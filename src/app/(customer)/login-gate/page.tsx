'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithKakao } from '@/lib/supabase';
import PageTransition from '@/components/PageTransition';

export default function LoginGatePage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace('/estimate');
    }
  }, [user, router]);

  const handleKakaoLogin = async () => {
    await signInWithKakao('/estimate');
  };

  return (
    <PageTransition>
    <div className="relative flex flex-col min-h-screen items-center justify-center overflow-hidden bg-gray-900">
      {/* 배경 유튜브 영상 — Shorts(9:16) 세로 영상을 화면에 꽉 채움 */}
      <div className="absolute inset-0 overflow-hidden">
        <iframe
          className="pointer-events-none opacity-50"
          src="https://www.youtube.com/embed/dWjhcYs0gl4?autoplay=1&loop=1&playlist=dWjhcYs0gl4&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1"
          allow="autoplay; encrypted-media"
          style={{
            border: 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            /* 9:16 세로 비율로 화면을 cover — 어떤 화면 크기에도 꽉 채움 */
            height: 'max(100vh, 177.78vw)',
            width: 'max(100vw, 56.25vh)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center gap-8 w-full max-w-sm">
        <p className="text-white text-xl font-bold leading-relaxed">
          카카오 간편 로그인으로<br />
          예상 견적을 바로 확인해 보세요
        </p>

        <button
          onClick={handleKakaoLogin}
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#FEE500] text-gray-900 font-bold text-base rounded-none"
          style={{ borderRadius: 0 }}
        >
          <span className="text-xl">💬</span>
          카카오 간편 로그인
        </button>
      </div>
    </div>
    </PageTransition>
  );
}
