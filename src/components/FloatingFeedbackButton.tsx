'use client';

import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMobile } from '@/lib/hooks/useMobile';
import { FeedbackModal } from './FeedbackModal';

export function FloatingFeedbackButton() {
  const t = useTranslations();
  const isMobile = useMobile();
  const [open, setOpen] = React.useState(false);

  const openLabel = t('feedbackTitle', { defaultValue: 'Suggestions & Requests' });

  return (
    <>
      {isMobile ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={openLabel}
          className="fixed z-50 right-5 bottom-24 md:hidden inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <MessageSquareText className="w-6 h-6" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={openLabel}
          className={[
            'hidden md:flex fixed z-50 right-0 top-1/2 -translate-y-1/2',
            'translate-x-[calc(100%-2.5rem)] hover:translate-x-0 focus:translate-x-0',
            'transition-transform duration-200 ease-out',
            'bg-blue-600 text-white shadow-lg rounded-l-xl',
            'h-12 pl-3 pr-4 items-center gap-2',
          ].join(' ')}
        >
          <MessageSquareText className="w-5 h-5" />
          <span className="text-sm font-medium whitespace-nowrap">{openLabel}</span>
        </button>
      )}

      <FeedbackModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
