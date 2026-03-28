/**
 * Supabase OAuth 콜백 처리 라우트
 * 카카오 로그인 후 리다이렉트 처리
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error('[auth/callback] 세션 교환 실패:', err);
      // 실패해도 루트로 보내고 AuthContext에서 세션 재확인
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
