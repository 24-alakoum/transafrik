-- Migration: Fix missing column is_external on bills_of_lading and update category check constraint on expenses

-- 1. Add is_external column to bills_of_lading if missing
ALTER TABLE bills_of_lading ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;

-- 2. Update category CHECK constraint on expenses table to allow 'salaire', 'amende', 'parking', 'frais_aller', 'frais_retour'
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_category_check CHECK (category IN ('carburant', 'maintenance', 'peage', 'salaire', 'assurance', 'amende', 'parking', 'frais_aller', 'frais_retour', 'frais_route', 'autre'));
