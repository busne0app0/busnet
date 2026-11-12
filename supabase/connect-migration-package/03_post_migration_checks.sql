-- ============================================================================
-- BUSNET CONNECT: КРОК 3 — ПЕРЕВІРКА ПІСЛЯ ЗАСТОСУВАННЯ МІГРАЦІЇ v2.0
-- Виконайте цей скрипт у Supabase SQL Editor для підтвердження успіху міграції.
-- ============================================================================

-- 1. Перевірка кількості записів (кількість має 100% співпадати з Кроком 1)
SELECT 
  'forum_posts' AS table_name,
  COUNT(*) AS total_records,
  COUNT(post_type) AS posts_with_type,
  COUNT(*) FILTER (WHERE is_indexable = false) AS non_indexable_posts,
  COUNT(*) FILTER (WHERE is_indexable = true) AS indexable_posts
FROM forum_posts
UNION ALL
SELECT 
  'forum_comments' AS table_name,
  COUNT(*) AS total_records,
  NULL, NULL, NULL
FROM forum_comments;

-- 2. Перевірка наявності всіх нових колонок у forum_posts
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'forum_posts'
  AND column_name IN ('post_type', 'image_url', 'route_from', 'route_to', 'meta', 'is_public', 'is_indexable', 'views_count', 'updated_at')
ORDER BY column_name;

-- 3. Перевірка створених індексів
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('forum_posts', 'forum_comments', 'community_reports')
ORDER BY tablename, indexname;

-- 4. Перевірка активності тригерів безпеки
SELECT 
  event_object_table, 
  trigger_name, 
  event_manipulation, 
  action_statement, 
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table IN ('forum_posts', 'community_reports')
ORDER BY event_object_table, trigger_name;

-- 5. Перевірка RLS-політик на таблицях
SELECT 
  tablename, 
  policyname, 
  cmd, 
  roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('forum_posts', 'community_reports')
ORDER BY tablename, policyname;

-- 6. Перевірка структури та зовнішнього ключа таблиці скарг
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'community_reports'
ORDER BY ordinal_position;

-- 7. Перевірка наявності функцій та їх security_type
SELECT 
  routine_name, 
  routine_type, 
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('check_community_post_rate_limit', 'protect_forum_posts_update', 'increment_post_views', 'sanitize_community_report');
