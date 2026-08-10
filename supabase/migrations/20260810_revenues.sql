-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 20260810 — Table revenues (Recettes / Encaissements)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount_fcfa NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (amount_fcfa >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'transport',
  status TEXT DEFAULT 'encaisse' CHECK (status IN ('encaisse', 'en_attente', 'annule')),
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active RLS sur revenues
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

-- Politique d'isolation multi-tenant
CREATE POLICY "Company isolation for revenues" ON revenues
  FOR ALL USING (company_id = public.auth_company_id());

-- Trigger pour la mise à jour automatique de updated_at
DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_revenues_company ON revenues(company_id);
CREATE INDEX IF NOT EXISTS idx_revenues_trip ON revenues(trip_id);
CREATE INDEX IF NOT EXISTS idx_revenues_client ON revenues(client_id);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
