'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function JimpitanRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/finance');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-6 border-taruna-yellow-200 dark:border-slate-800">
        <CardHeader className="space-y-3 pb-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wallet className="w-7 h-7" />
          </div>
          <CardTitle className="text-xl">Pencatatan Jimpitan Dialihkan</CardTitle>
          <CardDescription>
            Pencatatan jimpitan kini diinput manual secara langsung melalui menu Keuangan (Pemasukan) tanpa pembagian per kelompok.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Mengalihkan Anda secara otomatis ke halaman Keuangan...
          </p>
          <Link href="/finance">
            <Button variant="primary" className="w-full gap-2">
              <span>Buka Menu Keuangan</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
