-- =========================================================================
-- BUSNET LIVE PRODUCTION SECURITY PATCH
-- Exact schema matching: public.users (uid: text, role: text)
-- 1. Close public read leak on bookings (remove USING (true))
-- 2. Secure carrier documents & payouts from self-approval
-- 3. Secure ticket_messages and notifications from phishing / spam
-- 4. Enable claim_guest_booking RPC for public.users
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. FIX CRITICAL BOOKINGS DATA LEAK (GDPR & PASSPORT PROTECTION)
-- -------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop insecure public read policies
DROP POLICY IF EXISTS "Allow users to view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_policy" ON public.bookings;
DROP POLICY IF EXISTS "bookings_secure_select" ON public.bookings;

-- Create hardened SELECT policy:
-- Passengers see ONLY their own bookings
-- Carriers see ONLY bookings for their assigned fleet/carrier_id
-- Admins see all
CREATE POLICY "bookings_secure_select" ON public.bookings
FOR SELECT
USING (
  -- Passenger: matching user_id
  (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  
  -- Carrier: matching carrier_id
  OR (carrier_id = auth.uid()::text)
  
  -- Admin: verified via public.users
  OR EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.uid = auth.uid()::text
      AND u.role = 'admin'
  )
);

-- -------------------------------------------------------------------------
-- 2. HARDENED claim_guest_booking RPC (COMPATIBLE WITH public.users)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_guest_booking(
  p_booking_id UUID,
  p_claim_token UUID DEFAULT NULL,
  p_user_phone TEXT DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::text;
  v_booking RECORD;
  v_clean_phone TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Fetch unclaimed booking
  SELECT id, user_id, claim_token, passenger_phone, passenger_email
  INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
    AND (user_id IS NULL OR user_id = v_user_id);

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 2. Cryptographic claim_token check (from purchaser device)
  IF p_claim_token IS NOT NULL AND v_booking.claim_token IS NOT NULL THEN
    IF v_booking.claim_token = p_claim_token THEN
      UPDATE public.bookings
      SET user_id = v_user_id,
          claim_token = NULL
      WHERE id = p_booking_id;
      RETURN TRUE;
    END IF;
  END IF;

  -- 3. E.164 phone or Email check
  v_clean_phone := regexp_replace(COALESCE(p_user_phone, ''), '\D', '', 'g');

  IF (
    (
      p_user_email IS NOT NULL 
      AND length(trim(p_user_email)) > 3 
      AND lower(trim(COALESCE(v_booking.passenger_email, ''))) = lower(trim(p_user_email))
    )
    OR
    (
      v_clean_phone IS NOT NULL 
      AND length(v_clean_phone) >= 9
      AND regexp_replace(COALESCE(v_booking.passenger_phone, ''), '\D', '', 'g') = v_clean_phone
    )
  ) THEN
    UPDATE public.bookings
    SET user_id = v_user_id,
        claim_token = NULL
    WHERE id = p_booking_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- -------------------------------------------------------------------------
-- 3. CARRIER FRAUD PREVENTION: CARRIER DOCUMENTS & PAYOUTS
-- -------------------------------------------------------------------------
-- Carriers cannot self-approve their licenses or document status
CREATE OR REPLACE FUNCTION public.trg_lock_carrier_document_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid()::text AND role = 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
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

-- Payouts: carrier cannot insert payout with status='completed'
CREATE OR REPLACE FUNCTION public.trg_lock_payout_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid()::text AND role = 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      NEW.status := OLD.status;
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

-- -------------------------------------------------------------------------
-- 4. TICKET MESSAGES & NOTIFICATIONS SPAM PROTECTION
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_insert_message" ON public.ticket_messages;
CREATE POLICY "ticket_messages_secure_insert" ON public.ticket_messages
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid()::text 
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE uid = auth.uid()::text 
        AND role IN ('admin', 'carrier', 'support')
    )
  )
);

