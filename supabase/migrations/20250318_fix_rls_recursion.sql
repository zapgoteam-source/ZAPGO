-- =============================================
-- RLS 무한 재귀 수정
--
-- users 테이블 RLS 정책에서 users 테이블을 서브쿼리로
-- 조회하면 무한 재귀가 발생하므로, SECURITY DEFINER
-- 헬퍼 함수를 사용하여 RLS를 우회합니다.
-- =============================================

-- 헬퍼 함수: RLS 우회하여 현재 사용자의 역할 조회
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

-- 헬퍼 함수: RLS 우회하여 현재 사용자의 tenant_id 조회
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$;

-- 헬퍼 함수: 현재 사용자가 활성 상태인지 확인
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_active FROM public.users WHERE id = auth.uid()), false);
$$;

-- 기존 재귀 정책 삭제
DROP POLICY IF EXISTS "users_select_hq_admin" ON users;
DROP POLICY IF EXISTS "users_select_same_tenant" ON users;
DROP POLICY IF EXISTS "users_update_hq_admin" ON users;
DROP POLICY IF EXISTS "users_delete_hq_admin" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;

-- 재생성: 헬퍼 함수 사용 (재귀 없음)
CREATE POLICY "users_select_hq_admin"
  ON users FOR SELECT
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

CREATE POLICY "users_select_same_tenant"
  ON users FOR SELECT
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.is_active_user()
  );

CREATE POLICY "users_update_hq_admin"
  ON users FOR UPDATE
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

CREATE POLICY "users_update_self"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role::text = public.get_my_role()
    AND tenant_id = public.get_my_tenant_id()
    AND is_active = public.is_active_user()
  );

CREATE POLICY "users_delete_hq_admin"
  ON users FOR DELETE
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

-- tenants 테이블도 같은 문제 수정
DROP POLICY IF EXISTS "tenants_select_hq_admin" ON tenants;
DROP POLICY IF EXISTS "tenants_select_own" ON tenants;
DROP POLICY IF EXISTS "tenants_insert_hq_admin" ON tenants;
DROP POLICY IF EXISTS "tenants_update_hq_admin" ON tenants;
DROP POLICY IF EXISTS "tenants_delete_hq_admin" ON tenants;

CREATE POLICY "tenants_select_hq_admin"
  ON tenants FOR SELECT
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

CREATE POLICY "tenants_select_own"
  ON tenants FOR SELECT
  USING (id = public.get_my_tenant_id());

CREATE POLICY "tenants_insert_hq_admin"
  ON tenants FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

CREATE POLICY "tenants_update_hq_admin"
  ON tenants FOR UPDATE
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

CREATE POLICY "tenants_delete_hq_admin"
  ON tenants FOR DELETE
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

-- subscriptions 테이블도 같은 문제 수정
DROP POLICY IF EXISTS "subscriptions_select_hq_admin" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_own_tenant" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_hq_admin" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_hq_admin" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_hq_admin" ON subscriptions;

CREATE POLICY "subscriptions_select_hq_admin"
  ON subscriptions FOR SELECT
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

CREATE POLICY "subscriptions_select_own_tenant"
  ON subscriptions FOR SELECT
  USING (
    tenant_id = public.get_my_tenant_id()
    AND public.is_active_user()
  );

CREATE POLICY "subscriptions_insert_hq_admin"
  ON subscriptions FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

CREATE POLICY "subscriptions_update_hq_admin"
  ON subscriptions FOR UPDATE
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

CREATE POLICY "subscriptions_delete_hq_admin"
  ON subscriptions FOR DELETE
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

-- subscription_history 테이블도 수정
DROP POLICY IF EXISTS "sub_history_select_hq_admin" ON subscription_history;
DROP POLICY IF EXISTS "sub_history_insert_hq_admin" ON subscription_history;

CREATE POLICY "sub_history_select_hq_admin"
  ON subscription_history FOR SELECT
  USING (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );

CREATE POLICY "sub_history_insert_hq_admin"
  ON subscription_history FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'HQ_ADMIN'
    AND public.is_active_user()
  );
