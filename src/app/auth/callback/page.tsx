'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get('next') || '/';

    // detectSessionInUrl: true 가 자동으로 code 교환 처리
    // SIGNED_IN 이벤트를 기다렸다가 redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        subscription.unsubscribe();
        router.replace(next);
      }
    });

    // 이미 로그인된 경우 바로 redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        router.replace(next);
      }
    });

    // 5초 후 fallback redirect
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      router.replace(next);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
