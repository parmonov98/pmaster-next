'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

type FeedbackType = 'suggestion' | 'bug' | 'request' | 'other';

export function FeedbackModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations();
  const supabase = createClient();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFeedbackError(null);
    setFeedbackSuccess(false);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => panelRef.current?.focus(), 0);
  }, [isOpen]);

  const handleSubmitFeedback = async () => {
    const message = feedbackMessage.trim();
    if (!message) {
      setFeedbackError(t('feedbackMessageRequired', { defaultValue: 'Message is required' }));
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError(null);
    setFeedbackSuccess(false);

    try {
      const { error: invokeError } = await supabase.functions.invoke('submit-feedback', {
        body: {
          type: feedbackType,
          message,
          contact: feedbackContact.trim() || undefined,
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
        },
      });

      if (invokeError) {
        setFeedbackError(invokeError.message || t('feedbackSubmitFailed', { defaultValue: 'Failed to submit. Please try again.' }));
        return;
      }

      setFeedbackSuccess(true);
      setFeedbackMessage('');
      setFeedbackContact('');
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : t('feedbackSubmitFailed', { defaultValue: 'Failed to submit. Please try again.' }));
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t('close', { defaultValue: 'Close' })}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          className="w-full max-w-2xl bg-white rounded-lg shadow-xl outline-none"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{t('feedbackTitle', { defaultValue: 'Suggestions & Requests' })}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              aria-label={t('close', { defaultValue: 'Close' })}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-gray-500 mb-2">
              {t('feedbackDesc', { defaultValue: "Send us an idea, a bug report, or a feature request. We'll receive it in Telegram." })}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {t('feedbackAltContact', { defaultValue: 'Or send your suggestion via Telegram:' })}{' '}
              <a
                href="https://t.me/dev_murod"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                @dev_murod
              </a>
            </p>

            {feedbackError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{feedbackError}</p>
              </div>
            )}

            {feedbackSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{t('feedbackSubmitted', { defaultValue: "Thanks! Your message has been sent." })}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('feedbackTypeLabel', { defaultValue: 'Type' })}
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                  disabled={feedbackLoading}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="suggestion">{t('feedbackTypeSuggestion', { defaultValue: 'Suggestion' })}</option>
                  <option value="bug">{t('feedbackTypeBug', { defaultValue: 'Bug' })}</option>
                  <option value="request">{t('feedbackTypeRequest', { defaultValue: 'Request' })}</option>
                  <option value="other">{t('feedbackTypeOther', { defaultValue: 'Other' })}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('feedbackContactLabel', { defaultValue: 'Contact (optional)' })}
                </label>
                <input
                  type="text"
                  value={feedbackContact}
                  onChange={(e) => setFeedbackContact(e.target.value)}
                  disabled={feedbackLoading}
                  placeholder={t('feedbackContactPlaceholder', { defaultValue: 'Phone, Telegram username, email' })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('feedbackMessageLabel', { defaultValue: 'Message' })}
              </label>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                disabled={feedbackLoading}
                rows={6}
                maxLength={2000}
                placeholder={t('feedbackMessagePlaceholder', { defaultValue: 'Describe your idea or the problem...' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="mt-1 text-xs text-gray-500 text-right">
                {feedbackMessage.length}/2000
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">{t('feedbackRateLimitHint', { defaultValue: 'Limit: 3 messages per hour' })}</p>

              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={feedbackLoading}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {feedbackLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    {t('submitting', { defaultValue: 'Submitting...' })}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('submit', { defaultValue: 'Submit' })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
