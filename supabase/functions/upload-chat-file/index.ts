import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ticketId = formData.get('ticketId') as string;
    const senderName = formData.get('senderName') as string || 'Користувач';

    if (!file || !ticketId) throw new Error('Missing file or ticketId');
    if (file.size > 10 * 1024 * 1024) throw new Error('Файл занадто великий (макс. 10MB)');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif'];
    if (!allowedTypes.includes(file.type)) throw new Error('Непідтримуваний тип файлу');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop();
    const fileName = `${ticketId}/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    // Post message with attachment URL
    const isImage = file.type.startsWith('image/');
    const messageText = isImage
      ? `📎 [Зображення](${publicUrl})`
      : `📎 [${file.name}](${publicUrl})`;

    const { data: msg, error: msgErr } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        role: 'user',
        text: messageText,
        sender_name: senderName
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // Update ticket last_updated
    await supabase.from('support_tickets')
      .update({ last_updated: new Date().toISOString() })
      .eq('id', ticketId);

    return new Response(JSON.stringify({ success: true, url: publicUrl, message: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
