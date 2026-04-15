'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Search, Clock, Settings, Package, Banknote } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import type { Database } from '@/lib/database.types';
import { formatDateTime } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';

type Repair = Database['public']['Tables']['repairs']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row'];
  diagnostic: Database['public']['Tables']['diagnostics']['Row'][];
  pickup_codes?: Database['public']['Tables']['pickup_codes']['Row'][];
};

type TabKey = 'repairing' | 'ready' | 'picked';
const TAB_TO_STATUS: Record<TabKey, string> = { repairing: 'diagnosed', ready: 'fixed', picked: 'picked' };

type CompletionListProps = {
  listOnly?: boolean;
};

const CompletionList = ({ listOnly = false }: CompletionListProps) => {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const urlTab = params.tab as string;
  const selectedRepairId = params.id as string;
  const activeTab: TabKey = (urlTab === 'ready' || urlTab === 'picked') ? urlTab : 'repairing';

  const [diagnosedRepairs, setDiagnosedRepairs] = useState<Repair[]>([]);
  const [fixedRepairs, setFixedRepairs] = useState<Repair[]>([]);
  const [pickedRepairs, setPickedRepairs] = useState<Repair[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeoutState] = useState<NodeJS.Timeout | null>(null);
  const [searchResults, setSearchResults] = useState<Repair[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeGenerating, setCodeGenerating] = useState<string | null>(null);

  const setActiveTab = (tab: TabKey) => {
    router.push(`/completion/${tab}`);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchLoading(false);
  }, [activeTab]);

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const [{ data: diagnosedData, error: de }, { data: fixedData, error: fe }, { data: pickedData, error: pe }] = await Promise.all([
          supabase
            .from('repairs')
            .select(`*, customer:customers(*), diagnostic:diagnostics(*), pickup_codes(*)`)
            .eq('status', 'diagnosed')
            .order('updated_at', { ascending: false })
            .limit(20),
          supabase
            .from('repairs')
            .select(`*, customer:customers(*), diagnostic:diagnostics(*), pickup_codes(*)`)
            .eq('status', 'fixed')
            .order('updated_at', { ascending: false })
            .limit(20),
          supabase
            .from('repairs')
            .select(`*, customer:customers(*), diagnostic:diagnostics(*), pickup_codes(*)`)
            .eq('status', 'picked')
            .order('updated_at', { ascending: false })
            .limit(20),
        ]);

        if (de || fe || pe) setError('Failed to load repairs');
        setDiagnosedRepairs((diagnosedData as Repair[]) || []);
        setFixedRepairs((fixedData as Repair[]) || []);
        setPickedRepairs((pickedData as Repair[]) || []);
      } catch (err) {
        console.error('Error fetching repairs:', err);
        setError('Failed to load repairs');
      } finally {
        setLoading(false);
      }
    };
    fetchRepairs();
  }, [activeTab]);

  const getLatestDiagnostic = (repair: Repair) => {
    if (!repair.diagnostic || repair.diagnostic.length === 0) return null;
    return repair.diagnostic[repair.diagnostic.length - 1];
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout) clearTimeout(searchTimeout);

    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const statusToSearch = TAB_TO_STATUS[activeTab];

    const timeout = setTimeout(async () => {
      try {
        const supabase = createClient();

        const repairQueries: any[] = [
          supabase
            .from('repairs')
            .select(`*, customer:customers(*), diagnostic:diagnostics(*), pickup_codes(*)`)
            .eq('status', statusToSearch)
            .or(`repair_id.ilike.%${query}%,device_model.ilike.%${query}%`)
            .order('updated_at', { ascending: false })
            .limit(20),
        ];

        const { data: matchingCustomers } = await supabase
          .from('customers')
          .select('id')
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(50);

        if (matchingCustomers?.length) {
          const customerIds = matchingCustomers.map((c: { id: string }) => c.id);
          repairQueries.push(
            supabase
              .from('repairs')
              .select(`*, customer:customers(*), diagnostic:diagnostics(*), pickup_codes(*)`)
              .eq('status', statusToSearch)
              .in('customer_id', customerIds)
              .order('updated_at', { ascending: false })
              .limit(20)
          );
        }

        const results = await Promise.all(repairQueries);
        const allRepairs: Repair[] = [];
        const seenIds = new Set<string>();
        for (const result of results) {
          if (result.data) {
            for (const r of result.data as Repair[]) {
              if (!seenIds.has(r.id)) {
                seenIds.add(r.id);
                allRepairs.push(r);
              }
            }
          }
        }
        allRepairs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setSearchResults(allRepairs.slice(0, 20));
      } catch (err) {
        console.error('Error searching repairs:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    setSearchTimeoutState(timeout);
  };

  const handleRepairClick = async (repair: Repair) => {
    if (activeTab === 'repairing') {
      const hasActiveCode = repair.pickup_codes?.some((c: any) => c.is_active);
      if (!hasActiveCode) {
        setCodeGenerating(repair.id);
        try {
          const supabase = createClient();
          await (supabase as any).rpc('generate_unique_pickup_code', { repair_id_param: repair.id });
        } catch (err) {
          console.error('Error generating pickup code:', err);
        } finally {
          setCodeGenerating(null);
        }
      }
    }
    router.push(`/completion/${activeTab}/repair/${repair.id}`);
  };

  const filteredDiagnosedRepairs = diagnosedRepairs.filter(
    (r) =>
      r.repair_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.device_type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFixedRepairs = fixedRepairs.filter(
    (r) =>
      r.repair_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.device_type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPickedRepairs = pickedRepairs.filter(
    (r) =>
      r.repair_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.device_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayRepairs =
    searchQuery.length >= 2
      ? searchResults
      : activeTab === 'repairing'
      ? filteredDiagnosedRepairs
      : activeTab === 'ready'
      ? filteredFixedRepairs
      : filteredPickedRepairs;

  const badgeConfig =
    activeTab === 'repairing'
      ? { style: 'bg-blue-100 text-blue-800', text: 'Jarayonda', hover: 'hover:border-blue-500', selected: 'border-blue-500 bg-blue-50' }
      : activeTab === 'ready'
      ? { style: 'bg-green-100 text-green-800', text: 'Tayyor', hover: 'hover:border-green-500', selected: 'border-green-500 bg-green-50' }
      : { style: 'bg-gray-100 text-gray-800', text: 'Topshirilgan', hover: 'hover:border-gray-500', selected: 'border-gray-500 bg-gray-50' };

  const emptyMessage =
    activeTab === 'repairing'
      ? "Sozlab qo'yilayotgan ta'mirlashlar yo'q"
      : activeTab === 'ready'
      ? "Olib ketishga tayyor ta'mirlashlar yo'q"
      : "Topshirilgan ta'mirlashlar yo'q";

  const content = (
    <>
      {/* Tabs - sticky on mobile, inside card flow on desktop */}
      <div className="sticky top-12 md:top-14 lg:static z-10 bg-white border-b border-gray-200 lg:border-0 -mx-3 -mt-3 md:-mx-5 md:-mt-5 lg:mx-0 lg:mt-0 px-3 pt-1 md:px-5 md:pt-1 lg:px-0 lg:pt-0">
        <nav className="-mb-px flex space-x-4 lg:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('repairing')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'repairing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-5 h-5" />
            Sozlanmoqda
          </button>
          <button
            onClick={() => setActiveTab('ready')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'ready' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-5 h-5" />
            Tayyor
          </button>
          <button
            onClick={() => setActiveTab('picked')}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'picked' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Topshirilgan
          </button>
        </nav>
      </div>

      <div className={`lg:sticky lg:top-14 flex flex-col lg:max-h-[calc(100vh-4rem)]`}>
        <div className={`flex-1 min-h-0 overflow-y-auto ${listOnly ? '' : 'grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6'}`}>
        <div className={`${listOnly ? "bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 lg:p-4" : "col-span-1 lg:col-span-12 xl:col-span-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 lg:p-4"}`}>
          <div className="flex items-center gap-2 mb-3 md:mb-4 lg:mb-6">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
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

          <div className="space-y-2 md:space-y-3 lg:space-y-4 pr-1 md:pr-2">
            {loading || searchLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : displayRepairs.length > 0 ? (
              displayRepairs.map((repair) => {
                const diagnostic = getLatestDiagnostic(repair);
                const isGenerating = activeTab === 'repairing' && codeGenerating === repair.id;
                return (
                  <button
                    key={repair.id}
                    onClick={() => handleRepairClick(repair)}
                    disabled={activeTab === 'repairing' && !!codeGenerating}
                    className={`w-full p-3 md:p-3 lg:p-4 border rounded-lg transition-colors text-left ${
                      selectedRepairId === repair.id ? badgeConfig.selected : badgeConfig.hover
                    } ${activeTab === 'repairing' && codeGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-mono text-sm md:text-base text-blue-600 font-semibold">{repair.repair_id}</div>
                      <div className="text-xs md:text-sm text-gray-400">{formatDateTime(repair.created_at)}</div>
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 capitalize">
                      {repair.device_type}
                      {repair.device_model && <span className="font-bold text-blue-600 text-sm md:text-base">{` - ${repair.device_model}`}</span>}
                    </div>
                    <a
                      href={`/customer/${repair.customer.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/customer/${repair.customer.id}`);
                      }}
                      className="text-sm md:text-base text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium block mt-0.5"
                    >
                      {repair.customer.name}
                    </a>
                    {diagnostic && (
                      <div className="mt-1.5 flex items-center gap-3 text-xs md:text-sm">
                        {diagnostic.estimated_time && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{diagnostic.estimated_time}h</span>
                          </div>
                        )}
                        {diagnostic.estimated_cost && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Banknote className="w-3.5 h-3.5" />
                            <span>{diagnostic.estimated_cost.toLocaleString()} UZS</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${badgeConfig.style}`}>
                        {badgeConfig.text}
                      </span>
                      {isGenerating && <span className="ml-2 text-xs text-gray-500">Kod yaratilmoqda...</span>}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-12 px-4">{searchQuery.length >= 2 ? "Ta'mirlash topilmadi" : emptyMessage}</div>
            )}
          </div>
        </div>

        {!listOnly && (
          <div className="hidden lg:flex col-span-8 flex-col items-center justify-center text-gray-500 min-h-[200px] bg-white rounded-lg shadow-sm">
            <Settings className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-center">Yakunlash uchun ta&apos;mirlashni tanlang</p>
          </div>
        )}
        </div>
      </div>
    </>
  );

  if (listOnly) {
    return (
      <div className="px-0">
        {content}
      </div>
    );
  }

  return (
    <div className="px-0">
      {content}
    </div>
  );
};

export default CompletionList;
