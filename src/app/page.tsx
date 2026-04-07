'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const { user, loading, profileReady, role, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // auth 세션 + 프로필 양쪽 모두 확인될 때까지 대기
    if (loading || !profileReady) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!userProfile) {
      router.replace('/register');
      return;
    }

    switch (role) {
      case 'ADMIN':
        router.replace('/admin/dashboard');
        break;
      case 'WORKER':
        router.replace('/worker/list');
        break;
      case 'AGENCY':
        router.replace('/agency/dashboard');
        break;
      case 'CUSTOMER':
      default:
        router.replace('/survey');
        break;
    }
  }, [user, loading, profileReady, role, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-400 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-gray-900">Z</span>
        </div>
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3" />
        <p className="text-sm text-gray-500">에너지잡고 로딩 중...</p>
      </div>
    </div>
  );
}
