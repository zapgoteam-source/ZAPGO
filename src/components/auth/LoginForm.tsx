/**
 * 로그인 폼 컴포넌트
 * 
 * 사용자 로그인을 위한 폼 컴포넌트입니다.
 * 이메일/비밀번호 입력, 유효성 검사, 오류 처리를 포함합니다.
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { isValidUsername } from '@/lib/utils';

interface LoginFormProps {
  /** 로그인 성공 시 실행될 콜백 함수 */
  onSuccess?: () => void;
  /** 회원가입 폼으로 전환하는 함수 */
  onSwitchToSignUp?: () => void;
}

/**
 * 로그인 폼 컴포넌트
 * 
 * @param onSuccess - 로그인 성공 콜백
 * @param onSwitchToSignUp - 회원가입 폼 전환 콜백
 */
export function LoginForm({ onSuccess, onSwitchToSignUp }: LoginFormProps) {
  const { signIn, loading } = useAuth();
  
  // 폼 상태 관리
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  // 오류 상태 관리
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  /**
   * 입력 필드 값 변경 핸들러
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
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

    // 아이디 검증
    if (!formData.username) {
      newErrors.username = '아이디를 입력해주세요.';
    } else if (!isValidUsername(formData.username)) {
      newErrors.username = '올바른 아이디 형식을 입력해주세요.';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
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
      // 로그인 시도
      const { error } = await signIn({
        username: formData.username,
        password: formData.password,
      });

      if (error) {
        // 오류 메시지 처리
        switch (error.message) {
          case 'Invalid login credentials':
            setSubmitError('아이디 또는 비밀번호가 올바르지 않습니다.');
            break;
          case 'Email not confirmed':
            setSubmitError('계정 인증이 필요합니다. 관리자에게 문의하세요.');
            break;
          case 'Too many requests':
            setSubmitError('너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
            break;
          default:
            setSubmitError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      } else {
        // 로그인 성공
        onSuccess?.();
      }
    } catch (error) {
      console.error('로그인 처리 오류:', error);
      setSubmitError('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* 로고 */}
      <div className="text-center mb-8">
        <Logo size="xl" />
      </div>

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 아이디 입력 */}
        <Input
          type="text"
          name="username"
          label="아이디"
          value={formData.username}
          onChange={handleInputChange}
          error={errors.username}
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
          required
          autoComplete="current-password"
        />

        {/* 전체 오류 메시지 */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm font-korean">
            {submitError}
          </div>
        )}

        {/* 로그인 버튼 */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </Button>

        {/* 회원가입 링크 */}
        <div className="text-center">
          <p className="text-sm text-gray-600 font-korean">
            아직 계정이 없으신가요?{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-primary hover:text-primary-hover font-semibold transition-colors duration-200"
            >
              회원가입
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

