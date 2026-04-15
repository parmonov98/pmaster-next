'use client';

import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import ProfileDropdown from './ProfileDropdown';

export default function AuthButton() {
  const t = useTranslations();
  const { user, signInWithGoogle, loading } = useAuth();

  if (loading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 text-gray-400 bg-gray-100 rounded-md"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        {t('loading')}
      </button>
    );
  }

  if (user) {
    return <ProfileDropdown />;
  }

  return (
    <button
      onClick={() => signInWithGoogle()}
      className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <LogIn className="w-5 h-5" />
      {t('signInWithGoogle')}
    </button>
  );
}
