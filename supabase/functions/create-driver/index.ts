import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Verify caller is authenticated carrier
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !caller) throw new Error('Unauthorized');

    // Verify caller is a carrier
    const { data: callerProfile } = await adminClient
      .from('users')
      .select('role, uid')
      .eq('uid', caller.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== 'carrier') {
      throw new Error('Only carriers can create driver accounts');
    }

    const { email, password, firstName, lastName, phone, licenseNumber, action, driverId, updates } = await req.json();

    // ── ACTION: create ──────────────────────────────────────────────────────────
    if (!action || action === 'create') {
      if (!email || !password || !firstName || !lastName) {
        throw new Error("Email, пароль, ім'я та прізвище обов'язкові");
      }
      if (password.length < 6) throw new Error('Пароль повинен містити щонайменше 6 символів');

      // Check if email already used
      const { data: existingUsers } = await adminClient
        .from('users')
        .select('uid, role')
        .eq('email', email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Користувач з таким email вже існує');
      }

      // Create auth user
      const { data: newAuthUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // skip email confirmation
        user_metadata: {
          role: 'driver',
          firstName,
          lastName,
          phone: phone || '',
          carrierId: callerProfile.uid,
        }
      });

      if (createErr) throw createErr;
      const driverUid = newAuthUser.user.id;

      // Insert into users table
      const { error: userInsertErr } = await adminClient.from('users').insert({
        uid: driverUid,
        email,
        role: 'driver',
        firstName,
        lastName,
        phone: phone || '',
        status: 'active',
        carrier_id: callerProfile.uid,
      });
      if (userInsertErr) console.warn('[create-driver] users insert:', userInsertErr.message);

      // Insert into drivers table
      const { data: driverRecord, error: driverInsertErr } = await adminClient
        .from('drivers')
        .insert({
          uid: driverUid,
          carrier_id: callerProfile.uid,
          firstName,
          lastName,
          phone: phone || '',
          licenseNumber: licenseNumber || '',
          rating: 5.0,
          status: 'active',
        })
        .select()
        .single();

      if (driverInsertErr) throw driverInsertErr;

      return new Response(JSON.stringify({ success: true, driver: driverRecord, uid: driverUid }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── ACTION: update ──────────────────────────────────────────────────────────
    if (action === 'update') {
      if (!driverId) throw new Error('driverId required');
      const { error } = await adminClient
        .from('drivers')
        .update(updates)
        .eq('id', driverId)
        .eq('carrier_id', callerProfile.uid);
      if (error) throw error;

      // Sync to users table if relevant fields changed
      if (updates.status || updates.firstName || updates.lastName || updates.phone) {
        const userUpdates: Record<string, any> = {};
        if (updates.status) userUpdates.status = updates.status === 'inactive' ? 'blocked' : 'active';
        if (updates.firstName) userUpdates.firstName = updates.firstName;
        if (updates.lastName) userUpdates.lastName = updates.lastName;
        if (updates.phone) userUpdates.phone = updates.phone;
        if (updates.uid) {
          await adminClient.from('users').update(userUpdates).eq('uid', updates.uid);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── ACTION: block ───────────────────────────────────────────────────────────
    if (action === 'block') {
      if (!driverId) throw new Error('driverId required');
      const { data: driver } = await adminClient
        .from('drivers').select('uid').eq('id', driverId).maybeSingle();

      await adminClient.from('drivers').update({ status: 'inactive' }).eq('id', driverId).eq('carrier_id', callerProfile.uid);
      if (driver?.uid) {
        await adminClient.from('users').update({ status: 'blocked' }).eq('uid', driver.uid);
        await adminClient.auth.admin.updateUserById(driver.uid, { ban_duration: '87600h' }); // 10 years = blocked
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── ACTION: unblock ─────────────────────────────────────────────────────────
    if (action === 'unblock') {
      if (!driverId) throw new Error('driverId required');
      const { data: driver } = await adminClient
        .from('drivers').select('uid').eq('id', driverId).maybeSingle();

      await adminClient.from('drivers').update({ status: 'active' }).eq('id', driverId).eq('carrier_id', callerProfile.uid);
      if (driver?.uid) {
        await adminClient.from('users').update({ status: 'active' }).eq('uid', driver.uid);
        await adminClient.auth.admin.updateUserById(driver.uid, { ban_duration: 'none' });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── ACTION: fire (soft delete — keeps record, marks fired) ──────────────────
    if (action === 'fire') {
      if (!driverId) throw new Error('driverId required');
      const { data: driver } = await adminClient
        .from('drivers').select('uid').eq('id', driverId).maybeSingle();

      await adminClient.from('drivers').update({ status: 'fired' }).eq('id', driverId).eq('carrier_id', callerProfile.uid);
      if (driver?.uid) {
        await adminClient.from('users').update({ status: 'blocked', carrier_id: null }).eq('uid', driver.uid);
        await adminClient.auth.admin.updateUserById(driver.uid, { ban_duration: '87600h' });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── ACTION: reset_password ──────────────────────────────────────────────────
    if (action === 'reset_password') {
      const { driverUid, newPassword } = await req.json().catch(() => ({ driverUid: null, newPassword: null }));
      const uid = updates?.uid || driverUid;
      if (!uid || !updates?.newPassword) throw new Error('uid та новий пароль обов\'язкові');
      const { error } = await adminClient.auth.admin.updateUserById(uid, { password: updates.newPassword });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unknown action');

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
