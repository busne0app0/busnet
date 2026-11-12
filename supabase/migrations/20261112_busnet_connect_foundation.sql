-- ============================================================================
-- BUSNET CONNECT: КРОК 2 — ОСНОВНА МІГРАЦІЯ (BUSNET CONNECT FOUNDATION v2.0)
-- Повністю виправлена та захищена версія з урахуванням аудиту безпеки:
-- 1. Захист від підробки user_id (береться ТІЛЬКИ з auth.uid()).
-- 2. Усунення Race Condition через pg_advisory_xact_lock.
-- 3. Захист від несанкціонованої зміни колонок (likes, indexable, views, user_id) при UPDATE.
-- 4. Захист increment_post_views (search_path, перевірка публічності, обмеження прав).
-- 5. Захист community_reports (reporter_id тільки з auth.uid(), status примусово 'pending', захист від дублювання скарг).
-- 6. Безпечний search_path для всіх SECURITY DEFINER функцій.
-- 7. Точна відповідність реальній колонці user_id (без вигаданих authorId).
-- ============================================================================

BEGIN;

-- 1. БЕЗПЕЧНЕ РОЗШИРЕННЯ ТАБЛИЦІ FORUM_POSTS
ALTER TABLE IF EXISTS forum_posts 
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS route_from TEXT,
  ADD COLUMN IF NOT EXISTS route_to TEXT,
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT false, -- СУВОРЕ SEO: за замовчуванням false
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. ІНТЕЛЕКТУАЛЬНЕ ПЕРЕТВОРЕННЯ КАТЕГОРІЙ ДЛЯ ІСНУЮЧИХ ЗАПИСІВ
-- Зберігає колонку category без змін, заповнюючи post_type відповідним типом
UPDATE forum_posts
SET post_type = CASE
  WHEN category ILIKE '%новин%' OR category ILIKE '%news%' THEN 'news'
  WHEN category ILIKE '%порад%' OR category ILIKE '%tip%' THEN 'tips'
  WHEN category ILIKE '%питан%' OR category ILIKE '%quest%' THEN 'questions'
  WHEN category ILIKE '%кордон%' OR category ILIKE '%border%' THEN 'border'
  WHEN category ILIKE '%посилк%' OR category ILIKE '%parcel%' THEN 'parcel'
  WHEN category ILIKE '%попут%' OR category ILIKE '%buddy%' THEN 'buddy'
  WHEN category ILIKE '%відгук%' OR category ILIKE '%review%' THEN 'review'
  WHEN category ILIKE '%історі%' OR category ILIKE '%story%' OR category ILIKE '%blog%' THEN 'blog'
  ELSE 'general'
END
WHERE post_type IS NULL OR post_type = 'general';

-- Всі старі публікації за замовчуванням НЕ індексуються Google
UPDATE forum_posts
SET is_indexable = false
WHERE is_indexable IS NULL;

-- 3. ОПТИМІЗАЦІЙНІ ІНДЕКСИ
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_post_type ON forum_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_public ON forum_posts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_indexable ON forum_posts(is_indexable) WHERE is_indexable = true;
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);

-- 4. ТРИГЕР ЗАХИСТУ ВІД СПАМУ, RACE CONDITION ТА ПІДРОБКИ АВТОРА
CREATE OR REPLACE FUNCTION check_community_post_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_last_post_time TIMESTAMP WITH TIME ZONE;
  v_effective_uid TEXT;
BEGIN
  -- Якщо запит виконується адміністратором через SQL або сервісним ключем — пропускаємо
  IF current_user = 'postgres' OR (auth.jwt() ->> 'role') = 'service_role' THEN
    IF NEW.user_id IS NULL THEN
      NEW.user_id := COALESCE(auth.uid()::text, 'admin');
    END IF;
    RETURN NEW;
  END IF;

  -- 1) Перевірка дійсної авторизації
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Для публікації в BUSNET CONNECT потрібна авторизація';
  END IF;

  v_effective_uid := auth.uid()::text;

  -- 2) ЗАХИСТ ВІД ПІДРОБКИ: автор завжди встановлюється з токена сесії
  NEW.user_id := v_effective_uid;

  -- 3) УСУНЕННЯ RACE CONDITION ЧЕРЕЗ ADVISORY LOCK
  -- Блокує конкурентні запити виключно для цього користувача в межах транзакції
  PERFORM pg_advisory_xact_lock(hashtext(v_effective_uid));

  -- 4) Перевірка інтервалу публікацій (1 пост на 60 секунд)
  SELECT created_at INTO v_last_post_time
  FROM forum_posts
  WHERE user_id = v_effective_uid
    AND id != COALESCE(NEW.id, '')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_post_time IS NOT NULL AND (NOW() - v_last_post_time) < INTERVAL '60 seconds' THEN
    RAISE EXCEPTION 'Обмеження частоти: зачекайте % секунд перед наступною публікацією.',
      EXTRACT(SECOND FROM (INTERVAL '60 seconds' - (NOW() - v_last_post_time)))::INT;
  END IF;

  -- 5) Примусові системні значення для нового посту
  NEW.likes_count := 0;
  NEW.liked_by := ARRAY[]::TEXT[];
  NEW.comments := 0;
  NEW.views_count := 0;
  NEW.is_indexable := false; -- Ніколи не дозволяти клієнту ставити true при створенні
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_posts_rate_limit ON forum_posts;
CREATE TRIGGER trg_forum_posts_rate_limit
  BEFORE INSERT ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION check_community_post_rate_limit();

-- 5. ТРИГЕР ЗАХИСТУ UPDATE: ЗАБОРОНА ЗМІНИ СИСТЕМНИХ ПОЛІВ ПРИ РЕДАГУВАННІ
CREATE OR REPLACE FUNCTION protect_forum_posts_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Дозволити повні зміни для службової ролі або postgres
  IF current_user = 'postgres' OR (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Звичайний користувач НЕ МОЖЕ змінювати:
  -- likes_count, liked_by, comments, is_indexable, views_count, user_id, created_at
  IF NEW.likes_count != OLD.likes_count 
     OR NEW.liked_by != OLD.liked_by
     OR NEW.comments != OLD.comments
     OR NEW.is_indexable != OLD.is_indexable
     OR NEW.views_count != OLD.views_count
     OR NEW.user_id != OLD.user_id
     OR NEW.created_at != OLD.created_at THEN
    RAISE EXCEPTION 'Спроба несанкціонованої зміни захищених системних колонок';
  END IF;

  -- Оновлюємо timestamp
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_posts_protect_update ON forum_posts;
CREATE TRIGGER trg_forum_posts_protect_update
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION protect_forum_posts_update();

-- 6. БЕЗПЕЧНА RPC-ФУНКЦІЯ ДЛЯ ПЕРЕГЛЯДІВ (З ЗАХИСТОМ ТА SEARCH_PATH)
CREATE OR REPLACE FUNCTION increment_post_views(target_post_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Перевірка чи існує такий пост і чи він публічний
  IF NOT EXISTS (
    SELECT 1 FROM forum_posts 
    WHERE id = target_post_id AND is_public = true
  ) THEN
    RETURN;
  END IF;

  -- Атомарне збільшення без можливості впливати на інші поля
  UPDATE forum_posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = target_post_id;
END;
$$;

REVOKE ALL ON FUNCTION increment_post_views(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_post_views(TEXT) TO anon, authenticated, service_role;

-- 7. ТАБЛИЦЯ СКАРГ (COMMUNITY REPORTS) ТА ЇЇ ЗАХИСТ
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Тригер санітизації для скарг: примусово призначає reporter_id та status
CREATE OR REPLACE FUNCTION sanitize_community_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user = 'postgres' OR (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Перевірка авторизації
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Для подання скарги потрібна авторизація';
  END IF;

  -- Примусове встановлення reporter_id
  NEW.reporter_id := auth.uid()::text;

  -- Примусовий статус тільки 'pending' для звичайних користувачів
  NEW.status := 'pending';
  NEW.created_at := NOW();

  -- Перевірка існування цільового посту
  IF NOT EXISTS (SELECT 1 FROM forum_posts WHERE id = NEW.post_id) THEN
    RAISE EXCEPTION 'Цільову публікацію не знайдено';
  END IF;

  -- Захист від спаму: не дозволяти подавати повторну скаргу на той самий пост у статусі pending
  IF EXISTS (
    SELECT 1 FROM community_reports 
    WHERE reporter_id = NEW.reporter_id 
      AND post_id = NEW.post_id 
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Ви вже надіслали скаргу на цю публікацію. Модератори перевіряють її.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sanitize_community_report ON community_reports;
CREATE TRIGGER trg_sanitize_community_report
  BEFORE INSERT ON community_reports
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_community_report();

-- RLS для таблиці скарг
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_reports_insert_auth" ON community_reports;
CREATE POLICY "community_reports_insert_auth" ON community_reports
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "community_reports_select_admin" ON community_reports;
CREATE POLICY "community_reports_select_admin" ON community_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE uid = auth.uid()::text AND role = 'admin'
    )
  );

-- 8. СУВОРІ ПОЛІТИКИ БЕЗПЕКИ ДЛЯ FORUM_POSTS
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_posts_read_all" ON forum_posts;
CREATE POLICY "forum_posts_read_all" ON forum_posts
  FOR SELECT
  USING (is_public = true OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "forum_posts_insert_auth" ON forum_posts;
CREATE POLICY "forum_posts_insert_auth" ON forum_posts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = user_id);

DROP POLICY IF EXISTS "forum_posts_update_own" ON forum_posts;
CREATE POLICY "forum_posts_update_own" ON forum_posts
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "forum_posts_delete_own" ON forum_posts;
CREATE POLICY "forum_posts_delete_own" ON forum_posts
  FOR DELETE
  USING (
    auth.uid()::text = user_id 
    OR EXISTS (
      SELECT 1 FROM users WHERE uid = auth.uid()::text AND role = 'admin'
    )
  );

COMMIT;
