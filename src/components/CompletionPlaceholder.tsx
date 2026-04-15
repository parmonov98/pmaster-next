'use client';

import React from 'react';
import { Settings } from 'lucide-react';

const CompletionPlaceholder = () => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center text-gray-500 min-h-[200px] bg-white rounded-lg shadow-sm">
      <Settings className="w-16 h-16 mb-4 text-gray-400" />
      <p className="text-center">Yakunlash uchun ta&apos;mirlashni tanlang</p>
    </div>
  );
};

export default CompletionPlaceholder;
