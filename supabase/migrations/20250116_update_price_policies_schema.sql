-- 가격 정책 테이블 스키마 업데이트
-- 기존 컬럼명을 새로운 구조로 변경

-- 1. 새로운 컬럼 추가
ALTER TABLE price_policies 
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS work_category TEXT,
ADD COLUMN IF NOT EXISTS supply_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2);

-- 2. 기존 데이터 마이그레이션 (있는 경우)
-- item_type -> item_name
UPDATE price_policies 
SET item_name = item_type 
WHERE item_name IS NULL AND item_type IS NOT NULL;

-- work_type -> work_category
UPDATE price_policies 
SET work_category = work_type 
WHERE work_category IS NULL AND work_type IS NOT NULL;

-- unit_price -> supply_price (총금액과 동일하게 설정)
UPDATE price_policies 
SET supply_price = unit_price,
    total_amount = unit_price 
WHERE supply_price IS NULL AND unit_price IS NOT NULL;

-- 3. 기존 컬럼 삭제
ALTER TABLE price_policies 
DROP COLUMN IF EXISTS item_type,
DROP COLUMN IF EXISTS work_type,
DROP COLUMN IF EXISTS unit_price,
DROP COLUMN IF EXISTS effective_from,
DROP COLUMN IF EXISTS effective_to;

-- 4. NOT NULL 제약 조건 추가
ALTER TABLE price_policies 
ALTER COLUMN item_name SET NOT NULL,
ALTER COLUMN supply_price SET NOT NULL,
ALTER COLUMN total_amount SET NOT NULL;

-- 5. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_price_policies_item_name ON price_policies(item_name);
CREATE INDEX IF NOT EXISTS idx_price_policies_is_active ON price_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_price_policies_tenant_id ON price_policies(tenant_id);

-- 6. 코멘트 추가
COMMENT ON COLUMN price_policies.item_name IS '항목명 (예: 출장비, 인건비, 1인작업창 등)';
COMMENT ON COLUMN price_policies.work_category IS '작업 구분 (예: 탈거·사면시공, 선택사항)';
COMMENT ON COLUMN price_policies.supply_price IS '공급가액';
COMMENT ON COLUMN price_policies.total_amount IS '총금액 (VAT 포함)';

