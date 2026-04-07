/**
 * Supabase 클라이언트 설정
 * ZAPGO 에너지잡고 셀프견적 앱
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn(
    'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요. DB 기능이 비활성화됩니다.'
  );
}

/**
 * Supabase 클라이언트 인스턴스
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: false, // AuthContext의 scheduleTokenRefresh가 단독 처리 (이중 갱신 방지)
    persistSession: true,
    detectSessionInUrl: true, // OAuth redirect 처리를 위해 활성화
    flowType: 'pkce', // PKCE flow for OAuth
  },
  global: {
    headers: {
      'X-Client-Info': 'zapgo-web-app',
    },
  },
  db: {
    schema: 'public',
  },
});

/**
 * 카카오 OAuth 로그인
 * Supabase 대시보드에서 Kakao OAuth 설정 필요:
 * Authentication > Providers > Kakao 활성화
 */
export async function signInWithKakao() {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
      scopes: 'profile_nickname profile_image account_email phone_number name',
    },
  });

  return { data, error };
}

/**
 * 이메일+비밀번호 회원가입
 */
export async function signUpWithEmail(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  return { user: data.user, error };
}

/**
 * 이메일+비밀번호 로그인 (관리자/시공자용)
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error };
}

/**
 * 로그아웃
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * 현재 세션 가져오기
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * 사용자 프로필(users 테이블) 가져오기
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { profile: data, error };
}

/**
 * 사용자 프로필 upsert (최초 로그인 시 생성)
 */
export async function upsertUserProfile(profile: {
  id: string;
  kakao_id?: string;
  name?: string;
  phone?: string | null;
  role?: string;
}) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: profile.id,
        kakao_id: profile.kakao_id,
        name: profile.name,
        phone: profile.phone ?? undefined,
        role: profile.role || 'CUSTOMER',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select()
    .single();
  return { profile: data, error };
}
