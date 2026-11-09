import fs from 'fs';

const API_KEY = 'eDsaqP/Hz0KgzBh6Sk5NNg==';
const HEADERS = {
  'Content-Type': 'application/json',
  'Api-Key': API_KEY,
  'Accept-Language': 'uk'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Пошук реальної ціни через Al-Trans API
async function fetchPrice(fromId, toId, date, currency = 'UAH') {
  try {
    const res = await fetch('https://al-trans.com.ua/api/v2/booking/search_trips', {
      method: 'POST',
      headers: HEADERS,
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
      const t = d.trips_sequences[0];
      return {
        price: t.price,
        currency: t.currency_code,
        onlineDiscountPercent: t.liqpay_discount_in_percent || 0,
        busNumber: t.first_trip?.bus_number || '',
        phone: t.first_trip?.phoneNumber || ''
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('1. Завантаження списку всіх маршрутів Al-Trans...');
  const resRoutes = await fetch('https://al-trans.com.ua/api/v3/cache/routes', { headers: HEADERS });
  const routesData = await resRoutes.json();
  const routes = routesData.routes || [];
  console.log(`Знайдено маршрутів: ${routes.length}`);

  const masterRoutes = [];
  const csvRows = [
    [
      'ID рейсу',
      'Назва маршруту',
      'Графік (Дні курсування)',
      'Перевізник',
      '№ зупинки',
      'Місто відправлення',
      'Країна відправлення',
      'Адреса відправлення',
      'GPS відправлення (Lat, Lng)',
      'День виїзду',
      'Час виїзду',
      'Місто прибуття (кінцеве/наступне)',
      'Країна прибуття',
      'Адреса прибуття',
      'GPS прибуття (Lat, Lng)',
      'День прибуття',
      'Час прибуття',
      'Реальний час у дорозі',
      'Ціна квитка (UAH)',
      'Ціна квитка (EUR)',
      'Контактні телефони'
    ]
  ];

  for (const r of routes) {
    console.log(`\nОбробка: ${r.name} (${r.navigation_key})...`);
    const resDetail = await fetch('https://al-trans.com.ua/api/v2/references/route_details_key', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ key: r.navigation_key })
    });
    const detailData = await resDetail.json();
    const schedules = detailData.schedules || [];

    const routeObj = {
      id: r.id,
      name: r.name,
      scheduleDays: r.shedule_days,
      carrier: r.carrier_name,
      country: r.countryName,
      navigationKey: r.navigation_key,
      schedules: []
    };

    for (const sched of schedules) {
      const items = sched.items || [];
      if (items.length < 2) continue;

      const uaStops = items.filter(s => ['Київ', 'Львів', 'Одеса', 'Житомир', 'Вінниця', 'Рівне', 'Тернопіль', 'Івано-Франківськ', 'Чернівці', 'Умань', 'Хмельницький', 'Мукачево', 'Стрий', 'Гайсин', 'Немирів', 'Звягель', 'Луцьк', 'Коломия', 'Золочів', 'Калуш', 'Долина'].includes(s.city_name) || s.longitude > 21);
      const itStops = items.filter(s => !uaStops.includes(s));

      // Зразкова ціна для ключових пар
      let routePriceUah = null;
      let routePriceEur = null;
      let busPhone = '';

      const firstUa = uaStops[0] || items[0];
      const lastIt = itStops[itStops.length - 1] || items[items.length - 1];

      if (firstUa && lastIt) {
        console.log(`  Отримання офіційної ціни: ${firstUa.city_name} -> ${lastIt.city_name}...`);
        const priceInfoUah = await fetchPrice(firstUa.city_id, lastIt.city_id, '2026-11-05T00:00:00', 'UAH');
        const priceInfoEur = await fetchPrice(firstUa.city_id, lastIt.city_id, '2026-11-05T00:00:00', 'EUR');
        if (priceInfoUah) {
          routePriceUah = priceInfoUah.price;
          busPhone = priceInfoUah.phone;
        }
        if (priceInfoEur) {
          routePriceEur = priceInfoEur.price;
        }
        await sleep(300);
      }

      const scheduleEntry = {
        title: sched.title,
        departureDay: sched.departure_day,
        returnDay: sched.return_day,
        stopsCount: items.length,
        basePriceUah: routePriceUah,
        basePriceEur: routePriceEur,
        stops: items.map((stop, idx) => {
          const isUa = stop.longitude > 20;
          return {
            order: idx + 1,
            city: stop.city_name,
            cityId: stop.city_id,
            country: isUa ? 'Україна' : 'Італія',
            timezone: isUa ? 'UTC+2 (EET)' : 'UTC+1 (CET)',
            station: stop.place,
            latitude: stop.latitude,
            longitude: stop.longitude,
            depDay: stop.departure_day_str,
            depTime: stop.departure_time_str,
            retDay: stop.return_day_str,
            retTime: stop.return_time_str
          };
        })
      };

      routeObj.schedules.push(scheduleEntry);

      // Додаємо в CSV для кожної зупинки
      const destStop = items[items.length - 1];
      items.forEach((s, idx) => {
        const isUa = s.longitude > 20;
        csvRows.push([
          r.id,
          r.name,
          sched.title || r.shedule_days,
          r.carrier_name,
          idx + 1,
          s.city_name,
          isUa ? 'Україна' : 'Італія',
          s.place,
          `${s.latitude}, ${s.longitude}`,
          s.departure_day_str,
          s.departure_time_str,
          destStop.city_name,
          destStop.longitude > 20 ? 'Україна' : 'Італія',
          destStop.place,
          `${destStop.latitude}, ${destStop.longitude}`,
          destStop.departure_day_str,
          destStop.departure_time_str,
          'За розкладом лінії',
          routePriceUah ? `${routePriceUah} грн` : '',
          routePriceEur ? `€${routePriceEur}` : '',
          busPhone
        ]);
      });
    }

    masterRoutes.push(routeObj);
  }

  // Зберігаємо JSON
  fs.writeFileSync('al_trans_master_routes.json', JSON.stringify(masterRoutes, null, 2), 'utf8');

  // Зберігаємо CSV (з BOM для правильного відкриття в Excel з кирилицею)
  const csvContent = '\ufeff' + csvRows.map(row => 
    row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')
  ).join('\r\n');
  fs.writeFileSync('al_trans_master_routes.csv', csvContent, 'utf8');

  console.log('\n✅ УСПІШНО! Створено 2 файли:');
  console.log('1. al_trans_master_routes.json (структурований JSON)');
  console.log('2. al_trans_master_routes.csv (таблиця Excel CSV)');
}

main().catch(console.error);
