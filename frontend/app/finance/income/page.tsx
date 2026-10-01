'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinanceIncomeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/finance?tab=income');
  }, [router]);

  return null;
}
