-- Migration to create truck_tires table
CREATE TABLE IF NOT EXISTS truck_tires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('avant_gauche', 'avant_droit', 'arriere_gauche_exterieur', 'arriere_gauche_interieur', 'arriere_droit_exterieur', 'arriere_droit_interieur', 'secours')),
  brand TEXT NOT NULL,
  wear_percentage NUMERIC(5,2) DEFAULT 0.00 NOT NULL, -- 0 to 100%
  mileage_installed NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
  installed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  last_checked_at DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'good' CHECK (status IN ('good', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE truck_tires ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "Company isolation for truck_tires" ON truck_tires;
CREATE POLICY "Company isolation for truck_tires" ON truck_tires
  FOR ALL USING (company_id = public.auth_company_id());
