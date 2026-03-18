-- =============================================
-- 회원가입 시 public.users 프로필 자동 생성 트리거
--
-- auth.users에 새 사용자가 생성되면 자동으로
-- public.users 테이블에 기본 프로필을 생성합니다.
-- 이를 통해 클라이언트 측 프로필 생성을 제거하고
-- 보안을 강화합니다.
-- =============================================

-- 트리거 함수: 새 사용자 생성 시 public.users에 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- 서비스 역할 권한으로 실행 (RLS 우회)
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    role,
    tenant_id,
    name,
    email,
    phone,
    is_active,
    created_by,
    updated_by,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'UNASSIGNED'::user_role),
    COALESCE(
      (NEW.raw_user_meta_data->>'tenant_id')::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid  -- UNASSIGNED_TENANT
    ),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    '',
    false,  -- 항상 비활성 상태로 생성 (관리자 승인 필요)
    NEW.id,
    NEW.id,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- 이미 프로필이 존재하는 경우 무시
    RETURN NEW;
END;
$$;

-- 기존 트리거가 있으면 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- auth.users INSERT 후 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 함수 권한 설정
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
