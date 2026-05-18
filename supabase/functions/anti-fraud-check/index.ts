import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Anti-fraud: detect suspicious referral patterns
async function runFraudCheck(supabase: any) {
  const logs: string[] = [];

  // 1. Check for cyclic referrals (should be blocked by trigger, but double-check)
  const { data: cycles } = await supabase.rpc('check_cyclic_referrals_audit').catch(() => ({ data: null }));
  if (cycles?.length) logs.push(`⚠️ Cyclic referrals detected: ${cycles.length}`);

  // 2. Find users who registered 5+ accounts in the last hour from metadata patterns
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { data: suspicious } = await supabase
    .from('user_relationships')
    .select('parent_id, count(*)')
    .gte('created_at', oneHourAgo)
    .limit(100);

  if (suspicious) {
    const counts = new Map<string, number>();
    for (const row of suspicious) {
      counts.set(row.parent_id, (counts.get(row.parent_id) || 0) + 1);
    }
    for (const [parentId, count] of counts) {
      if (count >= 5) {
        logs.push(`🚨 High referral rate: user ${parentId.slice(0, 8)} created ${count} relationships in 1h`);
        await supabase.from('audit_logs').insert({
          action: 'FRAUD_ALERT',
          target: parentId,
          meta: { type: 'high_referral_rate', count, window: '1h' }
        });
      }
    }
  }

  return logs;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // This function is called by Supabase Cron or admin manually
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

    const fraudLogs = await runFraudCheck(supabase);

    // Log the check run
    await supabase.from('audit_logs').insert({
      action: 'FRAUD_CHECK_RUN',
      meta: { results: fraudLogs, timestamp: new Date().toISOString() }
    });

    return new Response(JSON.stringify({ success: true, alerts: fraudLogs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
