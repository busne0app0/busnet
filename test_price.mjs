const API_KEY = 'eDsaqP/Hz0KgzBh6Sk5NNg==';

async function getPrice(fromId, toId, date, currency = 'UAH') {
  try {
    const res = await fetch('https://al-trans.com.ua/api/v2/booking/search_trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Key': API_KEY, 'Accept-Language': 'uk' },
      body: JSON.stringify({
        departure_city_id: fromId,
        arrival_city_id: toId,
        depature_date: date,
        passengers_count: 1,
        currecny_code: currency,
        enable_external_search: false
      })
    });
    const d = await res.json();
    if (d.trips_sequences && d.trips_sequences.length > 0) {
      return { price: d.trips_sequences[0].price, currency: d.trips_sequences[0].currency_code };
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function run() {
  // 2 = Kyiv, 1 = Lviv, 3 = Odesa, 41 = Roma, 46 = Bologna, 78 = Salerno
  const p1 = await getPrice(2, 41, '2026-11-05T00:00:00', 'UAH');
  const p1_eur = await getPrice(2, 41, '2026-11-05T00:00:00', 'EUR');
  const p2 = await getPrice(1, 46, '2026-11-05T00:00:00', 'UAH');
  const p3 = await getPrice(3, 78, '2026-11-05T00:00:00', 'UAH');

  console.log('Київ -> Рим:', p1, p1_eur);
  console.log('Львів -> Болонья:', p2);
  console.log('Одеса -> Салерно:', p3);
}

run();
