/**
 * 고객 관리 테이블 생성
 * 
 * 생성일: 2025-01-18
 * 설명: 고객 정보를 관리하는 테이블을 생성하고 RLS 정책을 설정합니다.
 */

-- 1. customers 테이블 생성
CREATE TABLE IF NOT EXISTS customers (
  -- 기본 정보
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- 고객 정보
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  
  -- 상태 정보
  status TEXT NOT NULL DEFAULT 'potential' CHECK (status IN ('active', 'inactive', 'potential')),
  
  -- 통계 정보
  quotation_count INTEGER NOT NULL DEFAULT 0,
  total_amount BIGINT NOT NULL DEFAULT 0,
  last_contact TIMESTAMPTZ,
  
  -- 메타데이터
  notes TEXT, -- 고객 메모
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- 3. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- 4. RLS (Row Level Security) 활성화
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성

-- 정책 1: 본사 관리자는 모든 고객 조회 가능
CREATE POLICY "본사 관리자는 모든 고객 조회 가능"
  ON customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

-- 정책 2: 대리점/직영점은 자신의 고객만 조회 가능
CREATE POLICY "대리점/직영점은 자신의 고객만 조회 가능"
  ON customers
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  );

-- 정책 3: 본사 관리자는 모든 고객 생성 가능
CREATE POLICY "본사 관리자는 모든 고객 생성 가능"
  ON customers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

-- 정책 4: 대리점/직영점은 자신의 테넌트에 고객 생성 가능
CREATE POLICY "대리점/직영점은 자신의 테넌트에 고객 생성 가능"
  ON customers
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      AND is_active = true
      AND role IN ('DEALER_ADMIN', 'DEALER_STAFF', 'OWNED_BRANCH_ADMIN', 'OWNED_BRANCH_STAFF')
    )
  );

-- 정책 5: 본사 관리자는 모든 고객 수정 가능
CREATE POLICY "본사 관리자는 모든 고객 수정 가능"
  ON customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

-- 정책 6: 대리점/직영점은 자신의 고객만 수정 가능
CREATE POLICY "대리점/직영점은 자신의 고객만 수정 가능"
  ON customers
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  );

-- 정책 7: 본사 관리자와 관리자 권한자만 고객 삭제 가능
CREATE POLICY "본사 관리자와 관리자 권한자만 고객 삭제 가능"
  ON customers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('HQ_ADMIN', 'DEALER_ADMIN', 'OWNED_BRANCH_ADMIN')
      AND users.is_active = true
      AND (
        users.role = 'HQ_ADMIN' 
        OR customers.tenant_id = users.tenant_id
      )
    )
  );

-- 6. 테스트 데이터 삽입 (선택적)
-- 실제 tenant_id는 tenants 테이블에서 확인 필요
INSERT INTO customers (name, email, phone, company, address, status, quotation_count, total_amount, last_contact, tenant_id)
SELECT 
  '김철수',
  'kim@example.com',
  '010-1234-5678',
  '(주)테스트컴퍼니',
  '서울시 강남구',
  'active',
  5,
  15000000,
  NOW() - INTERVAL '5 days',
  t.id
FROM tenants t
WHERE t.type = 'DEALER'
LIMIT 1;

INSERT INTO customers (name, email, phone, company, address, status, quotation_count, total_amount, last_contact, tenant_id)
SELECT 
  '이영희',
  'lee@company.co.kr',
  '010-9876-5432',
  '영희건설',
  '부산시 해운대구',
  'potential',
  2,
  8500000,
  NOW() - INTERVAL '10 days',
  t.id
FROM tenants t
WHERE t.type = 'DEALER'
OFFSET 1
LIMIT 1;

INSERT INTO customers (name, email, phone, company, address, status, quotation_count, total_amount, last_contact, tenant_id)
SELECT 
  '박민수',
  'park@business.com',
  '010-5555-6666',
  '민수산업',
  '대구시 중구',
  'active',
  8,
  25000000,
  NOW() - INTERVAL '2 days',
  t.id
FROM tenants t
WHERE t.type = 'DEALER'
LIMIT 1;

-- 7. 코멘트 추가
COMMENT ON TABLE customers IS '고객 정보 테이블 - 각 대리점/지점의 고객을 관리';
COMMENT ON COLUMN customers.id IS '고객 고유 ID';
COMMENT ON COLUMN customers.tenant_id IS '고객이 속한 대리점/지점 ID';
COMMENT ON COLUMN customers.name IS '고객 이름';
COMMENT ON COLUMN customers.email IS '고객 이메일';
COMMENT ON COLUMN customers.phone IS '고객 전화번호';
COMMENT ON COLUMN customers.company IS '고객 회사명';
COMMENT ON COLUMN customers.address IS '고객 주소';
COMMENT ON COLUMN customers.status IS '고객 상태 (active: 활성, inactive: 비활성, potential: 잠재)';
COMMENT ON COLUMN customers.quotation_count IS '생성된 견적서 수';
COMMENT ON COLUMN customers.total_amount IS '총 견적 금액';
COMMENT ON COLUMN customers.last_contact IS '마지막 연락일';
COMMENT ON COLUMN customers.notes IS '고객 메모';
COMMENT ON COLUMN customers.created_at IS '생성일시';
COMMENT ON COLUMN customers.updated_at IS '수정일시';



