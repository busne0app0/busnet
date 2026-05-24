-- ============================================================
-- BUSNET UA — Carrier Portal Missing Tables Fix
-- ============================================================

-- 1. CARRIER DOCUMENTS
CREATE TABLE IF NOT EXISTS public.carrier_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id   TEXT NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT,
  size         TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  url          TEXT,
  "storagePath" TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carrier_documents_carrier_id ON public.carrier_documents(carrier_id);

ALTER TABLE public.carrier_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carrier_manage_own_documents" ON public.carrier_documents;
CREATE POLICY "carrier_manage_own_documents" ON public.carrier_documents
  FOR ALL USING (carrier_id = auth.uid()::text) WITH CHECK (carrier_id = auth.uid()::text);


-- 2. PAYOUTS
CREATE TABLE IF NOT EXISTS public.payouts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id   TEXT NOT NULL,
  amount       NUMERIC NOT NULL,
  status       TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_carrier_id ON public.payouts(carrier_id);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carrier_view_own_payouts" ON public.payouts;
CREATE POLICY "carrier_view_own_payouts" ON public.payouts
  FOR SELECT USING (carrier_id = auth.uid()::text);

DROP POLICY IF EXISTS "carrier_insert_own_payouts" ON public.payouts;
CREATE POLICY "carrier_insert_own_payouts" ON public.payouts
  FOR INSERT WITH CHECK (carrier_id = auth.uid()::text);


-- 3. ANALYTICS
CREATE TABLE IF NOT EXISTS public.analytics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id    TEXT NOT NULL UNIQUE,
  clicks        INTEGER DEFAULT 0,
  registrations INTEGER DEFAULT 0,
  sales         INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_carrier_id ON public.analytics(carrier_id);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carrier_view_own_analytics" ON public.analytics;
CREATE POLICY "carrier_view_own_analytics" ON public.analytics
  FOR SELECT USING (carrier_id = auth.uid()::text);


-- 4. REVIEWS - Add missing column
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS carrier_reply TEXT;


-- 5. CARRIER DOCUMENTS - Add missing columns for UI
ALTER TABLE public.carrier_documents ADD COLUMN IF NOT EXISTS "expiryDate" TEXT;
ALTER TABLE public.carrier_documents ADD COLUMN IF NOT EXISTS "uploadedAt" TEXT;
ALTER TABLE public.carrier_documents ADD COLUMN IF NOT EXISTS "downloadUrl" TEXT;


-- 6. STORAGE BUCKETS - Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('carrier_docs', 'carrier_docs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;


-- 7. STORAGE POLICIES - Configure RLS for storage buckets
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Carrier Upload Policy" ON storage.objects;
CREATE POLICY "Carrier Upload Policy" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'carrier_docs' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Chat Attachments Upload Policy" ON storage.objects;
CREATE POLICY "Chat Attachments Upload Policy" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'chat-attachments'
);

DROP POLICY IF EXISTS "Carrier Delete Policy" ON storage.objects;
CREATE POLICY "Carrier Delete Policy" ON storage.objects FOR DELETE USING (
  bucket_id = 'carrier_docs' AND auth.role() = 'authenticated'
);

