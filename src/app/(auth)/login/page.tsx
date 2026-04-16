'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VIDEO_ID = '_ZCn_t7kc5M';

export default function LoginPage() {
  const { signInWithKakao, user, loading, profileReady, role, userProfile } = useAuth();
  const router = useRouter();
  const redirecting = useRef(false);
  const playerRef = useRef<any>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);

  useEffect(() => {
    if (loading || !profileReady || !user || redirecting.current) return;
    redirecting.current = true;
    if (!userProfile) { router.replace('/register'); return; }
    switch (role) {
      case 'ADMIN': router.replace('/admin/dashboard'); break;
      case 'WORKER': router.replace('/worker/list'); break;
      case 'AGENCY': router.replace('/agency/dashboard'); break;
      default: router.replace('/selfest');
    }
  }, [user, loading, profileReady, role, userProfile, router]);

  useEffect(() => {
    const initPlayer = () => {
      if (playerRef.current) return;
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === 0) handleVideoEnd();
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    // 약간의 딜레이 후 로그인 UI 페이드인
    setTimeout(() => setLoginVisible(true), 50);
  };

  if (loading || (user && !profileReady)) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-white max-w-md mx-auto overflow-hidden">

      {/* 유튜브 영상 섹션 */}
      {!videoEnded && (
        <div className="flex flex-col flex-1 bg-black">
          {/* 로고 */}
          <div className="flex justify-center pt-10 pb-4">
            <img
              src="/LOGO_BK.webp"
              alt="에너지잡고"
              className="h-10 w-auto brightness-0 invert"
              draggable={false}
            />
          </div>

          {/* 영상 */}
          <div className="relative w-full aspect-video">
            <div id="yt-player" className="absolute inset-0 w-full h-full" />
          </div>

          {/* 건너뛰기 버튼 */}
          <div className="flex justify-end px-4 pt-3">
            <button
              onClick={handleVideoEnd}
              className="text-white/70 text-sm bg-white/10 hover:bg-white/20 active:bg-white/30 px-4 py-1.5 rounded-full transition-colors"
            >
              건너뛰기 →
            </button>
          </div>

          {/* 하단 안내 */}
          <div className="mt-auto pb-10 flex flex-col items-center gap-1 px-6 text-center">
            <p className="text-white/50 text-xs">창문 단열 셀프 견적 서비스</p>
            <p className="text-white/30 text-xs">영상이 끝나면 시작할 수 있어요</p>
          </div>
        </div>
      )}

      {/* 로그인 UI (영상 종료 후) */}
      {videoEnded && (
        <div
          className={`flex flex-col flex-1 px-6 transition-opacity duration-500 ${loginVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* 상단 로고 */}
          <div className="flex flex-col items-center justify-center pt-12 pb-6">
            <img
              src="/LOGO_BK.webp"
              alt="에너지잡고"
              className="h-16 w-auto"
              draggable={false}
            />
            <p className="text-sm text-gray-400 mt-3">창문 단열 셀프견적</p>
          </div>

          {/* 혜택 카드 */}
          <div className="bg-gray-50 px-5 py-4 mb-6">
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-yellow-500 font-bold">✓</span>
                3분만에 창문별 맞춤 견적 확인
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-500 font-bold">✓</span>
                단열 효과별 시공 방법 추천
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-500 font-bold">✓</span>
                참고 견적 무료 제공 (부가세 별도)
              </li>
            </ul>
          </div>

          {/* 카카오 버튼 */}
          <button
            onClick={signInWithKakao}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-[#FEE500] hover:bg-[#F5D800] active:bg-[#EDD000] text-[#191919] font-bold py-4 text-base transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M10 2C5.58 2 2 4.97 2 8.63c0 2.33 1.44 4.37 3.6 5.57l-.92 3.35a.3.3 0 00.46.32L9.4 15.2c.2.02.4.03.6.03 4.42 0 8-2.97 8-6.63S14.42 2 10 2z"
                fill="#191919" />
            </svg>
            {loading ? '잠시만요...' : '카카오로 1초만에 시작하기'}
          </button>

          {/* 새 안내 문구 */}
          <p className="text-center text-sm text-gray-500 mt-3">
            간단한 정보만 입력하면 예상 견적을 바로 확인할 수 있어요
          </p>

          <p className="text-center text-xs text-gray-400 mt-3">
            로그인 시{' '}
            <a href="/terms" className="underline underline-offset-2 hover:text-gray-600">이용약관</a>
            {' '}및{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-gray-600">개인정보 처리방침</a>
            에 동의합니다
          </p>

          {/* 하단 CTA */}
          <div className="mt-auto pb-8 space-y-2.5">
            <a
              href="tel:16009195"
              className="block w-full text-center py-3.5 border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              📞 상담원 연결
            </a>
            <a
              href="/visit-request"
              className="block w-full text-center py-3.5 bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              방문 견적 요청
            </a>
            <div className="text-center pt-1">
              <a href="/admin/login" className="text-xs text-gray-300 hover:text-gray-500 underline underline-offset-2">
                직원/관리자 로그인
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
