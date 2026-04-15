'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useBusinessProfile } from '@/lib/businessProfileContext';
import { useTranslations } from 'next-intl';

export default function ProfileDropdown() {
  const t = useTranslations();
  const { user, signOut } = useAuth();
  const { businessProfile } = useBusinessProfile();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || !businessProfile) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        {user.user_metadata.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
        )}
        <div className="text-left min-w-0 max-w-[180px] md:max-w-none">
          <div className="text-sm font-medium truncate">{user.user_metadata.full_name}</div>
          <div className="text-xs text-gray-500 truncate">{businessProfile.business_name}</div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b">
            <div className="text-sm font-medium text-gray-900">{businessProfile.business_name}</div>
            <div className="text-xs text-gray-500">
              {businessProfile.region && businessProfile.city
                ? `${businessProfile.city}, ${businessProfile.region}`
                : businessProfile.location
              }
            </div>
          </div>

          <Link
            href="/business/edit"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Building2 className="w-4 h-4" />
            Biznesni tahrirlash
          </Link>

          <button
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
