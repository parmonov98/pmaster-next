'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowLeft, CheckCircle, AlertCircle, Gift } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';

export default function SignUpPage() {
  const t = useTranslations();
  const router = useRouter();
  const { signInWithGoogle, loading, error, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('free');
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ref') || localStorage.getItem('pendingReferralCode') || '';
    }
    return '';
  });

  // Redirect if user is already authenticated
  React.useEffect(() => {
    if (user) {
      console.log('User is authenticated, redirecting to home');
      router.replace('/dashboard');
    }
  }, [user, router]);

  const plans = {
    free: {
      name: t('freePlan'),
      price: '0 UZS',
      period: t('forever'),
      features: [
        t('upTo10Repairs'),
        t('upTo10Customers'),
        t('basicRepairTracking'),
        t('qrCodeLabels'),
        t('dailyCashRegister'),
        t('smsNotifications'),
      ],
    },
    premium: {
      name: t('premiumPlan'),
      price: '129,000 UZS',
      period: t('perMonth'),
      features: [
        t('unlimitedRepairs'),
        t('unlimitedCustomers'),
        t('basicRepairTracking'),
        t('qrCodeLabels'),
        t('dailyCashRegister'),
        t('smsNotifications'),
        t('excelReports'),
      ],
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 text-gray-600 mb-8">
          <ArrowLeft className="w-5 h-5" />
          {t('backToHome')}
        </Link>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {t('choosePlan')}
          </h2>
          <p className="mt-2 text-gray-600">
            {t('startManaging')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Free Plan */}
          <div
            className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all ${
              selectedPlan === 'free' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900">{plans.free.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">{plans.free.price}</span>
                <span className="ml-2 text-gray-500">{plans.free.period}</span>
              </div>
              <button
                onClick={() => setSelectedPlan('free')}
                className={`mt-6 w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  selectedPlan === 'free'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === 'free' ? t('selectedPlan') : t('choosePlanButton')}
              </button>
              <ul className="mt-6 space-y-4">
                {plans.free.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Premium Plan */}
          <div
            className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all ${
              selectedPlan === 'premium' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="p-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">{plans.premium.name}</h3>
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                  {t('popular')}
                </span>
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">{plans.premium.price}</span>
                <span className="ml-2 text-gray-500">{plans.premium.period}</span>
              </div>
              <button
                onClick={() => setSelectedPlan('premium')}
                className={`mt-6 w-full py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  selectedPlan === 'premium'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === 'premium' ? t('selectedPlan') : t('choosePlanButton')}
              </button>
              <ul className="mt-6 space-y-4">
                {plans.premium.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('continueWithGoogle')}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {selectedPlan === 'premium'
                ? t('premiumPaymentNote')
                : t('noCardRequired')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700">{error}</p>
                <p className="text-sm text-red-600 mt-1">
                  {t('contactSupport')}
                </p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
              {t('referralCodeInput')}
            </label>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase"
                placeholder="PM-XXXX"
                maxLength={7}
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (referralCode.trim()) {
                localStorage.setItem('pendingReferralCode', referralCode.trim().toUpperCase());
              }
              signInWithGoogle(selectedPlan);
            }}
            disabled={loading}
            className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            {loading ? t('creatingAccount') : t('continueWithGoogle')}
          </button>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              {t('alreadyHaveAccount')}{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500">
                {t('signInInstead')}
              </Link>
            </p>
            <p className="mt-4">
              {t('agreeToTerms')}{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                {t('termsOfService')}
              </Link>{' '}
              {t('and')}{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                {t('privacyPolicy')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
