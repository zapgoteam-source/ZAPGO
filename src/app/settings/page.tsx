/**
 * 설정 페이지
 * 
 * 사용자 설정 및 계정 정보를 관리하는 페이지입니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/layout/PageHeader';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Settings, 
  Shield,
  LogOut,
  Edit3,
  Save,
  X,
  Activity,
  UserCog
} from 'lucide-react';
import { getRoleDisplayName } from '@/lib/permissions';

export default function SettingsPage() {
  const router = useRouter();
  const { user, userProfile, signOut, loading, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState(userProfile?.phone || user?.user_metadata?.phone || '');
  

  /**
   * 사용자 이름 가져오기 (여러 fallback 옵션)
   */
  const getUserName = (): string => {
    // 1순위: userProfile.name
    if (userProfile?.name && userProfile.name.trim()) {
      return userProfile.name;
    }
    // 2순위: user.user_metadata.name
    if (user?.user_metadata?.name && user.user_metadata.name.trim()) {
      return user.user_metadata.name;
    }
    // 3순위: 이메일에서 추출 (@ 앞부분)
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      if (emailName && emailName !== 'zapgo.local') {
        return emailName;
      }
    }
    // 4순위: userProfile.email에서 추출
    if (userProfile?.email) {
      const emailName = userProfile.email.split('@')[0];
      if (emailName && emailName !== 'zapgo.local') {
        return emailName;
      }
    }
    // 최종 fallback
    return '사용자';
  };

  /**
   * 전화번호 포맷팅 (010-1234-5678 형식)
   */
  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';
    
    // 숫자만 추출
    const numbers = phoneNumber.replace(/[^\d]/g, '');
    
    // 길이에 따라 포맷팅
    if (numbers.length === 11) {
      // 010-1234-5678
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length === 10) {
      // 02-1234-5678 또는 031-123-4567
      if (numbers.startsWith('02')) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
      }
    } else if (numbers.length === 9) {
      // 02-123-4567
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
    }
    
    // 기본: 숫자만 반환
    return numbers;
  };

  /**
   * 입력 중 전화번호 포맷팅 (실시간)
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    // 11자리로 제한
    const limited = numbers.slice(0, 11);
    setPhone(limited);
  };

  // 인증 체크 및 승인 상태 체크
  useEffect(() => {
    // 로그아웃 중이면 리다이렉션 중단
    if (typeof window !== 'undefined' && (window as any).__LOGOUT_IN_PROGRESS__) {
      return;
    }
    
    if (!loading) {
      if (!user) {
        // 로그인하지 않은 사용자는 로그인 페이지로
        router.replace('/login');
      } else if (userProfile && !userProfile.is_active) {
        // 승인 대기 중인 사용자는 승인 대기 페이지로
        router.replace('/pending-approval');
      }
    }
  }, [user, userProfile, loading, router]);

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
      // AuthContext에서 에러 발생 시에도 리다이렉션 처리됨
    }
  };

  /**
   * 편집 모드 토글
   */
  const handleEditToggle = () => {
    if (isEditing) {
      // 편집 취소 시 원래 데이터로 복원 (숫자만)
      const originalPhone = userProfile?.phone || user?.user_metadata?.phone || '';
      setPhone(originalPhone.replace(/[^\d]/g, ''));
    } else {
      // 편집 시작 시 숫자만 추출
      const currentPhone = userProfile?.phone || user?.user_metadata?.phone || '';
      setPhone(currentPhone.replace(/[^\d]/g, ''));
    }
    setIsEditing(!isEditing);
  };

  /**
   * 전화번호 저장
   * users 테이블의 phone 컬럼 업데이트 (숫자만 저장)
   */
  const handleSave = async () => {
    try {
      if (!user) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      setSaving(true);

      // 숫자만 추출하여 저장
      const phoneNumbers = phone.replace(/[^\d]/g, '');

      // users 테이블 업데이트
      const { error } = await supabase
        .from('users')
        .update({ phone: phoneNumbers })
        .eq('id', user.id);

      if (error) {
        console.error('전화번호 업데이트 오류:', error);
        alert('전화번호 업데이트에 실패했습니다.');
        setSaving(false);
        return;
      }

      // 성공
      alert('전화번호가 업데이트되었습니다.');
      setIsEditing(false);
      setSaving(false);
      
      // 프로필 새로고침
      await refreshUserProfile();
      
    } catch (error) {
      console.error('전화번호 업데이트 중 오류:', error);
      alert('전화번호 업데이트에 실패했습니다.');
      setSaving(false);
    }
  };


  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          {/* 외곽 회전 원 */}
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
          {/* 회전 애니메이션 원 */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Settings className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 인증되지 않은 사용자 또는 승인 대기 중인 사용자
  if (!user || !userProfile || !userProfile.is_active) {
    return null;
  }

  return (
    <div className="bg-gray-50">
      {/* 통일된 헤더 */}
      <PageHeader />

      {/* 메인 콘텐츠 */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 프로필 카드 */}
          <div className="lg:col-span-2">
            {/* 프로필 헤더 카드 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-8">
                <div className="flex items-center">
                  <div className="w-20 h-20 border-2 border-primary rounded-full flex items-center justify-center">
                    <User className="text-primary" size={32} />
                  </div>
                  <div className="ml-6">
                    <h2 className="text-2xl font-bold text-gray-900 font-korean">
                      {getUserName()}
                    </h2>
                    <p className="text-gray-600 font-korean">
                      {userProfile?.tenant?.name || '소속 없음'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="px-6 py-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 font-korean">기본 정보</h3>
                <div className="divide-y divide-gray-100">
                  {/* 이메일 */}
                  <div className="flex items-center px-4 py-4 hover:bg-gray-50 transition-colors">
                    <Mail className="text-gray-400 mr-4 flex-shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-gray-500 font-korean mb-1">아이디</label>
                      <p className="text-base text-gray-900 font-medium">{user?.email?.split('@')[0]}</p>
                    </div>
                  </div>

                  {/* 전화번호 */}
                  <div className="flex items-center px-4 py-4 hover:bg-gray-50 transition-colors">
                    <Phone className="text-gray-400 mr-4 flex-shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-gray-500 font-korean mb-1">전화번호</label>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={formatPhoneNumber(phone)}
                          onChange={handlePhoneChange}
                          className="mt-1"
                          placeholder="01012345678"
                          maxLength={13}
                        />
                      ) : (
                        <div className="mt-1">
                          {userProfile?.phone || user?.user_metadata?.phone ? (
                            <a 
                              href={`tel:${(userProfile?.phone || user?.user_metadata?.phone || '').replace(/[^\d]/g, '')}`}
                              className="text-base text-gray-900 font-medium hover:text-primary hover:underline transition-colors"
                            >
                              {formatPhoneNumber(userProfile?.phone || user?.user_metadata?.phone || '')}
                            </a>
                          ) : (
                            <p className="text-base text-gray-400 font-medium">미설정</p>
                          )}
                        </div>
                      )}
                    </div>
                    {/* 전화번호만 편집 가능 */}
                    {!isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleEditToggle}
                        className="flex items-center gap-1 font-korean ml-3 flex-shrink-0"
                      >
                        <Edit3 size={14} />
                        편집
                      </Button>
                    )}
                  </div>

                  {/* 권한 */}
                  <div className="flex items-center px-4 py-4 hover:bg-gray-50 transition-colors">
                    <UserCog className="text-gray-400 mr-4 flex-shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-gray-500 font-korean mb-1">권한</label>
                      <p className="text-base text-gray-900 font-medium">
                        {getRoleDisplayName(userProfile.role)}
                      </p>
                    </div>
                  </div>

                  {/* 가입일 */}
                  <div className="flex items-center px-4 py-4 hover:bg-gray-50 transition-colors">
                    <Calendar className="text-gray-400 mr-4 flex-shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-gray-500 font-korean mb-1">가입일</label>
                      <p className="text-base text-gray-900 font-medium">
                        {new Date(user.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* 계정 상태 */}
                  <div className="flex items-center px-4 py-4 hover:bg-gray-50 transition-colors">
                    <Activity className="text-gray-400 mr-4 flex-shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-gray-500 font-korean mb-1">계정 상태</label>
                      <p className="text-base text-gray-900 font-medium">
                        {userProfile.is_active ? '활성' : '승인 대기'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 저장 버튼 */}
                {isEditing && (
                  <div className="mt-6 px-4 flex gap-3">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 font-korean"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          저장
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEditToggle}
                      disabled={saving}
                      className="flex items-center gap-2 font-korean"
                    >
                      <X size={16} />
                      취소
                    </Button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 사이드바 */}
          <div>
            {/* 로그아웃 */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-3 px-6 font-korean"
              >
                <LogOut size={16} />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

