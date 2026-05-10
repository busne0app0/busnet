/**
 * Supabase Edge Function: chat-support
 * Handles AI responses for passenger support chat via Vercel AI Gateway.
 * 
 * Deploy with:
 *   supabase functions deploy chat-support
 * 
 * Set secrets:
 *   supabase secrets set AI_GATEWAY_API_KEY=your_vercel_api_key_here
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const AI_MODEL = "openai/gpt-4o"; // Change to gpt-5.5 when available

const SYSTEM_PROMPT = `
Ти — AI Консьєрж BUSNET, дружній помічник пасажирів автобусних рейсів.
Відповідай ТІЛЬКИ українською мовою. Будь коротким (2-4 речення).

Ти можеш допомогти з:
- Інформацією про квитки та бронювання
- Нормами багажу (1 сумка 20кг + ручна поклажа 5кг)
- Бонусною програмою (10 балів = 1 грн знижки)
- Загальними питаннями про рейси

Якщо питання складне (скасування, відшкодування, скарга, юридичне), 
додай у відповідь JSON-мітку: {"escalate": true}

Якщо пасажир просить людину або оператора — ОБОВ'ЯЗКОВО додай {"escalate": true}.
`.trim();

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
    const { message, ticketId, tripId, userId } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "No message provided" }), { status: 400 });
    }

    const apiKey = Deno.env.get("AI_GATEWAY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI_GATEWAY_API_KEY not set" }), { status: 500 });
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
          { role: "system", content: SYSTEM_PROMPT },
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
        reply: "Вибачте, сервіс тимчасово недоступний. Спробуйте пізніше або зверніться до оператора.",
        escalate: false
      }), { status: 200 }); // Return 200 so frontend handles gracefully
    }

    const aiData = await aiResponse.json();
    const rawReply: string = aiData.choices?.[0]?.message?.content || "";

    // Check if AI decided to escalate
    const escalate = rawReply.includes('"escalate": true') || rawReply.includes('"escalate":true');

    // Clean JSON tags from reply text
    const reply = rawReply
      .replace(/\{[^}]*"escalate"[^}]*\}/g, "")
      .trim();

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
        reply: "Виникла помилка. Переключаю вас на оператора.",
        escalate: true 
      }),
      { status: 200 }
    );
  }
});
