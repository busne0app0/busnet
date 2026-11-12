-- ============================================================================
-- BUSNET CONNECT: КРОК 1 — ПЕРЕВІРКА СТАНУ БАЗИ ДАНИХ ПЕРЕД МІГРАЦІЄЮ
-- Виконайте цей скрипт у Supabase SQL Editor перед запуском міграції.
-- ЖОДНИХ ЗМІН НЕ ВНОСИТЬСЯ. ТІЛЬКИ ПЕРЕВІРКА ТА ДІАГНОСТИКА.
-- ============================================================================

-- 1. Перевірка наявності та кількості записів у таблицях форуму
SELECT 
  'forum_posts' AS table_name,
  COUNT(*) AS total_records,
  MIN(created_at) AS earliest_post,
  MAX(created_at) AS latest_post
FROM forum_posts
UNION ALL
SELECT 
  'forum_comments' AS table_name,
  COUNT(*) AS total_records,
  MIN(created_at) AS earliest_post,
  MAX(created_at) AS latest_post
FROM forum_comments;

-- 2. Перевірка поточної схеми колонок forum_posts
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'forum_posts'
ORDER BY ordinal_position;

-- 3. Перевірка існуючих RLS-політик для forum_posts та forum_comments
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('forum_posts', 'forum_comments');

-- 4. Перевірка наявності RPC-функції increment_likes
SELECT 
  routine_name, 
  routine_type, 
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('increment_likes', 'increment_post_views', 'check_community_post_rate_limit');

-- 5. Перевірка категорій у наявних публікаціях (для контролю коректного мапінгу)
SELECT 
  COALESCE(category, 'NULL') AS category_name, 
  COUNT(*) AS count_posts
FROM forum_posts
GROUP BY category
ORDER BY count_posts DESC;

