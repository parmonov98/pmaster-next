'use client';

import { useState } from 'react';
import { createClient } from '../supabase/client';
import type { Database } from '../database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type IncomeType = Database['public']['Tables']['income_types']['Row'];
type ExpenseType = Database['public']['Tables']['expense_types']['Row'];

type Period = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export function useTransactions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getIncomeTypes = async () => {
    try {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('income_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching income types:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch income types');
      return [];
    }
  };

  const createIncomeType = async (name: string): Promise<IncomeType | null> => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: insertError } = await (supabase as any)
        .from('income_types')
        .insert({ name })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      console.error('Error creating income type:', err);
      setError(err instanceof Error ? err.message : 'Failed to create income type');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getExpenseTypes = async () => {
    try {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('expense_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching expense types:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch expense types');
      return [];
    }
  };

  const createExpenseType = async (name: string): Promise<ExpenseType | null> => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: insertError } = await (supabase as any)
        .from('expense_types')
        .insert({ name })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      console.error('Error creating expense type:', err);
      setError(err instanceof Error ? err.message : 'Failed to create expense type');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getTransactions = async (period: Period = 'today') => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      let query = supabase
        .from('transactions')
        .select(`
          *,
          income_type:income_types(*),
          expense_type:expense_types(*)
        `);

      // If period is 'all', don't add date filters
      if (period !== 'all') {
        let startDate = new Date();
        let endDate = new Date();

        switch (period) {
          case 'yesterday':
            startDate.setDate(startDate.getDate() - 1);
            endDate = new Date(startDate);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          default:
            // today - use default dates
            break;
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<TransactionInsert, 'id' | 'user_id' | 'created_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: insertError } = await (supabase as any)
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSummary = async (period: Period = 'today') => {
    try {
      const transactions = await getTransactions(period);

      // Calculate cash totals
      const cashIncome = (transactions || [])
        .filter((t: any) => t.type === 'income' && t.payment_method === 'cash')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      const cashExpenses = (transactions || [])
        .filter((t: any) => t.type === 'expense' && t.payment_method === 'cash')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      const cashBalance = cashIncome - cashExpenses;

      // Calculate card totals
      const cardIncome = (transactions || [])
        .filter((t: any) => t.type === 'income' && t.payment_method === 'card')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      const cardExpenses = (transactions || [])
        .filter((t: any) => t.type === 'expense' && t.payment_method === 'card')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      const cardBalance = cardIncome - cardExpenses;

      // Calculate total totals
      const totalIncome = cashIncome + cardIncome;
      const totalExpenses = cashExpenses + cardExpenses;
      const totalBalance = totalIncome - totalExpenses;

      return {
        cash: {
          income: cashIncome,
          expenses: cashExpenses,
          balance: cashBalance
        },
        card: {
          income: cardIncome,
          expenses: cardExpenses,
          balance: cardBalance
        },
        total: {
          income: totalIncome,
          expenses: totalExpenses,
          balance: totalBalance
        }
      };
    } catch (err) {
      console.error('Error calculating summary:', err);
      return {
        cash: { income: 0, expenses: 0, balance: 0 },
        card: { income: 0, expenses: 0, balance: 0 },
        total: { income: 0, expenses: 0, balance: 0 }
      };
    }
  };

  return {
    loading,
    error,
    getIncomeTypes,
    getExpenseTypes,
    createIncomeType,
    createExpenseType,
    getTransactions,
    addTransaction,
    getSummary
  };
}
