'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-24">
      {/* Background Gradient Decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text Content */}
          <div className="space-y-6 md:space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {t('hero_title')}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
              {t('hero_sub')}
            </p>

            {/* Badge Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200">
                <span className="text-sm font-medium text-blue-700">
                  {t('badge_free')}
                </span>
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 border border-green-200">
                <span className="text-sm font-medium text-green-700">
                  {t('badge_nocard')}
                </span>
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-50 border border-purple-200">
                <span className="text-sm font-medium text-purple-700">
                  {t('badge_pwa')}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href={`/${locale}/auth/signup`}
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                {t('hero_cta')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                {t('hero_learn')}
              </a>
            </div>
          </div>

          {/* Right Column: Phone Mockup */}
          <div className="hidden md:flex items-center justify-center relative">
            <div className="relative w-80 h-96">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-3xl z-20"></div>
                <div className="w-full h-full bg-gradient-to-b from-blue-50 to-white p-4 flex flex-col">
                  {/* Status Bar */}
                  <div className="h-6 mb-2"></div>

                  {/* App Content */}
                  <div className="flex-1 space-y-3">
                    {/* SMS Card - Animated */}
                    <div className="animate-float bg-white rounded-lg p-3 shadow-md border-l-4 border-green-500">
                      <div className="text-xs font-semibold text-gray-700">
                        {t('card_sms')}
                      </div>
                      <div className="text-lg font-bold text-gray-900">+500 SMS</div>
                      <div className="text-xs text-gray-500">
                        {t('card_sent')}
                      </div>
                    </div>

                    {/* QR Card - Animated with delay */}
                    <div
                      className="animate-float bg-white rounded-lg p-3 shadow-md border-l-4 border-blue-500"
                      style={{ animationDelay: '0.5s' }}
                    >
                      <div className="text-xs font-semibold text-gray-700">
                        {t('card_qr')}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {t('card_scanned')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('card_today')}
                      </div>
                    </div>

                    {/* Income Card - Animated with delay */}
                    <div
                      className="animate-float bg-white rounded-lg p-3 shadow-md border-l-4 border-purple-500"
                      style={{ animationDelay: '1s' }}
                    >
                      <div className="text-xs font-semibold text-gray-700">
                        {t('card_income')}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        $1,250
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('card_daily')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Shadow */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-64 h-12 bg-blue-600/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
