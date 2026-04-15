'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer as PrinterIcon, AlertCircle, Search, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import type { Database } from '@/lib/database.types';
import { useBusinessProfile } from '@/lib/businessProfileContext';
import QRCode from 'qrcode';

type Repair = Database['public']['Tables']['repairs']['Row'];
type RepairWithCustomer = Repair & { customer: Database['public']['Tables']['customers']['Row'] };

const capitalizeDeviceType = (deviceType: string): string => {
  if (!deviceType) return deviceType;
  return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
};

const LabelGenerationPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestRepairs, setLatestRepairs] = useState<RepairWithCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'customer' | 'repair'>('customer');
  const [generating, setGenerating] = useState(false);
  const { businessProfile } = useBusinessProfile();
  const supabase = createClient();

  useEffect(() => {
    const fetchLatestRepairs = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('repairs')
          .select(`*, customer:customers(*)`)
          .order('created_at', { ascending: false })
          .limit(5);
        if (fetchError) throw fetchError;
        setLatestRepairs(data as RepairWithCustomer[] || []);
      } catch (err) {
        console.error('Error fetching latest repairs:', err);
      }
    };
    fetchLatestRepairs();
    setLoading(false);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setLatestRepairs([]);
      return;
    }
    try {
      let queryBuilder: any = supabase.from('repairs');
      if (searchType === 'customer') {
        queryBuilder = queryBuilder.select(`*, customer:customers!inner(*)`).ilike('customer.name', `%${query}%`);
      } else {
        queryBuilder = queryBuilder.select(`*, customer:customers(*)`).ilike('repair_id', `%${query}%`);
      }
      const { data, error: searchError } = await queryBuilder.order('created_at', { ascending: false }).limit(5);
      if (searchError) throw searchError;
      setLatestRepairs(data as RepairWithCustomer[] || []);
    } catch (err) {
      console.error('Error searching repairs:', err);
    }
  };

  return (
    <div className="max-w-full md:max-w-2xl mx-auto px-0">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex gap-4 mb-4">
          <button onClick={() => setSearchType('customer')} className={`px-4 py-2 rounded-md ${searchType === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t('searchByCustomer')}
          </button>
          <button onClick={() => setSearchType('repair')} className={`px-4 py-2 rounded-md ${searchType === 'repair' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t('searchByRepairID')}
          </button>
        </div>
        <div className="relative flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchType === 'customer' ? t('searchCustomerName') : t('searchRepairID')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {searchQuery ? t('searchResults') : t('latestRepairs')}
        </h3>
        <div className="space-y-4">
          {latestRepairs.length > 0 ? (
            latestRepairs.map((repair) => (
              <button
                key={repair.id}
                onClick={() => router.push(`/repair/${repair.repair_id}`)}
                className="w-full p-4 border rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <a href={`/customer/${repair.customer.id}`} onClick={(e) => { e.preventDefault(); router.push(`/customer/${repair.customer.id}`); }} className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                      {repair.customer.name}
                    </a>
                    <div className="text-sm text-gray-500 mt-1">
                      {capitalizeDeviceType(repair.device_type)}
                      {repair.device_model && ` - ${repair.device_model}`}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{repair.repair_id}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              {searchQuery ? t('noRepairsFound') : t('noRecentRepairs')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelGenerationPage;
