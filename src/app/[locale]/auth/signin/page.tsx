'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowLeft, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';

export default function SignInPage() {
  const t = useTranslations();
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, loading, error, user } = useAuth();
  const [showEmailForm, setShowEmailForm] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Redirect if user is already authenticated
  React.useEffect(() => {
    if (user) {
      console.log('User is authenticated, redirecting to home');
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithEmail(email, password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center gap-2 text-gray-600 mb-8 mx-4">
          <ArrowLeft className="w-5 h-5" />
          {t('backToHome')}
        </Link>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Sign in to pMaster
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {t('signInDesc')}
            </p>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700">{error}</p>
                {error.includes('Supabase project may be paused') && (
                  <div className="text-sm text-red-600 mt-2">
                    <p className="font-medium">To fix this:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Go to your Supabase dashboard</li>
                      <li>Check if your project is paused and unpause it</li>
                      <li>Verify the project URL in your environment variables</li>
                      <li>Ensure localhost:3000 is in Site URL settings</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8">
            {!showEmailForm ? (
              <div className="space-y-4">
                <button
                  onClick={() => signInWithGoogle()}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  {loading ? t('signingIn') : t('continueWithGoogle')}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">or</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Mail className="w-5 h-5" />
                  Sign in with Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Back to other options
                  </button>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              {t('dontHaveAccount')}{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500">
                {t('signUpForFree')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
