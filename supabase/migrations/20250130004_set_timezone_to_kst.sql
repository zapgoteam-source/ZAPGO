-- 데이터베이스 타임존을 한국 시간(KST, Asia/Seoul)으로 설정
-- 이렇게 하면 NOW(), CURRENT_TIMESTAMP 등이 한국 시간을 반환합니다

-- 세션 타임존 설정 (현재 연결에만 적용)
SET timezone = 'Asia/Seoul';

-- 데이터베이스 기본 타임존 설정 (모든 연결에 적용)
ALTER DATABASE postgres SET timezone TO 'Asia/Seoul';

-- 변경사항 확인
SHOW timezone;

-- 참고: 이미 저장된 timestamp 값들은 UTC로 저장되어 있으며,
-- 타임존 설정은 표시/입력 시에만 영향을 줍니다.
-- timestamptz 타입은 자동으로 설정된 타임존으로 변환되어 표시됩니다.

