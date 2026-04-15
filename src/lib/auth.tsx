'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from './supabase/client';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signInWithGoogle: (plan?: 'free' | 'premium') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn('Cannot connect to Supabase. Your project may be paused or unreachable.');
            setError('Cannot connect to authentication service. Please check your Supabase project status.');
          } else {
            console.warn('Session retrieval error:', error.message);
          }
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
          console.warn('Cannot connect to Supabase. Your project may be paused or unreachable.');
          setError('Cannot connect to authentication service. Please check your Supabase project status.');
        } else {
          console.warn('Failed to get session:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      (async () => {
        // Silent auth state update to avoid noisy console logs in production
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (plan: 'free' | 'premium' = 'free') => {
    try {
      const supabase = createClient();
      setError(null);

      // Check if Supabase is accessible before attempting OAuth
      try {
        await supabase.auth.getSession();
      } catch (connectError) {
        throw new Error('Cannot connect to Supabase. Please check if your Supabase project is active and the URL is correct.');
      }

      const redirectUrl = window.location.origin + `/auth/callback?plan=${plan}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error('Sign in error:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';

      // Handle specific connection errors
      if (errorMessage.includes('refused to connect') || errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to Supabase. Your Supabase project may be paused or the URL may be incorrect. Please check your Supabase project status.';
      }

      setError(errorMessage);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const supabase = createClient();
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Don't set loading to false here - let the auth state change handler do it
      // This ensures the user state is properly updated before loading is set to false
    } catch (err) {
      console.error('Email sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with email');
      setLoading(false); // Only set loading to false on error
    }
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      setError(null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any cached data and redirect to home
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const supabase = createClient();
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const supabase = createClient();
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signInWithGoogle, signInWithEmail, signOut, resetPassword, updatePassword, loading, error, isConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
