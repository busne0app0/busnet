const API_KEY = 'eDsaqP/Hz0KgzBh6Sk5NNg==';
const BASE_URL = 'https://al-trans.com.ua';
const TRIP_ID = 31145; // активний рейс 05.11

async function check(name, url, method = 'GET', body = null) {
    try {
        const opts = {
            method,
            headers: {
                'Api-Key': API_KEY,
                'Accept-Language': 'uk',
                'Content-Type': 'application/json'
            }
        };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(url, opts);
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();

        console.log(`\n========================================`);
        console.log(`👉 ${name} [${res.status}]`);
        console.log(`URL: ${url}`);

        if (res.status === 200) {
            if (contentType.includes('json')) {
                const json = JSON.parse(text);
                console.log('✅ Отримано JSON (довжина):', Array.isArray(json) ? json.length : Object.keys(json));
                console.log('Зразок даних:', JSON.stringify(json, null, 2).slice(0, 700));
            } else {
                console.log('📄 Отримано відповідь (не JSON):', text.slice(0, 300));
            }
        } else {
            console.log('❌ Відповідь:', text.slice(0, 200));
        }
    } catch (e) {
        console.log(`Помилка: ${e.message}`);
    }
}

async function run() {
    // 1. Квитки по рейсу через параметр в URL
    await check('1. Згруповані квитки рейсу', `${BASE_URL}/api/v3/trips/get_grouped_tickets/${TRIP_ID}`);
    await check('1.1 Квитки рейсу через query', `${BASE_URL}/api/v3/trips/get_grouped_tickets?tripId=${TRIP_ID}`);

    // 2. Телефони пасажирів онлайн
    await check('2. Телефони online GET', `${BASE_URL}/api/v3/system/users/phones-by-tickets/online?tripId=${TRIP_ID}`);
    await check('2.1 Телефони online POST', `${BASE_URL}/api/v3/system/users/phones-by-tickets/online`, 'POST', { tripId: TRIP_ID, trip_id: TRIP_ID });

    // 3. Телефони пасажирів від диспетчера
    await check('3. Телефони admin-booked GET', `${BASE_URL}/api/v3/system/users/phones-by-tickets/admin-booked?tripId=${TRIP_ID}`);

    // 4. Звіт рейсу (посадочна відомість)
    await check('4. Звіт рейсу get_trip_report', `${BASE_URL}/api/v3/utils/print/get_trip_report?tripId=${TRIP_ID}`);
    await check('5. Звіт перевезення', `${BASE_URL}/api/v3/utils/print/get_passenger_transportation_report?tripId=${TRIP_ID}`);
}

run();