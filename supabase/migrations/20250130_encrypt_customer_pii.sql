-- 고객 개인정보(PII) 암호화 마이그레이션
-- pgsodium 확장을 사용하여 이름, 전화번호, 주소를 암호화합니다.

-- 1. pgsodium 확장 활성화 (이미 활성화되어 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- 2. 암호화 키를 저장할 테이블 생성
CREATE TABLE IF NOT EXISTS vault.secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  secret text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS 활성화 (보안을 위해 아무도 직접 접근 불가)
ALTER TABLE vault.secrets ENABLE ROW LEVEL SECURITY;

-- 4. 암호화 키 생성 및 저장 (이미 존재하지 않는 경우에만)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'customer_pii_key') THEN
    INSERT INTO vault.secrets (name, secret)
    VALUES ('customer_pii_key', encode(pgsodium.crypto_secretbox_keygen(), 'hex'));
  END IF;
END $$;

-- 5. 암호화 키를 가져오는 함수
CREATE OR REPLACE FUNCTION get_customer_pii_key()
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_hex text;
BEGIN
  SELECT secret INTO key_hex FROM vault.secrets WHERE name = 'customer_pii_key';
  RETURN decode(key_hex, 'hex');
END;
$$;

-- 6. customers 테이블에 암호화된 컬럼 추가
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS name_encrypted bytea,
  ADD COLUMN IF NOT EXISTS phone_encrypted bytea,
  ADD COLUMN IF NOT EXISTS address_encrypted bytea;

-- 7. 기존 데이터를 암호화하여 새 컬럼으로 마이그레이션
UPDATE customers
SET 
  name_encrypted = CASE 
    WHEN name IS NOT NULL AND name != '' 
    THEN pgsodium.crypto_secretbox_noncegen(name::bytea, get_customer_pii_key())
    ELSE NULL 
  END,
  phone_encrypted = CASE 
    WHEN phone IS NOT NULL AND phone != '' 
    THEN pgsodium.crypto_secretbox_noncegen(phone::bytea, get_customer_pii_key())
    ELSE NULL 
  END,
  address_encrypted = CASE 
    WHEN address IS NOT NULL AND address != '' 
    THEN pgsodium.crypto_secretbox_noncegen(address::bytea, get_customer_pii_key())
    ELSE NULL 
  END
WHERE name_encrypted IS NULL OR phone_encrypted IS NULL OR address_encrypted IS NULL;

-- 8. 복호화 함수들 생성
CREATE OR REPLACE FUNCTION decrypt_customer_name(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN convert_from(
    pgsodium.crypto_secretbox_open(encrypted_data, get_customer_pii_key()),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[복호화 오류]';
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_customer_phone(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN convert_from(
    pgsodium.crypto_secretbox_open(encrypted_data, get_customer_pii_key()),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[복호화 오류]';
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_customer_address(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN convert_from(
    pgsodium.crypto_secretbox_open(encrypted_data, get_customer_pii_key()),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[복호화 오류]';
END;
$$;

-- 9. 암호화 함수들 생성
CREATE OR REPLACE FUNCTION encrypt_customer_name(plain_text text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgsodium.crypto_secretbox_noncegen(plain_text::bytea, get_customer_pii_key());
END;
$$;

CREATE OR REPLACE FUNCTION encrypt_customer_phone(plain_text text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgsodium.crypto_secretbox_noncegen(plain_text::bytea, get_customer_pii_key());
END;
$$;

CREATE OR REPLACE FUNCTION encrypt_customer_address(plain_text text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgsodium.crypto_secretbox_noncegen(plain_text::bytea, get_customer_pii_key());
END;
$$;

-- 10. 자동 암호화를 위한 뷰 생성 (애플리케이션에서는 이 뷰를 사용)
CREATE OR REPLACE VIEW customers_decrypted AS
SELECT 
  id,
  decrypt_customer_name(name_encrypted) as name,
  decrypt_customer_phone(phone_encrypted) as phone,
  decrypt_customer_address(address_encrypted) as address,
  status,
  issues,
  notes,
  desired_quote_date,
  created_at,
  updated_at,
  tenant_id,
  created_by,
  updated_by
FROM customers;

-- 11. 뷰를 통한 INSERT를 처리하는 트리거 함수
CREATE OR REPLACE FUNCTION customers_decrypted_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO customers (
    name_encrypted,
    phone_encrypted,
    address_encrypted,
    status,
    issues,
    notes,
    desired_quote_date,
    tenant_id,
    created_by
  ) VALUES (
    encrypt_customer_name(NEW.name),
    encrypt_customer_phone(NEW.phone),
    encrypt_customer_address(NEW.address),
    NEW.status,
    NEW.issues,
    NEW.notes,
    NEW.desired_quote_date,
    NEW.tenant_id,
    NEW.created_by
  );
  RETURN NEW;
END;
$$;

-- 12. 뷰를 통한 UPDATE를 처리하는 트리거 함수
CREATE OR REPLACE FUNCTION customers_decrypted_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers
  SET
    name_encrypted = encrypt_customer_name(NEW.name),
    phone_encrypted = encrypt_customer_phone(NEW.phone),
    address_encrypted = encrypt_customer_address(NEW.address),
    status = NEW.status,
    issues = NEW.issues,
    notes = NEW.notes,
    desired_quote_date = NEW.desired_quote_date,
    updated_at = NEW.updated_at,
    updated_by = NEW.updated_by
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

-- 13. 뷰를 통한 DELETE를 처리하는 트리거 함수
CREATE OR REPLACE FUNCTION customers_decrypted_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM customers WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- 14. 뷰에 INSTEAD OF 트리거 추가
DROP TRIGGER IF EXISTS customers_decrypted_insert_trigger ON customers_decrypted;
CREATE TRIGGER customers_decrypted_insert_trigger
  INSTEAD OF INSERT ON customers_decrypted
  FOR EACH ROW
  EXECUTE FUNCTION customers_decrypted_insert();

DROP TRIGGER IF EXISTS customers_decrypted_update_trigger ON customers_decrypted;
CREATE TRIGGER customers_decrypted_update_trigger
  INSTEAD OF UPDATE ON customers_decrypted
  FOR EACH ROW
  EXECUTE FUNCTION customers_decrypted_update();

DROP TRIGGER IF EXISTS customers_decrypted_delete_trigger ON customers_decrypted;
CREATE TRIGGER customers_decrypted_delete_trigger
  INSTEAD OF DELETE ON customers_decrypted
  FOR EACH ROW
  EXECUTE FUNCTION customers_decrypted_delete();

-- 15. RLS 정책을 뷰에도 적용
ALTER VIEW customers_decrypted SET (security_invoker = on);

-- 16. 기존 RLS 정책을 뷰에 복사 (수동으로 설정 필요)
-- 참고: 뷰의 RLS는 기본 테이블의 정책을 상속받습니다.

-- 17. 주석 추가
COMMENT ON VIEW customers_decrypted IS '고객 정보를 복호화하여 보여주는 뷰. 애플리케이션에서는 이 뷰를 사용해야 합니다.';
COMMENT ON COLUMN customers.name_encrypted IS '암호화된 고객 이름';
COMMENT ON COLUMN customers.phone_encrypted IS '암호화된 전화번호';
COMMENT ON COLUMN customers.address_encrypted IS '암호화된 주소';

-- 18. 기존 평문 컬럼 백업 후 제거 준비 (주의: 데이터 확인 후 수동으로 실행)
-- ALTER TABLE customers RENAME COLUMN name TO name_backup;
-- ALTER TABLE customers RENAME COLUMN phone TO phone_backup;
-- ALTER TABLE customers RENAME COLUMN address TO address_backup;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '고객 개인정보 암호화가 완료되었습니다.';
  RAISE NOTICE '애플리케이션 코드에서 customers 테이블 대신 customers_decrypted 뷰를 사용하세요.';
END $$;

