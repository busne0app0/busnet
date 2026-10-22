-- ============================================================
-- BUSNET UA: Migration 20261019
-- 1. Automatic trigger to create passenger profile on signup
-- 2. Backfill existing auth users missing in public.users
-- 3. Partner applications table with strict RLS
-- ============================================================

-- ------------------------------------------------------------
-- 1. Trigger function: handle_new_user()
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_phone text;
  v_role text;
BEGIN
  -- Safe extraction from raw_user_meta_data
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'first_name',
    split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
    ''
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'last_name',
    split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2),
    ''
  );

  v_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.phone,
    ''
  );

  -- All standard signups are passengers.
  -- Only existing trusted accounts or admin actions can grant carrier/agent.
  v_role := 'passenger';

  -- Insert profile if not exists
  INSERT INTO public.users (
    uid,
    email,
    role,
    "firstName",
    "lastName",
    phone,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id::text,
    COALESCE(NEW.email, ''),
    v_role,
    v_first_name,
    v_last_name,
    v_phone,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (uid) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = NOW()
  WHERE public.users.uid = NEW.id::text;

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Backfill: restore profiles for existing auth accounts
-- ------------------------------------------------------------
INSERT INTO public.users (
  uid,
  email,
  role,
  "firstName",
  "lastName",
  phone,
  status,
  created_at,
  updated_at
)
SELECT
  au.id::text,
  COALESCE(au.email, ''),
  'passenger',
  COALESCE(
    au.raw_user_meta_data->>'firstName',
    au.raw_user_meta_data->>'first_name',
    split_part(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 1),
    ''
  ),
  COALESCE(
    au.raw_user_meta_data->>'lastName',
    au.raw_user_meta_data->>'last_name',
    split_part(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 2),
    ''
  ),
  COALESCE(au.raw_user_meta_data->>'phone', au.phone, ''),
  'active',
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON u.uid = au.id::text
WHERE u.uid IS NULL
ON CONFLICT (uid) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Partner Applications table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('carrier', 'agent')),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  fleet_size text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated can submit new application with status = 'pending'
DROP POLICY IF EXISTS "Anyone can submit partner application" ON public.partner_applications;
CREATE POLICY "Anyone can submit partner application"
  ON public.partner_applications
  FOR INSERT
  WITH CHECK (status = 'pending');

-- Only admins can view applications
DROP POLICY IF EXISTS "Admins can view partner applications" ON public.partner_applications;
CREATE POLICY "Admins can view partner applications"
  ON public.partner_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.uid = auth.uid()::text
      AND public.users.role = 'admin'
    )
  );

-- Only admins can update applications (change status)
DROP POLICY IF EXISTS "Admins can update partner applications" ON public.partner_applications;
CREATE POLICY "Admins can update partner applications"
  ON public.partner_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.uid = auth.uid()::text
      AND public.users.role = 'admin'
    )
  );
