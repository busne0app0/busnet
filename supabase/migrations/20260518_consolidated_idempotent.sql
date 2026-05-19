-- ============================================================
-- BUSNET UA — Consolidated Idempotent Migration
-- Safe to run multiple times (all CREATE IF NOT EXISTS / DROP IF EXISTS)
-- ============================================================

-- ============================================================
-- 1. SUPPORT TICKETS — Add missing columns
-- ============================================================
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS user_id        TEXT,
  ADD COLUMN IF NOT EXISTS carrier_id     TEXT,
  ADD COLUMN IF NOT EXISTS trip_id        TEXT,
  ADD COLUMN IF NOT EXISTS agent_id       UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS booking_id     UUID,
  ADD COLUMN IF NOT EXISTS assigned_to    TEXT DEFAULT 'ai' CHECK (assigned_to IN ('ai', 'carrier', 'admin')),
  ADD COLUMN IF NOT EXISTS status         TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated')),
  ADD COLUMN IF NOT EXISTS last_updated   TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS chat_type      TEXT DEFAULT 'support' CHECK (chat_type IN ('support', 'b2b_carrier_agent', 'b2b_admin_carrier', 'b2b_admin_agent', 'b2c_agent_passenger'));

-- ============================================================
-- 2. TICKET MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'ai', 'carrier', 'admin', 'system')),
  text        TEXT NOT NULL,
  sender_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id   ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_carrier_id ON public.support_tickets(carrier_id);

-- ============================================================
-- 3. USER RELATIONSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_relationships (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type           TEXT NOT NULL DEFAULT 'carrier_to_agent',
  custom_commission_percentage NUMERIC DEFAULT 10,
  status                      TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'review')),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

-- ============================================================
-- 4. REFERRAL LINKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referral_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL CHECK (target_role IN ('agent', 'passenger')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. DIRECT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. AGENT CLIENTS (CRM)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT,
  first_name   TEXT,
  last_name    TEXT,
  phone        TEXT,
  email        TEXT,
  passenger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. SYSTEM SETTINGS (AI toggle, platform commission)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.system_settings (key, value)
VALUES ('ai_autopilot_enabled', 'true'), ('platform_commission_pct', '5')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 8. AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  target     TEXT,
  meta       JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. ENABLE RLS
-- ============================================================
ALTER TABLE public.support_tickets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. RLS POLICIES — SUPPORT TICKETS
-- ============================================================
DROP POLICY IF EXISTS "passenger_select_own_ticket" ON public.support_tickets;
CREATE POLICY "passenger_select_own_ticket" ON public.support_tickets FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "passenger_insert_own_ticket" ON public.support_tickets;
CREATE POLICY "passenger_insert_own_ticket" ON public.support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "passenger_update_own_ticket" ON public.support_tickets;
CREATE POLICY "passenger_update_own_ticket" ON public.support_tickets FOR UPDATE
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "carrier_select_assigned_ticket" ON public.support_tickets;
CREATE POLICY "carrier_select_assigned_ticket" ON public.support_tickets FOR SELECT
  USING (carrier_id = auth.uid()::text);

DROP POLICY IF EXISTS "carrier_update_assigned_ticket" ON public.support_tickets;
CREATE POLICY "carrier_update_assigned_ticket" ON public.support_tickets FOR UPDATE
  USING (carrier_id = auth.uid()::text);

DROP POLICY IF EXISTS "agent_select_referral_ticket" ON public.support_tickets;
CREATE POLICY "agent_select_referral_ticket" ON public.support_tickets FOR SELECT
  USING (agent_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "admin_full_access_tickets" ON public.support_tickets;
CREATE POLICY "admin_full_access_tickets" ON public.support_tickets FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 11. RLS POLICIES — TICKET MESSAGES
-- ============================================================
DROP POLICY IF EXISTS "ticket_participant_select_messages" ON public.ticket_messages;
CREATE POLICY "ticket_participant_select_messages" ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id::text = ticket_messages.ticket_id::text
        AND (
          t.user_id    = auth.uid()::text OR
          t.carrier_id = auth.uid()::text OR
          t.agent_id::text = auth.uid()::text OR
          (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "passenger_insert_message" ON public.ticket_messages;
CREATE POLICY "passenger_insert_message" ON public.ticket_messages FOR INSERT
  WITH CHECK (
    role = 'user' AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id::text = ticket_messages.ticket_id::text
        AND t.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "carrier_insert_message" ON public.ticket_messages;
CREATE POLICY "carrier_insert_message" ON public.ticket_messages FOR INSERT
  WITH CHECK (
    role = 'carrier' AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id::text = ticket_messages.ticket_id::text
        AND t.carrier_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "admin_insert_message" ON public.ticket_messages;
CREATE POLICY "admin_insert_message" ON public.ticket_messages FOR INSERT
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "service_role_insert_message" ON public.ticket_messages;
CREATE POLICY "service_role_insert_message" ON public.ticket_messages FOR INSERT
  WITH CHECK (true); -- Edge Functions use service role

-- ============================================================
-- 12. RLS POLICIES — USER RELATIONSHIPS
-- ============================================================
DROP POLICY IF EXISTS "Users can view their relationships" ON public.user_relationships;
CREATE POLICY "Users can view their relationships" ON public.user_relationships
  FOR SELECT USING (auth.uid() = parent_id OR auth.uid() = child_id);

DROP POLICY IF EXISTS "Carrier can manage relationships" ON public.user_relationships;
CREATE POLICY "Carrier can manage relationships" ON public.user_relationships
  FOR ALL USING (auth.uid() = parent_id);

-- ============================================================
-- 13. RLS POLICIES — REFERRAL LINKS
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their referral links" ON public.referral_links;
CREATE POLICY "Users can manage their referral links" ON public.referral_links
  FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Anyone can view active referral links" ON public.referral_links;
CREATE POLICY "Anyone can view active referral links" ON public.referral_links
  FOR SELECT USING (status = 'active');

-- ============================================================
-- 14. RLS POLICIES — DIRECT MESSAGES
-- ============================================================
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.direct_messages;
CREATE POLICY "Users can view their direct messages" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
CREATE POLICY "Users can send direct messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Admin can view all direct messages" ON public.direct_messages;
CREATE POLICY "Admin can view all direct messages" ON public.direct_messages
  FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 15. RLS POLICIES — AGENT CLIENTS
-- ============================================================
DROP POLICY IF EXISTS "Agents can manage their clients" ON public.agent_clients;
CREATE POLICY "Agents can manage their clients" ON public.agent_clients
  FOR ALL USING (auth.uid() = agent_id);

-- ============================================================
-- 16. RLS POLICIES — SYSTEM SETTINGS
-- ============================================================
DROP POLICY IF EXISTS "Admin can manage system settings" ON public.system_settings;
CREATE POLICY "Admin can manage system settings" ON public.system_settings
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Authenticated can read system settings" ON public.system_settings;
CREATE POLICY "Authenticated can read system settings" ON public.system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 17. RLS POLICIES — AUDIT LOGS
-- ============================================================
DROP POLICY IF EXISTS "Admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Admin can view audit logs" ON public.audit_logs
  FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 18. TRIGGER — Prevent Cyclic Referrals
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_cyclic_referrals() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    WITH RECURSIVE referral_tree AS (
      SELECT parent_id, child_id FROM public.user_relationships WHERE parent_id = NEW.child_id
      UNION ALL
      SELECT ur.parent_id, ur.child_id FROM public.user_relationships ur
      INNER JOIN referral_tree rt ON ur.parent_id = rt.child_id
    )
    SELECT 1 FROM referral_tree WHERE child_id = NEW.parent_id
  ) THEN
    RAISE EXCEPTION 'Cyclic referral detected: this would create a referral loop';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_cyclic_referrals ON public.user_relationships;
CREATE TRIGGER check_cyclic_referrals
  BEFORE INSERT OR UPDATE ON public.user_relationships
  FOR EACH ROW EXECUTE FUNCTION prevent_cyclic_referrals();

-- ============================================================
-- 19. TRIGGER — Auto-sync profile updates to agent_clients CRM
-- ============================================================
CREATE OR REPLACE FUNCTION sync_profile_to_crm() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agent_clients
  SET 
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
    email = COALESCE(NEW.email, email)
  WHERE passenger_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_user_crm_trigger ON auth.users;
CREATE TRIGGER sync_user_crm_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_profile_to_crm();

-- ============================================================
-- 20. VIEW — Open tickets for carrier/admin dashboard
-- ============================================================
CREATE OR REPLACE VIEW public.carrier_open_tickets AS
  SELECT
    t.id,
    t.user_id,
    t.carrier_id,
    t.agent_id,
    t.trip_id,
    t.booking_id,
    t.chat_type,
    t.assigned_to,
    t.status,
    t.last_updated,
    (
      SELECT m.text FROM public.ticket_messages m
      WHERE m.ticket_id::text = t.id::text
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message
  FROM public.support_tickets t
  WHERE t.assigned_to IN ('carrier', 'admin')
    AND t.status != 'resolved';

-- ============================================================
-- DONE
-- ============================================================
