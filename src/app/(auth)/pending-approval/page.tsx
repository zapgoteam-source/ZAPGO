/**
 * 계정 승인 대기 페이지
 * 
 * 비활성 사용자(is_active = false)를 위한 전용 페이지입니다.
 * 관리자의 승인을 기다리는 동안 표시됩니다.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserCheck, AlertCircle, User, IdCard } from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, userProfile, signOut, loading } = useAuth();
  const [showContent, setShowContent] = React.useState(false);

  /**
   * 로그아웃 핸들러
   * signOut() 함수가 자동으로 로그인 페이지로 리다이렉션합니다.
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      // AuthContext의 signOut 함수가 자동으로 /login으로 리다이렉션
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 인증 체크 및 리다이렉트
  useEffect(() => {
    if (!loading && user && userProfile) {
      if (userProfile.is_active) {
        // 이미 활성화된 사용자는 홈으로
        router.replace('/home');
      } else {
        // 비활성 사용자는 즉시 콘텐츠 표시 (지연 시간 제거)
        queueMicrotask(() => setShowContent(true));
      }
    } else if (!loading && !user) {
      // 로그인하지 않은 사용자는 로그인 페이지로
      router.replace('/login');
    }
  }, [user, userProfile, loading, router]);

  // 로딩 중이거나 체크가 완료되지 않았거나 콘텐츠 표시 전
  if (loading || !user || !userProfile || !showContent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          {/* 외곽 회전 원 */}
          <div className="w-20 h-20 border-4 border-primary/20"></div>
          {/* 회전 애니메이션 원 */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary animate-spin"></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <UserCheck className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 활성 사용자는 이미 리다이렉트됨
  if (userProfile.is_active) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto">
        {/* 메인 카드 */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          {/* 헤더 - 아이콘과 타이틀 */}
          <div className="px-6 pt-8 pb-6 text-center">
            {/* 아이콘 - ZAPGO 로고 컬러와 일관성 있는 레드 계열 */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            {/* 타이틀 */}
            <h2 className="text-2xl font-bold text-gray-900 font-korean mb-2">
              계정 승인 대기 중
            </h2>
            <p className="text-sm text-gray-600 font-korean">
              관리자가 회원가입을 검토하고 있습니다
            </p>
          </div>

          {/* 본문 */}
          <div className="px-6 pb-6">
            {/* 사용자 정보 - 모던한 카드 디자인 */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 p-5 border border-gray-200/60 space-y-4">
                {/* 이름 */}
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-korean mb-0.5">이름</p>
                    <p className="text-base font-semibold text-gray-900 font-korean truncate">
                      {userProfile.name}
                    </p>
                  </div>
                </div>

                {/* 구분선 */}
                <div className="border-t border-gray-200/80"></div>

                {/* 아이디 */}
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white flex items-center justify-center shadow-sm">
                    <IdCard className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-korean mb-0.5">아이디</p>
                    <p className="text-base font-semibold text-gray-900 font-korean truncate">
                      {userProfile.email?.split('@')[0] ?? '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-primary/5 p-4 mb-6">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-gray-600 font-korean leading-relaxed">
                  관리자가 계정을 검토하고 승인하는 동안 잠시만 기다려주세요.
                  <br />
                  승인 완료 후 모든 서비스를 이용하실 수 있습니다.
                </p>
                <p className="text-xs text-gray-500 font-korean">
                  일반적으로 1-2 영업일이 소요됩니다.
                </p>
              </div>
            </div>

            {/* 확인 버튼 */}
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="lg"
              fullWidth
              className="font-korean"
            >
              확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

