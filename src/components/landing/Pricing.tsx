import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { CheckCircle, X, Phone, Building2 } from 'lucide-react';

export default function Pricing() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="py-24 bg-gray-50" id="pricing">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          {t('choosePlan')}
        </h2>
        <p className="text-center text-gray-600 mb-12">
          {t('startManaging')}
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-bold text-gray-900">{t('freePlan')}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-gray-900">0 UZS</span>
              <span className="ml-2 text-gray-500">/ {t('forever')}</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">{t('freePlanDesc')}</p>

            <ul className="mt-6 space-y-3">
              <FeatureItem included>{t('upTo10Repairs')}</FeatureItem>
              <FeatureItem included>{t('upTo10Customers')}</FeatureItem>
              <FeatureItem included>{t('basicRepairTracking')}</FeatureItem>
              <FeatureItem included>{t('qrCodeLabels')}</FeatureItem>
              <FeatureItem included>{t('dailyCashRegister')}</FeatureItem>
              <FeatureItem included>{t('smsNotifications')}</FeatureItem>
              <FeatureItem>{t('excelReports')}</FeatureItem>
              <FeatureItem>{t('unlimitedCustomers')}</FeatureItem>
              <FeatureItem>{t('unlimitedRepairs')}</FeatureItem>
            </ul>

            <Link
              href={`/${locale}/auth/signup`}
              className="mt-8 block w-full text-center px-6 py-3 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
            >
              {t('tryForFree')}
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-blue-500 hover:shadow-md transition-shadow relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
              {t('popular')}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{t('premiumPlan')}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-gray-900">129,000</span>
              <span className="ml-1 text-lg font-medium text-gray-700">UZS</span>
              <span className="ml-2 text-gray-500">/ {t('perMonth')}</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">{t('premiumPlanDesc')}</p>

            <ul className="mt-6 space-y-3">
              <FeatureItem included highlight>{t('unlimitedRepairs')}</FeatureItem>
              <FeatureItem included highlight>{t('unlimitedCustomers')}</FeatureItem>
              <FeatureItem included>{t('basicRepairTracking')}</FeatureItem>
              <FeatureItem included>{t('qrCodeLabels')}</FeatureItem>
              <FeatureItem included>{t('dailyCashRegister')}</FeatureItem>
              <FeatureItem included>{t('smsNotifications')}</FeatureItem>
              <FeatureItem included highlight>{t('excelReports')}</FeatureItem>
              <FeatureItem included>{t('autoRenew')}</FeatureItem>
              <FeatureItem included>{t('referralTitle')}</FeatureItem>
            </ul>

            <Link
              href={`/${locale}/auth/signup`}
              className="mt-8 block w-full text-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
            >
              {t('subscribeToPremium')}
            </Link>
          </div>
        </div>

        {/* Corporate Plan */}
        <div className="max-w-3xl mx-auto mt-8">
          <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold">{t('corporatePlan')}</h3>
              </div>
              <p className="text-blue-200 text-sm mb-4">{t('corporatePlanDesc')}</p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-blue-100">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />{t('unlimitedEverything')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />{t('multiLocationSupport')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />{t('dedicatedSupport')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />{t('customIntegrations')}</li>
              </ul>
            </div>
            <a
              href="tel:+998952212144"
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              <Phone className="w-4 h-4" />
              +998 95 221 21 44
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ children, included = false, highlight = false }: { children: React.ReactNode; included?: boolean; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      {included ? (
        <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${highlight ? 'text-blue-500' : 'text-green-500'}`} />
      ) : (
        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
      )}
      <span className={included ? 'text-gray-700' : 'text-gray-400'}>{children}</span>
    </li>
  );
}
