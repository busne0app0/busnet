import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.14.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) throw new Error('Missing stripe-signature header');

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const bookingId = session.metadata?.booking_id;
      const agentId = session.metadata?.agent_id;
      const passengerId = session.client_reference_id;

      if (!bookingId) {
        throw new Error('No booking_id found in metadata');
      }

      // 1. Update Booking Status to PAID
      await supabase
        .from('bookings')
        .update({ status: 'paid', payment_intent: session.payment_intent })
        .eq('id', bookingId);

      // 2. Add System Message to any active chat
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('booking_id', bookingId);

      if (tickets && tickets.length > 0) {
        for (const ticket of tickets) {
          await supabase.from('ticket_messages').insert({
            ticket_id: ticket.id,
            role: 'system',
            text: `✅ Платіж успішно підтверджено. Статус квитка змінено на "Оплачено".`,
          });
        }
      }

      // 3. Log Audit Event
      await supabase.from('audit_logs').insert({
        action: 'WEBHOOK_PAYMENT_SUCCESS',
        target: bookingId,
        meta: { agentId, passengerId, amount: session.amount_total }
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
