-- ============================================================
-- MIGRATION: AL-TRANS integration + carrier login fix
-- Date: 2026-11-02
-- ============================================================

-- 1. FIX LOGIN: Insert Al-Trans record into users table
INSERT INTO users (
  uid, email, role, "companyName", phone, status, "loyaltyPoints", created_at, updated_at
) VALUES (
  'ec987229-0773-49b9-bac8-69d562a794d1',
  'ua.infobus@gmail.com',
  'carrier',
  'Al TRANS',
  '+393513004627',
  'active',
  0,
  NOW(), NOW()
)
ON CONFLICT (uid) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 2. EXTEND users TABLE: external integration fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS external_provider    TEXT,
  ADD COLUMN IF NOT EXISTS external_api_key     TEXT,
  ADD COLUMN IF NOT EXISTS external_route_keys  TEXT[],
  ADD COLUMN IF NOT EXISTS external_sync_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS external_synced_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "logoUrl"            TEXT;

UPDATE users
SET
  external_provider    = 'al-trans',
  external_api_key     = NULL, -- Set securely via backend environment variables or secrets manager
  external_route_keys  = ARRAY[
    'avtobus-cherkasy-salerno-al-trans',
    'avtobus-kherson-lecce-al-trans',
    'avtobus-kyiv-komo-al-trans',
    'avtobus-kherson-imperiya-al-trans',
    'avtobus-zaporizhzhia-salerno-al-trans',
    'avtobus-kyiv-salerno-al-trans'
  ],
  external_sync_status = 'pending'
WHERE uid = 'ec987229-0773-49b9-bac8-69d562a794d1';

-- 3. TABLE al_trans_routes
CREATE TABLE IF NOT EXISTS al_trans_routes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id       TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  external_line_id INTEGER,
  navigation_key   TEXT,
  name             TEXT,
  schedule_days    TEXT,
  source           TEXT DEFAULT 'al-trans-import',
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_altrans_route UNIQUE (carrier_id, external_line_id)
);

-- 4. TABLE al_trans_route_stops
CREATE TABLE IF NOT EXISTS al_trans_route_stops (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id         UUID NOT NULL REFERENCES al_trans_routes(id) ON DELETE CASCADE,
  schedule_title   TEXT,
  stop_order       INTEGER NOT NULL,
  city_name        TEXT,
  external_city_id INTEGER,
  country          TEXT,
  timezone         TEXT,
  station          TEXT,
  latitude         DOUBLE PRECISION,
  longitude        DOUBLE PRECISION,
  departure_day    TEXT,
  departure_time   TEXT,
  return_day       TEXT,
  return_time      TEXT
);

CREATE INDEX IF NOT EXISTS idx_altrans_stops_route    ON al_trans_route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_altrans_stops_city     ON al_trans_route_stops(external_city_id);
CREATE INDEX IF NOT EXISTS idx_altrans_routes_carrier ON al_trans_routes(carrier_id);

-- 5. TABLE search_cache (10-min TTL for price queries)
CREATE TABLE IF NOT EXISTS search_cache (
  cache_key  TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

-- 6. RLS POLICIES
ALTER TABLE al_trans_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carrier_own_altrans_routes" ON al_trans_routes;
CREATE POLICY "carrier_own_altrans_routes" ON al_trans_routes
  FOR ALL USING (carrier_id = auth.uid()::text)
  WITH CHECK (carrier_id = auth.uid()::text);

DROP POLICY IF EXISTS "admin_all_altrans_routes" ON al_trans_routes;
CREATE POLICY "admin_all_altrans_routes" ON al_trans_routes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE uid = auth.uid()::text AND role = 'admin')
  );

ALTER TABLE al_trans_route_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carrier_own_altrans_stops" ON al_trans_route_stops;
CREATE POLICY "carrier_own_altrans_stops" ON al_trans_route_stops
  FOR ALL USING (
    route_id IN (SELECT id FROM al_trans_routes WHERE carrier_id = auth.uid()::text)
  );

ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_search_cache" ON search_cache;
CREATE POLICY "service_role_search_cache" ON search_cache
  FOR ALL USING (auth.role() = 'service_role');
