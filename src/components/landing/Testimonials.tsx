'use client';

import { Star, Quote } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface Testimonial {
  name: string;
  city: string;
  business: { uz: string; ru: string; en: string };
  rating: number;
  review: { uz: string; ru: string; en: string };
  initials: string;
  color: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Aziz K.',
    city: 'Toshkent',
    business: {
      uz: 'Kompyuter ta\'mirlash',
      ru: 'Ремонт компьютеров',
      en: 'Computer repair',
    },
    rating: 5,
    review: {
      uz: 'pMaster orqali mijozlarimni kuzatish juda osonlashdi. Oldin daftarda yozardim, endi hammasi telefonimda.',
      ru: 'С pMaster отслеживать клиентов стало намного проще. Раньше записывал в тетрадь, теперь всё в телефоне.',
      en: 'Tracking my customers with pMaster became so easy. I used to write in a notebook, now everything is on my phone.',
    },
    initials: 'AK',
    color: 'bg-blue-500',
  },
  {
    name: 'Dilshod R.',
    city: 'Samarqand',
    business: {
      uz: 'Printer ta\'mirlash',
      ru: 'Ремонт принтеров',
      en: 'Printer repair',
    },
    rating: 5,
    review: {
      uz: 'QR kod yorliqlari eng zo\'r funksiya. Mijoz kelganda qurilmasini tezda topaman.',
      ru: 'QR-код этикетки — лучшая функция. Когда клиент приходит, я быстро нахожу его устройство.',
      en: 'QR code labels are the best feature. When a customer comes, I quickly find their device.',
    },
    initials: 'DR',
    color: 'bg-green-500',
  },
  {
    name: 'Nodira A.',
    city: 'Buxoro',
    business: {
      uz: 'Telefon ta\'mirlash',
      ru: 'Ремонт телефонов',
      en: 'Phone repair',
    },
    rating: 5,
    review: {
      uz: 'Kunlik kassa hisoboti menga har kuni qancha pul ishlaganimni ko\'rsatadi. Juda foydali!',
      ru: 'Ежедневный кассовый отчёт показывает, сколько я заработал каждый день. Очень полезно!',
      en: 'Daily cash report shows me how much I earned each day. Very useful!',
    },
    initials: 'NA',
    color: 'bg-purple-500',
  },
  {
    name: 'Sardor M.',
    city: 'Namangan',
    business: {
      uz: 'Maishiy texnika',
      ru: 'Бытовая техника',
      en: 'Home appliances',
    },
    rating: 5,
    review: {
      uz: 'SMS xabarnomalar tufayli mijozlarim qurilmasi tayyor bo\'lganda biladi. Professional ko\'rinadi.',
      ru: 'Благодаря SMS-уведомлениям клиенты знают, когда их устройство готово. Выглядит профессионально.',
      en: 'Thanks to SMS notifications, customers know when their device is ready. Looks professional.',
    },
    initials: 'SM',
    color: 'bg-amber-500',
  },
  {
    name: 'Jasur T.',
    city: 'Farg\'ona',
    business: {
      uz: 'Kompyuter ta\'mirlash',
      ru: 'Ремонт компьютеров',
      en: 'Computer repair',
    },
    rating: 4,
    review: {
      uz: 'Bepul rejada boshladim, hozir Premium ishlataman. Har bir tiyin arziydi.',
      ru: 'Начал с бесплатного плана, теперь использую Premium. Каждая копейка стоит того.',
      en: 'Started with the free plan, now I use Premium. Every penny is worth it.',
    },
    initials: 'JT',
    color: 'bg-red-500',
  },
];

export default function Testimonials() {
  const t = useTranslations();
  const locale = useLocale();
  const lang = locale as 'uz' | 'ru' | 'en';

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {t('testimonialsTitle')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {t('testimonialsSubtitle')}
          </p>
        </div>

        {/* Desktop: 3-column grid, Mobile: horizontal scroll */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          {testimonials.slice(0, 3).map((item, index) => (
            <TestimonialCard key={index} item={item} lang={lang} />
          ))}
        </div>

        {/* Second row: 2 cards centered */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 mt-6">
          <div className="hidden lg:block" />
          {testimonials.slice(3, 5).map((item, index) => (
            <TestimonialCard key={index + 3} item={item} lang={lang} />
          ))}
        </div>

        {/* Aggregate rating */}
        <div className="mt-10 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-sm text-gray-600">
            4.8 / 5.0 — {testimonials.length} {t('reviews')}
          </p>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ item, lang }: { item: Testimonial; lang: 'uz' | 'ru' | 'en' }) {
  return (
    <div className="min-w-[300px] lg:min-w-0 snap-center flex-shrink-0 lg:flex-shrink bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <Quote className="w-8 h-8 text-blue-100 mb-3" />

      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        "{item.review[lang]}"
      </p>

      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
          />
        ))}
      </div>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white text-sm font-bold`}>
          {item.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
          <p className="text-xs text-gray-500">{item.business[lang]} — {item.city}</p>
        </div>
      </div>
    </div>
  );
}
