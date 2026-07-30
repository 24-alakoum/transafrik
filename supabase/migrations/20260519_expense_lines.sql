-- Migration to create expense_lines table
CREATE TABLE IF NOT EXISTS expense_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'unité',
  unit_price_fcfa NUMERIC(15,2) DEFAULT 0,
  total_fcfa NUMERIC(15,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on expense_lines
ALTER TABLE expense_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policy for isolation
DROP POLICY IF EXISTS "Company isolation for expense lines" ON expense_lines;
CREATE POLICY "Company isolation for expense lines" ON expense_lines
  FOR ALL USING (
    expense_id IN (SELECT id FROM expenses WHERE company_id = public.auth_company_id())
  );
