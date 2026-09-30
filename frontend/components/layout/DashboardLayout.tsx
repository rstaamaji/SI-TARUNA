'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: 'ADMIN' | 'MEMBER';
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
    role: 'ADMIN' | 'MEMBER';
    avatarUrl?: string;
  }>(initialUser || {
    name: 'Pengurus Taruna',
    role: 'ADMIN',
  });

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name && (parsed.role === 'ADMIN' || parsed.role === 'MEMBER')) {
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
    <div className="min-h-screen flex bg-taruna-surface dark:bg-slate-950 text-taruna-dark dark:text-slate-100 transition-colors">
      {/* Sidebar Navigation with RBAC */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={currentUser.role}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onMenuToggle={() => setSidebarOpen(true)}
          user={currentUser}
          notificationCount={3}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
