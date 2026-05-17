import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const start = Date.now();

  try {
    // ── 1. Parse & validate input ────────────────────────────────────────────
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const { referralId, newUserId, customCommission } = body;

    if (!referralId || typeof referralId !== 'string' || referralId.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid referralId' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (!newUserId || typeof newUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid newUserId' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── 2. Validate referral link ────────────────────────────────────────────
    const { data: linkInfo, error: linkError } = await supabase
      .from('referral_links')
      .select('*')
      .eq('id', referralId)
      .single();

    if (linkError || !linkInfo) {
      return new Response(JSON.stringify({ error: 'Referral link not found' }), { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (linkInfo.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Referral link is inactive', code: 'INACTIVE' }), { status: 410, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const parentId = linkInfo.owner_id;

    // ── 3. Idempotency check — silently succeed if already linked ────────────
    const { data: existing } = await supabase
      .from('user_relationships')
      .select('id')
      .eq('parent_id', parentId)
      .eq('child_id', newUserId)
      .maybeSingle();

    if (existing) {
      console.log(`[process-referral] Already linked: ${parentId} -> ${newUserId} (${Date.now() - start}ms)`);
      return new Response(JSON.stringify({ success: true, message: 'Already linked', idempotent: true }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── 4. Create relationship ───────────────────────────────────────────────
    const relType = linkInfo.target_role === 'agent' ? 'carrier_agent' : 'agent_passenger';
    const commission = typeof customCommission === 'number' && customCommission > 0 && customCommission <= 100
      ? customCommission
      : (linkInfo.default_commission ?? 10);

    const { error: insertError } = await supabase
      .from('user_relationships')
      .insert({
        parent_id: parentId,
        child_id: newUserId,
        relationship_type: relType,
        status: 'active',
        custom_commission_percentage: commission,
      });

    if (insertError) {
      // Handle unique constraint race condition gracefully
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ success: true, message: 'Already linked (race)', idempotent: true }), {
          status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
      throw insertError;
    }

    // ── 5. CRM entry for passenger referrals ────────────────────────────────
    if (linkInfo.target_role === 'passenger') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, phone')
        .eq('id', newUserId)
        .single();

      if (profile) {
        const { error: crmError } = await supabase
          .from('agent_clients')
          .upsert({
            agent_id: parentId,
            passenger_id: newUserId,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Новий клієнт',
            phone: profile.phone || '',
            email: profile.email || '',
          }, { onConflict: 'agent_id,passenger_id', ignoreDuplicates: true });

        if (crmError) console.warn('[process-referral] CRM insert warning:', crmError.message);
      }
    }

    console.log(`[process-referral] Success: ${parentId} -> ${newUserId} | type=${relType} | commission=${commission}% | ${Date.now() - start}ms`);

    return new Response(JSON.stringify({ success: true, relationship_type: relType, commission }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[process-referral] Error:', err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
