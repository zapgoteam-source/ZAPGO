-- =============================================
-- ZAPGO Database Schema
-- Generated for migration to new Supabase project
-- =============================================

-- ENUM Types
CREATE TYPE customer_problem AS ENUM (
  '외풍', '벌레유입', '소음', '먼지', '악취', '방충망노후', '먼지날림'
);

CREATE TYPE customer_status AS ENUM (
  '상담대기', '사진요청', '부재중', '견적요청', '고민중', '상담종료', '시공완료'
);

CREATE TYPE material_category AS ENUM (
  'FLOORING', 'WALL', 'CEILING', 'DOOR', 'FIXTURE',
  'PLUMBING', 'PAINT', 'HARDWARE', 'INSULATION', 'OTHER'
);

CREATE TYPE payment_method AS ENUM (
  '현금', '계좌', '카드', '기타'
);

CREATE TYPE quotation_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED'
);

CREATE TYPE quote_item_type AS ENUM (
  '출장비', '인건비', '1인작업창', '2인작업창', '3인작업창',
  '4인작업창', 'HighLV', '방충가스켓', '방충풍지판상하', '창틀보강'
);

CREATE TYPE quote_status AS ENUM (
  'draft', 'sent', 'approved', 'rejected', 'closed'
);

CREATE TYPE tenant_type AS ENUM (
  'HQ', 'DEALER', 'UNASSINGED', 'OWNED_BRANCH', 'UNASSIGNED'
);

CREATE TYPE user_role AS ENUM (
  'UNASSIGNED', 'HQ_ADMIN', 'DEALER_OWNER', 'DEALER_STAFF',
  'OWNED_BRANCH_ADMIN', 'OWNED_BRANCH_STAFF', 'DEALER_ADMIN'
);

CREATE TYPE work_type AS ENUM (
  '탈거·사면시공', '미탈거·측면시공', '미탈거·창틀시공'
);

-- =============================================
-- Tables (dependency order)
-- =============================================

CREATE TABLE tenants (
  id                uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name              varchar(255)  NOT NULL,
  type              tenant_type   NOT NULL DEFAULT 'DEALER',
  parent_tenant_id  uuid          REFERENCES tenants(id),
  contact_email     varchar(255),
  contact_phone     varchar(50),
  address           text,
  business_number   varchar(50),
  is_active         boolean       NOT NULL DEFAULT true,
  created_at        timestamptz   DEFAULT now(),
  updated_at        timestamptz   DEFAULT now(),
  contract_start    date
);

CREATE TABLE users (
  id          uuid          NOT NULL PRIMARY KEY,
  role        user_role     NOT NULL,
  tenant_id   uuid          NOT NULL REFERENCES tenants(id),
  name        varchar(255)  NOT NULL,
  email       varchar(255)  NOT NULL,
  phone       varchar(50)   DEFAULT '',
  department  varchar(100),
  position    varchar(100),
  is_active   boolean       NOT NULL DEFAULT false,
  created_by  uuid          REFERENCES users(id),
  updated_by  uuid,
  created_at  timestamptz   DEFAULT now(),
  updated_at  timestamptz   DEFAULT now()
);

CREATE TABLE materials (
  id              uuid              NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name            varchar(255)      NOT NULL,
  category        material_category NOT NULL,
  description     text,
  unit            varchar(50)       NOT NULL,
  base_price      numeric           NOT NULL,
  supplier        varchar(255),
  model_number    varchar(100),
  specifications  jsonb,
  is_active       boolean           NOT NULL DEFAULT true,
  created_at      timestamptz       DEFAULT now(),
  updated_at      timestamptz       DEFAULT now(),
  created_by      uuid              REFERENCES users(id)
);

CREATE TABLE customers (
  id                  uuid              NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id           uuid              NOT NULL REFERENCES tenants(id),
  name                varchar(255)      NOT NULL,
  phone               varchar(50),
  notes               text,
  created_at          timestamptz       DEFAULT now(),
  updated_at          timestamptz       DEFAULT now(),
  created_by          uuid              REFERENCES users(id),
  status              customer_status   NOT NULL DEFAULT '상담대기',
  updated_by          uuid,
  issues              customer_problem[],
  address             text,
  desired_quote_date  date
);

CREATE TABLE quotations (
  id                uuid              NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         uuid              NOT NULL REFERENCES tenants(id),
  customer_id       uuid              NOT NULL REFERENCES customers(id),
  quotation_number  varchar(50)       NOT NULL,
  title             varchar(255)      NOT NULL,
  description       text,
  status            quotation_status  NOT NULL DEFAULT 'DRAFT',
  total_amount      numeric           NOT NULL DEFAULT 0,
  discount_rate     numeric           DEFAULT 0,
  discount_amount   numeric           DEFAULT 0,
  final_amount      numeric           NOT NULL DEFAULT 0,
  valid_until       date,
  notes             text,
  is_active         boolean           NOT NULL DEFAULT true,
  created_at        timestamptz       DEFAULT now(),
  updated_at        timestamptz       DEFAULT now(),
  created_by        uuid              REFERENCES users(id)
);

CREATE TABLE quotation_items (
  id            uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id  uuid          NOT NULL REFERENCES quotations(id),
  material_id   uuid          REFERENCES materials(id),
  item_name     varchar(255)  NOT NULL,
  description   text,
  quantity      numeric       NOT NULL,
  unit          varchar(50)   NOT NULL,
  unit_price    numeric       NOT NULL,
  total_price   numeric       NOT NULL DEFAULT 0,
  sort_order    integer       DEFAULT 0,
  created_at    timestamptz   DEFAULT now(),
  updated_at    timestamptz   DEFAULT now()
);

CREATE TABLE subscriptions (
  id                      uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id               uuid          NOT NULL REFERENCES tenants(id),
  subscription_start_date timestamptz   NOT NULL DEFAULT now(),
  subscription_end_date   timestamptz,
  is_active               boolean       DEFAULT true,
  plan_type               varchar(50)   DEFAULT 'standard',
  max_users               integer,
  notes                   text,
  created_at              timestamptz   DEFAULT now(),
  updated_at              timestamptz   DEFAULT now(),
  created_by              uuid,
  updated_by              uuid
);

CREATE TABLE subscription_history (
  id                  uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id     uuid          NOT NULL REFERENCES subscriptions(id),
  tenant_id           uuid          NOT NULL REFERENCES tenants(id),
  action              varchar(50)   NOT NULL,
  previous_end_date   timestamptz,
  new_end_date        timestamptz,
  changed_by          uuid,
  changed_by_name     varchar(255),
  change_reason       text,
  created_at          timestamptz   DEFAULT now()
);

CREATE TABLE price_policies (
  id            uuid      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     uuid      REFERENCES tenants(id),
  is_active     boolean   NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  item_name     text      NOT NULL,
  work_category text,
  supply_price  numeric   NOT NULL,
  total_amount  numeric   NOT NULL
);

-- =============================================
-- Indexes (from original migration files)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_price_policies_item_name ON price_policies(item_name);
CREATE INDEX IF NOT EXISTS idx_price_policies_is_active ON price_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_price_policies_tenant_id ON price_policies(tenant_id);
