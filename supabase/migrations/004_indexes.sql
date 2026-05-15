-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 004 — Index de performance
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trucks
CREATE INDEX IF NOT EXISTS idx_trucks_company ON trucks(company_id);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(company_id, status);

-- Drivers
CREATE INDEX IF NOT EXISTS idx_drivers_company ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(company_id, status);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_company ON trips(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(company_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(company_id, departure_date, arrival_date);
CREATE INDEX IF NOT EXISTS idx_trips_client ON trips(company_id, client_id);
CREATE INDEX IF NOT EXISTS idx_trips_reference ON trips(company_id, reference);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(company_id, is_active);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_company ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(company_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(company_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);

-- Delivery notes
CREATE INDEX IF NOT EXISTS idx_delivery_notes_company ON delivery_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_status ON delivery_notes(company_id, status);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_due ON delivery_notes(company_id, due_date);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_note ON payments(delivery_note_id);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id, created_at DESC);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(company_id, is_active);
