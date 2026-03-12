/**
 * Logo 컴포넌트
 * 
 * ZAPGO의 브랜드 로고를 표시하는 컴포넌트입니다.
 * 다양한 크기를 지원하며, 반응형 디자인에 최적화되어 있습니다.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// 로고 크기 타입 정의
type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'custom';

interface LogoProps {
  /** 로고의 크기 */
  size?: LogoSize;
  /** 사용자 정의 너비 (size가 'custom'일 때 사용) */
  width?: number;
  /** 사용자 정의 높이 (size가 'custom'일 때 사용) */
  height?: number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 로고 클릭 시 실행될 함수 */
  onClick?: () => void;
  /** 접근성을 위한 alt 텍스트 */
  alt?: string;
  /** 로고 색상 변형 */
  variant?: 'default' | 'white';
}

/**
 * 로고 크기별 스타일 정의
 */
const logoSizes: Record<Exclude<LogoSize, 'custom'>, { width: number; height: number }> = {
  sm: { width: 80, height: 32 },
  md: { width: 120, height: 48 },
  lg: { width: 160, height: 64 },
  xl: { width: 240, height: 96 }
};

/**
 * Logo 컴포넌트
 * 
 * @param size - 로고 크기 (기본값: 'md')
 * @param width - 사용자 정의 너비 (size가 'custom'일 때만 사용)
 * @param height - 사용자 정의 높이 (size가 'custom'일 때만 사용)
 * @param className - 추가 CSS 클래스
 * @param onClick - 클릭 이벤트 핸들러
 * @param alt - 접근성을 위한 대체 텍스트
 */
export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ 
    size = 'md',
    width,
    height,
    className,
    onClick,
    alt = 'ZAPGO 로고',
    variant = 'default',
    ...props
  }, ref) => {
    // 크기 계산
    const dimensions = size === 'custom' 
      ? { width: width || 120, height: height || 48 }
      : logoSizes[size];

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center logo-protected',
          onClick && 'cursor-pointer hover:opacity-80 transition-opacity duration-200',
          className
        )}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        {...props}
      >
        <Image
          src="/2555936eae5a1.png"
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          priority
          className={cn(
            "object-contain select-none pointer-events-none",
            variant === 'white' && "brightness-0 invert"
          )}
          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
          }}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }
);

Logo.displayName = 'Logo';
