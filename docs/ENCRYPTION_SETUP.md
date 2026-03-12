# 고객 개인정보 암호화 설정 가이드

## 개요

ZAPGO 시스템에서는 고객의 개인정보(이름, 전화번호, 주소)를 안전하게 보호하기 위해 **AES-256 암호화**를 사용합니다.

- **암호화 대상**: 이름, 전화번호, 주소
- **암호화 방식**: AES-256 (crypto-js)
- **처리 위치**: Next.js 서버 사이드 (API 라우트)

## 설정 방법

### 1. 환경 변수 설정

`.env.local` 파일에 암호화 키를 추가합니다:

```bash
# 기존 Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 암호화 키 (32자 이상의 랜덤 문자열)
ENCRYPTION_SECRET_KEY=your-32-character-or-longer-secret-key-here
```

### 2. 암호화 키 생성

안전한 랜덤 키를 생성하는 방법:

#### macOS/Linux:
```bash
openssl rand -base64 32
```

#### Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

생성된 키를 복사하여 `.env.local` 파일의 `ENCRYPTION_SECRET_KEY`에 붙여넣습니다.

### 3. 서버 재시작

환경 변수 변경 후 반드시 개발 서버를 재시작해야 합니다:

```bash
# 개발 서버 재시작
npm run dev
```

## 작동 방식

### 데이터 흐름

```
[프론트엔드] 
    ↓ (평문 전송)
[API 라우트] 
    ↓ (암호화)
[Supabase DB] 
    ↓ (암호화된 상태로 저장)
[API 라우트] 
    ↓ (복호화)
[프론트엔드] 
    ↓ (평문으로 표시)
```

### 자동 처리

- **추가**: `/api/customers` (POST) - 자동 암호화 후 저장
- **수정**: `/api/customers` (PUT) - 자동 암호화 후 업데이트
- **조회**: `/api/customers` (GET) - 자동 복호화 후 반환
- **삭제**: `/api/customers` (DELETE) - 그대로 삭제

## 보안 고려사항

### ✅ 장점

1. **서버 사이드 암호화**: 암호화 키가 서버에만 존재하여 클라이언트에 노출되지 않음
2. **투명한 처리**: 프론트엔드 코드는 평문으로 작업하며, 암호화는 자동으로 처리
3. **데이터베이스 보안**: DB가 해킹되어도 암호화 키 없이는 개인정보 복호화 불가
4. **백업 보안**: 데이터베이스 백업도 암호화된 상태로 저장됨

### ⚠️ 주의사항

1. **암호화 키 관리**
   - `.env.local` 파일을 절대 Git에 커밋하지 마세요
   - 프로덕션 환경에서는 환경 변수를 안전하게 관리하세요 (Vercel Secrets 등)
   - 키를 분실하면 기존 데이터를 복호화할 수 없습니다

2. **키 백업**
   - 암호화 키를 안전한 곳에 백업하세요
   - 비밀번호 관리자나 보안 저장소 사용 권장

3. **키 변경**
   - 암호화 키를 변경하면 기존 암호화된 데이터를 읽을 수 없습니다
   - 키 변경 시 모든 데이터를 재암호화해야 합니다

## 프로덕션 배포 (Vercel 예시)

### 환경 변수 설정

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수 추가:
   - `ENCRYPTION_SECRET_KEY`: 생성한 암호화 키

### 배포 후 확인

```bash
# 환경 변수가 제대로 설정되었는지 확인
vercel env ls
```

## 문제 해결

### 암호화 키 오류

```
Error: ENCRYPTION_SECRET_KEY 환경 변수가 설정되지 않았습니다.
```

**해결**: `.env.local` 파일에 `ENCRYPTION_SECRET_KEY`를 추가하고 서버 재시작

### 복호화 실패

```
복호화 오류: 잘못된 암호화 키 또는 손상된 데이터
```

**원인**: 
- 암호화 키가 변경됨
- 데이터가 손상됨
- 다른 키로 암호화된 데이터

**해결**: 올바른 암호화 키로 복구하거나 데이터 재암호화

## 기술 스택

- **암호화 라이브러리**: crypto-js
- **암호화 알고리즘**: AES-256
- **키 길이**: 최소 32자 (권장 256비트)
- **처리 위치**: Next.js API Routes (서버 사이드)

## 관련 파일

- `/src/lib/encryption.ts` - 암호화/복호화 유틸리티
- `/src/app/api/customers/route.ts` - 고객 API 라우트
- `/src/app/customers/page.tsx` - 고객 관리 페이지
- `.env.local.example` - 환경 변수 예시

## 추가 보안 강화 방안

향후 필요 시 다음 보안 기능을 추가할 수 있습니다:

1. **필드별 암호화 키**: 각 필드마다 다른 키 사용
2. **키 로테이션**: 주기적으로 암호화 키 변경
3. **감사 로그**: 개인정보 접근 기록
4. **접근 제어**: 역할 기반 복호화 권한 관리
5. **데이터 마스킹**: 부분적 표시 (예: 010-****-1234)

