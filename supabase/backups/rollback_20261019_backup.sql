-- ============================================================
-- BUSNET UA: ROLLBACK BACKUP — 2026-10-19
-- Contains snapshots of previous policies and trigger definitions
-- ============================================================

-- Original policies snapshot from supabase_policies.sql:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = uid);

DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
CREATE POLICY "Admins can view all profiles" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE uid = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = uid);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);

-- To rollback trigger on auth.users:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.partner_applications;
