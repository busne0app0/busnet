-- Phase 1: B2B/B2C Chat Ecosystem and Referrals
-- 1. Modify support_tickets to add booking context and chat type
ALTER TABLE public.support_tickets 
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS booking_id UUID, -- Will point to bookings(id)
  ADD COLUMN IF NOT EXISTS chat_type TEXT DEFAULT 'support' CHECK (chat_type IN ('support', 'b2b_carrier_agent', 'b2b_admin_carrier', 'b2b_admin_agent', 'b2c_agent_passenger'));

-- 2. Create user_relationships (Tracks who invited who)
CREATE TABLE IF NOT EXISTS public.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('carrier_to_agent', 'agent_to_passenger', 'carrier_to_passenger')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

-- 3. Create referral_links (Allows generating invite links)
CREATE TABLE IF NOT EXISTS public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL CHECK (target_role IN ('agent', 'passenger')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create direct_messages (For pure B2B/B2C chat without a "ticket" status)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create agent_clients (Mini CRM for agents to manually add passengers without platform account)
CREATE TABLE IF NOT EXISTS public.agent_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies Setup (Enabling RLS for new tables)
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_clients ENABLE ROW LEVEL SECURITY;

-- Policies for user_relationships
CREATE POLICY "Users can view their relationships" ON public.user_relationships
  FOR SELECT USING (auth.uid() = parent_id OR auth.uid() = child_id);

-- Policies for referral_links
CREATE POLICY "Users can manage their referral links" ON public.referral_links
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active referral links" ON public.referral_links
  FOR SELECT USING (status = 'active');

-- Policies for direct_messages
CREATE POLICY "Users can view their direct messages" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send direct messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policies for agent_clients
CREATE POLICY "Agents can manage their clients" ON public.agent_clients
  FOR ALL USING (auth.uid() = agent_id);

-- Expand Support Tickets Policy
CREATE POLICY "Agents can view their referral chats" ON public.support_tickets
  FOR SELECT USING (auth.uid() = agent_id);
