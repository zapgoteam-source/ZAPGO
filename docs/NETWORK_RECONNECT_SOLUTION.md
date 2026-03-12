# 모바일 화면 잠금 후 데이터 로드 문제 해결 방안

## 📋 문제 요약

모바일 환경에서 화면 잠금이 실행된 후 다시 앱으로 복귀할 때 다음과 같은 문제가 발생했습니다:
- 관리 탭의 정보가 표시되지 않음
- 지점 관리 페이지에서 "로딩 중..." 상태에서 멈춤
- 구독 관리 페이지에서 데이터가 로드되지 않음

## 🔍 근본 원인 분석

### 1. **Supabase 세션 만료**
- 화면 잠금 시 네트워크가 일시 중단되어 자동 토큰 갱신 실패
- 세션이 만료되어도 감지하지 못함

### 2. **컴포넌트 리마운트 시 데이터 재로드 부재**
- `useEffect`가 조건부로만 실행되어 화면 복귀 시 재로드 안 됨
- 의존성 배열 문제로 인한 재실행 누락

### 3. **네트워크 재연결 감지 부재**
- 앱이 네트워크 복구를 자동으로 감지하지 못함
- 화면 복귀 이벤트 리스너 없음

### 4. **로딩 상태 관리 오류**
- 무한 로딩 상태에 빠질 수 있는 구조
- 에러 발생 시 복구 메커니즘 부재

## ✅ 구현된 해결책

### 1. 네트워크 재연결 감지 훅 (`useNetworkReconnect`)

**위치:** `/src/hooks/useNetworkReconnect.ts`

**기능:**
- 네트워크 온라인 이벤트 감지
- 화면 가시성 변경 감지 (화면 잠금 해제)
- 윈도우 포커스 복귀 감지
- 페이지 복원 감지 (bfcache)
- 디바운스 기능으로 중복 호출 방지 (기본 1초)

**사용법:**
```typescript
useNetworkReconnect({
  onReconnect: async () => {
    // 재연결 시 실행할 로직
    await loadData();
  },
  debounceMs: 2000, // 2초 디바운스
  enableLog: true // 디버그 로그 활성화
});
```

### 2. AuthContext 세션 검증 및 복구 로직

**위치:** `/src/contexts/AuthContext.tsx`

**추가된 함수:** `validateAndRefreshSession()`

**기능:**
- 현재 세션 유효성 검증
- 토큰 자동 갱신 시도
- 세션 만료 시 로그인 페이지로 리다이렉트
- 프로필 정보 자동 재로드

**흐름:**
```
1. 세션 가져오기 (getSession) → 자동 토큰 갱신 시도
2. 세션 유효성 확인
   ├─ 유효하지 않음 → 로그인 페이지로 리다이렉트
   └─ 유효함 → 프로필 정보 재로드
3. 사용자 상태 업데이트
```

### 3. 관리 페이지들에 자동 재로드 적용

#### 3.1 관리자 대시보드 (`/src/app/admin/page.tsx`)

**변경사항:**
- `loadStats` 함수를 `useCallback`으로 메모이제이션
- `useNetworkReconnect` 훅 추가
- 재연결 시 세션 검증 후 데이터 재로드

```typescript
const loadStats = useCallback(async () => {
  // 통계 데이터 로드 로직
}, []);

useNetworkReconnect({
  onReconnect: async () => {
    const isValid = await validateAndRefreshSession();
    if (isValid && authUserProfile) {
      await loadStats();
    }
  },
  debounceMs: 2000,
});
```

#### 3.2 지점 관리 페이지 (`/src/components/admin/BranchManagement.tsx`)

**변경사항:**
- `loadBranches` 함수를 `useCallback`으로 메모이제이션
- 네트워크 재연결 감지 추가
- 세션 검증 후 자동 재로드

#### 3.3 구독 관리 페이지 (`/src/app/admin/subscription/page.tsx`)

**변경사항:**
- `loadUsers`, `loadTenants`, `loadSubscriptions` 함수들을 `useCallback`으로 메모이제이션
- `loadAllData` 함수로 모든 데이터를 병렬 로드
- 재연결 시 모든 데이터를 한 번에 재로드

```typescript
const loadAllData = useCallback(async () => {
  await Promise.all([
    loadUsers(),
    loadTenants(),
    loadSubscriptions()
  ]);
}, [loadUsers, loadTenants, loadSubscriptions]);
```

### 4. Supabase 클라이언트 설정 개선

**위치:** `/src/lib/supabase.ts`

**추가된 설정:**

```typescript
{
  global: {
    headers: {
      'X-Client-Info': 'zapgo-mobile-app',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
    heartbeatIntervalMs: 30000, // 30초
    timeout: 10000, // 10초
  },
}
```

**개선 사항:**
- 클라이언트 식별자 추가 (디버깅 용도)
- 실시간 구독 재연결 설정
- 하트비트 간격 조정으로 연결 유지 강화

## 🔄 데이터 재로드 흐름

```
1. 사용자가 화면 잠금 → 앱 백그라운드
   │
2. 화면 잠금 해제 → 앱 포그라운드 복귀
   │
3. useNetworkReconnect 훅이 감지
   ├─ visibilitychange 이벤트
   ├─ focus 이벤트
   └─ online 이벤트
   │
4. onReconnect 콜백 실행
   │
5. validateAndRefreshSession() 호출
   ├─ 세션 유효성 검증
   ├─ 토큰 자동 갱신 시도
   └─ 프로필 재로드
   │
6. 세션 유효 시 데이터 재로드
   ├─ loadStats() (관리자 대시보드)
   ├─ loadBranches() (지점 관리)
   └─ loadAllData() (구독 관리)
   │
7. UI 업데이트 완료
```

## 📱 테스트 시나리오

### 1. 화면 잠금 테스트
```
1. 앱에 로그인
2. 관리 페이지 진입
3. 모바일 기기 화면 잠금 (5분 이상)
4. 화면 잠금 해제
5. 앱으로 복귀
→ 예상 결과: 데이터가 자동으로 재로드됨
```

### 2. 네트워크 재연결 테스트
```
1. 앱에 로그인
2. 관리 페이지 진입
3. 비행기 모드 활성화 (또는 Wi-Fi 끄기)
4. 1분 대기
5. 비행기 모드 비활성화 (또는 Wi-Fi 켜기)
→ 예상 결과: 네트워크 복구 후 자동으로 재로드
```

### 3. 앱 전환 테스트
```
1. 앱에 로그인
2. 관리 페이지 진입
3. 다른 앱으로 전환
4. 5분 이상 대기
5. ZAPGO 앱으로 복귀
→ 예상 결과: 포커스 복귀 시 자동으로 재로드
```

### 4. 세션 만료 테스트
```
1. 앱에 로그인
2. 관리 페이지 진입
3. 30분 이상 방치 (자동 로그아웃 시간)
4. 화면 터치
→ 예상 결과: 세션 만료 알림 후 로그인 페이지로 이동
```

## 🐛 디버깅 로그

개발 환경에서 다음과 같은 로그를 확인할 수 있습니다:

```
🎧 [재연결 감지] 이벤트 리스너 등록 완료
🔄 [재연결 감지] 화면 복귀 - 데이터 재로드 시작
🔍 [세션 검증] 시작...
✅ [세션 검증] 세션 유효
🔄 [세션 검증] 프로필 재로드
✅ [세션 검증] 완료
🔄 [관리자 대시보드] 재연결 감지 - 세션 검증 및 데이터 재로드
✅ [재연결 감지] 화면 복귀 - 데이터 재로드 완료
```

## 🎯 핵심 개선 사항

### Before (문제 상황)
```typescript
// ❌ 화면 복귀 시 재로드 안 됨
useEffect(() => {
  loadData();
}, []); // 한 번만 실행
```

### After (해결 후)
```typescript
// ✅ 화면 복귀 시 자동 재로드
const loadData = useCallback(async () => {
  // 데이터 로드 로직
}, []);

useNetworkReconnect({
  onReconnect: async () => {
    const isValid = await validateAndRefreshSession();
    if (isValid) {
      await loadData();
    }
  },
  debounceMs: 2000,
});
```

## 📊 성능 최적화

### 1. 디바운스 적용
- 2초 디바운스로 중복 호출 방지
- 빠른 앱 전환 시 불필요한 API 호출 감소

### 2. 병렬 데이터 로드
```typescript
// 구독 관리 페이지
await Promise.all([
  loadUsers(),
  loadTenants(),
  loadSubscriptions()
]);
```

### 3. 메모이제이션
- `useCallback`으로 함수 재생성 방지
- 불필요한 리렌더링 최소화

## 🔒 보안 고려사항

### 1. 세션 검증
- 모든 재연결 시 세션 유효성 확인
- 만료된 세션 자동 감지 및 처리

### 2. 자동 로그아웃
- 30분 비활성 시 자동 로그아웃 (기존 기능 유지)
- localStorage 기반 활동 추적

### 3. 토큰 갱신
- Supabase 자동 토큰 갱신 활용
- PKCE 플로우로 보안 강화

## 🚀 추가 개선 가능 사항

### 1. 오프라인 지원
```typescript
// 향후 구현 예정
if (navigator.onLine) {
  await loadData();
} else {
  showOfflineMessage();
}
```

### 2. 백그라운드 동기화
```typescript
// Service Worker 활용
// 백그라운드에서 주기적으로 데이터 동기화
```

### 3. 에러 재시도 로직
```typescript
// 지수 백오프를 사용한 재시도
async function loadDataWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await loadData();
      break;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i));
    }
  }
}
```

## 📝 유지보수 가이드

### 새로운 페이지에 적용하기

```typescript
// 1. 필요한 import 추가
import { useNetworkReconnect } from '@/hooks/useNetworkReconnect';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

// 2. 데이터 로드 함수를 useCallback으로 메모이제이션
const loadData = useCallback(async () => {
  // 데이터 로드 로직
}, [/* 의존성 */]);

// 3. useAuth에서 validateAndRefreshSession 가져오기
const { validateAndRefreshSession } = useAuth();

// 4. 네트워크 재연결 훅 추가
useNetworkReconnect({
  onReconnect: async () => {
    const isValid = await validateAndRefreshSession();
    if (isValid) {
      await loadData();
    }
  },
  debounceMs: 2000,
});

// 5. 초기 데이터 로드
useEffect(() => {
  if (authUserProfile) {
    loadData();
  }
}, [authUserProfile, loadData]);
```

## 🎉 결론

이 솔루션은 모바일 환경에서 발생하는 화면 잠금 및 네트워크 재연결 문제를 **근본적으로** 해결합니다:

✅ **화면 잠금 후 복귀 시 자동 데이터 재로드**  
✅ **네트워크 재연결 자동 감지**  
✅ **세션 만료 자동 처리**  
✅ **무한 로딩 상태 방지**  
✅ **성능 최적화 (디바운스, 병렬 처리)**  
✅ **타입 안전성 보장**  
✅ **재사용 가능한 커스텀 훅**  
✅ **확장 가능한 구조**  

앞으로 새로운 페이지를 추가할 때도 동일한 패턴을 적용하여 일관된 사용자 경험을 제공할 수 있습니다.

