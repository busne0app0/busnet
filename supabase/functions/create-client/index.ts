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
    
    // Check auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Auth Header');
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error('Unauthorized');
    
    const { name, phone, email, route, price, note } = await req.json();
    if (!name) throw new Error('Name is required');

    let passengerId = null;

    // If email is provided, try to create or find auth user
    if (email) {
      const { data: existingUser } = await supabaseClient.auth.admin.getUserById(email).catch(() => ({ data: null }));
      
      if (!existingUser) {
        const { data: newUser, error: createErr } = await supabaseClient.auth.admin.createUser({
          email,
          phone: phone || undefined,
          password: crypto.randomUUID(), // secure random password
          email_confirm: true,
          user_metadata: { role: 'passenger', full_name: name }
        });
        if (!createErr && newUser.user) passengerId = newUser.user.id;
      }
    }

    // Insert into agent_clients
    const { data: client, error: insertErr } = await supabaseClient
      .from('agent_clients')
      .insert({
        agent_id: user.id,
        name,
        phone,
        email,
        passenger_id: passengerId
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Optional: create a user_relationships link if passengerId exists
    if (passengerId) {
      await supabaseClient.from('user_relationships').upsert({
        parent_id: user.id,
        child_id: passengerId,
        relationship_type: 'agent_passenger',
        status: 'active'
      }, { onConflict: 'parent_id,child_id' });
    }

    return new Response(JSON.stringify({ success: true, client, passengerId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
