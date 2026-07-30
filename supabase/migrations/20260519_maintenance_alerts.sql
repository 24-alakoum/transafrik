-- Migration to create maintenance_alerts table
CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  ai_generated BOOLEAN DEFAULT FALSE,
  due_date DATE DEFAULT CURRENT_DATE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Company isolation for maintenance_alerts" ON maintenance_alerts;
CREATE POLICY "Company isolation for maintenance_alerts" ON maintenance_alerts
  FOR ALL USING (company_id = public.auth_company_id());
