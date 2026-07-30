-- Migration to create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('maintenance', 'delivery', 'payment', 'trip', 'system', 'alert')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Company isolation for notifications" ON notifications;
CREATE POLICY "Company isolation for notifications" ON notifications
  FOR ALL USING (company_id = public.auth_company_id());
