import React from 'react';
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/ui/LoadingState';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Skeleton */}
      <div className="p-6 rounded-3xl border border-taruna-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2.5 max-w-lg w-full">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex gap-2 self-start">
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Table Skeleton */}
      <TableSkeleton rows={5} />
    </div>
  );
}
