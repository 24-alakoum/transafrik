-- ==========================================
-- MIGRATION: GPS TRACKING, COLIS QR CODE, MAINTENANCE
-- ==========================================

-- 1. GPS_LOCATIONS
CREATE TABLE IF NOT EXISTS gps_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  speed_kmh NUMERIC(6, 2),
  heading NUMERIC(6, 2),
  altitude_m NUMERIC(8, 2),
  accuracy_m NUMERIC(6, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_truck_time ON gps_locations(truck_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_company ON gps_locations(company_id);

-- 2. PACKAGES (Colis avec QR Code)
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  qr_code TEXT UNIQUE NOT NULL,
  reference TEXT NOT NULL,
  description TEXT,
  weight_kg NUMERIC(10, 2),
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','picked_up','in_transit','out_for_delivery','delivered','returned','lost')),
  estimated_delivery DATE,
  actual_delivery TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, reference)
);

CREATE INDEX IF NOT EXISTS idx_packages_company ON packages(company_id);
CREATE INDEX IF NOT EXISTS idx_packages_qr ON packages(qr_code);

-- 3. MAINTENANCE_ALERTS
CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('oil_change','tire_rotation','brake_check','filter_change','inspection','insurance','tech_visit','battery','other')),
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_mileage NUMERIC(10, 0),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved','dismissed')),
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_company ON maintenance_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_maint_truck ON maintenance_alerts(truck_id);

-- 4. FUEL_LOGS
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  liters NUMERIC(8, 2) NOT NULL,
  price_per_liter NUMERIC(8, 2),
  total_cost_fcfa NUMERIC(15, 2),
  mileage_at_fill NUMERIC(10, 0),
  station_name TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_company ON fuel_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_fuel_truck ON fuel_logs(truck_id);

-- RLS
ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company isolation for gps_locations" ON gps_locations
  FOR ALL USING (company_id = public.auth_company_id());

CREATE POLICY "Company isolation for packages" ON packages
  FOR ALL USING (company_id = public.auth_company_id());

CREATE POLICY "Company isolation for maintenance_alerts" ON maintenance_alerts
  FOR ALL USING (company_id = public.auth_company_id());

CREATE POLICY "Company isolation for fuel_logs" ON fuel_logs
  FOR ALL USING (company_id = public.auth_company_id());
