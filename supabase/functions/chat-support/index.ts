import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter (resets on cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Auth Header');

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error('Unauthorized');

    // Rate limit: max 5 messages per minute per user
    if (!checkRateLimit(`msg_${user.id}`, 5)) {
      return new Response(JSON.stringify({ error: 'Забагато запитів. Зачекайте хвилину.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, ticketId, userId, userRole, history } = await req.json();
    if (!message || !ticketId) throw new Error('Missing message or ticketId');

    // Fetch AI toggle status
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'ai_autopilot_enabled')
      .single();

    const aiEnabled = settings?.value !== 'false';
    if (!aiEnabled) {
      // AI is off — escalate immediately to admin
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        role: 'system',
        text: 'AI-асистент тимчасово відключено. Ваш запит передано до оператора.',
        sender_name: null
      });
      await supabase.from('support_tickets').update({
        assigned_to: 'admin',
        status: 'escalated',
        last_updated: new Date().toISOString()
      }).eq('id', ticketId);
      return new Response(JSON.stringify({ reply: null, escalate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch ticket context
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('booking_id, chat_type, carrier_id')
      .eq('id', ticketId)
      .single();

    // Build system prompt with context
    const rolePrompts: Record<string, string> = {
      passenger: 'Ти — AI Консьєрж BUSNET. Допомагаєш пасажирам з квитками, розкладом, поверненнями. Відповідай лише по темі транспорту.',
      carrier: 'Ти — AI-асистент для перевізників BUSNET. Допомагаєш з управлінням рейсами, агентами та звітністю.',
      agent: 'Ти — AI-помічник для агентів BUSNET. Допомагаєш з комісіями, бронюваннями клієнтів та реферальними лінками.',
      driver: 'Ти — AI-диспетчер для водіїв BUSNET. Надаєш маршрути, списки пасажирів, технічну допомогу.',
      admin: 'Ти — внутрішній AI-інструмент для адміністраторів BUSNET. Допомагаєш з аналітикою та ескалаціями.',
    };

    const systemPrompt = (rolePrompts[userRole] || rolePrompts.passenger) +
      (ticket?.booking_id ? `\nКонтекст: квиток #${ticket.booking_id}.` : '') +
      '\nЯкщо не можеш допомогти — запропонуй оператора.';

    const apiKey = Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('AI_GATEWAY_KEY') ?? '';
    const apiUrl = Deno.env.get('AI_GATEWAY_URL') ?? 'https://api.openai.com/v1/chat/completions';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...((history || []).slice(-8).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }))),
      { role: 'user', content: message }
    ];

    const aiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 500, temperature: 0.7 })
    });

    if (!aiRes.ok) throw new Error(`AI API error: ${aiRes.status}`);
    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content?.trim() ?? '';

    // Detect escalation signals in Ukrainian + English
    const escalateKeywords = ['оператор', 'людина', 'адмін', 'operator', 'human', 'agent'];
    const escalate = escalateKeywords.some(k => reply.toLowerCase().includes(k) || message.toLowerCase().includes(k));

    // Log to audit
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'AI_RESPONSE',
      target: ticketId,
      meta: { userRole, escalate, tokens: aiData.usage?.total_tokens ?? 0 }
    });

    return new Response(JSON.stringify({ reply, escalate }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
