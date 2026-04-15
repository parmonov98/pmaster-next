'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { ArrowLeft, User, Phone, Wrench, Banknote } from 'lucide-react';
import type { Database } from '@/lib/database.types';
import { formatPhoneNumber, formatDateTime } from '@/lib/utils';

type Customer = Database['public']['Tables']['customers']['Row'];
type Repair = Database['public']['Tables']['repairs']['Row'] & {
  diagnostic: Database['public']['Tables']['diagnostics']['Row'][];
};

const CustomerDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations();
  const supabase = createClient();
  const customerId = typeof id === 'string' ? id : id?.[0];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [repairs, setRepairs] = useState<Repair[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (!customerId) { setError('No customer ID'); setLoading(false); return; }
      try {
        const { data: customerData, error: customerError } = await supabase.from('customers').select('*').eq('id', customerId).single();
        if (customerError) throw customerError;
        setCustomer(customerData);
        const { data: repairsData, error: repairsError } = await supabase.from('repairs').select(`*, diagnostic:diagnostics(*)`).eq('customer_id', customerId).order('created_at', { ascending: false });
        if (repairsError) throw repairsError;
        setRepairs(repairsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [customerId]);

  const getLatestDiagnostic = (repair: Repair) => {
    if (!repair.diagnostic?.length) return null;
    return repair.diagnostic.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse"><User className="w-12 h-12 text-gray-300" /></div></div>;
  if (error || !customer) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-red-500 mb-4">{error || 'Not found'}</p><button onClick={() => router.push('/history')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Back</button></div></div>;

  return (
    <div className="pb-20 lg:pb-0 space-y-4 md:space-y-6">
      <div className="sticky top-12 z-10 bg-white border-b border-gray-200 px-3 md:px-5 lg:px-6 py-3 lg:border-0 lg:pb-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium min-h-[44px]">
          <ArrowLeft className="w-6 h-6" />{t('back')}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />Mijoz ma'lumotlari
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <a href={`/customer/${customer.id}`} onClick={(e) => { e.preventDefault(); router.push(`/customer/${customer.id}`); }} className="text-2xl text-blue-600 hover:text-blue-700 hover:underline font-medium">{customer.name}</a>
          </div>
          <div>
            <a href={`tel:${customer.phone}`} className="text-2xl text-gray-900 font-medium hover:text-blue-600 hover:underline">{formatPhoneNumber(customer.phone)}</a>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Ta'mirlashlar ({repairs.length})</h2>
        </div>
        <div className="p-6">
          {repairs.length > 0 ? (
            <div className="space-y-4">
              {repairs.map((repair) => {
                const diagnostic = getLatestDiagnostic(repair);
                return (
                  <div key={repair.id} className="w-full border rounded-lg p-4 space-y-4">
                    <button onClick={() => router.push(`/repair/${repair.repair_id}`)} className="w-full text-left hover:border-blue-500 hover:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-mono text-2xl text-blue-600">ID: {repair.repair_id}</div>
                        <div className="text-2xl text-gray-500">{formatDateTime(repair.created_at)}</div>
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-5 h-5 text-gray-400" />
                          <span className="text-base capitalize">{repair.device_type}{repair.device_model && <span className="font-bold text-blue-600 text-lg">{` - ${repair.device_model}`}</span>}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${repair.status === 'completed' ? 'bg-green-100 text-green-800' : repair.status === 'diagnosed' ? 'bg-blue-100 text-blue-800' : repair.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {t(repair.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-2"><strong>{t('issue')}:</strong> {repair.issue_description}</div>
                      {diagnostic && (
                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                          <div><div className="text-gray-500 mb-1">{t('diagnosticNotes')}</div><div>{diagnostic.notes}</div></div>
                          <div><div className="text-gray-500 mb-1">{t('requiredParts')}</div><div>{diagnostic.required_parts || t('none')}</div></div>
                        </div>
                      )}
                      <div className="flex items-center justify-end pt-4 border-t">
                        {diagnostic && diagnostic.estimated_cost && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Banknote className="w-4 h-4" />
                            <span>{t('estimatedCost')}: {diagnostic.estimated_cost.toLocaleString()} UZS</span>
                          </div>
                        )}
                      </div>
                    </button>
                    <button onClick={() => router.push(`/diagnostic/repair/${repair.id}`)} className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Diagnostika sahifasiga o'tish
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">Bu mijoz uchun ta'mirlashlar topilmadi</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
