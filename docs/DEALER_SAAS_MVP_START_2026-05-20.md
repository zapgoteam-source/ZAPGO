# 대리점 SaaS MVP 시작 메모

## 1차 목표

현재 셀프견적 앱을 대리점이 바로 활용할 수 있도록, 대리점별 공유 링크로 들어온 고객을 자동 귀속한다.

## 이번 구현 범위

- 대리점 공유 링크를 `/q/{dealerCode}/{referralCode}` 형식으로 변경
- 셀프견적 세션 생성 시 `dealerCode`, `referralCode`를 저장
- 고객 리드 생성 시 기존 `customers.ref_code`, `customers.referral_code`, `customers.agency_id`에 귀속 정보 저장
- 대리점 대시보드와 고객 목록에서 `agency_id` 또는 `referral_code` 기준으로 유입 고객 조회
- 상담 신청 이메일의 대리점 코드가 고정값 `zapgoself`가 아니라 실제 유입 코드로 표시되도록 변경

## 현재 데이터 모델 사용 원칙

- `agencies.referral_code`: 대리점 또는 추천인 식별 코드
- `customers.agency_id`: 실제 대리점 계정에 연결된 고객 귀속
- `customers.referral_code`: 유입 코드 보존
- `customers.ref_code`: 기존 화면/알림 호환용 코드

## 다음 구현 후보

1. 본사 관리자에서 대리점별 유입/상담/시공완료 집계 카드 추가
2. 대리점 관리 화면에서 대리점 코드와 공유 링크를 직접 확인/복사
3. 추천인과 대리점을 분리하기 위한 `referrers` 또는 `partners` 테이블 설계
4. 고객 상태값을 리퍼럴 정산에 맞게 정리
5. 인센티브 상태 필드 추가: `PENDING`, `APPROVED`, `PAID`, `HOLD`

## 주의점

현재는 기존 스키마를 활용한 최소 변경이다. 정산, 로열티, 추천인 포털까지 확장하려면 대리점과 추천인을 같은 `agencies` 테이블에 계속 둘지, 별도 파트너 모델로 분리할지 먼저 결정해야 한다.
