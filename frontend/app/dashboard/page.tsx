'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { MemberDashboard } from '@/components/dashboard/MemberDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [viewMode, setViewMode] = useState<'AUTO' | 'MEMBER' | 'ADMIN'>('AUTO');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('si_taruna_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'ADMIN' || parsed.role === 'MEMBER') {
          setUserRole(parsed.role);
        }
      }
    } catch (e) {
      console.debug('Failed to read stored user session:', e);
    }
  }, []);

  const isMemberView = viewMode === 'MEMBER' || (viewMode === 'AUTO' && userRole === 'MEMBER');

  if (isMemberView) {
    return (
      <div className="space-y-6">
        {userRole === 'ADMIN' && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-3 text-xs flex-wrap">
            <span className="text-amber-800 dark:text-amber-300 font-semibold">
              👁️ Pratinjau: Anda sedang melihat tampilan <strong>Dashboard Member</strong> (Mode Admin).
            </span>
            <button
              onClick={() => setViewMode('ADMIN')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition shadow-xs"
            >
              Kembali ke Dashboard Admin
            </button>
          </div>
        )}
        <MemberDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-3.5 bg-taruna-yellow-50/70 dark:bg-slate-800/80 border border-taruna-yellow-200/80 dark:border-slate-700 rounded-2xl flex-wrap gap-3 text-xs">
        <span className="text-taruna-dark dark:text-slate-200 font-medium">
          🛡️ Anda berada di <strong>Mode Administrator</strong> dengan akses penuh ke overview organisasi, keuangan &amp; chart analitik.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode('MEMBER')}
        >
          👁️ Pratinjau Dashboard Member
        </Button>
      </div>
      <AdminDashboard />
    </div>
  );
}
