'use client';

import { useTranslations } from 'next-intl';

export default function BlogPostPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">BlogPost</h1>
        <p className="text-gray-600">This page is being ported to Next.js App Router.</p>
      </div>
    </div>
  );
}
