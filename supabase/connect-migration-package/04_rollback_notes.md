# План відкату міграції v2.0 (Rollback Notes)

> [!CAUTION]
> Ніколи не виконуйте `DROP TABLE forum_posts` або `DROP TABLE forum_comments`! Це призведе до безповоротної втрати користувацьких публікацій та коментарів.

Якщо під час виконання Кроку 2 виникла помилка і потрібно безпечно повернути стан бази даних до вихідного, скористайтеся наведеними нижче безпечними кроками.

---

### Сценарій 1: Автоматичний відкат транзакції
Файл `02_connect_foundation.sql` виконується у блоці `BEGIN; ... COMMIT;`.
Якщо виникає синтаксична або структурна помилка під час виконання, PostgreSQL автоматично скасовує всі зміни (`ROLLBACK`), і база даних залишається цілісною.

---

### Сценарій 2: Ручний відкат після застосування міграції
Якщо ви хочете прибрати нові тригери, індекси та таблицю скарг без шкоди для даних:

```sql
BEGIN;

-- 1. Видалення тригерів та функцій захисту
DROP TRIGGER IF EXISTS trg_forum_posts_rate_limit ON forum_posts;
DROP FUNCTION IF EXISTS check_community_post_rate_limit();

DROP TRIGGER IF EXISTS trg_forum_posts_protect_update ON forum_posts;
DROP FUNCTION IF EXISTS protect_forum_posts_update();

DROP TRIGGER IF EXISTS trg_sanitize_community_report ON community_reports;
DROP FUNCTION IF EXISTS sanitize_community_report();

DROP FUNCTION IF EXISTS increment_post_views(TEXT);

-- 2. Видалення таблиці скарг
DROP TABLE IF EXISTS community_reports CASCADE;

-- 3. Видалення створених індексів
DROP INDEX IF EXISTS idx_forum_posts_user_id;
DROP INDEX IF EXISTS idx_forum_posts_created_at;
DROP INDEX IF EXISTS idx_forum_posts_post_type;
DROP INDEX IF EXISTS idx_forum_posts_is_public;
DROP INDEX IF EXISTS idx_forum_posts_is_indexable;
DROP INDEX IF EXISTS idx_forum_comments_post_id;

-- 4. Повернення первинних RLS-політик forum_posts
DROP POLICY IF EXISTS "forum_posts_read_all" ON forum_posts;
CREATE POLICY "forum_posts_read_all" ON forum_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "forum_posts_insert_auth" ON forum_posts;
CREATE POLICY "forum_posts_insert_auth" ON forum_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "forum_posts_update_own" ON forum_posts;
CREATE POLICY "forum_posts_update_own" ON forum_posts FOR UPDATE USING (auth.uid()::text = user_id);

COMMIT;
```
