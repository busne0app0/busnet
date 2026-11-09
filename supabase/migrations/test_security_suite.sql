-- =========================================================================
-- BUSNET SECURITY VALIDATION & PENETRATION TEST SUITE
-- Run this in Supabase SQL Editor to test defense mechanisms.
-- =========================================================================

DO $$
DECLARE
  v_test_route_id TEXT := 'test-security-route-001';
  v_test_date DATE := CURRENT_DATE + INTERVAL '10 days';
  v_res JSONB;
  v_booking_1 UUID;
  v_booking_2 UUID;
  v_claim_res BOOLEAN;
BEGIN
  RAISE NOTICE '>>> TEST 1: ATOMIC OVERBOOKING & UNIQUE SEAT LOCK';
  
  -- Create seat 12 booking
  INSERT INTO booking_seats (route_id, departure_date, seat_number, status)
  VALUES (v_test_route_id, v_test_date, '12', 'confirmed');

  -- Attempt to book the same seat 12 on the same route & date
  BEGIN
    INSERT INTO booking_seats (route_id, departure_date, seat_number, status)
    VALUES (v_test_route_id, v_test_date, '12', 'confirmed');
    
    RAISE EXCEPTION 'TEST 1 FAILED: Double booking was allowed!';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'SUCCESS: Duplicate seat booking blocked by uq_route_date_seat_active.';
  END;

  RAISE NOTICE '>>> TEST 2: ANTI-ROLE ESCALATION TRIGGER';
  -- Create test profile
  INSERT INTO profiles (id, role, first_name)
  VALUES ('00000000-0000-0000-0000-000000000099', 'passenger', 'Test Passenger')
  ON CONFLICT (id) DO UPDATE SET role = 'passenger';

  -- Simulate client-side update trying to become 'admin'
  UPDATE profiles
  SET role = 'admin'
  WHERE id = '00000000-0000-0000-0000-000000000099';

  -- Verify role remains 'passenger'
  IF (SELECT role FROM profiles WHERE id = '00000000-0000-0000-0000-000000000099') = 'admin' THEN
    RAISE EXCEPTION 'TEST 2 FAILED: User was able to elevate role to admin!';
  ELSE
    RAISE NOTICE 'SUCCESS: Role escalation thwarted by trg_protect_profile_role.';
  END IF;

  RAISE NOTICE '>>> TEST 3: ANTI-IDOR GUEST CLAIM TOKEN';
  -- Create a guest booking with a secret claim_token
  INSERT INTO bookings (
    id, route_id, passenger_phone, passenger_email, user_id, claim_token, status
  ) VALUES (
    '00000000-0000-0000-0000-000000000088',
    v_test_route_id,
    '+380991112233',
    'real.victim@example.com',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'confirmed'
  ) ON CONFLICT (id) DO NOTHING;

  -- Test hacker trying to claim without token or contact match
  SELECT claim_guest_booking(
    '00000000-0000-0000-0000-000000000088',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- wrong token
    '+380509999999',                        -- wrong phone
    'hacker@attacker.com'                   -- wrong email
  ) INTO v_claim_res;

  IF v_claim_res = TRUE THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Attacker claimed booking without credentials!';
  ELSE
    RAISE NOTICE 'SUCCESS: Unauthorized claim rejected by claim_guest_booking.';
  END IF;

  -- Clean up test records
  DELETE FROM booking_seats WHERE route_id = v_test_route_id;
  DELETE FROM bookings WHERE id = '00000000-0000-0000-0000-000000000088';
  DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000099';

  RAISE NOTICE '>>> ALL SECURITY TESTS PASSED PERFECTLY!';
END $$;
