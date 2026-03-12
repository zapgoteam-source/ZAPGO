/**
 * Button 컴포넌트
 * 
 * ZAPGO 애플리케이션에서 사용되는 기본 버튼 컴포넌트입니다.
 * 다양한 스타일과 크기를 지원하며, 접근성을 고려하여 설계되었습니다.
 */

import React from 'react';
import { cn } from '@/lib/utils';

// 버튼 변형 타입 정의
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼의 시각적 스타일 변형 */
  variant?: ButtonVariant;
  /** 버튼의 크기 */
  size?: ButtonSize;
  /** 로딩 상태 표시 여부 */
  loading?: boolean;
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
  /** 버튼 내용 */
  children: React.ReactNode;
}

/**
 * 버튼 변형별 스타일 클래스
 */
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary/20',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500/20',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/20',
  ghost: 'text-primary hover:bg-primary/10 focus:ring-primary/20',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/20'
};

/**
 * 버튼 크기별 스타일 클래스
 */
const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

/**
 * Button 컴포넌트
 * 
 * @param variant - 버튼 스타일 변형 (기본값: 'primary')
 * @param size - 버튼 크기 (기본값: 'md')
 * @param loading - 로딩 상태 (기본값: false)
 * @param fullWidth - 전체 너비 사용 (기본값: false)
 * @param disabled - 비활성화 상태
 * @param className - 추가 CSS 클래스
 * @param children - 버튼 내용
 * @param props - 기타 HTML button 속성들
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // 기본 스타일
          'inline-flex items-center justify-center font-medium transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'font-korean',
          
          // 변형별 스타일
          buttonVariants[variant],
          
          // 크기별 스타일
          buttonSizes[size],
          
          // 전체 너비 사용
          fullWidth && 'w-full',
          
          // 로딩 상태일 때 커서 변경
          loading && 'cursor-wait',
          
          // 사용자 정의 클래스
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {/* 로딩 스피너 */}
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* 버튼 텍스트/내용 */}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

