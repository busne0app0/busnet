import fs from 'fs';

const API_KEY = 'eDsaqP/Hz0KgzBh6Sk5NNg==';
const HEADERS = {
  'Content-Type': 'application/json',
  'Api-Key': API_KEY,
  'Accept-Language': 'uk'
};

async function main() {
  console.log('Fetching route_details_key...');
  const resRoute = await fetch('https://al-trans.com.ua/api/v2/references/route_details_key', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ key: 'avtobus-cherkasy-salerno-al-trans' })
  });
  const routeJson = await resRoute.json();
  fs.writeFileSync('al_trans_route_details_key.json', JSON.stringify(routeJson, null, 2));

  console.log('Fetching search_trips (Lviv -> Roma)...');
  const resTrips = await fetch('https://al-trans.com.ua/api/v2/booking/search_trips', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      departure_city_id: 1,
      arrival_city_id: 41,
      depature_date: '2026-11-05T00:00:00',
      passengers_count: 1,
      currecny_code: 'EUR',
      enable_external_search: false
    })
  });
  const tripsJson = await resTrips.json();
  fs.writeFileSync('al_trans_search_trips.json', JSON.stringify(tripsJson, null, 2));

  console.log('DONE! Files written successfully.');
}

main().catch(console.error);
