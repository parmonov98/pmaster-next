'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useBusinessProfile } from '@/lib/businessProfileContext';
import { AuthProvider } from '@/lib/auth';
import { BusinessProfileProvider } from '@/lib/businessProfileContext';
import { BalanceProvider } from '@/lib/balanceContext';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { businessProfile, loading: profileLoading } = useBusinessProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Don't redirect while loading
    if (authLoading || profileLoading) return;

    // Redirect to signin if not authenticated
    if (!user) {
      router.replace('/auth/signin');
      return;
    }

    // Redirect to setup if no business profile
    if (!businessProfile) {
      router.replace('/setup');
      return;
    }
  }, [user, authLoading, businessProfile, profileLoading, router]);

  if (authLoading || profileLoading || !user || !businessProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <h1 className="text-lg font-semibold text-gray-900">pMaster</h1>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Bottom Navigation (Mobile) */}
        <BottomNav />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <BusinessProfileProvider>
        <BalanceProvider>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </BalanceProvider>
      </BusinessProfileProvider>
    </AuthProvider>
  );
}
