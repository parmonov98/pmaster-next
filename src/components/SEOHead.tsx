'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';

const BASE_URL = 'https://pmaster.uz';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

// Route-specific SEO data per language
const routeSEO: Record<string, Record<string, { title: string; description: string }>> = {
  '/': {
    uz: {
      title: "PMaster - Kompyuter, Printer, Telefon, Muzlatgich, Konditsioner va turli maishiy texnika sozlashni boshqarish tizimi",
      description: "O'zbekiston uchun kompyuter, printer, telefon, muzlatgich, konditsioner va turli maishiy texnika ta'mirlash ustaxonalari boshqaruv tizimi. Buyurtmalar, mijozlar, hisobotlar — barchasi bir joyda.",
    },
    ru: {
      title: 'PMaster - Система управления ремонтом компьютеров, принтеров, телефонов, холодильников, кондиционеров и бытовой техники',
      description: 'Система управления мастерскими по ремонту компьютеров, принтеров, телефонов, холодильников, кондиционеров и бытовой техники в Узбекистане. Заказы, клиенты, отчёты — всё в одном месте.',
    },
    en: {
      title: 'PMaster - Computer, Printer, Phone, Refrigerator, AC & Appliance Repair Management',
      description: 'Repair shop management system for computers, printers, phones, refrigerators, air conditioners and appliances in Uzbekistan. Orders, customers, reports — all in one place.',
    },
  },
  '/auth/signin': {
    uz: { title: 'Kirish - PMaster', description: "PMaster hisobingizga kiring va ta'mirlash buyurtmalarini boshqaring." },
    ru: { title: 'Вход - PMaster', description: 'Войдите в свой аккаунт PMaster и управляйте заказами на ремонт.' },
    en: { title: 'Sign In - PMaster', description: 'Sign in to your PMaster account and manage repair orders.' },
  },
  '/auth/signup': {
    uz: { title: "Ro'yxatdan o'tish - PMaster", description: "Bepul ro'yxatdan o'ting va ta'mirlash ustaxonangizni boshqarishni boshlang." },
    ru: { title: 'Регистрация - PMaster', description: 'Зарегистрируйтесь бесплатно и начните управлять вашей мастерской.' },
    en: { title: 'Sign Up - PMaster', description: 'Register for free and start managing your repair shop.' },
  },
  '/privacy': {
    uz: { title: 'Maxfiylik siyosati - PMaster', description: "PMaster maxfiylik siyosati va foydalanuvchi ma'lumotlarini himoya qilish." },
    ru: { title: 'Политика конфиденциальности - PMaster', description: 'Политика конфиденциальности PMaster и защита данных пользователей.' },
    en: { title: 'Privacy Policy - PMaster', description: 'PMaster privacy policy and user data protection.' },
  },
  '/terms': {
    uz: { title: "Foydalanish shartlari - PMaster", description: "PMaster xizmatidan foydalanish shartlari va qoidalari." },
    ru: { title: 'Условия использования - PMaster', description: 'Условия использования сервиса PMaster.' },
    en: { title: 'Terms of Service - PMaster', description: 'PMaster terms of service and usage conditions.' },
  },
};

export default function SEOHead({ title, description, image, type = 'website', noindex = false }: SEOHeadProps) {
  const locale = useLocale();
  const pathname = usePathname();

  // Remove the locale from pathname for matching
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
  const canonicalUrl = `${BASE_URL}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;

  // Get route-specific or fallback SEO data
  const routeData = routeSEO[pathWithoutLocale]?.[locale] || routeSEO['/']?.[locale] || routeSEO['/']!.uz;
  const pageTitle = title || routeData.title;
  const pageDescription = description || routeData.description;
  const ogImage = image || `${BASE_URL}/og-image.png`;

  const languages = ['uz', 'ru', 'en'];

  return (
    <>
      {/* Basic Meta */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="PMaster" />
      <meta property="og:locale" content={locale === 'uz' ? 'uz_UZ' : locale === 'ru' ? 'ru_RU' : 'en_US'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Hreflang tags for language alternatives */}
      {languages.map((lng) => (
        <link
          key={lng}
          rel="alternate"
          hrefLang={lng}
          href={`${BASE_URL}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}${pathWithoutLocale.includes('?') ? '&' : '?'}lang=${lng}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`} />
    </>
  );
}
