# ZAPGOSELF 공개 랜딩 환경변수 체크리스트

## 필수

| 변수 | 용도 |
|---|---|
| `JUSO_CONFM_KEY` | 도로명주소 검색 API 승인키 |
| `SOLAPI_API_KEY` | 문자 발송 |
| `SOLAPI_API_SECRET` | 문자 발송 |
| `SOLAPI_SENDER` | 문자 발송 발신번호 |
| `NEXT_PUBLIC_SUPABASE_URL` | 고객 저장 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 고객 저장 |
| `SUPABASE_SERVICE_ROLE_KEY` | 공개 셀프견적 세션 저장/복원 |

## 배포 전 확인

1. `JUSO_CONFM_KEY`가 운영 키인지 확인
2. `/api/juso-search?keyword=테헤란로` 응답 확인
3. `self_estimate_sessions` 마이그레이션 적용 여부 확인
4. 문자 발송 성공/실패 응답 확인
5. 문자 링크 재진입 시 연락처/주소 자동 복원 확인
6. `/zapgoself` 유입이 관리자 고객 목록에서 `ref_code`로 구분되는지 확인
7. 개인정보처리방침의 실제 수집 항목과 화면 문구 일치 여부 확인

## 실제 연결값

- 카카오채널: `http://pf.kakao.com/_PjwDxj/chat`
- 대표전화: `1600-9195`
- 시공사례 영상: `https://www.youtube.com/watch?v=_tq8gXHrhe4`
