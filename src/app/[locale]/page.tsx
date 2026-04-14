import { Locale, locales } from '@/i18n/config';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Problems from '@/components/landing/Problems';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import DeviceTypes from '@/components/landing/DeviceTypes';
import Pricing from '@/components/landing/Pricing';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';
import JsonLd from '@/components/JsonLd';

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;

  const meta: Record<Locale, { title: string; description: string }> = {
    uz: {
      title: "pMaster — Ta'mirlash ustaxonalari uchun CRM | Bepul bulutli yechim",
      description: "pMaster — ta'mirlash ustaxonalari uchun bepul bulutli CRM. QR-kodlar orqali ta'mirlarni kuzating, avtomatik SMS yuboring, kunlik kassani boshqaring.",
    },
    ru: {
      title: 'pMaster — CRM для ремонтных мастерских | Бесплатное облачное решение',
      description: 'pMaster — бесплатная облачная CRM для ремонтных мастерских. QR-коды, автоматические SMS, касса, статус ремонта онлайн.',
    },
    en: {
      title: 'pMaster — Repair Shop CRM & Management Software | Free Cloud-Based Solution',
      description: 'pMaster is a free cloud-based CRM for repair shops. Track repairs with QR codes, send automatic SMS notifications, manage daily cash flow.',
    },
  };

  const { title, description } = meta[locale] || meta.uz;
  const baseUrl = 'https://pmaster.uz';

  return {
    title,
    description,
    keywords: 'repair shop CRM, repair shop management software, repair tracking system, workshop management, phone repair software, electronics repair CRM, ta\'mirlash CRM, ремонт мастерская CRM',
    authors: [{ name: 'pMaster' }],
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: 'pMaster',
      locale: locale === 'uz' ? 'uz_UZ' : locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        uz: `${baseUrl}/uz`,
        ru: `${baseUrl}/ru`,
        en: `${baseUrl}/en`,
      },
    },
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <JsonLd />
      <Header />
      <Hero />
      <Problems />
      <Features />
      <HowItWorks />
      <DeviceTypes />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
