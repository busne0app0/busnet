-- Phase 2: CRM and Architecture Fixes

-- 1. Modify user_relationships for custom_commission_percentage and status
ALTER TABLE public.user_relationships 
  ADD COLUMN IF NOT EXISTS custom_commission_percentage NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'review'));

-- Fix constraint if relationship_type was restrictive
ALTER TABLE public.user_relationships DROP CONSTRAINT IF EXISTS user_relationships_relationship_type_check;
ALTER TABLE public.user_relationships ADD CONSTRAINT user_relationships_relationship_type_check 
  CHECK (relationship_type IN ('carrier_agent', 'agent_passenger', 'carrier_to_agent', 'agent_to_passenger', 'carrier_to_passenger'));

-- 2. Modify agent_clients to add passenger_id and name
ALTER TABLE public.agent_clients
  ADD COLUMN IF NOT EXISTS passenger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Move first_name + last_name to name if name is null
UPDATE public.agent_clients SET name = first_name || ' ' || last_name WHERE name IS NULL;

-- 3. Prevent cyclic referrals trigger
CREATE OR REPLACE FUNCTION prevent_cyclic_referrals() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    WITH RECURSIVE referral_tree AS (
      SELECT parent_id, child_id FROM user_relationships WHERE parent_id = NEW.child_id
      UNION ALL
      SELECT ur.parent_id, ur.child_id FROM user_relationships ur
      INNER JOIN referral_tree rt ON ur.parent_id = rt.child_id
    )
    SELECT 1 FROM referral_tree WHERE child_id = NEW.parent_id
  ) THEN
    RAISE EXCEPTION 'Cyclic referral detected';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_cyclic_referrals ON user_relationships;
CREATE TRIGGER check_cyclic_referrals
  BEFORE INSERT OR UPDATE ON user_relationships
  FOR EACH ROW EXECUTE FUNCTION prevent_cyclic_referrals();

-- 4. Sync users to agent_clients trigger
CREATE OR REPLACE FUNCTION sync_profile_to_crm() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS DISTINCT FROM OLD.phone OR NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.agent_clients
    SET phone = NEW.phone, email = NEW.email
    WHERE passenger_id = NEW.uid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Assuming table is 'users' based on previous context
DROP TRIGGER IF EXISTS sync_user_crm_trigger ON users;
CREATE TRIGGER sync_user_crm_trigger
  AFTER UPDATE OF phone, email ON users
  FOR EACH ROW EXECUTE FUNCTION sync_profile_to_crm();
