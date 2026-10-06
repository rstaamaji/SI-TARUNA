'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { getStoredUser, UserRole } from '@/lib/auth';

import { PushNotificationBanner } from '@/components/notifications/PushNotificationBanner';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: UserRole;
    avatarUrl?: string;
  };
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user: initialUser,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = React.useState<{
    name: string;
    role: UserRole;
    avatarUrl?: string;
  }>(initialUser || {
    name: 'Pengurus Taruna',
    role: 'ADMIN',
  });

  React.useEffect(() => {
    try {
      const u = getStoredUser();
      if (u) {
        setCurrentUser({
          name: u.name,
          role: u.role,
        });
      }
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-taruna-surface dark:bg-slate-950 text-taruna-dark dark:text-slate-100 transition-colors print:bg-white print:text-black print:min-h-0">
      {/* Sidebar Navigation with RBAC */}
      <div className="print:hidden lg:sticky lg:top-0 lg:h-screen lg:shrink-0">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={currentUser.role}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 print:w-full print:block">
        <div className="print:hidden">
          <Navbar
            onMenuToggle={() => setSidebarOpen(true)}
            user={currentUser}
          />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:max-w-none">
          <div className="print:hidden">
            <PushNotificationBanner />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};
