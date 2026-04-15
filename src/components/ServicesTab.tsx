'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Wrench, Clock, AlertCircle, Banknote } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import type { Database } from '@/lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];
type Repair = Database['public']['Tables']['repairs']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row'];
  diagnostic: Database['public']['Tables']['diagnostics']['Row'][];
};

type ServicesTabProps = {
  onSelectCustomer?: (customer: Customer) => void;
  onSwitchToHistory?: () => void;
};

const ServicesTab = ({ onSelectCustomer, onSwitchToHistory }: ServicesTabProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [repairSearchQuery, setRepairSearchQuery] = useState('');
  const [repairSearchResults, setRepairSearchResults] = useState<Repair[]>([]);
  const [repairSearchTimeout, setRepairSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [allRepairs, setAllRepairs] = useState<Repair[]>([]);
  const [allRepairsLoading, setAllRepairsLoading] = useState(true);

  useEffect(() => {
    const fetchAllLatestRepairs = async () => {
      try {
        setAllRepairsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from('repairs')
          .select(`
            *,
            customer:customers(*),
            diagnostic:diagnostics(*)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setAllRepairs(data || []);
      } catch (err) {
        console.error('Error fetching all latest repairs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load latest repairs');
      } finally {
        setAllRepairsLoading(false);
      }
    };

    fetchAllLatestRepairs();
  }, []);

  const handleRepairSearch = async (query: string) => {
    setRepairSearchQuery(query);

    if (repairSearchTimeout) {
      clearTimeout(repairSearchTimeout);
    }

    if (query.length < 3) {
      setRepairSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('repairs')
          .select(`
            *,
            customer:customers(*),
            diagnostic:diagnostics(*)
          `)
          .ilike('repair_id', `%${query}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRepairSearchResults(data as Repair[] || []);
      } catch (err) {
        console.error('Error searching repairs:', err);
      }
    }, 300);

    setRepairSearchTimeout(timeout);
  };

  const selectCustomer = (customer: Customer) => {
    if (onSelectCustomer && onSwitchToHistory) {
      onSelectCustomer(customer);
      onSwitchToHistory();
    }
  };

  const getLatestDiagnostic = (repair: Repair) => {
    if (!repair.diagnostic || repair.diagnostic.length === 0) return null;
    return repair.diagnostic.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  useEffect(() => {
    return () => {
      if (repairSearchTimeout) {
        clearTimeout(repairSearchTimeout);
      }
    };
  }, [repairSearchTimeout]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Repair ID Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={repairSearchQuery}
              onChange={(e) => handleRepairSearch(e.target.value)}
              placeholder="Ta'mirlash ID bo'yicha qidirish (masalan: REP123456789)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {repairSearchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              {repairSearchResults.map((repair) => (
                <button
                  key={repair.id}
                  onClick={() => selectCustomer(repair.customer)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-base text-gray-600 mb-1">
                        <Wrench className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">
                          {repair.device_type}
                          {repair.device_model && (
                            <span className="font-bold text-blue-600 text-lg">
                              {` - ${repair.device_model}`}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <a
                          href={`/customer/${repair.customer.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/customer/${repair.customer.id}`);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                          {repair.customer.name}
                        </a>
                        <span className="text-xs text-gray-500">{repair.customer.phone}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-blue-600">{repair.repair_id}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(repair.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Latest Repairs */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">So'nggi ta'mirlashlar (Barcha holatlar)</h3>

        {allRepairsLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        ) : allRepairs.length > 0 ? (
          <div className="space-y-4">
            {allRepairs.map((repair) => {
              const diagnostic = getLatestDiagnostic(repair);
              return (
                <div
                  key={repair.id}
                  className="border rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => router.push(`/repair/${repair.repair_id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="w-4 h-4 text-gray-400" />
                        <span className="text-base capitalize">
                          {repair.device_type}
                          {repair.device_model && (
                            <span className="font-bold text-blue-600 text-lg">
                              {` - ${repair.device_model}`}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <a
                          href={`/customer/${repair.customer.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/customer/${repair.customer.id}`);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                          {repair.customer.name}
                        </a>
                        <span className="text-xs text-gray-500">{repair.customer.phone}</span>
                      </div>
                      <div className="text-sm text-blue-600">
                        ID: {repair.repair_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          repair.status === 'picked'
                            ? 'bg-green-100 text-green-800'
                            : repair.status === 'fixed'
                            ? 'bg-blue-100 text-blue-800'
                            : repair.status === 'diagnosed'
                            ? 'bg-blue-100 text-blue-800'
                            : repair.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {repair.status === 'picked' ? 'Olib ketilgan' :
                           repair.status === 'fixed' ? 'Tayyor' :
                           repair.status === 'diagnosed' ? 'Diagnostika qilingan' :
                           repair.status === 'cancelled' ? 'Bekor qilingan' :
                           repair.status === 'accepted' ? 'Qabul qilingan' :
                           'Noma\'lum holat'}
                        </span>
                      </div>
                      {repair.status === 'cancelled' && repair.cancellation_note && (
                        <div className="mt-1 text-xs text-left text-red-700 max-w-xs">
                          Bekor qilish sababi: {repair.cancellation_note}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(repair.created_at).toLocaleDateString()}</span>
                        </div>
                        {diagnostic && diagnostic.estimated_cost && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Banknote className="w-4 h-4" />
                            <span>{diagnostic.estimated_cost.toLocaleString()} UZS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Hozircha ta'mirlashlar yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesTab;
