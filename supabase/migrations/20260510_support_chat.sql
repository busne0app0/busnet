-- ============================================================
-- BUSNET Support System — Supabase Migration
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. Drop old support_tickets messages column if exists (migrate to separate table)
ALTER TABLE public.support_tickets
  DROP COLUMN IF EXISTS messages;

-- 2. Add new columns to support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS user_id        text,
  ADD COLUMN IF NOT EXISTS carrier_id     text,
  ADD COLUMN IF NOT EXISTS trip_id        text,
  ADD COLUMN IF NOT EXISTS assigned_to    text DEFAULT 'ai' CHECK (assigned_to IN ('ai', 'carrier', 'admin')),
  ADD COLUMN IF NOT EXISTS status         text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated')),
  ADD COLUMN IF NOT EXISTS last_updated   timestamptz DEFAULT now();

-- 3. Create ticket_messages table (fixes race condition)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   text NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'ai', 'carrier', 'admin', 'system')),
  text        text NOT NULL,
  sender_name text,
  created_at  timestamptz DEFAULT now()
);

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id   ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_carrier_id ON public.support_tickets(carrier_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned   ON public.support_tickets(assigned_to);

-- ============================================================
-- 5. Enable Realtime for both tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- ============================================================
-- 6. Row Level Security
-- ============================================================
ALTER TABLE public.support_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages  ENABLE ROW LEVEL SECURITY;

-- Passenger: can see only their own tickets
CREATE POLICY "passenger_select_own_ticket"
  ON public.support_tickets FOR SELECT
  USING (user_id = auth.uid()::text);

-- Passenger: can create their own ticket
CREATE POLICY "passenger_insert_own_ticket"
  ON public.support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Passenger: can update their own ticket
CREATE POLICY "passenger_update_own_ticket"
  ON public.support_tickets FOR UPDATE
  USING (user_id = auth.uid()::text);

-- Carrier: can see & update tickets assigned to them
CREATE POLICY "carrier_select_assigned_ticket"
  ON public.support_tickets FOR SELECT
  USING (carrier_id = auth.uid()::text);

CREATE POLICY "carrier_update_assigned_ticket"
  ON public.support_tickets FOR UPDATE
  USING (carrier_id = auth.uid()::text);

-- Admin: full access
CREATE POLICY "admin_full_access_tickets"
  ON public.support_tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ticket_messages: anyone in the ticket can read
CREATE POLICY "ticket_participant_select_messages"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
        AND (
          t.user_id    = auth.uid()::text OR
          t.carrier_id = auth.uid()::text OR
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

-- Passenger can insert user messages
CREATE POLICY "passenger_insert_message"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    role = 'user' AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
        AND t.user_id = auth.uid()::text
    )
  );

-- Carrier can insert carrier messages
CREATE POLICY "carrier_insert_message"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    role = 'carrier' AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
        AND t.carrier_id = auth.uid()::text
    )
  );

-- Admin can insert any messages
CREATE POLICY "admin_insert_message"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 7. Carrier/Admin view of open tickets
-- ============================================================
CREATE OR REPLACE VIEW public.carrier_open_tickets AS
  SELECT
    t.id,
    t.user_id,
    t.carrier_id,
    t.trip_id,
    t.assigned_to,
    t.status,
    t.last_updated,
    (
      SELECT m.text FROM public.ticket_messages m
      WHERE m.ticket_id = t.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message
  FROM public.support_tickets t
  WHERE t.assigned_to IN ('carrier', 'admin')
    AND t.status != 'resolved';

-- ============================================================
-- DONE! Now go to:
-- Supabase Dashboard > Database > Replication
-- Enable INSERT + UPDATE + DELETE for:
--   - support_tickets
--   - ticket_messages
-- ============================================================
