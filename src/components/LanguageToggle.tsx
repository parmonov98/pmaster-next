'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

interface LanguageToggleProps {
  direction?: 'down' | 'up';
}

export default function LanguageToggle({ direction = 'down' }: LanguageToggleProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const languages = [
    { code: 'uz', label: 'UZ' },
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
  ];

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

    // Navigate to the new locale path
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <div className="relative group">
      <button className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-100">
        {locale.toUpperCase()}
      </button>

      {/* Dropdown Menu */}
      <div className={`absolute ${direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-50 min-w-max`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
              locale === lang.code
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
