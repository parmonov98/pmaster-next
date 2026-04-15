'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../supabase/client';
import { useAuth } from '../auth';
import { useBusinessProfile } from '../businessProfileContext';

export type PlanType = 'free' | 'premium';

export interface PlanLimits {
  maxRepairs: number;
  maxCustomers: number;
  trialRepairs: number;
  features: {
    excelReports: boolean;
    smsNotifications: boolean;
    unlimitedCustomers: boolean;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

export interface PlanStatus {
  plan: PlanType;
  repairCount: number;
  customerCount: number;
  limits: PlanLimits;
  canCreateRepair: boolean;
  canCreateCustomer: boolean;
  isTrialActive: boolean;
  trialRepairsRemaining: number;
  repairsRemaining: number;
  planExpiresAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
  autoRenew: boolean;
  premiumPrice: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  subscribe: () => Promise<{ success: boolean; error?: string; expires_at?: string }>;
  toggleAutoRenew: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
}

const PLAN_CONFIGS: Record<PlanType, PlanLimits> = {
  free: {
    maxRepairs: 10,
    maxCustomers: 10,
    trialRepairs: 0,
    features: {
      excelReports: false,
      smsNotifications: true,
      unlimitedCustomers: false,
    },
  },
  premium: {
    maxRepairs: Infinity,
    maxCustomers: Infinity,
    trialRepairs: 0,
    features: {
      excelReports: true,
      smsNotifications: true,
      unlimitedCustomers: true,
    },
  },
};

export function usePlanLimits(): PlanStatus {
  const { user } = useAuth();
  const { businessProfile, refreshProfile } = useBusinessProfile();
  const [repairCount, setRepairCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [premiumPrice, setPremiumPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read plan from business_profiles (DB), fallback to 'free'
  const dbPlan = businessProfile?.plan as PlanType | undefined;
  const planExpiresAt = businessProfile?.plan_expires_at ?? null;
  const autoRenew = businessProfile?.auto_renew ?? false;

  // Check if premium has expired
  const isExpired = dbPlan === 'premium' && planExpiresAt
    ? new Date(planExpiresAt) < new Date()
    : false;

  // Effective plan: if premium expired, treat as free
  const plan: PlanType = (dbPlan === 'premium' && !isExpired) ? 'premium' : 'free';
  const limits = PLAN_CONFIGS[plan];

  // Days remaining for premium
  const daysRemaining = planExpiresAt && !isExpired
    ? Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const fetchCounts = useCallback(async () => {
    if (!user || !businessProfile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const [repairsResult, customersResult, planResult] = await Promise.all([
        supabase
          .from('repairs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        (supabase as any)
          .from('subscription_plans')
          .select('price')
          .eq('name', 'premium')
          .eq('is_active', true)
          .single(),
      ]);

      if (repairsResult.error) throw repairsResult.error;
      if (customersResult.error) throw customersResult.error;

      setRepairCount(repairsResult.count ?? 0);
      setCustomerCount(customersResult.count ?? 0);
      if ((planResult as any).data) {
        setPremiumPrice((planResult as any).data.price);
      }
    } catch (err) {
      console.error('Failed to fetch plan limits:', err);
      setError(err instanceof Error ? err.message : 'Failed to check plan limits');
    } finally {
      setLoading(false);
    }
  }, [user, businessProfile]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Subscribe to premium
  const subscribe = useCallback(async (): Promise<{ success: boolean; error?: string; expires_at?: string }> => {
    if (!user) return { success: false, error: 'not_authenticated' };

    try {
      const supabase = createClient();

      const { data, error: rpcError } = await (supabase as any).rpc('charge_subscription', {
        p_user_id: user.id,
      });

      if (rpcError) throw rpcError;

      if (data?.success) {
        await refreshProfile();
        await fetchCounts();
        return { success: true, expires_at: data.expires_at };
      } else {
        return { success: false, error: data?.error || 'unknown_error' };
      }
    } catch (err) {
      console.error('Subscription error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'subscription_failed' };
    }
  }, [user, refreshProfile, fetchCounts]);

  // Toggle auto-renewal
  const toggleAutoRenew = useCallback(async (enabled: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!user || !businessProfile) return { success: false, error: 'not_authenticated' };

    try {
      const supabase = createClient();

      const { error: updateError } = await (supabase as any)
        .from('business_profiles')
        .update({ auto_renew: enabled })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      return { success: true };
    } catch (err) {
      console.error('Toggle auto-renew error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'toggle_failed' };
    }
  }, [user, businessProfile, refreshProfile]);

  // Calculate status
  const isTrialActive = plan === 'premium' && repairCount < limits.trialRepairs;
  const trialRepairsRemaining = plan === 'premium'
    ? Math.max(0, limits.trialRepairs - repairCount)
    : 0;

  const canCreateRepair = plan === 'free'
    ? repairCount < limits.maxRepairs
    : true;

  const canCreateCustomer = plan === 'free'
    ? customerCount < limits.maxCustomers
    : true;

  const repairsRemaining = plan === 'free'
    ? Math.max(0, limits.maxRepairs - repairCount)
    : isTrialActive
      ? trialRepairsRemaining
      : limits.maxRepairs - repairCount;

  return {
    plan,
    repairCount,
    customerCount,
    limits,
    canCreateRepair,
    canCreateCustomer,
    isTrialActive,
    trialRepairsRemaining,
    repairsRemaining,
    planExpiresAt,
    daysRemaining,
    isExpired,
    autoRenew,
    premiumPrice,
    loading,
    error,
    refresh: fetchCounts,
    subscribe,
    toggleAutoRenew,
  };
}
