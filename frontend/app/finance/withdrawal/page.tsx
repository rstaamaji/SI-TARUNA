'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinanceWithdrawalRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/finance?tab=expense');
  }, [router]);

  return null;
}
