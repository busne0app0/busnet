const API_KEY = 'eDsaqP/Hz0KgzBh6Sk5NNg==';
const BASE_URL = 'https://al-trans.com.ua';
const TEST_TRIP_ID = 31145;

async function run() {
    console.log('🔍 Скануємо JS бандли на наявність методів пасажирів, замовлень і квитків...');
    const html = await (await fetch(BASE_URL)).text();

    const scripts = Array.from(new Set(html.match(/src="([^"]+\.js)"/g) || []))
        .map(s => s.replace(/src="|"/g, ''))
        .map(s => s.startsWith('http') ? s : `${BASE_URL}/${s.replace(/^\//, '')}`);

    const allApis = new Set();
    for (const src of scripts) {
        try {
            const code = await (await fetch(src)).text();
            const matches = code.match(/api\/[a-zA-Z0-9_\-\/]+/g) || [];
            matches.forEach(m => allApis.add(m));
        } catch (e) { }
    }

    // Фільтруємо ВСІ 300+ ендпоінтів за ключовими словами
    const keywords = ['order', 'ticket', 'passenger', 'trip', 'carrier', 'client', 'booking', 'report'];
    const relevantApis = Array.from(allApis)
        .filter(api => keywords.some(kw => api.toLowerCase().includes(kw)))
        .sort();

    console.log(`\n🎯 ЗНАЙДЕНО ${relevantApis.length} ЦІЛЬОВИХ ЕНДПОІНТІВ (квитки, замовлення, пасажири):`);
    relevantApis.forEach(api => console.log('  → ' + api));

    console.log('\n🚀 Тестуємо цільові ендпоінти з вашим API-KEY...');
    for (const api of relevantApis) {
        // Пробуємо GET запити для інформаційних методів
        if (api.includes('add') || api.includes('delete') || api.includes('update') || api.includes('pay') || api.includes('reserve')) {
            continue; // пропускаємо мутації (створення/видалення)
        }

        let url = `${BASE_URL}/${api}`;
        if (api.includes('details') || api.includes('get_order')) {
            url += `?tripId=${TEST_TRIP_ID}&orderId=1`;
        } else if (api.includes('trip')) {
            url += `?tripId=${TEST_TRIP_ID}`;
        }

        try {
            const res = await fetch(url, {
                headers: {
                    'Api-Key': API_KEY,
                    'Accept-Language': 'uk'
                }
            });

            const contentType = res.headers.get('content-type') || '';
            if (res.status === 200 && contentType.includes('application/json')) {
                const json = await res.json();
                console.log(`\n🔥 УСПІХ [200 OK]: /${api}`);
                console.log('Відповідь API:', JSON.stringify(json).slice(0, 400));
            }
        } catch (e) { }
    }
}

run();