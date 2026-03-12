/**
 * 애플리케이션 상수 정의
 * 
 * 애플리케이션 전반에서 사용되는 상수값들을 정의합니다.
 */

/**
 * 기본 테넌트 정보 (본사)
 */
export const DEFAULT_TENANT = {
  /** 에너지잡고 본사 테넌트 ID */
  ID: 'e701d162-b504-4c78-9574-6c76f982caa2',
  /** 에너지잡고 본사 테넌트 이름 */
  NAME: '에너지잡고 본사',
} as const;

/**
 * 미배정 테넌트 정보 (회원가입 시 기본값)
 */
export const UNASSIGNED_TENANT = {
  /** 미배정 테넌트 ID (회원가입 후 역할 배정 대기) */
  ID: '00000000-0000-0000-0000-000000000000',
  /** 미배정 테넌트 이름 */
  NAME: '미배정',
} as const;

/**
 * 기본 사용자 역할 (회원가입 시 기본값)
 */
export const DEFAULT_USER_ROLE = 'UNASSIGNED' as const;

/**
 * 애플리케이션 설정
 */
export const APP_CONFIG = {
  /** 회원가입 시 기본 활성화 상태 */
  DEFAULT_USER_ACTIVE: false,
  /** 비밀번호 최소 길이 */
  MIN_PASSWORD_LENGTH: 6,
  /** 아이디 최소 길이 */
  MIN_USERNAME_LENGTH: 3,
  /** 아이디 최대 길이 */
  MAX_USERNAME_LENGTH: 20,
} as const;
