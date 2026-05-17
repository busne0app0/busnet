/**
 * Supabase Edge Function: chat-support
 * Handles AI responses for passenger/carrier/agent support chat via Vercel AI Gateway.
 * 
 * Deploy with:
 *   supabase functions deploy chat-support
 * 
 * Set secrets:
 *   supabase secrets set AI_GATEWAY_API_KEY=your_vercel_api_key_here
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const AI_MODEL = "openai/gpt-4o";

Deno.serve(async (req: Request) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { message, ticketId, tripId, userId, userRole } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "No message provided" }), { status: 400 });
    }

    const apiKey = Deno.env.get("AI_GATEWAY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI_GATEWAY_API_KEY not set" }), { status: 500 });
    }

    // Dynamic System Prompt based on role
    let systemPrompt = `Ти — AI Консьєрж BUSNET. Відповідай ТІЛЬКИ українською мовою. Будь коротким (2-4 речення).\n`;

    if (userRole === 'carrier') {
      systemPrompt += `
Ти спілкуєшся з ПЕРЕВІЗНИКОМ. Допомагай йому з управлінням рейсами, агентами, та адмін питаннями.
Якщо перевізник просить підключити адміністратора BUSNET, додай у відповідь JSON-мітку: {"escalate": true}
`;
    } else if (userRole === 'agent') {
      systemPrompt += `
Ти спілкуєшся з АГЕНТОМ (партнером). Допомагай з продажами, бронюваннями, комісіями.
Якщо агент просить вирішити складне питання через адміністратора, додай у відповідь JSON-мітку: {"escalate": true}
`;
    } else {
      systemPrompt += `
Ти спілкуєшся з ПАСАЖИРОМ. Допомагай з квитками, багажем, поверненнями. 
Норма багажу: 1 сумка 20кг + ручна поклажа 5кг. 
Бонуси: 10 балів = 1 грн знижки.
Якщо пасажир просить людину, оператора, або питання дуже складне (скасування, скарга) — ОБОВ'ЯЗКОВО додай: {"escalate": true}
`;
    }

    // Build context-aware prompt
    const contextMessage = tripId
      ? `[Контекст: Рейс ${tripId}, Тікет ${ticketId}]\n${message}`
      : message;

    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextMessage },
        ],
        max_tokens: 300,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error("AI Gateway error:", errorBody);
      return new Response(JSON.stringify({ 
        error: "AI service unavailable",
        reply: "Вибачте, сервіс тимчасово недоступний. Переключаю вас на оператора.",
        escalate: true
      }), { status: 200 });
    }

    const aiData = await aiResponse.json();
    const rawReply: string = aiData.choices?.[0]?.message?.content || "";

    const escalate = rawReply.includes('"escalate": true') || rawReply.includes('"escalate":true');
    const reply = rawReply.replace(/\{[^}]*"escalate"[^}]*\}/g, "").trim();

    return new Response(
      JSON.stringify({ reply, escalate }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ 
        reply: "Виникла помилка. Переключаю вас на адміністратора.",
        escalate: true 
      }),
      { status: 200 }
    );
  }
});
