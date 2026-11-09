// @ts-nocheck
// supabase/functions/search-altrans-trips/index.ts
// Edge Function: real-time price search via Al-Trans API, with 10-min cache
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALTRANS_CARRIER_UID = 'ec987229-0773-49b9-bac8-69d562a794d1';
const CACHE_TTL_MINUTES = 10;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const { fromCityId, toCityId, date, passengersCount = 1 } = body as {
    fromCityId: number;  // external_city_id from al_trans_route_stops
    toCityId: number;
    date: string;  // 'YYYY-MM-DD'
    passengersCount?: number;
  };

  if (!fromCityId || !toCityId || !date) {
    return new Response(
      JSON.stringify({ error: 'fromCityId, toCityId, date are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check 10-min cache first
  const cacheKey = `altrans:${fromCityId}:${toCityId}:${date}`;
  const { data: cached } = await supabase
    .from('search_cache')
    .select('payload')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached?.payload) {
    return new Response(JSON.stringify({ ...cached.payload, fromCache: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Load API key
  const { data: carrier } = await supabase
    .from('users')
    .select('external_api_key')
    .eq('uid', ALTRANS_CARRIER_UID)
    .single();

  if (!carrier?.external_api_key) {
    return new Response(
      JSON.stringify({ trips: [], error: 'Al-Trans not configured' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Call Al-Trans search_trips
  let trips: any[] = [];
  try {
    const res = await fetch('https://al-trans.com.ua/api/v2/booking/search_trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': carrier.external_api_key,
        'Accept-Language': 'uk',
      },
      body: JSON.stringify({
        departure_city_id: fromCityId,
        arrival_city_id: toCityId,
        depature_date: date,   // note: Al-Trans API typo is intentional
        passengers_count: passengersCount,
        currecny_code: 'UAH',  // note: Al-Trans API typo is intentional
        enable_external_search: false,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const sequences: any[] = data.trips_sequences ?? [];

      trips = sequences.map((seq: any) => ({
        carrier: 'AL-TRANS',
        source: 'al-trans-live',
        price: seq.price ?? null,
        currency: seq.currency_code ?? 'UAH',
        departureTime: seq.departure_time ?? null,
        arrivalTime: seq.arrival_time ?? null,
        busNumber: seq.bus_number ?? null,
        seatsAvailable: seq.free_seats ?? null,
        bookingUrl: seq.booking_url ?? null,
      }));
    }
  } catch (_err) {
    // Network/parse error — return empty, don't fail the whole search
  }

  const payload = { trips };

  // Store in cache (even empty results — avoids hammering API on "no routes" queries)
  const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
  await supabase.from('search_cache').upsert({
    cache_key: cacheKey,
    payload,
    expires_at: expiresAt,
  });

  return new Response(JSON.stringify({ ...payload, fromCache: false }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});