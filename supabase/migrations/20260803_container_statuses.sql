-- Unified container lifecycle and automatic modification timestamp.
UPDATE containers
SET status = CASE status
  WHEN 'au_port' THEN 'en_cours'
  WHEN 'retire' THEN 'en_cours'
  WHEN 'en_transit' THEN 'en_cours'
  WHEN 'decharge' THEN 'vide'
  ELSE status
END
WHERE status NOT IN ('en_cours', 'livre', 'vide', 'retourne');

ALTER TABLE containers DROP CONSTRAINT IF EXISTS containers_status_check;
ALTER TABLE containers
  ADD CONSTRAINT containers_status_check
  CHECK (status IN ('en_cours', 'livre', 'vide', 'retourne'));

ALTER TABLE containers ALTER COLUMN status SET DEFAULT 'en_cours';

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON containers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON containers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
