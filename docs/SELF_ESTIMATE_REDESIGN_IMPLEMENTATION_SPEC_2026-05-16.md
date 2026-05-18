# ZAPGO 셀프견적 개편 구현 명세

- 작성일: 2026-05-16
- 목적: UX/UI 개선 기획안을 실제 제품 개편으로 옮기기 위한 개발 전달 문서
- 전제: 현재 셀프견적 플로우는 `/selfest → /house-info → /estimate → /submit` 이다.

## 1. 현재 구조와 목표 구조

### 현재

```text
/selfest
  불편 증상 선택
    ↓
/house-info
  평형 + 창짝 수 입력
    ↓
/estimate
  시공 방식 + 옵션 + 예상 견적
    ↓
/submit
  상담 신청 입력
```

### 목표

```text
/selfest
  불편 증상 + 평형 + 창짝 수
    ↓
/lead-gate
  추천 시공 + 예상 금액대 + 연락처 + 지역
    ↓
/estimate
  상세 견적 + 시공 방식 + 옵션 + 상담 신청 확장 폼
```

## 2. 라우트 개편

### 유지

- `/selfest`
- `/lead-gate`
- `/estimate`
- `/visit-request`

### 축소 또는 제거

- `/house-info`
  - 기능을 `/selfest`로 흡수
- `/submit`
  - 기능을 `/estimate`로 흡수

### 마이그레이션 원칙

- 기존 북마크/문자 링크 호환을 위해 `/house-info`, `/submit`은 즉시 삭제하지 않고 일정 기간 리다이렉트 유지
- `/house-info` → `/selfest`
- `/submit` → `/estimate`

## 3. 상태 구조 변경

## 3.1 유지 가능한 상태

- `surveyAnswers`
- `housingAreaPyeong`
- `windowSashCount`
- `premiumProtection`
- `pestSolution`
- `pestScreenCount`
- `selectedPlan`
- `refCode`

## 3.2 추가 권장 상태

- `consultFormExpanded: boolean`
- `leadCaptureMode: 'full' | 'lite'`
- `entrySource: 'direct' | 'ad' | 'kakao' | 'agency' | 'sms'`

## 3.3 selectedPlan 초기값 변경 권장

현재:

- 기본값 `main`

권장:

- 초기값 `null`

이유:

- 고객이 직접 시공 방식을 고른다는 감각이 더 중요함
- 추천은 가능하지만 자동 선택은 판매 압박처럼 느껴질 수 있음

## 4. 화면별 구현 요구사항

## 4.1 `/selfest`

### 현재 포함 요소

- 증상 선택
- 추천 시공
- 자동 재생 인트로 영상

### 변경 후 포함 요소

- 증상 선택
- 평형 입력
- 창짝 수 입력
- 간단 추천 태그
- `내 예상 견적 보기`
- 보조 CTA

### 제거 또는 축소

- 자동 재생 영상 제거
- 긴 추천 설명 축소

### 다음 이동

- 현재: `/house-info`
- 변경: `/estimate`

## 4.2 `/estimate`

### 현재 포함 요소

- 시공 방식 선택
- 옵션 토글
- 총액
- 이탈 팝업
- 문자 링크

### 추가할 요소

- 동일 페이지 내 상담 신청 폼
- CTA 클릭 시 폼 확장
- 저장된 입력값을 유지한 채 폼 제출

### 삭제할 연결

- `router.push('/submit')`

### CTA 동작

1. 시공 방식 미선택
   - CTA disabled 또는 안내형
2. 시공 방식 선택
   - `이 조건으로 상담 신청하기`
3. 클릭 시
   - 폼 영역으로 scroll
   - 폼 expand

### 상담 폼 구성

#### 표준형

- 이름
- 연락처
- 주소
- 희망 일정
- 요청사항

#### 초간편형 실험안

- 이름
- 연락처

### 제출 후

- 현재 `/submit`에서 수행 중인 로직을 `/estimate` 내부로 이동
  - 이메일 발송
  - 고객 DB 저장
  - 성공 상태 표시

## 4.3 `/lead-gate`

### 목적

- 정확한 상세 견적 전에 리드를 확보한다.

### 포함 요소

- 추천 시공
- 추천 이유
- 넓은 예상 금액대
- 휴대폰 번호 입력
- 지역 입력
- `내 지역 기준 견적 보기`

### 다음 이동

- `/estimate`

### 저장 항목

- phone
- region
- lead captured timestamp

### 비고

- 이 단계에서는 상세 주소를 받지 않는다.
- 결과가 잠긴 이유는 `상담 유도`가 아니라 `지역 기준 정확도 향상`으로 설명한다.

## 5. 기존 코드 기준 변경 포인트

### `/selfest`

- `router.push('/house-info')` → `router.push('/estimate')`
- `house-info`의 입력 UI와 validation 흡수
- 필요하면 `house-info` 컴포넌트 일부를 재사용 가능한 블록으로 분리

### `/house-info`

- 신규 유입은 받지 않음
- 일정 기간 리다이렉트 페이지만 유지

### `/estimate`

- `/submit`의 상담 입력 폼과 제출 로직 흡수
- 현재 `showExitPopup`, `showSmsModal` 로직 유지
- `goToSubmit()` 제거
- `consultFormExpanded` 상태 추가

### `/submit`

- 리다이렉트 또는 deprecated 처리
- 문자 링크 재방문 호환성은 `/estimate` 쪽으로 통합

## 6. 데이터 흐름

```text
selfest input
  ↓
zustand persist
  ↓
estimate view
  ↓
service/option 선택
  ↓
consult form expand
  ↓
email + customer API
```

## 7. 링크/재방문 처리

현재 문자 링크는 아래 값을 쿼리로 복원한다.

- `plan`
- `premium`
- `pest`
- `pyeong`
- `sash`

### 유지해야 할 동작

- 문자 링크 진입 시 `/estimate`에서 상태 복원
- 선택한 옵션과 금액 동일 재현

### 추가 권장

- `source=sms`
- `ref`
- `region`

## 8. 분석 이벤트 구현

### `/selfest`

- `landing_view`
- `issue_select`
- `quick_input_complete`
- `estimate_cta_click`

### `/estimate`

- `estimate_view`
- `service_select`
- `option_toggle`
- `consult_cta_click`
- `consult_form_expand`
- `consult_submit`
- `sms_save_click`
- `visit_request_click`

## 9. UI 구현 원칙

- 모바일 기준 390px 폭에서 먼저 설계
- 첫 화면은 한 스크린 내 주요 과업 완료
- 모든 주요 CTA는 thumb zone 안에 배치
- 가격은 가장 높은 시각 우선순위
- 하단 고정 CTA는 메인 전환에만 사용

## 10. QA 체크리스트

### 기능

- 증상 선택 + 평형 + 창짝 수 입력 후 `/estimate` 진입 가능
- 시공 방식 미선택 상태에서 금액/CTA 상태가 의도대로 보임
- 상담 CTA 클릭 시 폼이 같은 페이지에서 확장됨
- 상담 신청 제출 성공 시 이메일 발송 및 고객 저장
- 문자 링크로 재진입 시 선택 상태 복원
- 기존 `/house-info`, `/submit` 접근 시 의도한 경로로 이동

### UX

- 첫 화면에서 스크롤 없이 주요 과업 가능
- 가격 확인까지 걸리는 단계 수 감소
- 상담 신청이 별도 작업처럼 느껴지지 않음
- 방문 견적/전화/카톡 경로가 보조 행동으로 유지

## 11. 출시 순서

### Sprint 1

1. `/selfest`와 `/house-info` 병합
2. `/estimate`와 `/submit` 병합
3. 리다이렉트 호환 처리

### Sprint 2

1. 시각 리디자인
2. 유입 카피 분기
3. 분석 이벤트 추가

### Sprint 3

1. 초간편 리드 모드 A/B 테스트
2. 문자 저장 CTA 실험
3. 추천 카피 개인화

## 12. 기존 앱 대비 반드시 보존할 기능

개편 과정에서 아래 기능은 빠지지 않게 유지해야 한다.

### 고객 전환 관련

- 카톡문의 / 전화문의 / 방문견적요청 보조 CTA
- 결과 다시보기 문자 링크
- 문자 링크 재진입 시 선택 상태 복원
- 이탈 시 결과 저장 유도

### 견적 조정 관련

- 패브릭씰러 / 일반 모헤어 / 측면 시공 비교
- 프리미엄 보양 포함 여부
- 방충솔루션 포함 여부 및 수량 조정

### 유입 추적 관련

- 대리점 ref 코드 보존
- 광고/문자/대리점 유입 source 파라미터 보존

### 설명 보조

- 창짝 개수 세는 방법 안내
- 필요 시 시공 방식 설명 영상

### 판단

- 자동 재생 영상은 제거 가능하지만, `도움이 필요한 고객이 눌러서 볼 수 있는 설명 수단` 자체는 남겨두는 편이 좋다.
- 기존 기능을 모두 전면 노출할 필요는 없지만, 퍼널상 의미 있는 기능은 잃지 않아야 한다.
