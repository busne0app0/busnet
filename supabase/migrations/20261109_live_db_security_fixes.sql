-- =========================================================================
-- BUSNET LIVE PRODUCTION SECURITY PATCH — STEP 1 of 4
-- Exact schema: public.users (uid TEXT), payouts.status CHECK ('processing','completed','failed')
-- ticket_messages columns: id, ticket_id, role, text, sender_name, created_at  (NO user_id)
-- bookings.contact JSONB  (NO passenger_phone / passenger_email flat columns)
-- bookings.id — TEXT (not UUID)
--
-- WHAT THIS FILE DOES (safe to apply now, does not touch booking reads/writes):
--   1. Trigger: carrier_documents — non-admin cannot self-approve
--   2. Trigger: payouts          — non-admin INSERT locked to 'processing'; amount frozen on UPDATE
--
-- WHAT THIS FILE INTENTIONALLY OMITS (see comments below):
--   • bookings SELECT/INSERT RLS  — requires front-end guest-flow fix first (see note A)
--   • ticket_messages INSERT RLS  — requires confirming how AI writes (see note B)
--   • notifications INSERT RLS    — low risk, included in Step 3
--   • claim_guest_booking RPC     — requires bookings.id type + contact format (see note C)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. CARRIER DOCUMENTS: non-admin cannot approve their own documents
--
-- Logic:
--   • INSERT  → always force status = 'pending'
--   • UPDATE  → freeze status at OLD value (admin must change it)
--   • service_role / NULL uid (background jobs) pass through unchanged
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_lock_carrier_document_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only restrict authenticated non-admins; let service_role / cron jobs pass
  IF auth.uid() IS NOT NULL
     AND coalesce(public.get_user_role(), '') <> 'admin'
  THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
    ELSE
      -- UPDATE: restore old status regardless of what carrier sent
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_carrier_doc_status ON public.carrier_documents;
CREATE TRIGGER trg_carrier_doc_status
  BEFORE INSERT OR UPDATE ON public.carrier_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_lock_carrier_document_status();

-- -------------------------------------------------------------------------
-- 2. PAYOUTS: non-admin cannot insert with status='completed' or change amount
--
-- payouts.status CHECK allows: 'processing' | 'completed' | 'failed'
-- So we lock INSERT to 'processing' (valid per CHECK).
-- On UPDATE we freeze both status AND amount for non-admins.
-- service_role (backend payout processor) passes through.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_lock_payout_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND coalesce(public.get_user_role(), '') <> 'admin'
  THEN
    IF TG_OP = 'INSERT' THEN
      -- Force initial status to 'processing' — valid per CHECK constraint
      NEW.status := 'processing';
    ELSE
      -- UPDATE: carrier cannot change status or amount
      NEW.status := OLD.status;
      NEW.amount := OLD.amount;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payout_status ON public.payouts;
CREATE TRIGGER trg_payout_status
  BEFORE INSERT OR UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_lock_payout_status();

-- =========================================================================
-- NOTES FOR STEPS 2–4 (do NOT apply until each prerequisite is met)
-- =========================================================================

-- NOTE A — bookings SELECT / INSERT RLS (Step 2, after front-end fix)
-- -----------------------------------------------------------------------
-- Current issue:
--   Guest flow does: supabase.rpc('create_booking').then(read back the row).
--   If we close USING(true) on SELECT before fixing the front-end,
--   the confirmation screen will stay blank because the returned row is blocked.
--
-- Front-end fix needed FIRST:
--   In useBookingStore.confirmBooking() — the RPC already returns
--   { booking_id, total_price, claim_token, … } in its JSONB response.
--   The store should NOT do a second .select() after the RPC call.
--   Once confirmed this is not happening, we can safely:
--     DROP POLICY "Allow users to view own bookings" ON public.bookings;
--     -- (the existing carrier + admin SELECT policies already exist)
--
-- INSERT on bookings for anon (WITH CHECK (true)) is a separate step:
--   Must be closed AFTER create_booking RPC is confirmed to work for guests,
--   because guests currently bypass RPC and insert directly.
--   Step: replace anon INSERT policy with: WITH CHECK (false) for anon,
--   and trust all booking creation goes through create_booking RPC.


-- NOTE B — ticket_messages INSERT RLS (Step 3)
-- -----------------------------------------------------------------------
-- ticket_messages has NO user_id column.
-- Columns: id UUID, ticket_id TEXT, role TEXT, text TEXT, sender_name TEXT, created_at.
--
-- Current policies that exist (from 20260518_consolidated_idempotent.sql):
--   • passenger_insert_message  — role='user'  AND ticket belongs to auth.uid()
--   • carrier_insert_message    — role='carrier' AND ticket.carrier_id = auth.uid()
--   • admin_insert_message      — jwt user_metadata.role = 'admin'
--   • service_role_insert_message — WITH CHECK (true)   ← the open one
--   • ai_insert_messages (possibly) — unknown
--
-- Question before closing service_role_insert_message:
--   Does the AI support bot write ticket_messages via service_role key (Edge Function)?
--   If YES → simply DROP the open policy; Edge Functions bypass RLS when using service_role.
--   If NO  → we need to know what role / key it uses before closing.
--
-- Action item: check Supabase Edge Functions dashboard — does search-altrans-trips
--   or any support function call supabase.from('ticket_messages').insert()?
--   If it uses createClient(url, SERVICE_ROLE_KEY) → safe to drop.


-- NOTE C — claim_guest_booking RPC (Step 4)
-- -----------------------------------------------------------------------
-- Needs confirmed schema before writing:
--   1. bookings.id type: TEXT or UUID? (migrations show TEXT; live DB may differ)
--   2. bookings.contact JSONB format: {"email":"...","phone":"..."} confirmed from useBookingStore
--   3. Does create_booking already return claim_token? If not, need to add it.
--
-- Once confirmed, the function signature will be:
--   claim_guest_booking(p_booking_id TEXT, p_claim_token UUID, p_user_email TEXT, p_user_phone TEXT)
--   It reads contact->>'email' and contact->>'phone' from bookings row.
--   It also needs bookings to have a claim_token column (UUID, nullable).
--   Adding: ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS claim_token UUID;
--   And create_booking RPC needs to: generate claim_token := gen_random_uuid() and return it.
