const API_KEY = 'eDsaqP/Hz0KgzBh6Sk5NNg==';

async function main() {
  const requestBody = {
    departure_city_id: 2, // Київ
    arrival_city_id: 41,   // Рим
    depature_date: '2026-11-05T00:00:00',
    passengers_count: 1,
    currecny_code: 'UAH',
    enable_external_search: false
  };

  const res = await fetch('https://al-trans.com.ua/api/v2/booking/search_trips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': API_KEY,
      'Accept-Language': 'uk'
    },
    body: JSON.stringify(requestBody)
  });

  const result = await res.json();
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
