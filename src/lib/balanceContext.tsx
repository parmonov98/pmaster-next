'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from './supabase/client';
import { useAuth } from './auth';

// Global state to prevent multiple initializations
let globalBalance: number | null = null;
let globalLoading = true;
let globalError: string | null = null;
let initializationPromise: Promise<void> | null = null;
let isInitializing = false;

interface BalanceContextType {
  balance: number | null;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(globalBalance);
  const [loading, setLoading] = useState(globalLoading);
  const [error, setError] = useState<string | null>(globalError);

  const fetchBalance = async () => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // If no balance record exists, create one with 0 balance
      if (!data) {
        const { data: newBalance, error: createError } = await (supabase as any)
          .from('user_balances')
          .insert({ user_id: user.id, balance: 0 })
          .select('balance')
          .single();

        if (createError) throw createError;
        globalBalance = newBalance.balance;
        globalLoading = false;
        globalError = null;
        setBalance(newBalance.balance);
        setError(null);
      } else {
        globalBalance = data.balance;
        globalLoading = false;
        globalError = null;
        setBalance(data.balance);
        setError(null);
      }
    } catch (err) {
      console.error('Balance fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load balance';
      globalError = errorMessage;
      globalLoading = false;
      setError(errorMessage);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    await fetchBalance();
  };

  useEffect(() => {
    // If data is already loaded globally, use it
    if (!globalLoading && globalBalance !== null) {
      setBalance(globalBalance);
      setLoading(false);
      setError(null);
      return;
    }

    // If initialization is already in progress, wait for it
    if (isInitializing && initializationPromise) {
      initializationPromise.then(() => {
        setBalance(globalBalance);
        setLoading(globalLoading);
        setError(globalError);
      });
      return;
    }

    // Start initialization
    isInitializing = true;
    const loadData = async () => {
      try {
        globalLoading = true;
        setLoading(true);
        setError(null);

        await fetchBalance();
      } catch (err) {
        console.error('Failed to load balance:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load balance';
        globalError = errorMessage;
        globalLoading = false;
        setError(errorMessage);
        setLoading(false);
      } finally {
        isInitializing = false;
        initializationPromise = null;
      }
    };

    initializationPromise = loadData();
  }, [user]);

  // Subscribe to real-time balance updates
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const subscription = supabase
      .channel(`user_balance_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_balances',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newBalance = payload.new as { balance: number };
          globalBalance = newBalance.balance;
          setBalance(newBalance.balance);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const value: BalanceContextType = {
    balance,
    loading,
    error,
    refreshBalance,
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within BalanceProvider');
  }
  return context;
}
