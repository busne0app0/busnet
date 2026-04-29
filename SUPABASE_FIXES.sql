-- ============================================================
-- BUSNET UA — SQL виправлення для Supabase
-- Виконати в: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- КРОК 1: Увімкнути RLS для критичних таблиць
-- ============================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- КРОК 2: RLS Policies для таблиці bookings
-- ============================================================

-- Видаляємо ВСІ старі policies (включно з admin)
DROP POLICY IF EXISTS "bookings_select_own" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
DROP POLICY IF EXISTS "bookings_update_own" ON bookings;
DROP POLICY IF EXISTS "bookings_admin_all" ON bookings;

-- Пасажир бачить тільки СВОЇ бронювання
CREATE POLICY "bookings_select_own"
  ON bookings FOR SELECT
  USING (auth.uid()::text = "userId");

-- Пасажир може створювати бронювання тільки від свого імені
CREATE POLICY "bookings_insert_own"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- Пасажир може оновлювати тільки свої бронювання (наприклад, статус cancelled)
CREATE POLICY "bookings_update_own"
  ON bookings FOR UPDATE
  USING (auth.uid()::text = "userId");

-- Адміни бачать всі бронювання
CREATE POLICY "bookings_admin_all"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.uid = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- ============================================================
-- КРОК 3: RLS Policies для таблиці passengers
-- ============================================================

DROP POLICY IF EXISTS "passengers_select_own" ON passengers;
DROP POLICY IF EXISTS "passengers_insert_own" ON passengers;
DROP POLICY IF EXISTS "passengers_delete_own" ON passengers;
DROP POLICY IF EXISTS "passengers_admin_all" ON passengers;

CREATE POLICY "passengers_select_own"
  ON passengers FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "passengers_insert_own"
  ON passengers FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "passengers_delete_own"
  ON passengers FOR DELETE
  USING (auth.uid()::text = "userId");

-- ============================================================
-- КРОК 4: RLS Policies для таблиці notifications
-- ============================================================

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_admin_all" ON notifications;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "notifications_insert_own"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = "userId");

-- ============================================================
-- КРОК 5: RLS Policies для таблиці trips (публічне читання)
-- ============================================================

DROP POLICY IF EXISTS "trips_select_all" ON trips;
DROP POLICY IF EXISTS "trips_carrier_manage" ON trips;
DROP POLICY IF EXISTS "trips_admin_all" ON trips;

-- Всі можуть читати рейси (для пошуку)
CREATE POLICY "trips_select_all"
  ON trips FOR SELECT
  USING (true);

-- Перевізник управляє тільки своїми рейсами
CREATE POLICY "trips_carrier_manage"
  ON trips FOR ALL
  USING (
    auth.uid()::text = "carrierId"
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.uid = auth.uid()::text
      AND users.role IN ('admin', 'carrier')
    )
  );

-- ============================================================
-- КРОК 6: RLS Policies для таблиці users
-- ============================================================

DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_service" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_admin_select" ON users;

-- Кожен бачить тільки свій профіль
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid()::text = uid);

-- Кожен може оновлювати тільки свій профіль
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid()::text = uid);

-- INSERT — тільки для service role (реєстрація через API)
-- або сам себе
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = uid);

-- Адмін бачить всіх
CREATE POLICY "users_admin_select"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.uid = auth.uid()::text
      AND u2.role = 'admin'
    )
  );

-- ============================================================
-- КРОК 7: Атомарна функція book_seats (вирішує race condition)
-- Замість SELECT + UPDATE (два окремих запити з можливою гонкою)
-- використовуємо одну транзакцію з блокуванням рядка
-- ============================================================

CREATE OR REPLACE FUNCTION book_seats(
  p_trip_id TEXT,
  p_seats_count INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip RECORD;
  v_available INTEGER;
BEGIN
  -- Блокуємо рядок рейсу FOR UPDATE — жоден інший запит не може
  -- змінити seatsBooked поки ця транзакція не завершиться
  SELECT * INTO v_trip
  FROM trips
  WHERE id = p_trip_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Рейс не знайдено');
  END IF;

  v_available := COALESCE(v_trip."seatsTotal", 0) - COALESCE(v_trip."seatsBooked", 0);

  IF v_available < p_seats_count THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Недостатньо місць. Залишилось: %s', v_available)
    );
  END IF;

  -- Атомарно оновлюємо кількість заброньованих місць
  UPDATE trips
  SET "seatsBooked" = COALESCE("seatsBooked", 0) + p_seats_count
  WHERE id = p_trip_id;

  RETURN json_build_object(
    'success', true,
    'availableAfter', v_available - p_seats_count
  );
END;
$$;

-- ============================================================
-- КРОК 8: Функція increment_likes з захистом від повторного лайку
-- ============================================================

CREATE OR REPLACE FUNCTION increment_likes(post_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT;
  v_liked_by TEXT[];
BEGIN
  v_user_id := auth.uid()::text;

  SELECT COALESCE("likedBy", '{}') INTO v_liked_by
  FROM forum_posts
  WHERE id = post_id;

  -- Якщо вже лайкнув — нічого не робимо
  IF v_user_id = ANY(v_liked_by) THEN
    RETURN;
  END IF;

  UPDATE forum_posts
  SET
    likes = COALESCE(likes, 0) + 1,
    "likedBy" = array_append(COALESCE("likedBy", '{}'), v_user_id)
  WHERE id = post_id;
END;
$$;

-- ============================================================
-- КРОК 9: Перевірка — переконайтесь що RLS увімкнено
-- ============================================================

SELECT
  tablename,
  rowsecurity AS "RLS enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('bookings', 'passengers', 'notifications', 'trips', 'users')
ORDER BY tablename;

-- Очікуваний результат: всі таблиці мають "RLS enabled" = true
