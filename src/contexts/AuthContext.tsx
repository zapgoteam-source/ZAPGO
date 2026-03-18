/**
 * 인증 컨텍스트
 * 
 * 애플리케이션 전체에서 사용자 인증 상태를 관리하는 React Context입니다.
 * 로그인, 로그아웃, 회원가입 기능을 제공합니다.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, SignUpData, SignInData } from '@/lib/supabase';
import { 
  UserProfile, 
  PermissionChecker, 
  UserRole, 
  PermissionAction, 
  ResourceType,
  Tenant 
} from '@/lib/permissions';
import { UNASSIGNED_TENANT } from '@/lib/constants';

// 인증 컨텍스트 타입 정의
interface AuthContextType {
  /** 현재 사용자 정보 */
  user: User | null;
  /** 현재 세션 정보 */
  session: Session | null;
  /** 사용자 프로필 정보 (역할, 테넌트 포함) */
  userProfile: UserProfile | null;
  /** 권한 확인 인스턴스 */
  permissionChecker: PermissionChecker | null;
  /** 로딩 상태 */
  loading: boolean;
  /** 회원가입 함수 */
  signUp: (data: SignUpData & { role: UserRole; tenantId: string }) => Promise<{ user: User | null; error: AuthError | null }>;
  /** 로그인 함수 */
  signIn: (data: SignInData) => Promise<{ user: User | null; error: AuthError | null }>;
  /** 로그아웃 함수 */
  signOut: () => Promise<{ error: AuthError | null }>;
  /** 비밀번호 재설정 이메일 전송 */
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  /** 권한 확인 헬퍼 함수 */
  hasPermission: (resource: ResourceType, action: PermissionAction, targetTenantId?: string) => boolean;
  /** 사용자 프로필 새로고침 */
  refreshUserProfile: () => Promise<void>;
  /** 세션 검증 및 복구 (네트워크 재연결 시 사용) */
  validateAndRefreshSession: () => Promise<boolean>;
}

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 인증 컨텍스트 프로바이더 Props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * 자동 로그아웃 설정 (밀리초 단위)
 * 기본값: 55분 (3300000ms)
 * 
 * 주의: Supabase JWT 토큰 만료 시간(1시간)보다 약간 짧게 설정
 * JWT 만료 전에 안전하게 로그아웃하여 세션 불일치 방지
 */
const AUTO_LOGOUT_TIME = 55 * 60 * 1000; // 55분

/**
 * 비활성 체크 간격 (밀리초 단위)
 * 기본값: 1분 - 서버 부하를 줄이면서도 적절한 반응성 유지
 */
const INACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1분

/**
 * localStorage 키
 */
const STORAGE_KEY = 'zapgo_last_activity';
const LOGOUT_FLAG_KEY = 'zapgo_logout_in_progress';

/**
 * 모던한 토스트 알림 표시 (alert 대체)
 * DOM에 직접 토스트 요소를 생성하여 표시
 */
const TOAST_STYLE_ID = 'zapgo-toast-keyframes';

const showLogoutNotification = (message: string) => {
  // 기존 토스트가 있으면 제거
  const existingToast = document.getElementById('zapgo-logout-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // 토스트 요소 생성
  const toast = document.createElement('div');
  toast.id = 'zapgo-logout-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #b10000 0%, #8b0000 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 26px;
    box-shadow: 0 4px 12px rgba(177, 0, 0, 0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: zapgoSlideIn 0.3s ease-out;
  `;

  // 아이콘 추가
  const icon = document.createElement('span');
  icon.textContent = '⏰';
  icon.style.fontSize = '20px';

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);

  // 애니메이션 스타일 - 한 번만 추가 (메모리 누수 방지)
  if (!document.getElementById(TOAST_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = TOAST_STYLE_ID;
    style.textContent = `
      @keyframes zapgoSlideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes zapgoSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // DOM에 추가
  document.body.appendChild(toast);

  // 3초 후 자동 제거
  setTimeout(() => {
    toast.style.animation = 'zapgoSlideOut 0.3s ease-out forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
};

/**
 * 인증 컨텍스트 프로바이더
 * 
 * @param children - 자식 컴포넌트들
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissionChecker, setPermissionChecker] = useState<PermissionChecker | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 사용자 프로필 정보를 로드합니다.
   * 
   * @param userId - 사용자 ID
   * @param userObject - 사용자 객체 (옵션)
   */
  const loadUserProfile = async (userId: string, userObject?: User | null) => {
    try {
       // 사용자 프로필 정보 조회 (테넌트 정보 포함)
       const { data: profileData, error: profileError } = await supabase
         .from('users')
         .select(`
           id,
           role,
           tenant_id,
           name,
           email,
           phone,
           department,
           position,
           is_active,
           created_at,
           updated_at,
           tenant:tenants(id, name, type, created_at, updated_at)
         `)
         .eq('id', userId)
         .single();

       // 구독 정보는 프로필의 tenant_id가 필요하므로 순차 조회
       let tenantSubscriptionEndDate: string | undefined = undefined;
       if (profileData?.tenant_id) {
         const { data: subscriptionData, error: subscriptionError } = await supabase
           .from('subscriptions')
           .select('subscription_end_date')
           .eq('tenant_id', profileData.tenant_id)
           .eq('is_active', true)
           .maybeSingle();

         if (subscriptionError) {
           console.warn('구독 정보 조회 오류:', subscriptionError.message);
         } else if (subscriptionData?.subscription_end_date) {
           tenantSubscriptionEndDate = subscriptionData.subscription_end_date;
         }
       }

      if (profileError) {
        console.error('사용자 프로필 로드 오류:', profileError.message, profileError);
        
        // 프로필 로드 실패 시 처리
        if (profileError.code === 'PGRST116' || profileError.message.includes('row-level security') || profileError.code === 'PGRST100') {
          console.log('프로필 로드 실패, 메타데이터 또는 기본값으로 프로필 생성 시도');
          const currentUser = userObject || user;
          
          if (currentUser?.user_metadata) {
            // 메타데이터에서 프로필 생성
            const metadata = currentUser.user_metadata;
            const basicProfile: UserProfile = {
              id: userId,
              user_id: userId, // id와 동일하게 설정
              role: (metadata.role || 'UNASSIGNED') as UserRole,
              tenant_id: metadata.tenant_id || UNASSIGNED_TENANT.ID,
              name: metadata.name || '',
              email: currentUser.email || '',
              phone: '',
              department: metadata.department,
              position: metadata.position,
              is_active: false, // 기본값으로 비활성 상태
              created_at: currentUser.created_at || '',
              updated_at: currentUser.updated_at || '',
              tenant: undefined,
            };
            
            setUserProfile(basicProfile);
            setPermissionChecker(new PermissionChecker(basicProfile));
            console.log('메타데이터에서 프로필 생성 완료:', basicProfile.name, basicProfile.role);
          } else {
            // 메타데이터도 없는 경우 최소한의 기본 프로필 생성 (미배정)
            const basicProfile: UserProfile = {
              id: userId,
              user_id: userId, // id와 동일하게 설정
              role: 'UNASSIGNED' as UserRole,
              tenant_id: UNASSIGNED_TENANT.ID,
              name: currentUser?.email?.split('@')[0] || 'Unknown',
              email: currentUser?.email || '',
              phone: '',
              department: undefined,
              position: undefined,
              is_active: false,
              created_at: currentUser?.created_at || '',
              updated_at: currentUser?.updated_at || '',
              tenant: undefined,
            };
            
            setUserProfile(basicProfile);
            setPermissionChecker(new PermissionChecker(basicProfile));
            console.log('기본 프로필 생성 완료:', basicProfile.name);
          }
        }
        // 에러 케이스에서도 로딩 상태 해제
        setLoading(false);
        return;
      }

       if (profileData) {
        const profile: UserProfile = {
          id: profileData.id,
          user_id: profileData.id, // users 테이블에서는 id가 auth.users(id)를 직접 참조
          role: profileData.role as UserRole,
          tenant_id: profileData.tenant_id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone || '',
          department: profileData.department,
          position: profileData.position,
          is_active: profileData.is_active,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
          // Supabase 조인은 단일 객체 또는 null로 반환됨
          tenant: profileData.tenant ? (profileData.tenant as unknown as Tenant) : undefined,
          tenant_subscription_end_date: tenantSubscriptionEndDate, // subscriptions 테이블에서 가져온 구독 만료일
        };

        setUserProfile(profile);
        setPermissionChecker(new PermissionChecker(profile));
        console.log('사용자 프로필 로드 완료:', profile.name, profile.role);
        if (tenantSubscriptionEndDate) {
          console.log('테넌트 구독 만료일:', new Date(tenantSubscriptionEndDate).toLocaleDateString('ko-KR'));
        }
        
        // JWT 메타데이터 업데이트는 무한 루프를 방지하기 위해 생략
        // RLS 함수들은 기본값으로 작동하도록 설계됨
      }
    } catch (error) {
      console.error('사용자 프로필 로드 처리 오류:', error);
    } finally {
      // 항상 로딩 상태 해제
      setLoading(false);
    }
  };

  /**
   * 사용자 프로필을 새로고침합니다.
   */
  const refreshUserProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id, user);
    }
  };

  /**
   * 세션 검증 및 복구
   * 
   * 화면 복귀 시 또는 네트워크 재연결 시 호출하여
   * 세션이 유효한지 확인하고 필요 시 갱신합니다.
   * 
   * @returns 세션이 유효하면 true, 그렇지 않으면 false
   */
  const validateAndRefreshSession = async (): Promise<boolean> => {
    try {
      console.log('🔍 [세션 검증] 시작...');
      
      // 현재 세션 가져오기 (자동으로 토큰 갱신 시도)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [세션 검증] 오류:', error.message);
        
        // 세션이 만료되었거나 유효하지 않은 경우
        if (error.message.includes('refresh_token_not_found') || 
            error.message.includes('invalid_grant') ||
            error.message.includes('session_not_found')) {
          console.log('🔴 [세션 검증] 세션 만료 - 재로그인 필요');
          
          // 상태 초기화
          setUser(null);
          setSession(null);
          setUserProfile(null);
          setPermissionChecker(null);
          
          // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 페이지가 아닐 때만)
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            showLogoutNotification('세션이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/login';
          }
          
          return false;
        }
        return false;
      }
      
      if (!session) {
        console.log('❌ [세션 검증] 세션 없음 - 로그인 필요');
        
        // 상태 초기화
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setPermissionChecker(null);
        
        return false;
      }
      
      // 세션이 유효한 경우
      console.log('✅ [세션 검증] 세션 유효');
      
      // 현재 사용자와 다른 경우에만 상태 업데이트
      if (!user || user.id !== session.user.id) {
        console.log('🔄 [세션 검증] 사용자 정보 업데이트');
        setSession(session);
        setUser(session.user);
      }
      
      // 프로필이 없거나 만료된 경우 다시 로드
      if (!userProfile || userProfile.id !== session.user.id) {
        console.log('🔄 [세션 검증] 프로필 재로드');
        await loadUserProfile(session.user.id, session.user);
      }
      
      console.log('✅ [세션 검증] 완료');
      return true;
    } catch (error) {
      console.error('❌ [세션 검증] 처리 오류:', error);
      return false;
    }
  };

  // createMissingProfile은 DB 트리거(handle_new_user)로 대체됨
  // 회원가입 시 auth.users INSERT 후 자동으로 public.users 프로필이 생성됨

  // updateUserMetadata, updateActivity 함수는 사용되지 않아 제거됨

  /**
   * 로그아웃 함수
   * useCallback으로 메모이제이션하여 불필요한 재생성 방지
   * 
   * @returns 로그아웃 결과
   */
  const signOut = React.useCallback(async () => {
    try {
      console.log('로그아웃 시작...');
      
      // Race condition 방지: 이미 로그아웃 진행 중이면 중단
      if (typeof window !== 'undefined') {
        const logoutFlag = localStorage.getItem(LOGOUT_FLAG_KEY);
        if (logoutFlag === 'true') {
          console.log('이미 로그아웃 진행 중...');
          return { error: null };
        }
        
        // 로그아웃 플래그 설정 (다른 탭에서도 감지 가능)
        localStorage.setItem(LOGOUT_FLAG_KEY, 'true');

      }
      
      // 상태 먼저 초기화 (로딩 화면 방지)
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setPermissionChecker(null);
      
      // Supabase Auth API 로그아웃 호출
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('로그아웃 오류:', error.message);
      } else {
        console.log('로그아웃 성공');
      }

      // 인증 관련 키만 선택적으로 삭제
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LOGOUT_FLAG_KEY);
        // Supabase 인증 관련 키 삭제
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
        sessionStorage.clear();
        console.log('인증 관련 스토리지 삭제 완료');
        
        // 브라우저 히스토리에서 현재 페이지를 로그인 페이지로 대체
        // 뒤로가기를 눌러도 이전 인증된 페이지로 돌아가지 않도록
        window.history.replaceState(null, '', '/login');
        
        // 로그아웃 후 로그인 페이지로 즉시 강제 리다이렉션
        window.location.replace('/login');
      }

      return { error };
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
      // 오류가 발생해도 localStorage 제거 및 리다이렉션
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LOGOUT_FLAG_KEY);
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
        sessionStorage.clear();

        window.history.replaceState(null, '', '/login');
        window.location.replace('/login');
      }
      return { error: error as AuthError };
    }
  }, []); // 의존성 없음: 상태만 변경하고 외부 값 참조 안 함

  useEffect(() => {
    // 초기 세션 가져오기
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 가져오기 오류:', error.message);
          setLoading(false);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          // 세션이 있으면 사용자 프로필 로드 (loadUserProfile 내부에서 loading = false 처리)
          if (session?.user) {
            await loadUserProfile(session.user.id, session.user);
          } else {
            // 세션이 없으면 바로 loading = false
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('초기 세션 로드 오류:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // 안전장치: 5초 후에도 로딩 중이면 강제로 로딩 해제
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      console.warn('로딩 타임아웃: 5초 경과로 인해 강제로 로딩 상태 해제');
    }, 5000);

    // 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변경:', event, session?.user?.email);
        
        // 세션 만료 또는 로그아웃 이벤트 처리
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          console.log(`인증 이벤트: ${event}`);
        }
        
        // 세션이 만료되었거나 유효하지 않은 경우
        if (event === 'SIGNED_OUT' && !session) {
          console.log('세션이 만료되었습니다. 로그인 페이지로 이동합니다.');
          setUserProfile(null);
          setPermissionChecker(null);
          setLoading(false);
          
          // 로그인 페이지로 리다이렉트
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // 사용자 정보 초기화
        if (!session?.user) {
          setUserProfile(null);
          setPermissionChecker(null);
          setLoading(false);
        } else {
          // 새로운 사용자 세션이면 프로필 로드 (프로필 로드 완료 후 loading = false)
          await loadUserProfile(session.user.id, session.user);
          setLoading(false);
        }
      }
    );

    // 컴포넌트 언마운트 시 리스너 및 타임아웃 정리
    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);

  /**
   * 비활성 시간 체크 및 자동 로그아웃 처리
   * localStorage + Visibility API + storage event로 다중 탭 동기화 및 화면 꺼짐 대응
   */
  useEffect(() => {
    // 로그인된 사용자가 없으면 타이머 실행하지 않음
    if (!user || !session) {
      return;
    }

    // 로그아웃이 이미 진행 중이면 타이머 실행하지 않음
    if (typeof window !== 'undefined') {
      const logoutFlag = localStorage.getItem(LOGOUT_FLAG_KEY);
      if (logoutFlag === 'true') {
        return;
      }
    }

    console.log('✅ 자동 로그아웃 타이머 시작 (55분 후 로그아웃)');
    
    // localStorage에서 마지막 활동 시간 불러오기 또는 현재 시간으로 초기화
    const initLastActivity = (): number => {
      const saved = localStorage.getItem(STORAGE_KEY);
      const time = saved ? parseInt(saved) : Date.now();
      if (!saved) {
        localStorage.setItem(STORAGE_KEY, time.toString());
      }
      return time;
    };

    let lastActivity = initLastActivity();
    let warningShown = false;
    let logCheckCount = 0; // 로그 출력 카운터

    // 활동 업데이트 (throttle 적용 - 1초에 한 번만)
    let throttleTimer: NodeJS.Timeout | null = null;
    const updateActivity = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 1000);

      lastActivity = Date.now();
      localStorage.setItem(STORAGE_KEY, lastActivity.toString());
      warningShown = false;
    };

    // 사용자 활동을 감지하는 이벤트 리스너
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // 다중 탭 동기화: 다른 탭에서 localStorage 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      // 다른 탭에서 활동 시간 업데이트 시 동기화
      if (e.key === STORAGE_KEY && e.newValue) {
        lastActivity = parseInt(e.newValue);
        warningShown = false;
        console.log('🔄 다른 탭에서 활동 감지 - 타이머 리셋');
      }
      
      // 다른 탭에서 로그아웃 시 현재 탭도 로그아웃
      if (e.key === LOGOUT_FLAG_KEY && e.newValue === 'true') {
        console.log('🔄 다른 탭에서 로그아웃 감지');
        signOut().catch((error) => {
          console.error('연동 로그아웃 오류:', error);
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 화면 활성화 시 체크 (노트북 닫았다 열 때 등)
    const handleVisibility = () => {
      if (document.hidden) return;

      // 로그아웃 플래그 확인
      const logoutFlag = localStorage.getItem(LOGOUT_FLAG_KEY);
      if (logoutFlag === 'true') {
        return;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        updateActivity();
        return;
      }

      const lastTime = parseInt(saved);
      const elapsed = Date.now() - lastTime;

      if (elapsed >= AUTO_LOGOUT_TIME) {
        console.log('🔴 비활성 시간 초과 (화면 복귀 시 감지)');
        console.log(`⌛ 비활성 시간: ${Math.floor(elapsed / 1000 / 60)}분`);
        
        localStorage.removeItem(STORAGE_KEY);
        
        // 토스트 메시지 표시 (alert 대신)
        showLogoutNotification('장시간 사용하지 않아 자동으로 로그아웃되었습니다.');
        
        signOut().catch((error) => {
          console.error('자동 로그아웃 오류:', error);
        });
      } else {
        lastActivity = lastTime;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    // 주기적으로 비활성 시간 체크
    const checkInactivity = setInterval(() => {
      // 로그아웃 플래그 확인
      const logoutFlag = localStorage.getItem(LOGOUT_FLAG_KEY);
      if (logoutFlag === 'true') {
        clearInterval(checkInactivity);
        return;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      const lastTime = saved ? parseInt(saved) : lastActivity;
      const now = Date.now();
      const elapsed = now - lastTime;

      // 비활성 시간이 설정된 시간을 초과한 경우
      if (elapsed >= AUTO_LOGOUT_TIME) {
        console.log('🔴 비활성 시간 초과로 자동 로그아웃 실행');
        console.log(`📅 마지막 활동 시간: ${new Date(lastTime).toLocaleString('ko-KR')}`);
        console.log(`⏰ 현재 시간: ${new Date(now).toLocaleString('ko-KR')}`);
        console.log(`⌛ 비활성 시간: ${Math.floor(elapsed / 1000 / 60)}분 ${Math.floor((elapsed / 1000) % 60)}초`);
        
        clearInterval(checkInactivity);
        localStorage.removeItem(STORAGE_KEY);
        
        // 토스트 메시지 표시 (alert 대신)
        showLogoutNotification('장시간 사용하지 않아 자동으로 로그아웃되었습니다.');
        
        signOut().catch((error) => {
          console.error('자동 로그아웃 오류:', error);
        });
      } else {
        // 디버깅을 위한 남은 시간 로그 (개발 환경에서만, 5분마다)
        if (process.env.NODE_ENV === 'development') {
          logCheckCount++;
          // 5분마다만 로그 출력 (5회 체크마다)
          if (logCheckCount % 5 === 0) {
          const remaining = AUTO_LOGOUT_TIME - elapsed;
          const min = Math.floor(remaining / 1000 / 60);
            console.log(`⏳ 자동 로그아웃까지 남은 시간: ${min}분`);
          }
        }
      }
    }, INACTIVITY_CHECK_INTERVAL);

    // 정리 함수
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInactivity);
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = null;
      }
    };
  }, [user, session, signOut]); // signOut은 useCallback으로 안정화되어 안전하게 의존성에 추가

  /**
   * 회원가입 함수
   * 
   * @param data - 회원가입 데이터 (아이디, 비밀번호, 이름, 역할, 테넌트ID)
   * @returns 회원가입 결과
   */
  const signUp = async (data: SignUpData & { role: UserRole; tenantId: string }) => {
    try {
      setLoading(true);
      
      // 아이디를 이메일 형식으로 변환 (Supabase 호환성을 위해)
      const email = `${data.username}@zapgo.local`;
      
      console.log('회원가입 시작:', data.username);
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: email,
        password: data.password,
        options: {
          data: {
            name: data.name || '',
            username: data.username, // 실제 사용자명을 메타데이터에 저장
            role: data.role, // 역할을 메타데이터에 저장
            tenant_id: data.tenantId, // 테넌트 ID를 메타데이터에 저장
          },
        },
      });

      if (error) {
        console.error('회원가입 오류:', error.message, error);
        return { user: null, error };
      }

      // 회원가입 성공 - DB 트리거(handle_new_user)가 자동으로 public.users 프로필 생성
      if (authData.user) {
        console.log('회원가입 성공:', data.username);
      }

      return { user: authData.user, error };
    } catch (error) {
      console.error('회원가입 처리 오류:', error);
      return { user: null, error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 로그인 함수
   * 
   * @param data - 로그인 데이터 (아이디, 비밀번호)
   * @returns 로그인 결과
   */
  const signIn = async (data: SignInData) => {
    try {
      setLoading(true);
      
      // 아이디를 이메일 형식으로 변환 (Supabase 호환성을 위해)
      const email = `${data.username}@zapgo.local`;
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: data.password,
      });

      if (error) {
        console.error('로그인 오류:', error.message);
      } else {
        console.log('로그인 성공:', data.username);
      }

      return { user: authData.user, error };
    } catch (error) {
      console.error('로그인 처리 오류:', error);
      return { user: null, error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 비밀번호 재설정 이메일 전송
   * 
   * @param email - 재설정할 이메일 주소
   * @returns 재설정 이메일 전송 결과
   */
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('비밀번호 재설정 오류:', error.message);
      } else {
        console.log('비밀번호 재설정 이메일 전송 성공');
      }

      return { error };
    } catch (error) {
      console.error('비밀번호 재설정 처리 오류:', error);
      return { error: error as AuthError };
    }
  };

  /**
   * 권한 확인 헬퍼 함수
   * 
   * @param resource - 리소스 타입
   * @param action - 액션 타입
   * @param targetTenantId - 대상 테넌트 ID (선택적)
   * @returns 권한이 있으면 true, 없으면 false
   */
  const hasPermission = (
    resource: ResourceType,
    action: PermissionAction,
    targetTenantId?: string
  ): boolean => {
    if (!permissionChecker) {
      return false;
    }
    return permissionChecker.hasPermission(resource, action, targetTenantId);
  };

  // 컨텍스트 값
  const value: AuthContextType = {
    user,
    session,
    userProfile,
    permissionChecker,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    hasPermission,
    refreshUserProfile,
    validateAndRefreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 인증 컨텍스트 훅
 * 
 * @returns 인증 컨텍스트 값
 * @throws 컨텍스트가 프로바이더 외부에서 사용될 때 오류 발생
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  
  return context;
}

