import fs from 'fs';

const API_KEY = 'eDsaqP/Hz0KgzBh6Sk5NNg==';
const HEADERS = {
  'Content-Type': 'application/json',
  'Api-Key': API_KEY,
  'Accept-Language': 'uk'
};

async function main() {
  console.log('1. Завантаження ліній Al-Trans...');
  const resRoutes = await fetch('https://al-trans.com.ua/api/v3/cache/routes', { headers: HEADERS });
  const routesData = await resRoutes.json();
  const routes = routesData.routes || [];

  const masterRoutes = [];
  const csvRows = [
    [
      'ID лінії',
      'Назва маршруту',
      'Графік курсування',
      'Перевізник',
      '№ зупинки',
      'Місто',
      'ID міста',
      'Країна',
      'Часовий пояс',
      'Автостанція / Точна адреса',
      'Широта (Lat)',
      'Довгота (Lng)',
      'Відправлення (Туди): День',
      'Відправлення (Туди): Час',
      'Повернення (Назад): День',
      'Повернення (Назад): Час'
    ]
  ];

  for (const r of routes) {
    console.log(`Обробка лінії: ${r.name}...`);
    const resDetail = await fetch('https://al-trans.com.ua/api/v2/references/route_details_key', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ key: r.navigation_key })
    });
    const detailData = await resDetail.json();
    const schedules = detailData.schedules || [];

    const routeEntry = {
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

      const scheduleObj = {
        title: sched.title,
        departureDay: sched.departure_day,
        returnDay: sched.return_day,
        totalStops: items.length,
        stops: []
      };

      items.forEach((s, idx) => {
        const isUa = s.longitude > 20; // Східніше 20° сх. д. — Україна
        const stopData = {
          order: idx + 1,
          city: s.city_name,
          cityId: s.city_id,
          country: isUa ? 'Україна' : 'Італія',
          timezone: isUa ? 'UTC+2 (EET)' : 'UTC+1 (CET)',
          station: s.place,
          latitude: s.latitude,
          longitude: s.longitude,
          departureDay: s.departure_day_str,
          departureTime: s.departure_time_str,
          returnDay: s.return_day_str,
          returnTime: s.return_time_str
        };

        scheduleObj.stops.push(stopData);

        csvRows.push([
          r.id,
          r.name,
          sched.title || r.shedule_days,
          r.carrier_name,
          idx + 1,
          s.city_name,
          s.city_id,
          isUa ? 'Україна' : 'Італія',
          isUa ? 'UTC+2' : 'UTC+1',
          s.place,
          s.latitude,
          s.longitude,
          s.departure_day_str,
          s.departure_time_str,
          s.return_day_str,
          s.return_time_str
        ]);
      });

      routeEntry.schedules.push(scheduleObj);
    }

    masterRoutes.push(routeEntry);
  }

  // 1. Збереження JSON
  fs.writeFileSync('al_trans_master_routes.json', JSON.stringify(masterRoutes, null, 2), 'utf8');

  // 2. Збереження CSV (з UTF-8 BOM для бездоганного відображення в Excel)
  const csvContent = '\ufeff' + csvRows.map(row => 
    row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')
  ).join('\r\n');
  fs.writeFileSync('al_trans_master_routes.csv', csvContent, 'utf8');

  console.log(`\n✅ Повний маршрутний лист згенеровано!`);
  console.log(`Усього зупинок у базі: ${csvRows.length - 1}`);
}

main().catch(console.error);
