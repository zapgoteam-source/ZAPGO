'use client';

/**
 * ZAPGO 인증 컨텍스트
 * 카카오 OAuth 기반 인증 및 사용자 역할 관리
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase, signInWithKakao, signInWithEmail, getUserProfile } from '@/lib/supabase';
import { User as UserProfile, UserRole } from '@/types';

// ─── 상수 ────────────────────────────────────────────────────────────────────
const PROFILE_CACHE_TTL = 5 * 60 * 1000;         // 캐시 유효 시간 (5분)
const TOKEN_REFRESH_LEAD = 5 * 60 * 1000;         // 만료 5분 전 토큰 갱신
const PROFILE_DB_TIMEOUT = 15 * 1000;             // DB 타임아웃 (15초)
const REFRESH_RETRY_DELAYS = [2000, 5000, 10000]; // 토큰 갱신 재시도 딜레이

// ─── localStorage 프로필 캐시 (새로고침 생존) ─────────────────────────────────
const profileStorageKey = (uid: string) => `zapgo-prof-${uid}`;

function readStoredProfile(userId: string): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(profileStorageKey(userId));
    if (!raw) return null;
    const { profile, cachedAt } = JSON.parse(raw) as { profile: UserProfile; cachedAt: number };
    if (Date.now() - cachedAt > PROFILE_CACHE_TTL) return null; // 만료
    return profile;
  } catch { return null; }
}

function writeStoredProfile(userId: string, profile: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(profileStorageKey(userId), JSON.stringify({ profile, cachedAt: Date.now() }));
  } catch { /* 스토리지 용량 초과 등 무시 */ }
}

function deleteStoredProfile(userId: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(profileStorageKey(userId)); } catch { /* 무시 */ }
}

// ─── in-memory 캐시 타입 ───────────────────────────────────────────────────
interface ProfileCache {
  profile: UserProfile;
  cachedAt: number;
}

// ─── 타입 ────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileReady: boolean;
  signInWithKakao: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  role: UserRole | null;
  permissionChecker: { isAdmin: () => boolean; [key: string]: unknown } | null;
  hasPermission: (...args: unknown[]) => boolean;
  refreshUserProfile: () => Promise<void>;
  validateAndRefreshSession: () => Promise<boolean>;
  signIn: (...args: unknown[]) => Promise<unknown>;
  signUp: (...args: unknown[]) => Promise<unknown>;
  resetPassword: (...args: unknown[]) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const router = useRouter();

  const loadingProfileRef = useRef(false);
  const profileCacheRef = useRef<ProfileCache | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  // ─── 토큰 자동 갱신 스케줄링 ────────────────────────────────────────────────
  const scheduleTokenRefresh = useCallback((sess: Session) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (!sess.expires_at) return;

    const delay = Math.max(sess.expires_at * 1000 - Date.now() - TOKEN_REFRESH_LEAD, 0);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) throw error;
        retryCountRef.current = 0;
      } catch (err) {
        // "Failed to fetch" 같은 네트워크 에러는 재시도
        const retryDelay = REFRESH_RETRY_DELAYS[retryCountRef.current];
        if (retryDelay !== undefined) {
          retryCountRef.current += 1;
          refreshTimerRef.current = setTimeout(async () => {
            try { await supabase.auth.refreshSession(); } catch { /* 재시도 실패 무시 */ }
          }, retryDelay);
        } else {
          // 최종 실패 - "Failed to fetch" 등 네트워크 에러는 콘솔에만 남김
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes('fetch')) console.error('[Auth] 토큰 갱신 최종 실패:', err);
        }
      }
    }, delay);
  }, []);

  // ─── 프로필 저장 헬퍼 ──────────────────────────────────────────────────────
  const applyProfile = useCallback((userId: string, profile: UserProfile) => {
    profileCacheRef.current = { profile, cachedAt: Date.now() };
    writeStoredProfile(userId, profile);
    setUserProfile(profile);
  }, []);

  // ─── 프로필 로딩 ───────────────────────────────────────────────────────────
  // 우선순위: in-memory 캐시 → localStorage 캐시 → DB 쿼리
  // localStorage 캐시 덕분에 새로고침 시 DB 기다리지 않고 즉시 복원
  const loadUserProfile = useCallback(async (authUser: User, forceRefresh = false) => {
    // 1. in-memory 캐시 (같은 세션 내 재요청)
    if (!forceRefresh && profileCacheRef.current) {
      const age = Date.now() - profileCacheRef.current.cachedAt;
      if (age < PROFILE_CACHE_TTL) {
        setUserProfile(profileCacheRef.current.profile);
        setProfileReady(true);
        // TTL 절반 경과 → 백그라운드 silent 갱신
        if (age > PROFILE_CACHE_TTL / 2) {
          getUserProfile(authUser.id).then(({ profile }) => {
            if (profile) applyProfile(authUser.id, profile as UserProfile);
          });
        }
        return;
      }
    }

    // 2. localStorage 캐시 (새로고침 후에도 생존)
    if (!forceRefresh) {
      const stored = readStoredProfile(authUser.id);
      if (stored) {
        profileCacheRef.current = { profile: stored, cachedAt: Date.now() };
        setUserProfile(stored);
        setProfileReady(true); // ← DB 기다리지 않고 바로 라우팅 가능
        // 백그라운드로 최신 데이터 가져오기
        getUserProfile(authUser.id).then(({ profile }) => {
          if (profile) applyProfile(authUser.id, profile as UserProfile);
        });
        return;
      }
    }

    // 3. 캐시 없음 → DB에서 로드 (최초 로그인 또는 캐시 만료)
    if (loadingProfileRef.current) return;
    loadingProfileRef.current = true;
    setProfileReady(false);

    try {
      const { profile, error } = await Promise.race([
        getUserProfile(authUser.id),
        new Promise<{ profile: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ profile: null, error: new Error('timeout') }), PROFILE_DB_TIMEOUT)
        ),
      ]);

      if (profile) {
        applyProfile(authUser.id, profile as UserProfile);
      } else if (error && (error as { code?: string }).code === 'PGRST116') {
        // 최초 카카오 로그인 → userProfile=null 유지, 각 페이지에서 /register로 라우팅
      }
      // 그 외 에러(네트워크, RLS, 타임아웃)는 기존 프로필 유지
    } catch (err) {
      console.error('[Auth] 프로필 로드 오류:', err);
    } finally {
      loadingProfileRef.current = false;
      setProfileReady(true);
    }
  }, [applyProfile]);

  // ─── 세션 유효성 검사 및 갱신 ─────────────────────────────────────────────
  const validateAndRefreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session: current } } = await supabase.auth.getSession();
      if (!current) return false;
      if (current.expires_at && Date.now() > current.expires_at * 1000 - 60_000) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) return false;
      }
      return true;
    } catch { return false; }
  }, []);

  // ─── 탭 복귀 시 토큰 만료 체크 ────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session: current } } = await supabase.auth.getSession();
      if (current?.expires_at && Date.now() > current.expires_at * 1000 - TOKEN_REFRESH_LEAD) {
        await supabase.auth.refreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ─── 초기 세션 & 인증 상태 구독 ───────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
      if (initialSession) {
        scheduleTokenRefresh(initialSession);
        loadUserProfile(initialSession.user);
      } else {
        setProfileReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, updatedSession) => {
      // TOKEN_REFRESHED: 세션 갱신만 처리, user 참조를 바꾸지 않아 effects 재실행 방지
      if (event === 'TOKEN_REFRESHED') {
        setSession(updatedSession);
        if (updatedSession) scheduleTokenRefresh(updatedSession);
        return;
      }

      setSession(updatedSession);
      setUser(updatedSession?.user ?? null);
      setLoading(false);

      if (updatedSession) {
        scheduleTokenRefresh(updatedSession);
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await loadUserProfile(updatedSession.user);
        }
      } else {
        // 로그아웃: 캐시 전체 초기화
        if (user) deleteStoredProfile(user.id);
        profileCacheRef.current = null;
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        setUserProfile(null);
        setProfileReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [loadUserProfile, scheduleTokenRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 핸들러 ────────────────────────────────────────────────────────────────
  const handleSignInWithKakao = useCallback(async () => {
    await signInWithKakao();
  }, []);

  const handleSignOut = useCallback(async () => {
    if (user) deleteStoredProfile(user.id);
    profileCacheRef.current = null;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    router.replace('/login');
  }, [router, user]);

  const role = (userProfile?.role as UserRole) ?? null;

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    profileReady,
    signInWithKakao: handleSignInWithKakao,
    signInWithEmail: async (email, password) => {
      const { error } = await signInWithEmail(email, password);
      return { error: error as Error | null };
    },
    signOut: handleSignOut,
    role,
    permissionChecker: { isAdmin: () => role === 'ADMIN' },
    hasPermission: () => false,
    refreshUserProfile: async () => { if (user) await loadUserProfile(user, true); },
    validateAndRefreshSession,
    signIn: async () => ({ user: null, error: null }),
    signUp: async () => ({ user: null, error: null }),
    resetPassword: async () => ({ error: null }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다');
  return ctx;
}

export type { AuthContextType };
