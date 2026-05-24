-- ============================================================
-- BUSNET UA — Missing Tables for Carrier Portal
-- ============================================================

-- ─────────────────────────────────────────────────
-- 1. ROUTES  (used by NewTrip, CarrierDashboard, BookingsTab, Schedule)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.routes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  operator        TEXT,
  seats           INTEGER DEFAULT 50,
  amenities       JSONB DEFAULT '[]',
  is_transfer     BOOLEAN DEFAULT false,
  transfer_type   TEXT DEFAULT 'direct',
  transfer_city   TEXT,
  currency        TEXT DEFAULT 'ГРН',
  discounts       JSONB DEFAULT '{}',
  custom_discounts JSONB DEFAULT '[]',
  rules           JSONB DEFAULT '[]',
  custom_rules    JSONB DEFAULT '[]',
  outbound        JSONB DEFAULT '{}',
  inbound         JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routes_carrier_id ON public.routes(carrier_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON public.routes(status);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carrier_manage_own_routes" ON public.routes;
CREATE POLICY "carrier_manage_own_routes" ON public.routes
  FOR ALL USING (carrier_id = auth.uid()::text)
  WITH CHECK (carrier_id = auth.uid()::text);

DROP POLICY IF EXISTS "admin_manage_all_routes" ON public.routes;
CREATE POLICY "admin_manage_all_routes" ON public.routes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid()::text AND role = 'admin')
  );

DROP POLICY IF EXISTS "public_read_approved_routes" ON public.routes;
CREATE POLICY "public_read_approved_routes" ON public.routes
  FOR SELECT USING (status = 'approved');

-- ─────────────────────────────────────────────────
-- 2. TRIPS  (live trip instances created from routes, used by LiveTrips, Analytics)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id      TEXT NOT NULL,
  status          TEXT DEFAULT 'scheduled',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Add ALL columns safely (works whether table was just created or pre-existing)
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS route_id UUID;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS departure_date DATE;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS departure_time TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS from_city TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS to_city TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS seats_total INTEGER DEFAULT 50;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS seats_booked INTEGER DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS bus_plate TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS current_lat NUMERIC;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS current_lon NUMERIC;

-- Now safe to create indexes (all columns exist)
CREATE INDEX IF NOT EXISTS idx_trips_carrier_id ON public.trips(carrier_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON public.trips(departure_date);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carrier_manage_own_trips" ON public.trips;
CREATE POLICY "carrier_manage_own_trips" ON public.trips
  FOR ALL USING (carrier_id = auth.uid()::text)
  WITH CHECK (carrier_id = auth.uid()::text);

DROP POLICY IF EXISTS "public_read_trips" ON public.trips;
CREATE POLICY "public_read_trips" ON public.trips
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────
-- 3. BALANCES  (used by FinanceTab)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.balances (
  id              TEXT PRIMARY KEY,  -- carrier uid
  balance         NUMERIC DEFAULT 0,
  pending_balance NUMERIC DEFAULT 0,
  total_earned    NUMERIC DEFAULT 0,
  total_payouts   NUMERIC DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carrier_read_own_balance" ON public.balances;
CREATE POLICY "carrier_read_own_balance" ON public.balances
  FOR SELECT USING (id = auth.uid()::text);

DROP POLICY IF EXISTS "admin_manage_balances" ON public.balances;
CREATE POLICY "admin_manage_balances" ON public.balances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid()::text AND role = 'admin')
  );

-- Service role can insert/update balances (for triggers/backend)
DROP POLICY IF EXISTS "service_manage_balances" ON public.balances;
CREATE POLICY "service_manage_balances" ON public.balances
  FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────
-- 4. INVOICES  (used by InvoicesTab)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id  TEXT NOT NULL,
  period      TEXT NOT NULL,
  amount      NUMERIC DEFAULT 0,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  items       INTEGER DEFAULT 0,
  date        TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_carrier_id ON public.invoices(carrier_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carrier_read_own_invoices" ON public.invoices;
CREATE POLICY "carrier_read_own_invoices" ON public.invoices
  FOR SELECT USING (carrier_id = auth.uid()::text);

DROP POLICY IF EXISTS "admin_manage_invoices" ON public.invoices;
CREATE POLICY "admin_manage_invoices" ON public.invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid()::text AND role = 'admin')
  );

-- ─────────────────────────────────────────────────
-- 5. NOTIFICATIONS  (used by NotificationsTab in all portals)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  text        TEXT,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info', 'alert', 'success', 'warning')),
  read        BOOLEAN DEFAULT false,
  category    TEXT DEFAULT 'system',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_manage_own_notifications" ON public.notifications;
CREATE POLICY "user_manage_own_notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "admin_insert_notifications" ON public.notifications;
CREATE POLICY "admin_insert_notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid()::text AND role = 'admin')
  );

-- ─────────────────────────────────────────────────
-- 6. Enable Realtime for all new tables
-- ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'routes'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.routes; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'trips'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.trips; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'balances'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.balances; END IF;
END $$;

-- ─────────────────────────────────────────────────
-- 7. Fix bookings table: add missing carrier_id column if not exists
-- ─────────────────────────────────────────────────
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS carrier_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS trip_id UUID;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS route_id UUID;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS departure_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS departure_time TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS route_from TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS route_to TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_bookings_carrier_id ON public.bookings(carrier_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON public.bookings(trip_id);

-- ─────────────────────────────────────────────────
-- 8. Add missing columns to reviews table
-- ─────────────────────────────────────────────────
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS carrier_id TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS "passengerName" TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS "routeInfo" JSONB;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS "tripId" TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_carrier_id ON public.reviews(carrier_id);
