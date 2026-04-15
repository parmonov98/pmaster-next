'use client';

import React from 'react';
import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

const DiagnosticPlaceholder = () => {
  const t = useTranslations();

  return (
    <div className="hidden lg:flex flex-col items-center justify-center text-gray-500 min-h-[200px] bg-white rounded-lg shadow-sm">
      <ClipboardList className="w-16 h-16 mb-4" />
      <p>{t('selectRepair')}</p>
    </div>
  );
};

export default DiagnosticPlaceholder;
