'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
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
    role: 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
    avatarUrl?: string;
  }>(initialUser || {
    name: 'Pengurus Taruna',
    role: 'ADMIN',
  });

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user') || localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name && (parsed.role === 'SUPERADMIN' || parsed.role === 'ADMIN' || parsed.role === 'MEMBER')) {
          setCurrentUser({
            name: parsed.name,
            role: parsed.role,
          });
        }
      }
    } catch {
      // Ignore json parse error
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-taruna-surface dark:bg-slate-950 text-taruna-dark dark:text-slate-100 transition-colors print:bg-white print:text-black print:min-h-0">
      {/* Sidebar Navigation with RBAC */}
      <div className="print:hidden">
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
          {children}
        </main>
      </div>
    </div>
  );
};
