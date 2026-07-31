CREATE TABLE IF NOT EXISTS notification_preferences (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  maintenance_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reports_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company isolation for notification preferences" ON notification_preferences;
CREATE POLICY "Company isolation for notification preferences" ON notification_preferences
  FOR ALL USING (company_id = public.auth_company_id());
