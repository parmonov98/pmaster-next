'use client';

import { useState, useEffect } from 'react';
import { Crown, Calendar, AlertCircle, CheckCircle, Loader2, History, Wallet, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePlanLimits } from '@/lib/hooks/usePlanLimits';
import { useBalance } from '@/lib/balanceContext';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';

type SubscriptionHistoryItem = {
  id: string;
  plan: string;
  action: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
};

export default function SubscriptionSection() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  const { balance, refreshBalance } = useBalance();
  const {
    plan,
    planExpiresAt,
    daysRemaining,
    isExpired,
    autoRenew,
    premiumPrice,
    loading,
    subscribe,
    toggleAutoRenew,
  } = usePlanLimits();

  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setHistory(data);
    } catch (err) {
      console.error('Failed to load subscription history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setShowConfirm(false);
    setSubscribing(true);
    setResultMessage(null);

    const result = await subscribe();
    await refreshBalance();

    if (result.success) {
      setResultMessage({ type: 'success', text: t('subscriptionSuccess') });
      await loadHistory();
    } else if (result.error === 'insufficient_balance') {
      setResultMessage({ type: 'error', text: t('insufficientBalanceSubscription') });
    } else {
      setResultMessage({ type: 'error', text: t('subscriptionFailed') });
    }

    setSubscribing(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'upgrade': return t('subscriptionUpgrade');
      case 'renewal': return t('subscriptionRenewal');
      case 'downgrade': return t('subscriptionDowngrade');
      case 'expired': return t('subscriptionExpiredAction');
      default: return action;
    }
  };

  if (loading) return null;

  const insufficientBalance = premiumPrice !== null && balance !== null && balance < premiumPrice;

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Crown className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">{t('subscriptionTitle')}</h3>
      </div>

      {/* Current plan info */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">{t('currentPlan')}</p>
            <p className={`text-lg font-bold ${plan === 'premium' ? 'text-blue-600' : 'text-gray-900'}`}>
              {plan === 'premium' ? t('premiumPlan') : t('freePlan')}
            </p>
          </div>
          {plan === 'premium' && !isExpired && (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
          {isExpired && (
            <AlertCircle className="w-6 h-6 text-red-500" />
          )}
        </div>

        {plan === 'premium' && planExpiresAt && !isExpired && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{t('planExpiresOn', { date: formatDate(planExpiresAt) })}</span>
            <span className="text-blue-600 font-medium">({daysRemaining} {t('daysLeft')})</span>
          </div>
        )}

        {isExpired && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {t('subscriptionExpired')}
          </div>
        )}
      </div>

      {/* Result message */}
      {resultMessage && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          resultMessage.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {resultMessage.type === 'success'
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm">{resultMessage.text}</span>
        </div>
      )}

      {/* Subscribe / Renew button */}
      {(plan === 'free' || isExpired || (plan === 'premium' && !isExpired)) && premiumPrice !== null && (
        <div className="mb-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
            <p className="text-sm text-blue-800">
              {t('subscriptionCost')}: <strong>{premiumPrice.toLocaleString()} UZS / {t('perMonth')}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {t('currentBalance')}: {(balance ?? 0).toLocaleString()} UZS
            </p>
          </div>

          {insufficientBalance && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {t('insufficientBalanceSubscription')}
              </p>
              <button
                onClick={() => router.push('/balance-history')}
                className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Wallet className="w-4 h-4" />
                {t('topupBalance')}
              </button>
            </div>
          )}

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={subscribing || insufficientBalance}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Crown className="w-4 h-4" />
              {plan === 'premium' && !isExpired ? t('renewSubscription') : t('subscribeToPremium')}
            </button>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 mb-3">
                {t('confirmSubscription', { amount: premiumPrice.toLocaleString() })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {subscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {t('yes')}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={subscribing}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-renewal toggle — only for active premium */}
      {plan === 'premium' && !isExpired && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">{t('autoRenew')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('autoRenewDesc')}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                setTogglingAutoRenew(true);
                await toggleAutoRenew(!autoRenew);
                setTogglingAutoRenew(false);
              }}
              disabled={togglingAutoRenew}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRenew ? 'bg-blue-600' : 'bg-gray-300'
              } ${togglingAutoRenew ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRenew ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {autoRenew && insufficientBalance && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              {t('autoRenewInsufficientBalance')}
            </div>
          )}
        </div>
      )}

      {/* Subscription history */}
      {history.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">{t('subscriptionHistory')}</h4>
          </div>
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs text-gray-600 py-1">
                <div>
                  <span className="font-medium">{getActionLabel(item.action)}</span>
                  <span className="ml-2 text-gray-400">{formatDate(item.created_at)}</span>
                </div>
                <span className="text-red-600">-{item.amount.toLocaleString()} UZS</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
