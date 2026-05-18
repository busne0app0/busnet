import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { to, subject, body, templateId, variables } = await req.json();
    if (!to || !subject) throw new Error('Missing required fields: to, subject');

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) throw new Error('RESEND_API_KEY not configured');

    // Resolve template
    const templates: Record<string, (v: any) => string> = {
      referral_invite: (v) => `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B1221;color:#fff;padding:40px;border-radius:16px;">
          <h1 style="color:#00E5FF;font-size:28px;margin-bottom:8px;">🚌 BUSNET UA</h1>
          <p style="color:#8899B5;font-size:14px;margin-bottom:32px;">Міжнародні автобусні перевезення</p>
          <h2 style="font-size:20px;">Вас запрошує агент <span style="color:#7c5cfc">${v.agentName || 'BUSNET'}</span></h2>
          <p style="color:#ccc;line-height:1.6;">Зареєструйтесь на платформі BUSNET і отримайте доступ до кращих маршрутів по Україні та Європі.</p>
          <a href="${v.inviteLink}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#7c5cfc;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:14px;">Зареєструватись →</a>
          <p style="margin-top:32px;color:#4a5c72;font-size:12px;">Лінк дійсний 7 днів. Якщо ви не очікували цього листа — проігноруйте його.</p>
        </div>
      `,
      ticket_confirmed: (v) => `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B1221;color:#fff;padding:40px;border-radius:16px;">
          <h1 style="color:#00E5FF;">✅ Квиток підтверджено</h1>
          <div style="background:#151c28;border-radius:12px;padding:20px;margin:24px 0;">
            <p style="color:#8899B5;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Маршрут</p>
            <p style="font-size:18px;font-weight:bold;color:#fff;">${v.route || 'Київ — Берлін'}</p>
            <p style="color:#8899B5;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-top:16px;">Дата відправлення</p>
            <p style="font-size:16px;color:#fff;">${v.departureDate || '-'}</p>
          </div>
          <p style="color:#ccc;">Ваш AI Консьєрж готовий допомогти з будь-яким питанням по рейсу прямо у чаті BUSNET.</p>
          <a href="${v.chatLink || 'https://busnet.ua'}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#10B981;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;">Відкрити чат →</a>
        </div>
      `,
      default: (_v) => `<div style="font-family:sans-serif;padding:20px;">${body || 'Повідомлення від BUSNET UA'}</div>`
    };

    const htmlContent = templateId && templates[templateId]
      ? templates[templateId](variables || {})
      : templates.default(variables || {});

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'BUSNET UA <noreply@busnet.ua>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html: htmlContent
      })
    });

    const result = await emailRes.json();
    if (!emailRes.ok) throw new Error(result.message || 'Email send failed');

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
