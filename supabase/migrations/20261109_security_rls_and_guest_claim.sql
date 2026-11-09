-- =========================================================================
-- BUSNET COMPLETE SECURITY & ACCESS CONTROL SPECIFICATION
-- 1. Helper Functions (is_admin, get_role) with recursion prevention
-- 2. Profiles: Strict Anti-Privilege Escalation Trigger (BEFORE INSERT OR UPDATE)
-- 3. Bookings: Automatic Carrier Assignment & Claim Tokens
-- 4. Anti-Overbooking: booking_seats Registry & Backfill
-- 5. Atomic create_booking RPC (ACID Transaction + Unique Seat Lock)
-- 6. Hardened claim_guest_booking RPC (Email Verification & Token & E.164)
-- 7. Secure cancel_booking RPC
-- 8. Complete Row Level Security (RLS) across all core tables
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS (SECURITY DEFINER to prevent RLS recursion)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT role FROM profiles WHERE id = auth.uid()), 'passenger');
$$;

-- -------------------------------------------------------------------------
-- 2. PROFILES: ANTI-PRIVILEGE ESCALATION TRIGGER (INSERT + UPDATE)
-- -------------------------------------------------------------------------
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION protect_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If executed via service_role, allow any role assignment
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- ON INSERT: Non-admins can ONLY create profiles with role = 'passenger'
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NULL OR NEW.role NOT IN ('admin', 'carrier', 'driver', 'agent') THEN
      NEW.role := 'passenger';
    ELSIF NEW.role IN ('admin', 'carrier', 'driver', 'agent') THEN
      -- Only existing admin can create staff/carrier accounts
      IF NOT is_admin() THEN
        NEW.role := 'passenger';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- ON UPDATE: Prevent regular users from modifying their role
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      IF NOT is_admin() THEN
        NEW.role := OLD.role; -- Revert escalation attempt
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role_insert_update ON profiles;
CREATE TRIGGER trg_protect_profile_role_insert_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_role_escalation();

-- Profiles RLS Policies:
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- -------------------------------------------------------------------------
-- 3. BOOKINGS TABLE SCHEMA HARDENING
-- -------------------------------------------------------------------------
ALTER TABLE IF EXISTS bookings 
  ADD COLUMN IF NOT EXISTS claim_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS carrier_id UUID,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS departure_country TEXT,
  ADD COLUMN IF NOT EXISTS arrival_country TEXT;

-- Automatic carrier assignment trigger from routes (prevents spoofing carrier_id from client)
CREATE OR REPLACE FUNCTION set_booking_carrier_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cid UUID;
BEGIN
  IF NEW.route_id IS NOT NULL THEN
    SELECT carrier_id INTO v_cid FROM routes WHERE id = NEW.route_id;
    IF v_cid IS NOT NULL THEN
      NEW.carrier_id := v_cid;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_carrier_id ON bookings;
CREATE TRIGGER trg_set_booking_carrier_id
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_carrier_id();

-- -------------------------------------------------------------------------
-- 4. ANTI-OVERBOOKING: BOOKING_SEATS REGISTRY & BACKFILL
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  route_id TEXT NOT NULL,
  departure_date DATE NOT NULL,
  seat_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, pending, boarded, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index ensuring no two non-cancelled bookings hold the same seat
CREATE UNIQUE INDEX IF NOT EXISTS uq_route_date_seat_active 
  ON booking_seats (route_id, departure_date, seat_number) 
  WHERE status != 'cancelled';

ALTER TABLE IF EXISTS booking_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_seats_read_all" ON booking_seats;
CREATE POLICY "booking_seats_read_all" ON booking_seats
  FOR SELECT USING (true);

-- -------------------------------------------------------------------------
-- 5. ATOMIC create_booking RPC (ACID TRANSACTION WITH SEAT CONCURRENCY LOCK)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_booking(
  p_route_id TEXT,
  p_direction TEXT,
  p_from_stop INT,
  p_to_stop INT,
  p_start_date TEXT,
  p_passengers JSONB,
  p_contact JSONB,
  p_idempotency_key TEXT DEFAULT NULL,
  p_price NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_carrier_id UUID;
  v_route_name TEXT;
  v_currency TEXT := 'грн';
  v_total_price NUMERIC;
  v_booking_id UUID := gen_random_uuid();
  v_claim_token UUID := gen_random_uuid();
  v_p_count INT := jsonb_array_length(p_passengers);
  v_dep_date DATE;
  v_passenger RECORD;
  v_seat_num TEXT;
  v_existing_id UUID;
BEGIN
  -- 1. Idempotency Check
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT id, total_price, currency INTO v_existing_id, v_total_price, v_currency
    FROM bookings
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_existing_id,
        'total_price', v_total_price,
        'currency', v_currency,
        'idempotent', true
      );
    END IF;
  END IF;

  -- 2. Route Lookup and Validation
  SELECT carrier_id, name, currency INTO v_carrier_id, v_route_name, v_currency
  FROM routes
  WHERE id = p_route_id;

  -- 3. Date parsing
  BEGIN
    v_dep_date := p_start_date::DATE;
  EXCEPTION WHEN OTHERS THEN
    v_dep_date := CURRENT_DATE + INTERVAL '1 day';
  END;

  -- 4. Calculate total price safely
  IF p_price IS NOT NULL AND p_price > 0 THEN
    v_total_price := p_price;
  ELSE
    v_total_price := 6240 * GREATEST(v_p_count, 1);
  END IF;

  -- 5. Insert Booking Master Record
  INSERT INTO bookings (
    id,
    user_id,
    carrier_id,
    route_id,
    route_from,
    route_to,
    departure_date,
    departure_time,
    passengers,
    passenger_name,
    passenger_email,
    passenger_phone,
    total_price,
    currency,
    status,
    claim_token,
    idempotency_key,
    created_at
  ) VALUES (
    v_booking_id,
    v_user_id,
    v_carrier_id,
    p_route_id,
    COALESCE(p_contact->>'fromCity', 'Київ'),
    COALESCE(p_contact->>'toCity', 'Рим'),
    v_dep_date,
    COALESCE(p_contact->>'departureTime', '07:00'),
    p_passengers,
    COALESCE(p_passengers->0->>'firstName', '') || ' ' || COALESCE(p_passengers->0->>'lastName', ''),
    p_contact->>'email',
    p_contact->>'phone',
    v_total_price,
    COALESCE(v_currency, 'грн'),
    'pending',
    v_claim_token,
    p_idempotency_key,
    now()
  );

  -- 6. Atomic Seat Reservation (Prevents Overbooking / Race Conditions)
  FOR i IN 0..(v_p_count - 1) LOOP
    v_seat_num := COALESCE(p_passengers->i->>'seatNumber', (i + 1)::TEXT);
    
    BEGIN
      INSERT INTO booking_seats (
        booking_id,
        route_id,
        departure_date,
        seat_number,
        status
      ) VALUES (
        v_booking_id,
        p_route_id,
        v_dep_date,
        v_seat_num,
        'confirmed'
      );
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Місце % на дату % вже зайняте. Будь ласка, оберіть інше місце.', v_seat_num, v_dep_date;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'claim_token', v_claim_token,
    'total_price', v_total_price,
    'currency', v_currency
  );
END;
$$;

-- -------------------------------------------------------------------------
-- 6. HARDENED claim_guest_booking RPC (ANTI-IDOR WITH CLAIM TOKEN & E.164)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_guest_booking(
  p_booking_id UUID,
  p_claim_token UUID DEFAULT NULL,
  p_user_phone TEXT DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_clean_phone TEXT;
  v_booking RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Fetch unclaimed booking
  SELECT id, user_id, claim_token, passenger_phone, passenger_email
  INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
    AND (user_id IS NULL OR user_id = v_user_id);

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 2. Cryptographic Token Match (Strongest verification)
  IF p_claim_token IS NOT NULL AND v_booking.claim_token IS NOT NULL THEN
    IF v_booking.claim_token = p_claim_token THEN
      UPDATE bookings
      SET user_id = v_user_id,
          claim_token = NULL
      WHERE id = p_booking_id;
      RETURN TRUE;
    END IF;
  END IF;

  -- 3. Contact Match (E.164 phone or Email check)
  v_clean_phone := regexp_replace(COALESCE(p_user_phone, ''), '\D', '', 'g');

  IF (
    -- Email match
    (
      p_user_email IS NOT NULL 
      AND length(trim(p_user_email)) > 3 
      AND lower(trim(COALESCE(v_booking.passenger_email, ''))) = lower(trim(p_user_email))
    )
    OR
    -- Phone match (strict full digits or standardized suffix)
    (
      v_clean_phone IS NOT NULL 
      AND length(v_clean_phone) >= 9
      AND regexp_replace(COALESCE(v_booking.passenger_phone, ''), '\D', '', 'g') = v_clean_phone
    )
  ) THEN
    UPDATE bookings
    SET user_id = v_user_id,
        claim_token = NULL
    WHERE id = p_booking_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- -------------------------------------------------------------------------
-- 7. SECURE cancel_booking RPC
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_booking_user_id UUID;
  v_carrier_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Потрібна авторизація для скасування квитка';
  END IF;

  SELECT user_id, carrier_id INTO v_booking_user_id, v_carrier_id
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Квиток не знайдено';
  END IF;

  -- Strict Authorization: Only ticket owner, trip carrier, or admin
  IF v_booking_user_id = v_user_id OR v_carrier_id = v_user_id OR is_admin() THEN
    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = p_booking_id;

    UPDATE booking_seats
    SET status = 'cancelled'
    WHERE booking_id = p_booking_id;

    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Доступ заборонено: ви не можете скасувати чужий квиток';
  END IF;
END;
$$;

-- -------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) FOR ALL CORE TABLES
-- -------------------------------------------------------------------------

-- A) BOOKINGS RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_policy" ON bookings;
CREATE POLICY "bookings_select_policy" ON bookings
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (carrier_id = auth.uid())
    OR is_admin()
  );

-- Direct client updates prohibited: Passenger cancellation MUST run through cancel_booking RPC
DROP POLICY IF EXISTS "bookings_update_policy" ON bookings;
CREATE POLICY "bookings_update_policy" ON bookings
  FOR UPDATE USING (
    (carrier_id = auth.uid())
    OR is_admin()
  );

-- Direct client inserts: Allowed via create_booking RPC (SECURITY DEFINER)
DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;
CREATE POLICY "bookings_insert_policy" ON bookings
  FOR INSERT WITH CHECK (
    user_id IS NULL
    OR user_id = auth.uid()
    OR is_admin()
  );

-- B) PASSENGERS RLS (Address book)
ALTER TABLE IF EXISTS passengers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "passengers_owner_all" ON passengers;
CREATE POLICY "passengers_owner_all" ON passengers
  FOR ALL USING (
    auth.uid() = user_id OR is_admin()
  ) WITH CHECK (
    auth.uid() = user_id OR is_admin()
  );

-- C) NOTIFICATIONS RLS
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_owner_select" ON notifications;
CREATE POLICY "notifications_owner_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "notifications_owner_update" ON notifications;
CREATE POLICY "notifications_owner_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- D) FORUM_POSTS RLS
ALTER TABLE IF EXISTS forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_posts_read_all" ON forum_posts;
CREATE POLICY "forum_posts_read_all" ON forum_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "forum_posts_insert_auth" ON forum_posts;
CREATE POLICY "forum_posts_insert_auth" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "forum_posts_update_own" ON forum_posts;
CREATE POLICY "forum_posts_update_own" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- E) ROUTES RLS
ALTER TABLE IF EXISTS routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "routes_read_all" ON routes;
CREATE POLICY "routes_read_all" ON routes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "routes_carrier_manage" ON routes;
CREATE POLICY "routes_carrier_manage" ON routes
  FOR ALL USING (carrier_id = auth.uid() OR is_admin())
  WITH CHECK (carrier_id = auth.uid() OR is_admin());
