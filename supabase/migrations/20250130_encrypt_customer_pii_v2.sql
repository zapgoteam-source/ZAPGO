-- 고객 개인정보(PII) 암호화 마이그레이션 v2
-- pgsodium 확장을 사용하여 이름, 전화번호, 주소를 암호화합니다.

-- 1. pgsodium 확장 활성화
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- 2. 암호화 키를 저장할 private 테이블 생성
CREATE TABLE IF NOT EXISTS private.encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  key bytea NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS 활성화 (보안을 위해 아무도 직접 접근 불가)
ALTER TABLE private.encryption_keys ENABLE ROW LEVEL SECURITY;

-- 4. 암호화 키 생성 및 저장
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM private.encryption_keys WHERE name = 'customer_pii_key') THEN
    INSERT INTO private.encryption_keys (name, key)
    VALUES ('customer_pii_key', pgsodium.crypto_secretbox_keygen());
  END IF;
END $$;

-- 5. 암호화 키를 가져오는 함수
CREATE OR REPLACE FUNCTION get_customer_pii_key()
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key bytea;
BEGIN
  SELECT key INTO encryption_key FROM private.encryption_keys WHERE name = 'customer_pii_key';
  RETURN encryption_key;
END;
$$;

-- 6. customers 테이블에 암호화된 컬럼 추가
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS name_encrypted bytea,
  ADD COLUMN IF NOT EXISTS phone_encrypted bytea,
  ADD COLUMN IF NOT EXISTS address_encrypted bytea;

-- 7. 복호화 함수들 생성
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
    RETURN NULL;
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
    RETURN NULL;
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
    RETURN NULL;
END;
$$;

-- 8. 암호화 함수들 생성
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

-- 9. 기존 데이터를 암호화하여 새 컬럼으로 마이그레이션
UPDATE customers
SET 
  name_encrypted = encrypt_customer_name(name),
  phone_encrypted = encrypt_customer_phone(phone),
  address_encrypted = encrypt_customer_address(address)
WHERE name_encrypted IS NULL OR phone_encrypted IS NULL OR address_encrypted IS NULL;

-- 10. 자동 암호화를 위한 뷰 생성
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

-- 11. INSERT 트리거 함수
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
  )
  RETURNING id INTO NEW.id;
  RETURN NEW;
END;
$$;

-- 12. UPDATE 트리거 함수
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

-- 13. DELETE 트리거 함수
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

-- 15. 뷰에 security_invoker 설정하여 RLS 적용
ALTER VIEW customers_decrypted SET (security_invoker = on);

-- 16. 주석 추가
COMMENT ON VIEW customers_decrypted IS '고객 정보를 복호화하여 보여주는 뷰. 애플리케이션에서는 customers 테이블 대신 이 뷰를 사용해야 합니다.';
COMMENT ON COLUMN customers.name_encrypted IS '암호화된 고객 이름 (pgsodium)';
COMMENT ON COLUMN customers.phone_encrypted IS '암호화된 전화번호 (pgsodium)';
COMMENT ON COLUMN customers.address_encrypted IS '암호화된 주소 (pgsodium)';

