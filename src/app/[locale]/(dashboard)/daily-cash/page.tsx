'use client';
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Download, AlertCircle, X, CreditCard, Banknote } from 'lucide-react';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useTranslations } from 'next-intl';
import type { Database } from '@/lib/database.types';
import { getPaymentMethodLabel, type PaymentMethod } from '@/lib/utils';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type IncomeType = Database['public']['Tables']['income_types']['Row'];
type ExpenseType = Database['public']['Tables']['expense_types']['Row'];
type Period = 'today' | 'yesterday' | 'week' | 'month' | 'all';
type AddTransactionFormData = { type: 'income' | 'expense'; amount: string; description: string; incomeTypeId: string; customIncomeTypeName: string; expenseTypeId: string; customExpenseTypeName: string; paymentMethod: PaymentMethod };

const DailyCashPage = () => {
  const t = useTranslations();
  const { getTransactions, addTransaction, getSummary, getIncomeTypes, getExpenseTypes, createIncomeType, createExpenseType, loading, error } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ cash: { income: 0, expenses: 0, balance: 0 }, card: { income: 0, expenses: 0, balance: 0 }, total: { income: 0, expenses: 0, balance: 0 } });
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [formData, setFormData] = useState<AddTransactionFormData>({
    type: 'income', amount: '', description: '', incomeTypeId: '', customIncomeTypeName: '', expenseTypeId: '', customExpenseTypeName: '', paymentMethod: 'cash'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [transactionsData, summaryData] = await Promise.all([getTransactions(selectedPeriod), getSummary(selectedPeriod)]);
      setTransactions(transactionsData || []);
      if (summaryData) setSummary(summaryData);
    };
    loadData();
  }, [selectedPeriod]);

  useEffect(() => {
    const loadIncomeTypes = async () => { const types = await getIncomeTypes(); setIncomeTypes(types); };
    const loadExpenseTypes = async () => { const types = await getExpenseTypes(); setExpenseTypes(types); };
    loadIncomeTypes();
    loadExpenseTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) { setFormError(t('invalidAmount')); return; }
    if (formData.type === 'income' && !formData.incomeTypeId) { setFormError(t('incomeTypeRequired')); return; }
    if (formData.type === 'expense' && !formData.expenseTypeId) { setFormError(t('expenseTypeRequired')); return; }

    let finalIncomeTypeId = formData.incomeTypeId;
    let finalExpenseTypeId = formData.expenseTypeId;
    
    if (formData.type === 'income' && formData.incomeTypeId === 'boshqa') {
      if (!formData.customIncomeTypeName.trim()) { setFormError(t('customIncomeTypeRequired')); return; }
      const newType = await createIncomeType(formData.customIncomeTypeName.trim());
      if (!newType) { setFormError('Failed to create custom income type'); return; }
      finalIncomeTypeId = newType.id;
      const types = await getIncomeTypes();
      setIncomeTypes(types);
    } else if (formData.type === 'expense' && formData.expenseTypeId === 'boshqa') {
      if (!formData.customExpenseTypeName.trim()) { setFormError(t('customExpenseTypeRequired')); return; }
      const newType = await createExpenseType(formData.customExpenseTypeName.trim());
      if (!newType) { setFormError('Failed to create custom expense type'); return; }
      finalExpenseTypeId = newType.id;
      const types = await getExpenseTypes();
      setExpenseTypes(types);
    }

    const transaction = await addTransaction({
      type: formData.type, amount, description: formData.description || null,
      income_type_id: formData.type === 'income' ? finalIncomeTypeId : null,
      expense_type_id: formData.type === 'expense' ? finalExpenseTypeId : null,
      payment_method: formData.paymentMethod
    });

    if (transaction) {
      setShowAddModal(false);
      setFormData({ type: 'income', amount: '', description: '', incomeTypeId: '', customIncomeTypeName: '', expenseTypeId: '', customExpenseTypeName: '', paymentMethod: 'cash' });
      const [transactionsData, summaryData] = await Promise.all([getTransactions(selectedPeriod), getSummary(selectedPeriod)]);
      setTransactions(transactionsData || []);
      if (summaryData) setSummary(summaryData);
    }
  };

  const getTransactionDisplayName = (transaction: Transaction) => {
    if (transaction.type === 'income') {
      const incomeType = incomeTypes.find(t => t.id === transaction.income_type_id);
      return incomeType ? incomeType.name.charAt(0).toUpperCase() + incomeType.name.slice(1) : transaction.description || t('income');
    }
    const expenseType = expenseTypes.find(t => t.id === transaction.expense_type_id);
    return expenseType ? expenseType.name.charAt(0).toUpperCase() + expenseType.name.slice(1) : transaction.description || t('expense');
  };

  const filteredTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    getTransactionDisplayName(t).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-full lg:max-w-6xl mx-auto px-0 pb-20 lg:pb-0">
      <div className="flex flex-col md:flex-row md:justify-end mb-4 md:mb-6">
        <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 w-full md:w-auto bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] lg:min-h-0">
          <Plus className="w-5 h-5" />{t('addTransaction')}
        </button>
      </div>

      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Calendar className="w-5 h-5" />
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value as Period)} className="flex-1 md:flex-none px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 min-h-[44px] lg:min-h-0">
            <option value="today">{t('today')}</option>
            <option value="yesterday">{t('yesterday')}</option>
            <option value="week">{t('thisWeek')}</option>
            <option value="month">{t('thisMonth')}</option>
            <option value="all">Barchasi</option>
          </select>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-500 mt-0.5" /><p className="text-red-700">{error}</p></div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
        <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-1.5 text-blue-600 mb-1 text-sm"><TrendingUp className="w-4 h-4" />{t('income')}</div>
          <div className="text-lg md:text-2xl font-bold text-blue-700 mb-2">{summary.total.income.toLocaleString()} UZS</div>
        </div>
        <div className="bg-red-50 p-3 md:p-4 rounded-lg border border-red-100">
          <div className="flex items-center gap-1.5 text-red-600 mb-1 text-sm"><TrendingDown className="w-4 h-4" />{t('expenses')}</div>
          <div className="text-lg md:text-2xl font-bold text-red-700 mb-2">{summary.total.expenses.toLocaleString()} UZS</div>
        </div>
        <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-100">
          <div className="flex items-center gap-1.5 text-green-600 mb-1 text-sm"><DollarSign className="w-4 h-4" />{t('balance')}</div>
          <div className="text-lg md:text-2xl font-bold text-green-700 mb-2">{summary.total.balance.toLocaleString()} UZS</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-3 md:p-4 border-b"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('searchTransactions')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm md:text-base" /></div>
        <div className="p-3 md:p-4">
          {filteredTransactions.length > 0 ? (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {getTransactionDisplayName(transaction)}
                    </span>
                    <span className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} UZS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">{t('noTransactionsFound')}</div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">{t('addTransaction')}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {formError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('type')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))} className={`p-3 border rounded-lg font-medium ${formData.type === 'income' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-700'}`}>Kirim</button>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))} className={`p-3 border rounded-lg font-medium ${formData.type === 'expense' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-700'}`}>Chiqim</button>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('amount')}</label>
                <input type="number" min="0" step="1000" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Izoh</label>
                <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-20" />
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Bekor qilish</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? t('saving') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyCashPage;
