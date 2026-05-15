-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 002 — Row Level Security (RLS) Policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Activer RLS sur toutes les tables ────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ── Fonctions helpers ────────────────────────────────
CREATE OR REPLACE FUNCTION auth_company_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- ── COMPANIES ────────────────────────────────────────
CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (id = auth_company_id());

CREATE POLICY "companies_update" ON companies
  FOR UPDATE USING (id = auth_company_id())
  WITH CHECK (auth_user_role() IN ('owner','admin'));

-- ── USERS ────────────────────────────────────────────
CREATE POLICY "users_select" ON users
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin'));

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (company_id = auth_company_id())
  WITH CHECK (auth_user_role() IN ('owner','admin') OR id = auth.uid());

CREATE POLICY "users_delete" ON users
  FOR DELETE USING (company_id = auth_company_id() AND auth_user_role() = 'owner');

-- ── TRUCKS ───────────────────────────────────────────
CREATE POLICY "trucks_select" ON trucks
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "trucks_insert" ON trucks
  FOR INSERT WITH CHECK (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin','dispatcher'));

CREATE POLICY "trucks_update" ON trucks
  FOR UPDATE USING (company_id = auth_company_id())
  WITH CHECK (auth_user_role() IN ('owner','admin','dispatcher'));

CREATE POLICY "trucks_delete" ON trucks
  FOR DELETE USING (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin'));

-- ── DRIVERS ──────────────────────────────────────────
CREATE POLICY "drivers_select" ON drivers
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "drivers_insert" ON drivers
  FOR INSERT WITH CHECK (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin','dispatcher'));

CREATE POLICY "drivers_update" ON drivers
  FOR UPDATE USING (company_id = auth_company_id())
  WITH CHECK (auth_user_role() IN ('owner','admin','dispatcher'));

CREATE POLICY "drivers_delete" ON drivers
  FOR DELETE USING (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin'));

-- ── CLIENTS ──────────────────────────────────────────
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin','dispatcher','accountant'));

CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (company_id = auth_company_id())
  WITH CHECK (auth_user_role() IN ('owner','admin','dispatcher','accountant'));

CREATE POLICY "clients_delete" ON clients
  FOR DELETE USING (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin'));

-- ── TRIPS ────────────────────────────────────────────
CREATE POLICY "trips_select" ON trips
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "trips_insert" ON trips
  FOR INSERT WITH CHECK (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin','dispatcher'));

CREATE POLICY "trips_update" ON trips
  FOR UPDATE USING (company_id = auth_company_id())
  WITH CHECK (auth_user_role() IN ('owner','admin','dispatcher'));

CREATE POLICY "trips_delete" ON trips
  FOR DELETE USING (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin'));

-- ── TRIP LINES ───────────────────────────────────────
CREATE POLICY "trip_lines_select" ON trip_lines
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_lines.trip_id AND trips.company_id = auth_company_id())
  );

CREATE POLICY "trip_lines_insert" ON trip_lines
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_lines.trip_id AND trips.company_id = auth_company_id())
    AND auth_user_role() IN ('owner','admin','dispatcher')
  );

CREATE POLICY "trip_lines_update" ON trip_lines
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_lines.trip_id AND trips.company_id = auth_company_id())
  );

CREATE POLICY "trip_lines_delete" ON trip_lines
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_lines.trip_id AND trips.company_id = auth_company_id())
    AND auth_user_role() IN ('owner','admin','dispatcher')
  );

-- ── EXPENSES ─────────────────────────────────────────
CREATE POLICY "expenses_select" ON expenses
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT WITH CHECK (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin','accountant','dispatcher'));

CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE USING (company_id = auth_company_id())
  WITH CHECK (auth_user_role() IN ('owner','admin','accountant'));

CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE USING (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin'));

-- ── DELIVERY NOTES ───────────────────────────────────
CREATE POLICY "delivery_notes_select" ON delivery_notes
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "delivery_notes_insert" ON delivery_notes
  FOR INSERT WITH CHECK (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin','accountant','dispatcher'));

CREATE POLICY "delivery_notes_update" ON delivery_notes
  FOR UPDATE USING (company_id = auth_company_id())
  WITH CHECK (auth_user_role() IN ('owner','admin','accountant'));

CREATE POLICY "delivery_notes_delete" ON delivery_notes
  FOR DELETE USING (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin'));

-- ── PAYMENTS ─────────────────────────────────────────
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (company_id = auth_company_id());

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin','accountant'));

CREATE POLICY "payments_delete" ON payments
  FOR DELETE USING (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin'));

-- ── NOTIFICATIONS ────────────────────────────────────
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR company_id = auth_company_id());

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ── SUBSCRIPTIONS ────────────────────────────────────
CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (company_id = auth_company_id() AND auth_user_role() IN ('owner','admin'));
