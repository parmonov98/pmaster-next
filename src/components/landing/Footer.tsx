import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="bg-gray-900 text-gray-400">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: Logo & Description (Wider) */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.svg" alt="pMaster" className="h-8 w-auto" />
              <span className="text-white font-bold text-lg">pMaster</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer_desc')}
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-white font-semibold mb-6">{t('footer_product')}</h3>
            <ul className="space-y-4">
              <li>
                <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {t('features_title')}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {t('choosePlan')}
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {t('faq_label')}
                </a>
              </li>
              <li>
                <a href="https://blog.pmaster.uz" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {t('footer_blog')}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-white font-semibold mb-6">{t('footer_company')}</h3>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {t('footer_about')}
                </a>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-gray-400 hover:text-white transition-colors text-sm">
                  {t('footer_privacy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-gray-400 hover:text-white transition-colors text-sm">
                  {t('footer_terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6">{t('footer_contact')}</h3>
            <ul className="space-y-4">
              <li>
                <a href="tel:+998952212144" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                  <span>+998 95 221 21 44</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@thedevs.uz" className="text-gray-400 hover:text-white transition-colors text-sm">
                  info@thedevs.uz
                </a>
              </li>
              <li className="flex gap-4 pt-2">
                <a href="https://t.me/pmaster_bot" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <Send className="w-5 h-5" />
                </a>
                <a href="https://instagram.com/pmaster_uz" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} pMaster. All rights reserved.</p>
            <p className="text-center md:text-right">
              {t('footer_made')} •
              <a href="https://thedevs.uz" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors ml-1">
                THEDEVS.uz
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
