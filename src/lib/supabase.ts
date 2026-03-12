/**
 * Supabase 클라이언트 설정
 * 
 * 인증, 데이터베이스, 실시간 기능을 위한 Supabase 클라이언트를 초기화합니다.
 */

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 익명 키를 가져옵니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수가 설정되지 않은 경우 오류 발생
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.'
  );
}

/**
 * Supabase 클라이언트 인스턴스
 * 애플리케이션 전체에서 사용되는 단일 클라이언트 인스턴스입니다.
 * 
 * 모바일 환경에서 화면 잠금 및 네트워크 재연결에 대응하도록 설정되었습니다.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 인증 상태를 localStorage에 저장
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // 자동 새로고침 활성화 - 토큰 만료 전 자동으로 갱신
    autoRefreshToken: true,
    // 세션 지속성 설정 - 브라우저 종료 후에도 세션 유지
    persistSession: true,
    // 토큰 만료 감지 활성화
    detectSessionInUrl: true,
    // 플로우 타입: PKCE (보안 강화)
    flowType: 'pkce',
  },
  global: {
    headers: {
      // 클라이언트 식별자 (디버깅 용도)
      'X-Client-Info': 'zapgo-mobile-app',
    },
  },
  // 데이터베이스 연결 설정
  db: {
    schema: 'public',
  },
  // 실시간 구독 설정 (필요한 경우에만 활성화)
  realtime: {
    // 재연결 설정
    params: {
      eventsPerSecond: 2, // 초당 최대 이벤트 수 제한
    },
    // 하트비트 간격 (밀리초)
    heartbeatIntervalMs: 30000, // 30초
    // 타임아웃 (밀리초)
    timeout: 10000, // 10초
  },
});

/**
 * 인증 관련 타입 정의
 */
export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
  created_at: string;
}

/**
 * 회원가입 데이터 타입
 */
export interface SignUpData {
  username: string;
  password: string;
  name?: string;
}

/**
 * 로그인 데이터 타입
 */
export interface SignInData {
  username: string;
  password: string;
}

