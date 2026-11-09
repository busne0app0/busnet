// supabase/functions/import-altrans-routes/index.ts
// Edge Function: imports Al-Trans route data into al_trans_routes + al_trans_route_stops
// Trigger: manual (carrier "Sync" button) OR daily cron
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALTRANS_CARRIER_UID = 'ec987229-0773-49b9-bac8-69d562a794d1';

Deno.serve(async (req: Request) => {
  // Allow OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Load carrier config
  const { data: carrier, error: carrierErr } = await supabase
    .from('users')
    .select('external_api_key, external_route_keys')
    .eq('uid', ALTRANS_CARRIER_UID)
    .single();

  if (carrierErr || !carrier?.external_api_key || !carrier.external_route_keys?.length) {
    return new Response(
      JSON.stringify({ error: 'Carrier not configured', detail: carrierErr?.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const apiHeaders = {
    'Content-Type': 'application/json',
    'Api-Key': carrier.external_api_key,
    'Accept-Language': 'uk',
  };

  let totalRoutes = 0;
  let totalStops = 0;
  const errors: string[] = [];

  for (const navigationKey of carrier.external_route_keys) {
    try {
      const res = await fetch('https://al-trans.com.ua/api/v2/references/route_details_key', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ key: navigationKey }),
      });

      if (!res.ok) {
        errors.push(${navigationKey}: HTTP );
        continue;
      }

      const data = await res.json();
      const routeInfo = data.route;
      const schedules: any[] = data.schedules ?? [];

      if (!routeInfo?.id) {
        errors.push(${navigationKey}: no route.id in response);
        continue;
      }

      // Upsert route record
      const { data: routeRow, error: routeErr } = await supabase
        .from('al_trans_routes')
        .upsert(
          {
            carrier_id:       ALTRANS_CARRIER_UID,
            external_line_id: routeInfo.id,
            navigation_key:   navigationKey,
            name:             routeInfo.name,
            schedule_days:    routeInfo.shedule_days ?? routeInfo.schedule_days ?? null,
            source:           'al-trans-import',
            status:           'draft',
            updated_at:       new Date().toISOString(),
          },
          { onConflict: 'carrier_id,external_line_id' }
        )
        .select()
        .single();

      if (routeErr || !routeRow) {
        errors.push(${navigationKey}: route upsert failed — );
        continue;
      }

      // Delete old stops before re-inserting
      await supabase.from('al_trans_route_stops').delete().eq('route_id', routeRow.id);

      const stopsToInsert: any[] = [];
      for (const sched of schedules) {
        (sched.items ?? []).forEach((s: any, idx: number) => {
          stopsToInsert.push({
            route_id:         routeRow.id,
            schedule_title:   sched.title ?? null,
            stop_order:       idx + 1,
            city_name:        s.city_name ?? null,
            external_city_id: s.city_id   ?? null,
            country:          (s.longitude && s.longitude > 20) ? 'Україна' : 'Італія',
            timezone:         (s.longitude && s.longitude > 20) ? 'UTC+2'   : 'UTC+1',
            station:          s.place       ?? null,
            latitude:         s.latitude    ?? null,
            longitude:        s.longitude   ?? null,
            departure_day:    s.departure_day_str  ?? null,
            departure_time:   s.departure_time_str ?? null,
            return_day:       s.return_day_str     ?? null,
            return_time:      s.return_time_str    ?? null,
          });
        });
      }

      if (stopsToInsert.length > 0) {
        const { error: stopsErr } = await supabase
          .from('al_trans_route_stops')
          .insert(stopsToInsert);
        if (stopsErr) errors.push(${navigationKey}: stops insert — );
        else totalStops += stopsToInsert.length;
      }

      totalRoutes++;
    } catch (err: any) {
      errors.push(${navigationKey}: );
    }
  }

  // Update sync status
  const syncStatus = errors.length === 0 ? 'synced' : (totalRoutes > 0 ? 'partial' : 'error');
  await supabase
    .from('users')
    .update({
      external_sync_status: syncStatus,
      external_synced_at:   new Date().toISOString(),
    })
    .eq('uid', ALTRANS_CARRIER_UID);

  return new Response(
    JSON.stringify({ success: true, totalRoutes, totalStops, errors, syncStatus }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
});
