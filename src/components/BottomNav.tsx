'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, History, Clipboard, CheckCircle, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';

const BottomNav = () => {
  const t = useTranslations();
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Wrench, label: t('customerIntake') },
    { href: '/history', icon: History, label: t('customerHistory') },
    { href: '/diagnostic', icon: Clipboard, label: t('diagnosticEntry') },
    { href: '/completion/repairing', icon: CheckCircle, label: t('completion') },
    { href: '/daily-cash', icon: DollarSign, label: t('dailyCashRegister') },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    if (href === '/completion/repairing') {
      return pathname.includes('/completion');
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden safe-area-bottom">
      <div className="flex justify-around items-center h-12 md:h-14">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors px-1 ${
                isActive(item.href)
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-[18px] h-[18px] md:w-5 md:h-5 mb-0.5" />
              <span className="text-[10px] md:text-xs font-medium text-center leading-tight truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
