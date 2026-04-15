'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AuthCallbackPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Check if this is a password reset callback
        const type = searchParams.get('type');
        const accessToken = searchParams.get('access_token');

        if (type === 'recovery' && accessToken) {
          // This is a password reset callback, redirect to reset password page
          router.replace('/auth/reset-password');
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) {
          router.replace('/dashboard');
        } else {
          // No session found, redirect to sign in
          router.replace('/auth/signin');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        router.replace('/auth/signin');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">{t('signingIn')}</p>
      </div>
    </div>
  );
}
