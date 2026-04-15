'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import { Wallet, ArrowLeft, Plus, X, CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBalance } from '@/lib/hooks/useBalance';
import { usePayme } from '@/lib/hooks/usePayme';
import { useClick } from '@/lib/hooks/useClick';

type BalanceTransaction = {
  id: string;
  user_id: string;
  sms_notification_id: string | null;
  transaction_type: 'sms_charge' | 'topup' | 'refund' | 'data_export' | 'subscription';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
};

const BalanceHistoryPage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { balance, refreshBalance } = useBalance();
  const { createPayment: createPaymePayment, checkOrderStatus: checkPaymeOrderStatus, isConfigured: isPaymeConfigured } = usePayme();
  const { createPayment: createClickPayment, checkOrderStatus: checkClickOrderStatus, isConfigured: isClickConfigured } = useClick();
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'payme' | 'click'>('click');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching balance transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'sms_charge': return 'SMS xizmati';
      case 'topup': return "To'ldirish";
      case 'refund': return 'Qaytarish';
      case 'data_export': return 'Ma\'lumotlarni eksport qilish';
      case 'subscription': return 'Obuna to\'lovi';
      default: return type;
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0 || amount < 1000) {
      setTopupError(t('invalidAmountError'));
      return;
    }
    try {
      setTopupLoading(true);
      setTopupError(null);
      if (selectedPaymentMethod === 'payme') {
        if (!isPaymeConfigured) { setTopupError(t('paymeNotConfigured')); setTopupLoading(false); return; }
        await createPaymePayment({ amount });
      } else {
        if (!isClickConfigured) { setTopupError(t('clickNotConfigured')); setTopupLoading(false); return; }
        await createClickPayment({ amount });
      }
      setTopupLoading(false);
    } catch (err) {
      console.error(`Error creating payment:`, err);
      setTopupError(err instanceof Error ? err.message : t('paymentFailed'));
      setTopupLoading(false);
    }
  };

  return (
    <div className="pb-20 lg:pb-0 space-y-4 md:space-y-6">
      <div className="sticky top-12 z-10 bg-white border-b border-gray-200 px-3 md:px-5 lg:px-6 py-3 lg:border-0 lg:pb-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium min-h-[44px]">
          <ArrowLeft className="w-6 h-6" />{t('back')}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600" />
        </div>
        <button onClick={() => setShowTopupModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 min-h-[44px]">
          <Plus className="w-5 h-5" /><span>Balansni to'ldirish</span>
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {paymentMessage && (
        <div className={`px-4 py-3 rounded-lg ${paymentSuccess ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'}`}>
          {paymentMessage}
          <button onClick={() => { setPaymentMessage(null); setPaymentSuccess(false); }} className="ml-2 underline">{t('close')}</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Sana va vaqt</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Miqdor</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Tavsif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Yuklanmoqda...</td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(transaction.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={transaction.transaction_type === 'sms_charge' || transaction.transaction_type === 'data_export' || transaction.transaction_type === 'subscription' ? 'text-red-600' : transaction.transaction_type === 'topup' ? 'text-green-600' : 'text-blue-600'}>
                        {transaction.transaction_type === 'sms_charge' || transaction.transaction_type === 'data_export' || transaction.transaction_type === 'subscription' ? '-' : '+'}{Math.abs(transaction.amount).toLocaleString()} UZS
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="font-medium">{getTransactionTypeLabel(transaction.transaction_type)}</div>
                        {transaction.description && <div className="text-xs text-gray-400">{transaction.description}</div>}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Hech qanday tranzaksiya topilmadi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTopupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowTopupModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{t('topupBalance')}</h2>
              <button onClick={() => { setShowTopupModal(false); setTopupAmount(''); setTopupError(null); setSelectedPaymentMethod('click'); }} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handlePayment} className="p-6">
              {topupLoading && <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span>{selectedPaymentMethod === 'click' ? 'Click орқали қайта йўналтирилмоқда...' : 'To\'lov қайта йўналтирилмоқда...'}</span></div>}
              {topupError && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{topupError}</div>}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectPaymentMethod')}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="paymentMethod" value="click" checked={selectedPaymentMethod === 'click'} onChange={() => setSelectedPaymentMethod('click')} className="w-4 h-4 text-blue-600" disabled={topupLoading} />
                    <span className="text-sm">{t('payWithClick')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="paymentMethod" value="payme" checked={selectedPaymentMethod === 'payme'} onChange={() => setSelectedPaymentMethod('payme')} className="w-4 h-4 text-blue-600" disabled={topupLoading} />
                    <span className="text-sm">{t('payWithPayme')}</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('currentBalance')}</label>
                <div className="text-2xl font-bold text-gray-900">{balance !== null ? `${balance.toLocaleString()} UZS` : '0 UZS'}</div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('topupAmount')}</label>
                <input type="number" min="1000" step="100" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="10000" required disabled={topupLoading} />
                <p className="mt-1 text-xs text-gray-500">{t('minAmount')}</p>
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => { setShowTopupModal(false); setTopupAmount(''); setTopupError(null); setSelectedPaymentMethod('click'); }} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled={topupLoading}>{t('cancel')}</button>
                <button type="submit" disabled={topupLoading || !topupAmount || parseFloat(topupAmount) < 1000 || (selectedPaymentMethod === 'payme' && !isPaymeConfigured) || (selectedPaymentMethod === 'click' && !isClickConfigured)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {topupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" />{selectedPaymentMethod === 'click' ? t('payWithClick') : t('payWithPayme')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceHistoryPage;
