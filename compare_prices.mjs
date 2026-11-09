const API_KEY = 'eDsaqP/Hz0KgzBh6Sk5NNg==';

async function query(fromId, fromName, toId, toName) {
  const res = await fetch('https://al-trans.com.ua/api/v2/booking/search_trips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Api-Key': API_KEY, 'Accept-Language': 'uk' },
    body: JSON.stringify({
      departure_city_id: fromId,
      arrival_city_id: toId,
      depature_date: '2026-11-05T00:00:00',
      passengers_count: 1,
      currecny_code: 'UAH',
      enable_external_search: false
    })
  });
  const data = await res.json();
  const first = data.trips_sequences?.[0];
  console.log(`${fromName} -> ${toName}: price = ${first?.price} ${first?.currency_code} (total variants found: ${data.trips_sequences?.length || 0})`);
}

async function run() {
  await query(1, 'Львів', 46, 'Болонья');
  await query(1, 'Львів', 41, 'Рим');
  await query(2, 'Київ', 46, 'Болонья');
  await query(2, 'Київ', 41, 'Рим');
  await query(3, 'Одеса', 78, 'Салерно');
}

run().catch(console.error);
