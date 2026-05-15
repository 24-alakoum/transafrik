-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 003 — Audit Logs + RGPD tables
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── AUDIT LOGS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id),
  user_id         UUID REFERENCES users(id),
  action          TEXT NOT NULL,
  resource        TEXT NOT NULL,
  resource_id     UUID,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS Audit logs (lecture admin uniquement, jamais de modification)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    company_id = auth_company_id()
    AND auth_user_role() IN ('owner','admin')
  );

-- Pas de politique UPDATE/DELETE — les logs sont immuables

-- ── RGPD — CONSENT RECORDS ───────────────────────────
CREATE TABLE IF NOT EXISTS consent_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  type            TEXT NOT NULL,
  version         TEXT NOT NULL,
  accepted        BOOLEAN NOT NULL,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_own_user" ON consent_records
  FOR ALL USING (user_id = auth.uid());

-- ── RGPD — DATA REQUESTS ─────────────────────────────
CREATE TABLE IF NOT EXISTS data_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  company_id      UUID REFERENCES companies(id),
  type            TEXT CHECK (type IN ('export','deletion','rectification','portability')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  notes           TEXT,
  processed_by    UUID REFERENCES users(id),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "data_requests_own_user" ON data_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "data_requests_insert" ON data_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "data_requests_admin" ON data_requests
  FOR UPDATE USING (
    company_id = auth_company_id()
    AND auth_user_role() IN ('owner','admin')
  );
