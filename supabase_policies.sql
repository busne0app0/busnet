-- Supabase RLS Policies for BUSNET UA
-- Execute this in the Supabase SQL Editor: https://app.supabase.com/project/_/sql

-----------------------------------------------------------
-- 1. USERS Table
-----------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = uid);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users WHERE uid = auth.uid() AND role = 'admin'
  )
);

-- Allow initial profile creation during signup/login
-- Note: This is where the 42501 error usually happens
CREATE POLICY "Users can insert their own profile" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = uid);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

-----------------------------------------------------------
-- 2. NOTIFICATIONS Table
-----------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = "userId");

CREATE POLICY "Users can update own notifications (mark as read)" 
ON notifications FOR UPDATE 
USING (auth.uid() = "userId");

-----------------------------------------------------------
-- 3. BOOKINGS Table
-----------------------------------------------------------
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT 
USING (auth.uid() = "userId");

CREATE POLICY "Carriers can view bookings for their trips" 
ON bookings FOR SELECT 
USING (auth.uid() = "carrierId");

CREATE POLICY "Users can insert own bookings" 
ON bookings FOR INSERT 
WITH CHECK (auth.uid() = "userId");

-----------------------------------------------------------
-- 4. FORUM Table
-----------------------------------------------------------
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forum posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can view forum comments" ON forum_comments FOR SELECT USING (true);

CREATE POLICY "Auth users can create forum posts" 
ON forum_posts FOR INSERT 
WITH CHECK (auth.uid() = "authorId");

CREATE POLICY "Auth users can create forum comments" 
ON forum_comments FOR INSERT 
WITH CHECK (auth.uid() = "authorId");

-----------------------------------------------------------
-- 5. PUBLIC TABLES (Read access for landing)
-----------------------------------------------------------
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for trips" ON trips FOR SELECT USING (true);
CREATE POLICY "Public read access for routes" ON routes FOR SELECT USING (true);

-- Only carriers can manage their own trips/routes
CREATE POLICY "Carriers can manage own trips" 
ON trips FOR ALL 
USING (auth.uid() = "carrierId");

CREATE POLICY "Carriers can manage own routes" 
ON routes FOR ALL 
USING (auth.uid() = "carrierId");

-----------------------------------------------------------
-- 6. SUPPORT TICKETS Table
-----------------------------------------------------------
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" 
ON support_tickets FOR SELECT 
USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own tickets" 
ON support_tickets FOR INSERT 
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own tickets" 
ON support_tickets FOR UPDATE 
USING (auth.uid() = "userId");
