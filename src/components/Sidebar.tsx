'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, Tag, Clipboard, CreditCard, CheckCircle, History, DollarSign, Wallet, AlertCircle, Settings, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '@/lib/auth';
import { useBalance } from '@/lib/hooks/useBalance';
import { useBusinessProfile } from '@/lib/businessProfileContext';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const t = useTranslations();
  const pathname = usePathname();
  const { user } = useAuth();
  const { balance, loading: balanceLoading } = useBalance();
  const { businessProfile } = useBusinessProfile();

  const navItems = [
    { href: '/', icon: <Wrench className="w-5 h-5" />, label: t('customerIntake') },
    { href: '/history', icon: <History className="w-5 h-5" />, label: t('customerHistory') },
    { href: '/diagnostic', icon: <Clipboard className="w-5 h-5" />, label: t('diagnosticEntry') },
    { href: '/completion/repairing', icon: <CheckCircle className="w-5 h-5" />, label: t('completion') },
    { href: '/daily-cash', icon: <DollarSign className="w-5 h-5" />, label: t('dailyCashRegister') },
    { href: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Sozlamalar' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {onClose && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        )}

      <div className="p-6">
        <h1 className="text-xl font-bold">{businessProfile?.master_name || 'pMaster'}</h1>
        <p className="text-gray-400 text-sm">PC Repair Management</p>
      </div>
      <nav className="mt-6 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 transition-colors ${
              isActive(item.href) ? 'bg-blue-900 text-white' : ''
            }`}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-6 space-y-4">
        {/* Balance Display */}
        <Link
          href="/balance-history"
          className={`block p-3 rounded-lg transition-all ${
            balance !== null && balance < 1000
              ? 'bg-red-900/50 border border-red-700'
              : 'bg-gray-800'
          } ${
            pathname === '/balance-history' ? 'ring-2 ring-blue-500' : ''
          } hover:bg-gray-700 cursor-pointer`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase">Balans</span>
          </div>
          {balanceLoading ? (
            <div className="text-sm text-gray-400">Yuklanmoqda...</div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">
                {balance !== null ? `${balance.toLocaleString()} UZS` : '0 UZS'}
              </span>
              {balance !== null && balance < 1000 && (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
          )}
          {balance !== null && balance < 1000 && (
            <div className="text-xs text-red-300 mt-1">
              Balans past
            </div>
          )}
        </Link>

        <LanguageToggle />
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
