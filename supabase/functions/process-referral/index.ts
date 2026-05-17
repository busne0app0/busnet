import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { referralId, newUserId } = await req.json();

    if (!referralId || !newUserId) {
      throw new Error('Missing referralId or newUserId');
    }

    // Initialize Supabase client with admin privileges
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get the referral link details
    const { data: linkInfo, error: linkError } = await supabaseClient
      .from('referral_links')
      .select('*')
      .eq('id', referralId)
      .single();

    if (linkError || !linkInfo) {
      throw new Error('Referral link not found or invalid');
    }

    if (linkInfo.status !== 'active') {
      throw new Error('Referral link is no longer active');
    }

    // 2. Create the relationship
    const parentId = linkInfo.owner_id;
    const relationshipType = linkInfo.target_role === 'agent' ? 'carrier_agent' : 'agent_passenger';

    // Check if relationship already exists
    const { data: existing } = await supabaseClient
      .from('user_relationships')
      .select('id')
      .eq('parent_id', parentId)
      .eq('child_id', newUserId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ message: 'Relationship already exists' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Insert new relationship
    const { error: insertError } = await supabaseClient
      .from('user_relationships')
      .insert({
        parent_id: parentId,
        child_id: newUserId,
        relationship_type: relationshipType,
        status: 'active'
      });

    if (insertError) throw insertError;

    // Optional: If target_role is 'passenger', also insert into agent_clients for CRM
    if (linkInfo.target_role === 'passenger') {
      // Get child profile to populate client details
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email, first_name, last_name, phone')
        .eq('id', newUserId)
        .single();
        
      if (profile) {
        await supabaseClient.from('agent_clients').insert({
          agent_id: parentId,
          passenger_id: newUserId,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          phone: profile.phone || '',
          email: profile.email
        });
      }
    }

    // 3. Update referral usage count (assuming we have one, if not just status)
    // We'll keep it simple: generic links stay active.

    return new Response(JSON.stringify({ success: true, message: 'Referral processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
