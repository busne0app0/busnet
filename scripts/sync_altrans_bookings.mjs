import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://upwwhhfgpxgnxkbfwfve.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3doaGZncHhnbnhrYmZ3ZnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjIxMzIsImV4cCI6MjA5MjU5ODEzMn0.-uyKjGcuE_KJHjku6s_Ocnz3_ZWWVWiQJSeD8vf40ug';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CARRIER_UID = 'ec987229-0773-49b9-bac8-69d562a794d1';
const API_KEY = process.env.ALTRANS_API_KEY;
if (!API_KEY) {
  console.error('Missing ALTRANS_API_KEY environment variable');
}

async function sync() {
  console.log('--- 1. Fetching Al-Trans routes from Supabase ---');
  const { data: routes, error: rErr } = await supabase
    .from('routes')
    .select('id, name')
    .eq('carrier_id', CARRIER_UID);
  
  if (rErr) throw rErr;
  console.log(`Found ${routes.length} routes for Al-Trans`);

  // We test on trip 31145 (Lviv -> Rome / Zaporizhzhia -> Salerno)
  const tripId = 31145;
  const fromCityId = 1;
  const toCityId = 41;

  console.log(`--- 2. Fetching real bus map for trip ${tripId} ---`);
  const res = await fetch(`https://al-trans.com.ua/api/v3/booking/get_bus_map_for_trip_id?tripId=${tripId}&cityFromId=${fromCityId}&cityToId=${toCityId}`, {
    headers: { 'Api-Key': API_KEY, 'Accept-Language': 'uk' }
  });

  const mapData = await res.json();
  const seats = (mapData.busPlaces || []).filter(p => p.type === 'seat');
  const occupied = seats.filter(p => p.status === 'purchased' || p.status === 'reserved');
  console.log(`Found ${occupied.length} occupied seats on bus (${mapData.busDescription})`);

  const zapRoute = routes.find(r => r.name.includes('Запоріжжя')) || routes[0];

  const bookingsToUpsert = occupied.map(place => {
    const tripDetail = (place.trips && place.trips[0]) || {};
    const fromName = tripDetail.CityFromName || 'Львів';
    const toName = tripDetail.CityToName || 'Рим';
    const isPurchased = place.status === 'purchased';

    return {
      id: `altrans_${tripId}_seat_${place.name}`,
      user_id: CARRIER_UID,
      carrier_id: CARRIER_UID,
      route_id: zapRoute.id,
      trip_id: `${zapRoute.id}_2026-11-05_${tripId}`,
      passengers: [
        {
          firstName: 'Пасажир',
          lastName: `(Місце ${place.name})`,
          seat: place.name,
          floor: place.floor,
          phone: '—',
          email: '—',
          from: fromName,
          to: toName
        }
      ],
      contact: {
        firstName: 'Пасажир',
        lastName: `(Місце ${place.name})`,
        phone: '—',
        email: '—'
      },
      route_from: fromName,
      route_to: toName,
      departure_date: '2026-11-05',
      seats: 1,
      total_price: isPurchased ? 120 : 0,
      currency: 'EUR',
      status: isPurchased ? 'confirmed' : 'pending',
      created_at: new Date().toISOString()
    };
  });

  console.log(`--- 3. Upserting ${bookingsToUpsert.length} bookings into Supabase ---`);
  const { data: inserted, error: iErr } = await supabase
    .from('bookings')
    .upsert(bookingsToUpsert, { onConflict: 'id' })
    .select('id, route_from, route_to, status');

  if (iErr) {
    console.error('Insert error:', iErr);
  } else {
    console.log(`Successfully synced ${inserted.length} real bookings!`);
    console.log('Sample:', inserted.slice(0, 3));
  }
}

sync().catch(console.error);
