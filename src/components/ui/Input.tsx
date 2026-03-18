/**
 * Input 컴포넌트
 * 
 * ZAPGO 애플리케이션에서 사용되는 기본 입력 필드 컴포넌트입니다.
 * 다양한 타입과 스타일을 지원하며, 접근성을 고려하여 설계되었습니다.
 */

'use client';

import React, { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 라벨 텍스트 */
  label?: string;
  /** 오류 메시지 */
  error?: string;
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
  /** 입력 필드 크기 */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 입력 필드 크기별 스타일 클래스
 */
const inputSizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg'
};

/**
 * Input 컴포넌트
 * 
 * @param label - 입력 필드 라벨
 * @param error - 오류 메시지
 * @param fullWidth - 전체 너비 사용 여부 (기본값: true)
 * @param size - 입력 필드 크기 (기본값: 'md')
 * @param className - 추가 CSS 클래스
 * @param props - 기타 HTML input 속성들
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error,
    fullWidth = true,
    size = 'md',
    className,
    id,
    type,
    ...props
  }, ref) => {
    // ID 생성 (라벨과 연결하기 위해)
    const generatedId = useId();
    const inputId = id || generatedId;
    
    // 비밀번호 표시/숨김 상태 (password 타입인 경우에만)
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    
    // 실제 input type (비밀번호 토글에 따라 변경)
    const actualType = isPasswordField && showPassword ? 'text' : type;

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {/* 라벨 */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 font-korean"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {/* 입력 필드 컨테이너 (비밀번호 필드인 경우 상대 위치) */}
        <div className="relative">
        {/* 입력 필드 */}
        <input
          ref={ref}
          id={inputId}
            type={actualType}
          className={cn(
            // 기본 스타일
            'block border border-gray-300 bg-white text-gray-900',
            'placeholder-gray-400 focus:outline-none focus:ring-2',
            'focus:ring-primary focus:border-primary transition-colors duration-200',
            'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
            'font-korean',
            
            // 크기별 스타일
            inputSizes[size],
            
            // 전체 너비
            fullWidth && 'w-full',
            
            // 오류 상태 스타일
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
              
              // 비밀번호 필드인 경우 오른쪽 패딩 추가 (토글 버튼 공간)
              isPasswordField && 'pr-12',
            
            // 사용자 정의 클래스
            className
          )}
          {...props}
        />
          
          {/* 비밀번호 표시/숨김 토글 버튼 */}
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        
        {/* 오류 메시지 */}
        {error && (
          <p className="text-sm text-red-600 font-korean" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

