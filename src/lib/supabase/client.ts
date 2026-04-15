import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isConfigured = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please connect your Supabase project first.');
}

// Create a single Supabase client instance
export function createClient() {
  if (!isConfigured) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'pmaster-auth'
      },
      global: {
        headers: {
          'X-Client-Info': 'pmaster-web'
        },
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: options.signal || AbortSignal.timeout(10000)
          }).catch(err => {
            if (err.name === 'AbortError' || err.message.includes('Failed to fetch')) {
              throw new Error('Failed to connect to Supabase. Please check your project status and URL configuration.');
            }
            throw err;
          });
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      db: {
        schema: 'public'
      }
    }
  );
}

// Export configuration status
export const isSupabaseConfigured = isConfigured;

// Helper function to handle Supabase errors gracefully
export const handleSupabaseError = (error: unknown) => {
  if (error instanceof Error) {
    // Network errors
    if (error.message === 'Failed to fetch' || error.message.includes('refused to connect') || error.message.includes('NetworkError')) {
      return 'Unable to connect to Supabase. Please add http://localhost:3000 to both Site URL and Redirect URLs in your Supabase project Authentication settings.';
    }
    if (error.message.includes('CORS') || error.message.includes('CORS_ERROR')) {
      return 'Connection blocked by CORS policy. Please add http://localhost:3000 to both Site URL and Redirect URLs in your Supabase project Authentication settings.';
    }
    return error.message;
  }
  return 'An unexpected error occurred';
};
