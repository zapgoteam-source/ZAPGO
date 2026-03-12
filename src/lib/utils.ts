/**
 * 유틸리티 함수들
 * 
 * 이 파일은 애플리케이션 전반에서 사용되는 
 * 공통 유틸리티 함수들을 포함합니다.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스를 조건부로 병합하는 함수
 * clsx와 tailwind-merge를 결합하여 클래스 충돌을 방지합니다.
 * 
 * @param inputs - 병합할 클래스 값들
 * @returns 병합된 클래스 문자열
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜를 한국어 형식으로 포맷팅하는 함수
 * 
 * @param date - 포맷팅할 날짜
 * @returns 포맷팅된 날짜 문자열 (예: "2025년 9월 29일")
 */
export function formatDateKorean(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * 시간을 한국어 형식으로 포맷팅하는 함수
 * 
 * @param date - 포맷팅할 날짜/시간
 * @returns 포맷팅된 시간 문자열 (예: "오후 2:30")
 */
export function formatTimeKorean(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

/**
 * 숫자를 한국어 통화 형식으로 포맷팅하는 함수
 * 
 * @param amount - 포맷팅할 금액
 * @returns 포맷팅된 통화 문자열 (예: "₩1,000")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
}

/**
 * 문자열이 비어있는지 확인하는 함수
 * null, undefined, 빈 문자열, 공백만 있는 문자열을 모두 처리합니다.
 * 
 * @param str - 확인할 문자열
 * @returns 비어있으면 true, 아니면 false
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * 이메일 주소 유효성을 검사하는 함수
 * 
 * @param email - 검사할 이메일 주소
 * @returns 유효하면 true, 아니면 false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 아이디 유효성을 검사하는 함수
 * 한글을 제외한 모든 문자를 허용하며 3-20자 길이여야 합니다.
 * 
 * @param username - 검사할 아이디
 * @returns 유효하면 true, 아니면 false
 */
export function isValidUsername(username: string): boolean {
  // 3-20자 길이, 영문자로 시작, 한글 제외한 모든 문자 허용
  const usernameRegex = /^[a-zA-Z][^\sㄱ-ㅎㅏ-ㅣ가-힣]{2,19}$/;
  return usernameRegex.test(username);
}

/**
 * 디바운스 함수
 * 함수 호출을 지연시켜 성능을 최적화합니다.
 * 
 * @param func - 디바운스할 함수
 * @param wait - 지연 시간 (밀리초)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

