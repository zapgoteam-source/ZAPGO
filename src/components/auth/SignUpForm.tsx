/**
 * 회원가입 폼 컴포넌트
 * 
 * 신규 사용자 회원가입을 위한 폼 컴포넌트입니다.
 * 이름, 이메일, 비밀번호 입력, 유효성 검사, 오류 처리를 포함합니다.
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { isValidUsername } from '@/lib/utils';
import { UserRole } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';
import { UNASSIGNED_TENANT } from '@/lib/constants';
import { CheckCircle, Info } from 'lucide-react';

interface SignUpFormProps {
  /** 회원가입 성공 시 실행될 콜백 함수 */
  onSuccess?: () => void;
  /** 로그인 폼으로 전환하는 함수 */
  onSwitchToLogin?: () => void;
}

/**
 * 회원가입 폼 컴포넌트
 * 
 * @param onSuccess - 회원가입 성공 콜백
 * @param onSwitchToLogin - 로그인 폼 전환 콜백
 */
export function SignUpForm({ onSuccess, onSwitchToLogin }: SignUpFormProps) {
  const { signUp, loading } = useAuth();
  
  // 폼 상태 관리
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  
  // 오류 상태 관리
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  /**
   * 입력 필드 값 변경 핸들러
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 아이디는 한글만 제외하고 입력 가능하도록 제한
    if (name === 'username') {
      // 한글(가-힣, ㄱ-ㅎ, ㅏ-ㅣ)만 제거, 나머지는 모두 허용
      const filteredValue = value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // 해당 필드의 오류 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    
    // 전체 오류 메시지 제거
    if (submitError) {
      setSubmitError('');
    }
  };

  /**
   * 폼 유효성 검사
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름은 최소 2자 이상이어야 합니다.';
    }

    // 아이디 검증
    if (!formData.username) {
      newErrors.username = '아이디를 입력해주세요.';
    } else if (!isValidUsername(formData.username)) {
      newErrors.username = '아이디는 영문으로 시작하며, 한글과 공백을 제외한 모든 문자 사용 가능합니다 (3-20자).';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!validateForm()) {
      return;
    }

    try {
      // 미배정 테넌트 ID (회원가입 후 본사에서 역할 배정 대기)
      const unassignedTenantId = UNASSIGNED_TENANT.ID;

      // 회원가입 시도 (기본값: 미배정 역할, 미배정 테넌트)
      const { error } = await signUp({
        name: formData.name.trim(),
        username: formData.username,
        password: formData.password,
        role: UserRole.UNASSIGNED, // 기본 역할: 미배정
        tenantId: unassignedTenantId, // 미배정 테넌트 ID
      });

      if (error) {
        // 오류 메시지 처리
        console.error('회원가입 오류 상세:', error);
        
        // Supabase 에러 메시지를 사용자 친화적으로 변환
        let errorMessage = '회원가입 중 오류가 발생했습니다.';
        
        if (error.message.includes('User already registered') || 
            error.message.includes('already registered') ||
            error.message.includes('already been registered')) {
          errorMessage = '이미 가입된 아이디입니다. 다른 아이디를 사용해보세요.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
        } else if (error.message.includes('valid password')) {
          errorMessage = '유효한 비밀번호를 입력해주세요.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = '잘못된 이메일 형식입니다. 관리자에게 문의하세요.';
        } else if (error.message.includes('duplicate key') || 
                   error.message.includes('unique constraint')) {
          errorMessage = '이미 존재하는 사용자입니다. 다른 아이디를 사용해보세요.';
        } else {
          // 상세한 에러 메시지 표시
          errorMessage = `회원가입 실패: ${error.message}`;
        }
        
        setSubmitError(errorMessage);
      } else {
        // 회원가입 성공
        setSuccessMessage(
          '회원가입이 완료되었습니다! 본사에서 권한 설정 후 로그인할 수 있습니다.'
        );
        
        // 폼 초기화
        setFormData({
          name: '',
          username: '',
          password: '',
          confirmPassword: '',
        });
        
        // 성공 콜백 실행 (1.5초 후로 단축)
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      }
    } catch (error) {
      console.error('회원가입 처리 오류:', error);
      setSubmitError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 성공 메시지가 있을 때는 성공 화면 표시
  if (successMessage) {
    return (
      <div className="w-full max-w-xs mx-auto text-center">
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-8 rounded-lg">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2 font-korean">회원가입 완료!</h3>
          <p className="text-sm font-korean leading-relaxed">{successMessage}</p>
        </div>
        
        <Button
          onClick={onSwitchToLogin}
          variant="primary"
          size="lg"
          className="mt-6"
        >
          로그인하러 가기
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* 로고 */}
      <div className="text-center mb-8">
        <Logo size="xl" />
      </div>

      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 이름 입력 */}
        <Input
          type="text"
          name="name"
          label="이름"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          placeholder="홍길동"
          required
          autoComplete="name"
        />

        {/* 아이디 입력 */}
        <Input
          type="text"
          name="username"
          label="아이디"
          value={formData.username}
          onChange={handleInputChange}
          error={errors.username}
          placeholder="영문, 숫자 3-20자"
          required
          autoComplete="username"
        />

        {/* 비밀번호 입력 */}
        <Input
          type="password"
          name="password"
          label="비밀번호"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          placeholder="6자 이상"
          required
          autoComplete="new-password"
        />

        {/* 비밀번호 확인 입력 */}
        <Input
          type="password"
          name="confirmPassword"
          label="비밀번호 확인"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
          placeholder="비밀번호를 다시 입력하세요"
          required
          autoComplete="new-password"
        />

        {/* 안내 메시지 */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-korean">
                회원가입 후 본사에서 권한 설정을 해드립니다.<br />
                권한 설정이 완료되면 서비스를 이용하실 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 전체 오류 메시지 */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm font-korean">
            {submitError}
          </div>
        )}

        {/* 회원가입 버튼 */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          {loading ? '가입 중...' : '회원가입'}
        </Button>

        {/* 로그인 링크 */}
        <div className="text-center">
          <p className="text-sm text-gray-600 font-korean">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:text-primary-hover font-semibold transition-colors duration-200"
            >
              로그인
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

