'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, profileReady } = useAuth();

  // auth 세션 + 프로필 양쪽 모두 확인될 때까지 로딩 처리
  const isReady = !loading && profileReady;

  useEffect(() => {
    if (!isReady) return;
    if (!user || (role !== 'WORKER' && role !== 'ADMIN')) {
      router.replace('/admin/login');
    }
  }, [user, role, isReady, router]);

  if (!isReady || !user || (role !== 'WORKER' && role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
}
