// Скрипт для создания администратора в Supabase
// Запуск: node create-admin.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://upwwhhfgpxgnxkbfwfve.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3doaGZncHhnbnhrYmZ3ZnZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzAyMjEzMiwiZXhwIjoyMDkyNTk4MTMyfQ.dDdw3aCqWmnKipEd_uUNCwhAxsU04NaiTFwg4nDp53E';

const ADMIN_EMAIL = 'admin@busnet.ua';
const ADMIN_PASSWORD = 'Admin2026!Busnet';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  console.log('Creating admin user...');

  // 1. Create or get the auth user
  let userId;

  // Try to create
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { firstName: 'Admin', lastName: 'Busnet' }
  });

  if (createError) {
    if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
      console.log('User already exists in Auth, fetching...');
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find(u => u.email === ADMIN_EMAIL);
      if (existing) {
        userId = existing.id;
        // Update password
        await supabase.auth.admin.updateUserById(userId, { password: ADMIN_PASSWORD, email_confirm: true });
        console.log('Password updated. UID:', userId);
      }
    } else {
      console.error('Auth create error:', createError.message);
      return;
    }
  } else {
    userId = created.user.id;
    console.log('Auth user created. UID:', userId);
  }

  if (!userId) {
    console.error('Could not get user ID');
    return;
  }

  // 2. Upsert into users table
  const { error: dbError } = await supabase.from('users').upsert({
    uid: userId,
    email: ADMIN_EMAIL,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Busnet',
    status: 'active'
  }, { onConflict: 'uid' });

  if (dbError) {
    console.error('DB error:', dbError.message);
    // Try update if insert fails
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin', status: 'active' })
      .eq('email', ADMIN_EMAIL);
    if (updateError) console.error('Update error:', updateError.message);
    else console.log('Existing user updated to admin role');
  } else {
    console.log('Admin record created/updated in users table');
  }

  console.log('\n✅ DONE!');
  console.log('Login URL: https://busnet-ua.vercel.app/admin/login');
  console.log('Email:', ADMIN_EMAIL);
  console.log('Password:', ADMIN_PASSWORD);
}

createAdmin().catch(console.error);
