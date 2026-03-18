-- =============================================
-- RLS 정책 추가: users, tenants, subscriptions
--
-- 기존에 RLS 정책이 누락되어 인증된 모든 사용자가
-- 타 테넌트 데이터에 접근 가능한 보안 취약점 수정
-- =============================================

-- =============================================
-- 1. users 테이블 RLS
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 본사 관리자는 모든 사용자 조회 가능
CREATE POLICY "users_select_hq_admin"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'HQ_ADMIN'
      AND u.is_active = true
    )
  );

-- 같은 테넌트 소속 사용자 조회 가능
CREATE POLICY "users_select_same_tenant"
  ON users FOR SELECT
  USING (
    tenant_id IN (
      SELECT u.tenant_id FROM users AS u
      WHERE u.id = auth.uid()
      AND u.is_active = true
    )
  );

-- 자기 자신의 프로필은 항상 조회 가능 (비활성 사용자 포함)
CREATE POLICY "users_select_self"
  ON users FOR SELECT
  USING (id = auth.uid());

-- 본사 관리자만 사용자 정보 수정 가능
CREATE POLICY "users_update_hq_admin"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'HQ_ADMIN'
      AND u.is_active = true
    )
  );

-- 자기 자신의 기본 정보(이름, 전화, 부서, 직위)만 수정 가능
-- role, tenant_id, is_active 등은 본사 관리자만 변경 가능
CREATE POLICY "users_update_self"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT u.role FROM users AS u WHERE u.id = auth.uid())
    AND tenant_id = (SELECT u.tenant_id FROM users AS u WHERE u.id = auth.uid())
    AND is_active = (SELECT u.is_active FROM users AS u WHERE u.id = auth.uid())
  );

-- 사용자 프로필 생성은 서비스 역할(트리거)에서만 허용
-- 클라이언트에서 직접 INSERT 방지
CREATE POLICY "users_insert_via_trigger_only"
  ON users FOR INSERT
  WITH CHECK (
    -- auth.uid()와 삽입하려는 id가 일치해야 함 (자기 자신의 프로필만)
    -- 그리고 role은 반드시 UNASSIGNED, is_active는 false여야 함
    id = auth.uid()
    AND role = 'UNASSIGNED'
    AND is_active = false
  );

-- 사용자 삭제는 본사 관리자만 가능
CREATE POLICY "users_delete_hq_admin"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'HQ_ADMIN'
      AND u.is_active = true
    )
  );

-- =============================================
-- 2. tenants 테이블 RLS
-- =============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 본사 관리자는 모든 테넌트 조회 가능
CREATE POLICY "tenants_select_hq_admin"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

-- 자기 소속 테넌트 정보 조회 가능
CREATE POLICY "tenants_select_own"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- 본사 관리자만 테넌트 생성/수정/삭제 가능
CREATE POLICY "tenants_insert_hq_admin"
  ON tenants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

CREATE POLICY "tenants_update_hq_admin"
  ON tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

CREATE POLICY "tenants_delete_hq_admin"
  ON tenants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

-- =============================================
-- 3. subscriptions 테이블 RLS
-- =============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 본사 관리자는 모든 구독 조회 가능
CREATE POLICY "subscriptions_select_hq_admin"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

-- 자기 테넌트의 구독 정보 조회 가능
CREATE POLICY "subscriptions_select_own_tenant"
  ON subscriptions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

-- 본사 관리자만 구독 생성/수정/삭제 가능
CREATE POLICY "subscriptions_insert_hq_admin"
  ON subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

CREATE POLICY "subscriptions_update_hq_admin"
  ON subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

CREATE POLICY "subscriptions_delete_hq_admin"
  ON subscriptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

-- =============================================
-- 4. subscription_history 테이블 RLS
-- =============================================
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_history_select_hq_admin"
  ON subscription_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );

CREATE POLICY "sub_history_insert_hq_admin"
  ON subscription_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'HQ_ADMIN'
      AND users.is_active = true
    )
  );
