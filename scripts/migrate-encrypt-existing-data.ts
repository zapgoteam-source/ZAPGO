/**
 * 기존 평문 데이터를 암호화하는 마이그레이션 스크립트
 * 
 * 사용법:
 * npx tsx scripts/migrate-encrypt-existing-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// 환경 변수 로드
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const encryptionKey = process.env.ENCRYPTION_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !encryptionKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey);
  console.error('ENCRYPTION_SECRET_KEY:', !!encryptionKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 데이터 암호화
 */
function encrypt(plainText: string | null): string | null {
  if (!plainText || plainText.trim() === '') {
    return null;
  }
  
  try {
    return CryptoJS.AES.encrypt(plainText, encryptionKey!).toString();
  } catch (error) {
    console.error('암호화 오류:', error);
    return null;
  }
}

/**
 * 데이터가 이미 암호화되어 있는지 확인
 * (암호화된 데이터는 일반적으로 Base64 형식이고 "U2FsdGVk"로 시작)
 */
function isEncrypted(text: string | null): boolean {
  if (!text) return false;
  // AES 암호화된 데이터는 보통 "U2FsdGVk"로 시작 (Base64 encoded "Salted__")
  return text.startsWith('U2FsdGVk');
}

async function migrateData() {
  console.log('🔐 고객 데이터 암호화 마이그레이션 시작...\n');
  
  try {
    // 모든 고객 데이터 조회
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, address');
    
    if (error) {
      throw error;
    }
    
    if (!customers || customers.length === 0) {
      console.log('✅ 마이그레이션할 고객 데이터가 없습니다.');
      return;
    }
    
    console.log(`📊 총 ${customers.length}명의 고객 데이터를 확인했습니다.\n`);
    
    let encryptedCount = 0;
    let alreadyEncryptedCount = 0;
    let errorCount = 0;
    
    // 각 고객 데이터 처리
    for (const customer of customers) {
      const needsEncryption = 
        (customer.name && !isEncrypted(customer.name)) ||
        (customer.phone && !isEncrypted(customer.phone)) ||
        (customer.address && !isEncrypted(customer.address));
      
      if (!needsEncryption) {
        alreadyEncryptedCount++;
        console.log(`⏭️  고객 ${customer.id}: 이미 암호화됨`);
        continue;
      }
      
      // 암호화
      const encryptedData = {
        name: isEncrypted(customer.name) ? customer.name : encrypt(customer.name),
        phone: isEncrypted(customer.phone) ? customer.phone : encrypt(customer.phone),
        address: isEncrypted(customer.address) ? customer.address : encrypt(customer.address),
      };
      
      // 업데이트
      const { error: updateError } = await supabase
        .from('customers')
        .update(encryptedData)
        .eq('id', customer.id);
      
      if (updateError) {
        console.error(`❌ 고객 ${customer.id} 암호화 실패:`, updateError);
        errorCount++;
      } else {
        console.log(`✅ 고객 ${customer.id}: 암호화 완료`);
        encryptedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 마이그레이션 결과:');
    console.log(`   ✅ 암호화 완료: ${encryptedCount}명`);
    console.log(`   ⏭️  이미 암호화됨: ${alreadyEncryptedCount}명`);
    console.log(`   ❌ 실패: ${errorCount}명`);
    console.log('='.repeat(50));
    
    if (errorCount === 0) {
      console.log('\n🎉 모든 고객 데이터가 성공적으로 암호화되었습니다!');
    } else {
      console.log('\n⚠️  일부 데이터 암호화에 실패했습니다. 로그를 확인해주세요.');
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    process.exit(1);
  }
}

// 실행
migrateData();

