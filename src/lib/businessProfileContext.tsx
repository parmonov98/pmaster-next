'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from './supabase/client';
import { useAuth } from './auth';

// Global state to prevent multiple initializations
let globalBusinessProfile: BusinessProfile | null = null;
let globalLoading = true;
let globalError: string | null = null;
let initializationPromise: Promise<void> | null = null;

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  region: string | null;
  city: string | null;
  address: string | null;
  location: string; // Keep for backward compatibility
  phone: string;
  master_name: string | null;
  logo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  sms_enabled: boolean;
  is_price_hidden: boolean;
  telegram_chat_id?: string | null;
  telegram_report_enabled?: boolean;
  telegram_report_time?: string | null;
  telegram_linked_at?: string | null;
  telegram_last_report_date?: string | null;
  auto_renew?: boolean;
  referral_code?: string | null;
  referred_by?: string | null;
  plan?: string;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface BusinessProfileContextType {
  businessProfile: BusinessProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<BusinessProfile>) => void;
}

const BusinessProfileContext = createContext<BusinessProfileContextType | undefined>(undefined);

export function BusinessProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(globalBusinessProfile);
  const [loading, setLoading] = useState(globalLoading);
  const [error, setError] = useState<string | null>(globalError);

  const fetchBusinessProfile = async () => {
    if (!user) {
      setBusinessProfile(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Business profile fetch error:', fetchError);
        const errorMessage = fetchError.message;
        globalError = errorMessage;
        globalLoading = false;
        setError(errorMessage);
        setBusinessProfile(null);
      } else {
        globalBusinessProfile = data;
        globalLoading = false;
        globalError = null;
        setBusinessProfile(data);
        setError(null);
      }
    } catch (err) {
      console.error('Business profile fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load business profile';
      globalError = errorMessage;
      globalLoading = false;
      setError(errorMessage);
      setBusinessProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchBusinessProfile();
  };

  const updateProfile = (updates: Partial<BusinessProfile>) => {
    if (businessProfile) {
      setBusinessProfile({ ...businessProfile, ...updates });
    }
  };

  useEffect(() => {
    // If data is already loaded globally, use it
    if (!globalLoading && globalBusinessProfile) {
      setBusinessProfile(globalBusinessProfile);
      setLoading(false);
      setError(null);
      return;
    }

    // If initialization is already in progress, wait for it
    if (initializationPromise) {
      initializationPromise.then(() => {
        setBusinessProfile(globalBusinessProfile);
        setLoading(globalLoading);
        setError(globalError);
      });
      return;
    }

    // Start initialization
    const loadData = async () => {
      try {
        globalLoading = true;
        setLoading(true);
        setError(null);

        await fetchBusinessProfile();
      } catch (err) {
        console.error('Failed to load business profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load business profile';
        globalError = errorMessage;
        globalLoading = false;
        setError(errorMessage);
        setLoading(false);
      } finally {
        initializationPromise = null;
      }
    };

    initializationPromise = loadData();
  }, [user]);

  const value: BusinessProfileContextType = {
    businessProfile,
    loading,
    error,
    refreshProfile,
    updateProfile
  };

  return (
    <BusinessProfileContext.Provider value={value}>
      {children}
    </BusinessProfileContext.Provider>
  );
}

export function useBusinessProfile() {
  const context = useContext(BusinessProfileContext);
  if (context === undefined) {
    throw new Error('useBusinessProfile must be used within a BusinessProfileProvider');
  }
  return context;
}
