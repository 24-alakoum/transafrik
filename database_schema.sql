-- ==========================================
-- SCHEMA TRANSAFRIK - BASE DE DONNÉES SUPABASE
-- ==========================================
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (Entreprises / Multi-tenancy)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nif TEXT,
  rccm TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  plan TEXT DEFAULT 'trial',
  invoice_prefix TEXT DEFAULT 'FAC',
  invoice_counter INTEGER DEFAULT 0,
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS (Profils liés à auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff', 'driver')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLIENTS
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  sector TEXT,
  payment_terms_days INTEGER DEFAULT 30,
  credit_limit_fcfa NUMERIC(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRUCKS (Camions)
CREATE TABLE trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  plate TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  type TEXT,
  capacity_kg NUMERIC(10,2),
  fuel_type TEXT DEFAULT 'diesel',
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_transit', 'maintenance', 'out_of_service')),
  insurance_expiry DATE,
  tech_visit_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, plate)
);

-- 5. DRIVERS (Chauffeurs)
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license_number TEXT, -- Stocké de manière chiffrée via l'application
  national_id TEXT, -- Stocké de manière chiffrée via l'application
  birth_date DATE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_trip', 'on_leave', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRIPS (Voyages)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  reference TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'in_transit', 'delivered', 'cancelled')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  departure_date DATE,
  arrival_date DATE,
  cargo_type TEXT,
  cargo_weight_kg NUMERIC(10,2),
  revenue_fcfa NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, reference)
);

-- 7. TRIP_LINES (Lignes de prestation des voyages)
CREATE TABLE trip_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'unité',
  unit_price_fcfa NUMERIC(15,2) DEFAULT 0,
  total_fcfa NUMERIC(15,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXPENSES (Dépenses)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('carburant', 'maintenance', 'peage', 'frais_route', 'assurance', 'autre')),
  description TEXT,
  amount_fcfa NUMERIC(15,2) NOT NULL,
  receipt_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DELIVERY_NOTES (Bons de Livraison / Factures)
CREATE TABLE delivery_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  reference TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'late', 'disputed', 'cancelled')),
  issued_date DATE NOT NULL,
  due_date DATE,
  subtotal_fcfa NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount_fcfa NUMERIC(15,2) DEFAULT 0,
  total_fcfa NUMERIC(15,2) DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, reference)
);

-- 10. PAYMENTS (Paiements & Encaissements)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  delivery_note_id UUID REFERENCES delivery_notes(id) ON DELETE CASCADE,
  amount_fcfa NUMERIC(15,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'mobile_money', 'cheque', 'other')),
  date DATE NOT NULL,
  reference TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT_LOGS (Traçabilité RGPD & Sécurité)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SUBSCRIPTIONS (Abonnements Stripe)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_sub_id TEXT,
  plan TEXT DEFAULT 'trial',
  status TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- 13. DATA_REQUESTS (Demandes RGPD)
CREATE TABLE data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('export', 'deletion')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 14. CONSENT_RECORDS (Consentements RGPD)
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  consent_type TEXT NOT NULL,
  accepted BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SÉCURITÉ - ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Activer RLS sur toutes les tables métiers
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Fonction utilitaire pour récupérer le company_id de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.auth_company_id() RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- POLITIQUES (Exemples : l'utilisateur ne voit que les données de son entreprise)

-- Users
CREATE POLICY "Users can view members of their company" ON users
  FOR SELECT USING (company_id = public.auth_company_id());
  
-- Companies
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (id = public.auth_company_id());

-- Clients
CREATE POLICY "Company isolation for clients" ON clients
  FOR ALL USING (company_id = public.auth_company_id());

-- Trucks
CREATE POLICY "Company isolation for trucks" ON trucks
  FOR ALL USING (company_id = public.auth_company_id());

-- Drivers
CREATE POLICY "Company isolation for drivers" ON drivers
  FOR ALL USING (company_id = public.auth_company_id());

-- Trips
CREATE POLICY "Company isolation for trips" ON trips
  FOR ALL USING (company_id = public.auth_company_id());

-- Trip Lines
CREATE POLICY "Company isolation for trip lines" ON trip_lines
  FOR ALL USING (
    trip_id IN (SELECT id FROM trips WHERE company_id = public.auth_company_id())
  );

-- Expenses
CREATE POLICY "Company isolation for expenses" ON expenses
  FOR ALL USING (company_id = public.auth_company_id());

-- Delivery Notes
CREATE POLICY "Company isolation for delivery notes" ON delivery_notes
  FOR ALL USING (company_id = public.auth_company_id());

-- Payments
CREATE POLICY "Company isolation for payments" ON payments
  FOR ALL USING (company_id = public.auth_company_id());

-- Audit Logs
CREATE POLICY "Company isolation for audit logs" ON audit_logs
  FOR SELECT USING (company_id = public.auth_company_id());
  
-- Subscriptions
CREATE POLICY "Company isolation for subscriptions" ON subscriptions
  FOR SELECT USING (company_id = public.auth_company_id());

-- Data Requests
CREATE POLICY "Users can view their own requests" ON data_requests
  FOR SELECT USING (user_id = auth.uid());

-- Consent Records
CREATE POLICY "Users can view their own consents" ON consent_records
  FOR SELECT USING (user_id = auth.uid());

-- NOTE: Pour permettre l'insertion de l'entreprise lors du register (qui se fait via le Service Role ou avant d'avoir auth.company_id), 
-- la politique "ALL" ou "INSERT" sera généralement bypassée par le client Supabase `createAdminClient` dans tes Server Actions.

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
-- Les buckets doivent être créés via l'interface Supabase Storage
-- 1. "receipts" (Privé)
-- 2. "logos" (Public)
-- 3. "exports" (Privé)
