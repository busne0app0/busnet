import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://upwwhhfgpxgnxkbfwfve.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3doaGZncHhnbnhrYmZ3ZnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjIxMzIsImV4cCI6MjA5MjU5ODEzMn0.-uyKjGcuE_KJHjku6s_Ocnz3_ZWWVWiQJSeD8vf40ug'
);

async function testQuote() {
  const { data: routes } = await supabase
    .from('routes')
    .select('id, name, outbound')
    .eq('carrier_id', 'ec987229-0773-49b9-bac8-69d562a794d1');

  console.log('Routes found:', routes?.length);
  if (!routes || routes.length === 0) return;

  const r = routes[0];
  console.log('Testing route:', r.name, r.id);
  const stops = r.outbound?.stops || [];
  console.log('First stop:', stops[0]?.city, 'Last stop:', stops[stops.length - 1]?.city);

  const { data, error } = await supabase.rpc('get_trip_quote', {
    p_route_id: r.id,
    p_direction: 'outbound',
    p_from_stop: 0,
    p_to_stop: stops.length - 1,
    p_start_date: '2026-11-05'
  });

  console.log('get_trip_quote result:', data);
  console.log('get_trip_quote error:', error);
}

testQuote();
