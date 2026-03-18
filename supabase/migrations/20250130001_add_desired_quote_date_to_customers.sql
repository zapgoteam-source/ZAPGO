-- 고객 테이블에 견적희망일자 컬럼 추가
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS desired_quote_date DATE;

COMMENT ON COLUMN customers.desired_quote_date IS '고객이 견적을 희망하는 날짜';

