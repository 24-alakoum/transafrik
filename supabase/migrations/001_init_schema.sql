-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 001 — Schéma initial TransAfrik
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── COMPANIES (tenant principal) ─────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  slug            TEXT UNIQUE,
  address         TEXT,
  city            TEXT,
  country         TEXT DEFAULT 'ML' CHECK (country IN ('ML','SN','CI','BF','NE','GN','TG','BJ','CM','GA')),
  phone           TEXT,
  email           TEXT,
  logo_url        TEXT,
  rccm            TEXT,
  nif             TEXT,
  currency        TEXT DEFAULT 'FCFA',
  invoice_prefix  TEXT DEFAULT 'BL',
  invoice_counter INTEGER DEFAULT 1,
  invoice_footer  TEXT,
  plan            TEXT DEFAULT 'trial' CHECK (plan IN ('trial','starter','pro','enterprise')),
  plan_expires_at TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  rgpd_accepted_at      TIMESTAMPTZ,
  rgpd_accepted_version TEXT,
  data_retention_days   INTEGER DEFAULT 2555,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── USERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email           TEXT NOT NULL,
  phone           TEXT,
  role            TEXT NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('owner','admin','dispatcher','accountant','viewer')),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  data_export_requested_at TIMESTAMPTZ,
  deletion_requested_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── TRUCKS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trucks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plate               TEXT NOT NULL CHECK (plate ~ '^[A-Z0-9\-]{3,15}$'),
  brand               TEXT,
  model               TEXT,
  year                SMALLINT CHECK (year BETWEEN 1980 AND 2030),
  type                TEXT CHECK (type IN ('camion','camionnette','remorque','tracteur','pickup')),
  capacity_kg         NUMERIC(10,2) DEFAULT 0 CHECK (capacity_kg >= 0),
  mileage             INTEGER DEFAULT 0 CHECK (mileage >= 0),
  fuel_type           TEXT DEFAULT 'diesel' CHECK (fuel_type IN ('diesel','essence','hybride','electrique')),
  chassis_number      TEXT,
  insurance_number    TEXT,
  insurance_expiry    DATE,
  tech_visit_expiry   DATE,
  status              TEXT DEFAULT 'available'
                        CHECK (status IN ('available','in_transit','loading','maintenance','inactive')),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, plate)
);

-- ── DRIVERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  phone               TEXT NOT NULL,
  email               TEXT,
  address             TEXT,
  city                TEXT,
  country             TEXT,
  license_number      TEXT,
  license_categories  TEXT[],
  license_expiry      DATE,
  birth_date          DATE,
  national_id         TEXT,
  monthly_salary      NUMERIC(12,2) DEFAULT 0,
  emergency_contact   TEXT,
  status              TEXT DEFAULT 'available'
                        CHECK (status IN ('available','on_trip','leave','inactive')),
  truck_id            UUID REFERENCES trucks(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ── CLIENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 150),
  contact_person  TEXT,
  email           TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  country         TEXT,
  sector          TEXT,
  payment_terms_days INTEGER DEFAULT 30 CHECK (payment_terms_days IN (7,15,30,45,60,90)),
  credit_limit_fcfa  NUMERIC(15,2),
  is_active       BOOLEAN DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── TRIPS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reference       TEXT NOT NULL,
  client_id       UUID REFERENCES clients(id),
  truck_id        UUID REFERENCES trucks(id),
  driver_id       UUID REFERENCES drivers(id),
  created_by      UUID REFERENCES users(id),
  origin          TEXT NOT NULL CHECK (char_length(origin) >= 2),
  destination     TEXT NOT NULL CHECK (char_length(destination) >= 2),
  cargo_type      TEXT,
  cargo_weight_kg NUMERIC(10,2) CHECK (cargo_weight_kg >= 0),
  cargo_desc      TEXT,
  departure_date  DATE,
  arrival_date    DATE,
  actual_arrival  DATE,
  revenue_fcfa    NUMERIC(15,2) DEFAULT 0 CHECK (revenue_fcfa >= 0),
  status          TEXT DEFAULT 'draft'
                    CHECK (status IN ('draft','loading','in_transit','delivered','cancelled','disputed')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, reference)
);

-- ── TRIP LINES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10,3) DEFAULT 1 CHECK (quantity > 0),
  unit            TEXT DEFAULT 'unité',
  unit_price_fcfa NUMERIC(15,2) DEFAULT 0 CHECK (unit_price_fcfa >= 0),
  total_fcfa      NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price_fcfa) STORED,
  sort_order      SMALLINT DEFAULT 0
);

-- ── EXPENSES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trip_id         UUID REFERENCES trips(id),
  truck_id        UUID REFERENCES trucks(id),
  created_by      UUID REFERENCES users(id),
  category        TEXT CHECK (category IN ('carburant','maintenance','peage','salaire','assurance','amende','parking','autre')),
  amount_fcfa     NUMERIC(15,2) NOT NULL CHECK (amount_fcfa > 0),
  date            DATE NOT NULL,
  description     TEXT,
  receipt_url     TEXT,
  receipt_size    INTEGER,
  is_reimbursed   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── DELIVERY NOTES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trip_id         UUID REFERENCES trips(id),
  created_by      UUID REFERENCES users(id),
  reference       TEXT NOT NULL,
  issued_date     DATE NOT NULL,
  due_date        DATE,
  paid_date       DATE,
  subtotal_fcfa   NUMERIC(15,2) DEFAULT 0,
  tax_rate        NUMERIC(5,2) DEFAULT 0 CHECK (tax_rate BETWEEN 0 AND 100),
  tax_amount_fcfa NUMERIC(15,2) GENERATED ALWAYS AS (subtotal_fcfa * tax_rate / 100) STORED,
  total_fcfa      NUMERIC(15,2) DEFAULT 0,
  status          TEXT DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','viewed','paid','late','cancelled','disputed')),
  payment_method  TEXT CHECK (payment_method IN ('mobile_money','virement','especes','cheque','autre')),
  payment_ref     TEXT,
  payment_terms   TEXT,
  notes           TEXT,
  pdf_url         TEXT,
  pdf_generated_at TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, reference)
);

-- ── PAYMENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  delivery_note_id UUID REFERENCES delivery_notes(id),
  amount_fcfa     NUMERIC(15,2) NOT NULL CHECK (amount_fcfa > 0),
  date            DATE NOT NULL,
  method          TEXT CHECK (method IN ('mobile_money','virement','especes','cheque','autre')),
  reference       TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── SUBSCRIPTIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT UNIQUE,
  stripe_sub_id       TEXT UNIQUE,
  plan                TEXT CHECK (plan IN ('starter','pro','enterprise')),
  status              TEXT CHECK (status IN ('active','past_due','cancelled','trialing')),
  current_period_end  TIMESTAMPTZ,
  cancel_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ── NOTIFICATIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id),
  user_id     UUID REFERENCES users(id),
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── TRIGGERS : updated_at automatique ───────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON trucks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON delivery_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
