/**
 * 네트워크 재연결 감지 훅
 * 
 * 모바일 환경에서 화면 잠금 후 복귀 시 또는 네트워크 복구 시
 * 자동으로 데이터를 재로드하는 기능을 제공합니다.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * 네트워크 재연결 감지 옵션
 */
interface UseNetworkReconnectOptions {
  /** 재연결 감지 시 실행할 콜백 함수 */
  onReconnect: () => void | Promise<void>;
  /** 중복 호출 방지를 위한 디바운스 시간 (밀리초, 기본값: 1000ms) */
  debounceMs?: number;
  /** 디버그 로그 활성화 여부 (기본값: true) */
  enableLog?: boolean;
}

/**
 * 네트워크 재연결 및 화면 복귀 감지 훅
 * 
 * @param options - 훅 옵션
 * @returns void
 * 
 * @example
 * ```tsx
 * useNetworkReconnect({
 *   onReconnect: async () => {
 *     await loadData();
 *   }
 * });
 * ```
 */
export function useNetworkReconnect({
  onReconnect,
  debounceMs = 1000,
  enableLog = true
}: UseNetworkReconnectOptions) {
  // 마지막 실행 시간 추적 (중복 실행 방지)
  const lastExecutionRef = useRef<number>(0);
  // 타임아웃 참조
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 디바운스가 적용된 재연결 핸들러
   */
  const handleReconnect = useCallback(async (source: string) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionRef.current;

    // 디바운스: 마지막 실행 후 지정된 시간이 지나지 않았으면 무시
    if (timeSinceLastExecution < debounceMs) {
      if (enableLog) {
        console.log(`⏭️ [재연결 감지] ${source} - 스킵 (디바운스: ${timeSinceLastExecution}ms)`);
      }
      return;
    }

    // 기존 타임아웃 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (enableLog) {
      console.log(`🔄 [재연결 감지] ${source} - 데이터 재로드 시작`);
    }

    lastExecutionRef.current = now;

    try {
      await onReconnect();
      if (enableLog) {
        console.log(`✅ [재연결 감지] ${source} - 데이터 재로드 완료`);
      }
    } catch (error) {
      console.error(`❌ [재연결 감지] ${source} - 재로드 오류:`, error);
    }
  }, [onReconnect, debounceMs, enableLog]);

  useEffect(() => {
    // 1. 네트워크 온라인 이벤트 감지
    const handleOnline = () => {
      handleReconnect('네트워크 온라인');
    };

    // 2. 화면 가시성 변경 감지 (화면 잠금 해제, 앱 복귀)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleReconnect('화면 복귀');
      }
    };

    // 3. 윈도우 포커스 복귀 감지
    const handleFocus = () => {
      handleReconnect('포커스 복귀');
    };

    // 4. 페이지 재개 감지 (iOS Safari 등)
    const handlePageShow = (event: PageTransitionEvent) => {
      // persisted가 true면 bfcache에서 복원된 것
      if (event.persisted) {
        handleReconnect('페이지 복원 (bfcache)');
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (enableLog) {
      console.log('🎧 [재연결 감지] 이벤트 리스너 등록 완료');
    }

    // 클린업
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (enableLog) {
        console.log('🧹 [재연결 감지] 이벤트 리스너 제거 완료');
      }
    };
  }, [handleReconnect, enableLog]);
}

/**
 * 현재 네트워크 상태를 반환하는 훅
 * 
 * @returns online 여부
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// React import 추가
import React from 'react';

