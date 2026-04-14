'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { ArrowRight, Menu, X } from 'lucide-react';
import LanguageToggle from '../LanguageToggle';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScroll, setHasScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScroll(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        hasScroll
          ? 'bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm'
          : 'bg-white/50 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-1 font-bold text-xl">
            <span className="text-blue-600">p</span>
            <span className="text-gray-900">Master</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              {t('nav_features')}
            </a>
            <a
              href="#how-it-works"
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              {t('nav_how')}
            </a>
            <a
              href="#pricing"
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              {t('nav_pricing')}
            </a>
            <a
              href="#faq"
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              {t('nav_faq')}
            </a>
          </nav>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageToggle direction="down" />
            <Link
              href={`/${locale}/auth/signin`}
              className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              {t('signIn')}
            </Link>
            <Link
              href={`/${locale}/auth/signup`}
              className="btn btn-primary text-sm px-6 py-2"
            >
              {t('header_cta')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-200 space-y-3">
            <a
              href="#features"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors text-sm font-medium"
            >
              {t('nav_features')}
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors text-sm font-medium"
            >
              {t('nav_how')}
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors text-sm font-medium"
            >
              {t('nav_pricing')}
            </a>
            <a
              href="#faq"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors text-sm font-medium"
            >
              {t('nav_faq')}
            </a>
            <div className="flex items-center gap-2 px-4 py-2">
              <LanguageToggle direction="down" />
            </div>
            <div className="flex gap-2 px-4 pt-2">
              <Link
                href={`/${locale}/auth/signin`}
                onClick={() => setIsMenuOpen(false)}
                className="flex-1 btn btn-secondary text-center text-sm"
              >
                {t('signIn')}
              </Link>
              <Link
                href={`/${locale}/auth/signup`}
                onClick={() => setIsMenuOpen(false)}
                className="flex-1 btn btn-primary text-center text-sm"
              >
                {t('header_cta')}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
