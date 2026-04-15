'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Search, AlertCircle } from 'lucide-react';
import { useRepairOps } from '@/lib/hooks/useRepairOps';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';
import { formatDateTime } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';

type Repair = Database['public']['Tables']['repairs']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row'];
  diagnostic?: Database['public']['Tables']['diagnostics']['Row'][];
  pickup_codes?: Database['public']['Tables']['pickup_codes']['Row'][];
};

const REPAIRS_PER_PAGE = 20;

type DiagnosticListProps = {
  listOnly?: boolean;
};

const DiagnosticList = ({ listOnly = false }: DiagnosticListProps) => {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const selectedRepairId = params.id as string;
  const { getRepairs, loading, error } = useRepairOps();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const getRepairsRef = useRef(getRepairs);
  const isInitialMount = useRef(true);

  useEffect(() => {
    getRepairsRef.current = getRepairs;
  }, [getRepairs]);

  useEffect(() => {
    const fetchRepairs = async () => {
      const data = await getRepairs(REPAIRS_PER_PAGE, 'accepted');
      if (data) {
        setRepairs(data as Repair[]);
        setHasMore(data.length === REPAIRS_PER_PAGE);
      }
    };
    fetchRepairs();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    let isCancelled = false;

    const searchRepairs = async () => {
      if (!searchQuery.trim()) {
        const data = await getRepairsRef.current(REPAIRS_PER_PAGE, 'accepted');
        if (!isCancelled && data) {
          setRepairs(data as Repair[]);
          setHasMore(data.length === REPAIRS_PER_PAGE);
          setPage(0);
        }
        if (!isCancelled) setSearching(false);
        return;
      }

      if (!isCancelled) setSearching(true);

      try {
        const supabase = createClient();

        const { data: repairsData, error: repairsError } = await supabase
          .from('repairs')
          .select(`*, customer:customers(*), diagnostic:diagnostics(*), pickup_codes:pickup_codes(*)`)
          .eq('status', 'accepted')
          .or(`repair_id.ilike.%${searchQuery}%,device_type.ilike.%${searchQuery}%`)
          .order('updated_at', { ascending: false })
          .limit(50);

        if (repairsError) throw repairsError;

        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select(`*, repairs!inner(*, diagnostic:diagnostics(*), pickup_codes:pickup_codes(*))`)
          .or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
          .eq('repairs.status', 'accepted')
          .limit(50);

        if (isCancelled) return;

        const allRepairs: Repair[] = [];
        if (repairsData) allRepairs.push(...(repairsData as Repair[]));

        if (!customersError && customersData) {
          customersData.forEach((customer: any) => {
            customer.repairs?.forEach((repair: any) => {
              if (repair.status === 'accepted') {
                allRepairs.push({
                  ...repair,
                  customer: {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    user_id: customer.user_id,
                    business_profile_id: customer.business_profile_id,
                    created_at: customer.created_at,
                  },
                } as Repair);
              }
            });
          });
        }

        const uniqueRepairs = Array.from(new Map(allRepairs.map((r) => [r.id, r])).values());
        if (!isCancelled) {
          setRepairs(uniqueRepairs.slice(0, 50) as Repair[]);
          setHasMore(false);
          setSearching(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Search error:', err);
          setRepairs([]);
          setSearching(false);
        }
      }
    };

    searchTimeoutRef.current = setTimeout(searchRepairs, 300);

    return () => {
      isCancelled = true;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [searchQuery]);

  const loadMoreRepairs = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const supabase = createClient();

      const nextPage = page + 1;
      const { data, error } = await supabase
        .from('repairs')
        .select(`*, customer:customers(*), diagnostic:diagnostics(*), pickup_codes:pickup_codes(*)`)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false })
        .range(nextPage * REPAIRS_PER_PAGE, (nextPage + 1) * REPAIRS_PER_PAGE - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        setRepairs((prev) => [...prev, ...(data as Repair[])]);
        setHasMore(data.length === REPAIRS_PER_PAGE);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more repairs:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 200) loadMoreRepairs();
    };
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [loadingMore, hasMore, page]);

  const filteredRepairs = repairs;

  const listColumn = (
    <div className={`${listOnly ? 'bg-white' : 'col-span-1 lg:col-span-12 xl:col-span-6 2xl:col-span-4 bg-white'} rounded-lg shadow-sm p-3 md:p-4 lg:p-4 self-start`}>
        <div className="flex items-center gap-2 mb-3 md:mb-4 lg:mb-6">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchRepairs')}
            className="w-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div ref={scrollContainerRef} className="max-h-[75vh] overflow-y-auto space-y-4 pr-2">
          {loading || searching ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : filteredRepairs.length > 0 ? (
            filteredRepairs.map((repair) => (
              <button
                key={repair.id}
                onClick={() => router.push(`/diagnostic/repair/${repair.id}`)}
                className={`w-full p-3 md:p-3 lg:p-4 border rounded-lg transition-colors text-left ${
                  selectedRepairId === repair.id ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500'
                }`}
              >
                <div className="flex justify-between items-center gap-2 mb-1">
                  <div className="font-mono text-sm md:text-base text-blue-600 font-semibold">{repair.repair_id}</div>
                  <div className="text-xs md:text-sm text-gray-400">{formatDateTime(repair.created_at)}</div>
                </div>
                <div className="text-xs md:text-sm text-gray-500 capitalize">
                  {repair.device_type}
                  {repair.device_model && (
                    <span className="font-bold text-blue-600 text-sm md:text-base">{` - ${repair.device_model}`}</span>
                  )}
                </div>
                <div className="text-sm md:text-base text-blue-600 font-medium mt-0.5">
                  {repair.customer?.name || 'Unknown Customer'}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">Qabul qilingan ta&apos;mirlashlar yo&apos;q</div>
          )}
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-pulse text-gray-500">Yuklanmoqda...</div>
            </div>
          )}
          {!hasMore && repairs.length > 0 && (
            <div className="text-center text-gray-500 py-4 text-sm">Barcha ta&apos;mirlashlar yuklandi</div>
          )}
        </div>
      </div>
  );

  if (listOnly) {
    return listColumn;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      {listColumn}
      <div className="hidden xl:flex col-span-6 xl:col-span-8 flex-col items-center justify-center text-gray-500 min-h-[200px] bg-white rounded-lg shadow-sm">
        <ClipboardList className="w-16 h-16 mb-4" />
        <p>{t('selectRepair')}</p>
      </div>
    </div>
  );
};

export default DiagnosticList;
