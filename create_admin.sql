-- Запустіть цей скрипт у Supabase SQL Editor
-- https://app.supabase.com -> SQL Editor

-- 1. Спочатку ОБОВ'ЯЗКОВО зареєструйте адміна через Supabase Auth Dashboard:
--    Authentication -> Users -> Add user
--    Email: admin@busnet.ua
--    Password: Admin2026!Busnet
--    Позначте "Auto Confirm User"
--    Запишіть UUID який буде створений

-- 2. Замініть 'PUT_ADMIN_UUID_HERE' на реальний UUID з кроку 1, потім виконайте:

INSERT INTO users (uid, email, role, "firstName", "lastName", status)
VALUES (
  'PUT_ADMIN_UUID_HERE',
  'admin@busnet.ua',
  'admin',
  'Admin',
  'Busnet',
  'active'
)
ON CONFLICT (uid) DO UPDATE SET role = 'admin', status = 'active';

-- 3. Перевірити що запис є:
SELECT uid, email, role FROM users WHERE email = 'admin@busnet.ua';
