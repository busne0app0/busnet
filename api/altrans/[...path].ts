// Білий список дозволених ендпоінтів Al-Trans (захист від відкритого проксі)
const ALLOWED_ENDPOINTS = new Set([
    'api/v2/booking/search_trips',
    'api/v3/booking/get_bus_map_for_trip_id',
    'api/v3/cache/routes'
]);

// In-memory Rate Limiter (60 запитів на хвилину на клієнтський IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 60;

    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (record.count >= maxRequests) {
        return false;
    }

    record.count++;
    return true;
}

export default async function handler(req: any, res: any) {
    // Дозволяємо CORS для фронтенду
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Api-Key, Accept-Language');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').toString().split(',')[0].trim();
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Забагато запитів до шлюзу. Зачекайте 1 хвилину.' });
    }

    try {
        // 1. Отримуємо шлях після /api/altrans/
        const pathParam = req.query?.path;
        const pathString = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');
        const normalizedPath = pathString.replace(/^\/+/, '');

        // 2. Безпека: Перевірка ендпоінту за суворим білим списком
        if (!ALLOWED_ENDPOINTS.has(normalizedPath)) {
            return res.status(403).json({ error: 'Доступ до даного ендпоінту заборонено політикою безпеки BUSNET' });
        }

        // 3. Безпечно формуємо query-параметри
        const queryParams = new URLSearchParams();
        if (req.query && typeof req.query === 'object') {
            Object.entries(req.query).forEach(([key, value]) => {
                if (key !== 'path' && value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => queryParams.append(key, String(v)));
                    } else {
                        queryParams.append(key, String(value));
                    }
                }
            });
        }

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const targetUrl = `https://al-trans.com.ua/api/${pathString}${queryString}`;

        const apiKey = process.env.ALTRANS_API_KEY;
        if (!apiKey) {
            console.error('[Vercel Al-Trans Gateway Error]: ALTRANS_API_KEY not configured.');
            return res.status(502).json({ error: 'Серверний шлюз: відсутній ALTRANS_API_KEY у змінних середовища.' });
        }

        const fetchOptions: RequestInit = {
            method: req.method || 'GET',
            headers: {
                'Api-Key': apiKey,
                'Accept-Language': 'uk',
                'Content-Type': 'application/json',
            },
        };

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        const upstream = await fetch(targetUrl, fetchOptions);
        const data = await upstream.text();

        res.setHeader('Cache-Control', 'no-store, max-age=0');
        return res.status(upstream.status).send(data);
    } catch (error: any) {
        console.error('[Vercel Al-Trans Gateway Error]:', error);
        return res.status(500).json({ error: 'Помилка з\'єднання зі шлюзом Al-Trans' });
    }
}
