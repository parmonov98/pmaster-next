import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="container mx-auto px-4 text-center space-y-6 py-24">
        <h1 className="text-5xl font-bold text-slate-900">404</h1>
        <p className="text-xl text-slate-600">Page not found</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
