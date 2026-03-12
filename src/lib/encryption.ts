/**
 * 암호화/복호화 유틸리티
 * 
 * AES-256 암호화를 사용하여 고객의 개인정보(이름, 전화번호, 주소)를 암호화합니다.
 * 서버 사이드에서만 사용되어야 합니다.
 */

import CryptoJS from 'crypto-js';

/**
 * 암호화 키 가져오기
 * 환경 변수에서 암호화 키를 읽어옵니다.
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_SECRET_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
  }
  
  if (key.length < 32) {
    throw new Error('ENCRYPTION_SECRET_KEY는 최소 32자 이상이어야 합니다.');
  }
  
  return key;
}

/**
 * 데이터 암호화
 * 
 * @param plainText - 암호화할 평문
 * @returns 암호화된 문자열 (Base64 인코딩)
 */
export function encrypt(plainText: string | null | undefined): string | null {
  // null, undefined, 빈 문자열은 그대로 반환
  if (!plainText || plainText.trim() === '') {
    return null;
  }
  
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(plainText, key).toString();
    return encrypted;
  } catch (error) {
    console.error('암호화 오류:', error);
    throw new Error('데이터 암호화에 실패했습니다.');
  }
}

/**
 * 데이터가 암호화되어 있는지 확인
 * AES 암호화된 데이터는 Base64 형식이고 "U2FsdGVk"로 시작
 */
function isEncrypted(text: string): boolean {
  return text.startsWith('U2FsdGVk');
}

/**
 * 데이터 복호화
 * 
 * @param encryptedText - 암호화된 문자열 (Base64 인코딩) 또는 평문
 * @returns 복호화된 평문
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
  // null, undefined, 빈 문자열은 그대로 반환
  if (!encryptedText || encryptedText.trim() === '') {
    return null;
  }
  
  // 이미 평문인 경우 (암호화되지 않은 기존 데이터) 그대로 반환
  if (!isEncrypted(encryptedText)) {
    return encryptedText;
  }
  
  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    
    // 복호화 실패 시 빈 문자열이 반환됨
    if (!plainText) {
      console.error('복호화 실패: 잘못된 암호화 키 또는 손상된 데이터');
      // 복호화 실패 시 원본 반환 (평문일 수 있음)
      return encryptedText;
    }
    
    return plainText;
  } catch (error) {
    console.error('복호화 오류:', error);
    // 에러 시 원본 반환 (평문일 수 있음)
    return encryptedText;
  }
}

/**
 * 고객 정보 암호화
 * 이름, 전화번호, 주소를 암호화합니다.
 */
export function encryptCustomerData(data: {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}) {
  return {
    name: encrypt(data.name),
    phone: encrypt(data.phone),
    address: encrypt(data.address),
  };
}

/**
 * 고객 정보 복호화
 * 암호화된 이름, 전화번호, 주소를 복호화합니다.
 */
export function decryptCustomerData(data: {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}) {
  return {
    name: decrypt(data.name),
    phone: decrypt(data.phone),
    address: decrypt(data.address),
  };
}

