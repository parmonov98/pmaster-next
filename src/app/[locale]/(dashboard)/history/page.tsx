'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import CustomerHistoryTab from '@/components/CustomerHistoryTab';

const CustomerHistoryPage = () => {
  const pathname = usePathname();
  const atDetail = pathname.includes('/history/repair/');

  return (
    <div className="">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className={`${atDetail ? 'hidden lg:block lg:col-span-4' : 'col-span-12'}`}>
          <CustomerHistoryTab listOnly={atDetail} />
        </div>
      </div>
    </div>
  );
};

export default CustomerHistoryPage;
