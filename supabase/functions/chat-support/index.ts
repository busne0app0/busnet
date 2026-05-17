import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const AI_MODEL = "openai/gpt-4o";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLE_PROMPTS: Record<string, string> = {
  passenger: `Ти — AI Консьєрж BUSNET. Відповідай ТІЛЬКИ українською. Будь коротким (2-4 речення), теплим і корисним.
Ти спілкуєшся з ПАСАЖИРОМ. Допомагай з квитками, багажем (20кг + ручна 5кг), поверненнями, розкладом.
Бонуси: 10 балів = 1 грн знижки.
ВАЖЛИВО: Ніколи не обіцяй повернення коштів без уточнення правил перевізника.
Якщо пасажир просить живу людину, оператора, або питання складне — додай у кінець: {"escalate":true}`,

  carrier: `Ти — AI Консьєрж BUSNET. Відповідай ТІЛЬКИ українською. Будь чітким і професійним.
Ти спілкуєшся з ПЕРЕВІЗНИКОМ (компанією або диспетчером). Допомагай з рейсами, агентами, документами, фінансами.
Перевізник — твій B2B-партнер, звертайся поважно. 
Якщо питання потребує ескалації до адміністрації BUSNET — додай: {"escalate":true}`,

  agent: `Ти — AI Консьєрж BUSNET. Відповідай ТІЛЬКИ українською. Будь конкретним і діловим.
Ти спілкуєшся з АГЕНТОМ (партнером-посередником). Допомагай з продажами, комісіями, клієнтами, бронюваннями.
Якщо питання потребує втручання адміністратора — додай: {"escalate":true}`,

  driver: `Ти — AI Консьєрж BUSNET. Відповідай ДУЖЕ коротко (1-2 речення), простою мовою.
Ти спілкуєшся з ВОДІЄМ. Допомагай з маршрутом, зупинками, пасажирами, документами.
Проблема технічна або потребує диспетчера — додай: {"escalate":true}`,

  admin: `Ти — внутрішній AI-асистент BUSNET для адміністраторів. Відповідай технічно точно.
Допомагай з аналітикою, конфліктами, ескалаціями, налаштуваннями системи.`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json();
    const { message, ticketId, userId, userRole = "passenger", history = [], bookingContext } = body;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "No message" }), { status: 400, headers: CORS });
    }

    const apiKey = Deno.env.get("AI_GATEWAY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ reply: "Сервіс тимчасово недоступний. Спробуйте пізніше.", escalate: false }), { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const systemPrompt = ROLE_PROMPTS[userRole] || ROLE_PROMPTS.passenger;

    // Build messages array with history (last 6 messages for context)
    const recentHistory = (history || []).slice(-6).map((h: any) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.text,
    }));

    // Add booking context if available
    let userContent = message;
    if (bookingContext) {
      userContent = `[Контекст квитка: ${bookingContext.from || ''} → ${bookingContext.to || ''}, дата: ${bookingContext.date || ''}, статус: ${bookingContext.status || ''}]\n\n${message}`;
    }

    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...recentHistory,
          { role: "user", content: userContent },
        ],
        max_tokens: 350,
        temperature: 0.65,
      }),
    });

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({
        reply: "Вибачте, AI тимчасово недоступний. Переключаю на оператора.",
        escalate: true,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const rawReply: string = aiData.choices?.[0]?.message?.content || "";

    const escalate = rawReply.includes('"escalate":true') || rawReply.includes('"escalate": true');
    const reply = rawReply.replace(/\{[^}]*"escalate"[^}]*\}/g, "").trim();

    return new Response(JSON.stringify({ reply, escalate }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("chat-support error:", err);
    return new Response(JSON.stringify({
      reply: "Виникла помилка з'єднання. Переключаю на адміністратора.",
      escalate: true,
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
