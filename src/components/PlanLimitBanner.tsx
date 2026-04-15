'use client';

import { AlertCircle, Crown, ArrowRight, Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePlanLimits } from '@/lib/hooks/usePlanLimits';

export default function PlanLimitBanner() {
  const t = useTranslations();
  const router = useRouter();
  const {
    plan,
    canCreateRepair,
    repairsRemaining,
    repairCount,
    isTrialActive,
    isExpired,
    trialRepairsRemaining,
    limits,
    loading,
  } = usePlanLimits();

  if (loading) return null;

  // Expired premium: show expired banner
  if (isExpired) {
    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">{t('subscriptionExpired')}</h3>
            <p className="text-sm text-red-600 mt-1">{t('subscriptionExpiredDesc')}</p>
            <button
              onClick={() => router.push('/settings')}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Crown className="w-4 h-4" />
              {t('renewSubscription')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Free plan: show limit reached
  if (plan === 'free' && !canCreateRepair) {
    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">{t('planLimitReached')}</h3>
            <p className="text-sm text-red-600 mt-1">{t('planLimitReachedDesc', { max: limits.maxRepairs })}</p>
            <button
              onClick={() => router.push('/settings')}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Crown className="w-4 h-4" />
              {t('upgradeToPremium')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Free plan: show warning when close to limit (3 or fewer remaining)
  if (plan === 'free' && repairsRemaining <= 3 && repairsRemaining > 0) {
    return (
      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800">{t('planLimitWarning')}</h3>
            <p className="text-sm text-amber-600 mt-1">
              {t('planLimitWarningDesc', { remaining: repairsRemaining, max: limits.maxRepairs })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Premium trial: show trial status
  if (plan === 'premium' && isTrialActive) {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800">{t('premiumTrialActive')}</h3>
            <p className="text-sm text-blue-600 mt-1">
              {t('premiumTrialDesc', { remaining: trialRepairsRemaining, total: limits.trialRepairs })}
            </p>
            {/* Progress bar */}
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(repairCount / limits.trialRepairs) * 100}%` }}
              />
            </div>
            <p className="text-xs text-blue-500 mt-1">
              {repairCount}/{limits.trialRepairs} {t('repairsUsed')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
