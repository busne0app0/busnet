import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

/* =========================================================================
   /api/booking/create  —  server-verified booking (Vercel Serverless Function)

   Contract with the database (verified on live schema):
     rpc get_trip_quote(p_route_id, p_direction, p_from_stop, p_to_stop, p_start_date)
     rpc create_booking_verified(p_uid, p_route_id, p_direction, p_from_stop, p_to_stop,
                                 p_start_date, p_passengers, p_contact,
                                 p_idempotency_key, p_verified_unit_price)

   Security model:
     - uid comes ONLY from auth.getUser(token) (works for anonymous sessions too)
     - the client NEVER sends a price; `expectedPrice` is compared, never used
     - Al-Trans price is fetched server-side for the exact route/segment/day/time
       the user is booking and cross-checked against the DB quote (anchor)
     - fail closed: no fallback prices, any mismatch -> reject
   ========================================================================= */

/* ------------------------------- config --------------------------------- */
const ALTRANS_CARRIER_UID = process.env.ALTRANS_CARRIER_UID || 'ec987229-0773-49b9-bac8-69d562a794d1';
const ALTRANS_API_BASE = process.env.ALTRANS_API_BASE || 'https://al-trans.com.ua';
const ALTRANS_TIMEOUT_MS = 7000;

// Live price must stay within [MIN, MAX] x DB quote. Tune to your real tariff spread.
const PRICE_MIN_RATIO = Number(process.env.ALTRANS_PRICE_MIN_RATIO || 0.8);
const PRICE_MAX_RATIO = Number(process.env.ALTRANS_PRICE_MAX_RATIO || 1.5);

// Soft anti-hoarding caps (payment is cash to the driver, so a booking is free).
// NOT atomic: also enforce in the DB / Vercel Firewall / captcha (see notes).
const MAX_ACTIVE_BOOKINGS_PER_USER = 5;
const MAX_ACTIVE_BOOKINGS_PER_ANON_USER = 3;
const MAX_ACTIVE_BOOKINGS_PER_PHONE = 5;

// TODO(business): confirm these age rules before go-live.
const CHILD_DISCOUNT_MAX_AGE_EXCLUSIVE = 12; // child discounts only for age < 12 on travel date
const SENIOR_DISCOUNT_MIN_AGE = 60;          // senior discount only for age >= 60

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://bus-net.it,https://www.bus-net.it')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const CHILD_TYPES = new Set(['child', 'child_50', 'child_30']);
const SENIOR_TYPES = new Set(['senior_10']);

/* ------------------------------ helpers --------------------------------- */
class ApiError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDEM_RE = /^[A-Za-z0-9_-]{16,64}$/;
const DISCOUNT_RE = /^[A-Za-z0-9_-]{1,40}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isIsoDate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function kyivToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' }); // YYYY-MM-DD
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function ageOn(birthIso: string, onIso: string): number {
  const [by, bm, bd] = birthIso.split('-').map(Number);
  const [y, m, d] = onIso.split('-').map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age--;
  return age;
}

function normHHMM(v: unknown): string {
  return String(v ?? '').trim().slice(0, 5);
}

function ddmmyyyyToIso(v: unknown): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(v ?? '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function normCurrency(c: unknown): string {
  const v = String(c ?? '').trim().toUpperCase();
  if (['UAH', 'ГРН', '₴', 'ГРИВНЯ'].includes(v)) return 'UAH';
  if (['EUR', '€', 'ЄВРО', 'EURO'].includes(v)) return 'EUR';
  return v;
}

const toMinor = (n: number) => Math.round(n * 100);

/* ------------------------ soft rate limit (best effort) ------------------ */
// In-memory counters are NOT shared between serverless instances. This only
// dampens bursts on a warm instance. Real limiting: Vercel Firewall rule on
// /api/booking/* and/or Upstash Redis.
const hits = new Map<string, { count: number; resetAt: number }>();
function softRateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  }
  const rec = hits.get(key);
  if (!rec || now > rec.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count >= max) return false;
  rec.count++;
  return true;
}

function clientIp(req: any): string {
  const raw =
    req.headers['x-vercel-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.socket?.remoteAddress ||
    'unknown';
  return String(raw).split(',')[0].trim();
}

/* ------------------------------ clients ---------------------------------- */
function getEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !anon || !service) throw new Error('Supabase env is not configured');
  return { url, anon, service };
}

/* ---------------------------- input validation --------------------------- */
interface ParsedPassenger {
  firstName: string;
  lastName: string;
  discountType: string;
  birthDate: string | null;
}
interface ParsedInput {
  routeId: string;
  direction: 'outbound' | 'inbound';
  fromStop: number;
  toStop: number;
  startDate: string;
  passengers: ParsedPassenger[];
  contact: { email: string; phone: string };
  idempotencyKey: string;
  expectedPrice: number | null;
}

function parseBody(body: any): ParsedInput {
  const bad = (msg: string): never => {
    throw new ApiError(400, msg);
  };
  if (!body || typeof body !== 'object') bad('Некоректний запит');

  const { routeId, direction, fromStop, toStop, startDate, passengers, contact, idempotencyKey, expectedPrice } = body;

  if (typeof routeId !== 'string' || !UUID_RE.test(routeId)) bad('Некоректний маршрут');
  if (direction !== 'outbound' && direction !== 'inbound') bad('Некоректний напрям');
  if (!Number.isInteger(fromStop) || !Number.isInteger(toStop) || fromStop < 0 || toStop <= fromStop) {
    bad('Некоректні зупинки');
  }
  if (!isIsoDate(startDate)) bad('Некоректна дата');
  const today = kyivToday();
  if (startDate < today || startDate > addDaysIso(today, 365)) bad('Дата поза допустимим діапазоном');
  if (typeof idempotencyKey !== 'string' || !IDEM_RE.test(idempotencyKey)) {
    bad('Відсутній або некоректний ключ ідемпотентності');
  }

  if (!Array.isArray(passengers) || passengers.length < 1 || passengers.length > 10) {
    bad('Кількість пасажирів повинна бути від 1 до 10');
  }
  const pax: ParsedPassenger[] = passengers.map((p: any, i: number) => {
    const firstName = typeof p?.firstName === 'string' ? p.firstName.trim() : '';
    const lastName = typeof p?.lastName === 'string' ? p.lastName.trim() : '';
    if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) {
      throw new ApiError(400, `Пасажир ${i + 1}: вкажіть ім'я та прізвище`);
    }
    const dt = typeof p?.discountType === 'string' && p.discountType ? p.discountType : 'none';
    if (!DISCOUNT_RE.test(dt)) throw new ApiError(400, `Пасажир ${i + 1}: некоректний тип знижки`);
    let birthDate: string | null = null;
    if (p?.birthDate != null && p.birthDate !== '') {
      if (!isIsoDate(p.birthDate) || p.birthDate > startDate || p.birthDate < '1900-01-01') {
        throw new ApiError(400, `Пасажир ${i + 1}: некоректна дата народження`);
      }
      birthDate = p.birthDate;
    }
    // Age eligibility for discounts is checked on the TRAVEL date, server-side.
    if (CHILD_TYPES.has(dt) || SENIOR_TYPES.has(dt)) {
      if (!birthDate) throw new ApiError(400, `Пасажир ${i + 1}: для знижки потрібна дата народження`);
      const age = ageOn(birthDate, startDate);
      if (CHILD_TYPES.has(dt) && age >= CHILD_DISCOUNT_MAX_AGE_EXCLUSIVE) {
        throw new ApiError(400, `Пасажир ${i + 1}: дитяча знижка недоступна за віком`);
      }
      if (SENIOR_TYPES.has(dt) && age < SENIOR_DISCOUNT_MIN_AGE) {
        throw new ApiError(400, `Пасажир ${i + 1}: знижка недоступна за віком`);
      }
    }
    return { firstName, lastName, discountType: dt, birthDate };
  });

  const phone = typeof contact?.phone === 'string' ? contact.phone.trim().slice(0, 32) : '';
  const email = typeof contact?.email === 'string' ? contact.email.trim().slice(0, 254) : '';
  if (!phone && !email) bad('Вкажіть контактні дані (телефон або email)');
  if (email && !EMAIL_RE.test(email)) bad('Некоректний email');

  let exp: number | null = null;
  if (expectedPrice != null) {
    exp = Number(expectedPrice);
    if (!Number.isFinite(exp) || exp <= 0) bad('Некоректна очікувана ціна');
  }

  return {
    routeId,
    direction,
    fromStop,
    toStop,
    startDate,
    passengers: pax,
    contact: { email, phone },
    idempotencyKey,
    expectedPrice: exp,
  };
}

/* -------------------------- anti-hoarding (soft) ------------------------- */
async function enforceActiveLimits(svc: SupabaseClient, uid: string, isAnon: boolean, phone: string) {
  const today = kyivToday();

  const byUser = await svc
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)
    .in('status', ['pending', 'confirmed'])
    .gte('start_date', today);
  if (byUser.error) throw new Error(`limit query failed: ${byUser.error.message}`);
  const userCap = isAnon ? MAX_ACTIVE_BOOKINGS_PER_ANON_USER : MAX_ACTIVE_BOOKINGS_PER_USER;
  if ((byUser.count ?? 0) >= userCap) {
    throw new ApiError(429, 'Досягнуто ліміт активних бронювань. Скасуйте непотрібні або зверніться в підтримку.');
  }

  if (phone) {
    const byPhone = await svc
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .filter('contact->>phone', 'eq', phone)
      .in('status', ['pending', 'confirmed'])
      .gte('start_date', today);
    if (byPhone.error) throw new Error(`limit query failed: ${byPhone.error.message}`);
    if ((byPhone.count ?? 0) >= MAX_ACTIVE_BOOKINGS_PER_PHONE) {
      throw new ApiError(429, 'Для цього номера телефону вже забагато активних бронювань.');
    }
  }
}

/* ----------------------- Al-Trans price verification --------------------- */
async function verifyAltransPrice(args: {
  route: any;
  input: ParsedInput;
  quote: any;
  reqId: string;
}): Promise<{ price: number; currency: string }> {
  const { route, input, quote, reqId } = args;

  const apiKey = process.env.ALTRANS_API_KEY;
  if (!apiKey) {
    console.error(JSON.stringify({ reqId, msg: 'ALTRANS_API_KEY missing' }));
    throw new ApiError(500, 'Помилка інтеграції з перевізником');
  }

  // City ids come from OUR route stops, never from the client.
  const stops = (input.direction === 'outbound' ? route.outbound : route.inbound)?.stops;
  const fromCityId = Number(stops?.[input.fromStop]?.cityId);
  const toCityId = Number(stops?.[input.toStop]?.cityId);
  if (!Number.isInteger(fromCityId) || !Number.isInteger(toCityId)) {
    console.error(JSON.stringify({ reqId, msg: 'route stops without cityId', routeId: route.id }));
    throw new ApiError(422, 'Цей рейс тимчасово недоступний для онлайн-бронювання');
  }

  const wantedTime = normHHMM(quote.dep_time);
  if (!/^\d{2}:\d{2}$/.test(wantedTime)) {
    throw new ApiError(422, 'Цей рейс тимчасово недоступний для онлайн-бронювання');
  }

  const searchBody = { city_from_id: fromCityId, city_to_id: toCityId, date: input.startDate };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ALTRANS_TIMEOUT_MS);
  let data: any;
  try {
    const r = await fetch(`${ALTRANS_API_BASE}/api/v2/booking/search_trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey, 'Accept-Language': 'uk' },
      body: JSON.stringify(searchBody),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new ApiError(502, 'Перевізник Al-Trans тимчасово недоступний');
    data = await r.json();
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    if (e?.name === 'AbortError') throw new ApiError(504, 'Перевізник Al-Trans не відповів вчасно');
    throw new ApiError(502, 'Перевізник Al-Trans тимчасово недоступний');
  } finally {
    clearTimeout(timer);
  }

  if (!data || data.success !== true || !Array.isArray(data.trips_sequences)) {
    throw new ApiError(502, 'Некоректна відповідь перевізника');
  }

  // Match the exact trip the user is booking (cities + day + departure time).
  const candidates = data.trips_sequences.filter((s: any) => {
    const ft = s?.first_trip;
    if (!ft) return false;
    return (
      Number(ft.departure_city_id) === fromCityId &&
      Number(ft.arrival_city_id) === toCityId &&
      ddmmyyyyToIso(s.departure_date_ddmmyyyy ?? s.departure_date) === input.startDate &&
      normHHMM(s.departure_time_hhmm ?? s.departure_time) === wantedTime
    );
  });

  if (candidates.length === 0) {
    console.warn(JSON.stringify({ reqId, msg: 'altrans trip not matched', routeId: route.id, wantedTime }));
    throw new ApiError(409, 'Рейс на обрану дату й час не знайдено у перевізника', { code: 'trip_not_found' });
  }
  if (candidates.length > 1) {
    console.warn(JSON.stringify({ reqId, msg: 'altrans ambiguous match', count: candidates.length }));
    throw new ApiError(502, 'Не вдалося однозначно визначити рейс перевізника');
  }

  const trip = candidates[0];
  if (trip.canBook !== true || trip.canBookWithPaymentAtBoarding === false) {
    throw new ApiError(409, 'Рейс недоступний для бронювання з оплатою при посадці', { code: 'not_bookable' });
  }

  const livePrice = Number(trip.price);
  const liveCurrency = normCurrency(trip.currency_code);
  if (!Number.isFinite(livePrice) || livePrice <= 0) {
    throw new ApiError(502, 'Не вдалося отримати актуальну ціну від Al-Trans');
  }

  // Currency must match what the database will record for this route.
  const dbCurrency = normCurrency(quote.currency);
  if (liveCurrency !== dbCurrency) {
    console.warn(JSON.stringify({ reqId, msg: 'currency mismatch', liveCurrency, dbCurrency, routeId: route.id }));
    throw new ApiError(422, 'Валюта рейсу не підтримується для онлайн-бронювання', { code: 'currency_mismatch' });
  }

  // Anchor: live price must be plausible vs the DB quote for this exact segment.
  const dbPrice = Number(quote.price);
  if (!Number.isFinite(dbPrice) || dbPrice <= 0) {
    throw new ApiError(422, 'Цей рейс тимчасово недоступний для онлайн-бронювання');
  }
  if (livePrice < dbPrice * PRICE_MIN_RATIO || livePrice > dbPrice * PRICE_MAX_RATIO) {
    console.warn(JSON.stringify({ reqId, msg: 'live price outside anchor range', routeId: route.id, dbPrice, livePrice }));
    throw new ApiError(422, 'Не вдалося підтвердити вартість рейсу. Спробуйте пізніше.', { code: 'price_unverified' });
  }

  return { price: Math.round(livePrice * 100) / 100, currency: liveCurrency };
}

/* -------------------------------- handler -------------------------------- */
export default async function handler(req: any, res: any) {
  const reqId = randomUUID();

  // CORS: allowlist (non-browser clients send no Origin and are unaffected)
  const origin = req.headers.origin as string | undefined;
  const isDev = process.env.NODE_ENV !== 'production';
  if (origin && (ALLOWED_ORIGINS.includes(origin) || (isDev && /^http:\/\/localhost(:\d+)?$/.test(origin)))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Метод не підтримується' });

  try {
    if (!softRateLimit(clientIp(req))) {
      throw new ApiError(429, 'Забагато запитів. Зачекайте хвилину.');
    }

    const env = getEnv();

    // 1) Authentication: verified session (registered OR anonymous)
    const authHeader = String(req.headers['authorization'] || '');
    if (!authHeader.startsWith('Bearer ')) throw new ApiError(401, 'Потрібна авторизація');
    const token = authHeader.slice(7).trim();

    const authClient = createClient(env.url, env.anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !userData?.user) throw new ApiError(401, 'Недійсна або прострочена сесія');
    const uid = userData.user.id;
    const isAnon = Boolean((userData.user as any).is_anonymous);

    if (!softRateLimit(`uid:${uid}`, 10)) throw new ApiError(429, 'Забагато запитів. Зачекайте хвилину.');

    // 2) Validate input (whitelisted fields only)
    const input = parseBody(req.body);

    const svc = createClient(env.url, env.service, { auth: { persistSession: false, autoRefreshToken: false } });

    // 3) Soft caps against seat hoarding
    await enforceActiveLimits(svc, uid, isAnon, input.contact.phone);

    // 4) Route
    const { data: route, error: routeError } = await svc
      .from('routes')
      .select('id, carrier_id, status, outbound, inbound')
      .eq('id', input.routeId)
      .maybeSingle();
    if (routeError) throw new Error(`route query failed: ${routeError.message}`);
    if (!route || route.status !== 'active') throw new ApiError(404, 'Маршрут не знайдено');

    // 5) Authoritative DB quote (validates day of week, stops, availability)
    const { data: quote, error: quoteError } = await svc.rpc('get_trip_quote', {
      p_route_id: input.routeId,
      p_direction: input.direction,
      p_from_stop: input.fromStop,
      p_to_stop: input.toStop,
      p_start_date: input.startDate,
    });
    if (quoteError) throw new Error(`quote rpc failed: ${quoteError.message}`);
    if (!quote?.ok) throw new ApiError(400, String(quote?.error || 'Рейс недоступний'));
    if (Number(quote.available) < input.passengers.length) {
      throw new ApiError(409, `Недостатньо місць. Залишилось: ${quote.available}`, { code: 'no_seats' });
    }

    // 6) Price
    const isAltrans = route.carrier_id === ALTRANS_CARRIER_UID;
    let verifiedUnitPrice: number | null = null;
    let displayedUnitPrice: number;
    let priceCurrency: string = normCurrency(quote.currency);

    if (isAltrans) {
      const live = await verifyAltransPrice({ route, input, quote, reqId });
      verifiedUnitPrice = live.price;
      displayedUnitPrice = live.price;
      priceCurrency = live.currency;
    } else {
      // Internal carriers: the database computes the price itself.
      displayedUnitPrice = Number(quote.price);
    }

    // expectedPrice is a pure price-change detector (exact, in minor units)
    if (input.expectedPrice != null && toMinor(input.expectedPrice) !== toMinor(displayedUnitPrice)) {
      throw new ApiError(409, 'Ціна рейсу змінилася. Підтвердіть нову вартість.', {
        code: 'price_changed',
        newPrice: displayedUnitPrice,
        currency: priceCurrency,
      });
    }

    // 7) Booking in ONE DB transaction (lock, seats, discounts, trips, bookings)
    const { data: result, error: rpcError } = await svc.rpc('create_booking_verified', {
      p_uid: uid,
      p_route_id: input.routeId,
      p_direction: input.direction,
      p_from_stop: input.fromStop,
      p_to_stop: input.toStop,
      p_start_date: input.startDate,
      p_passengers: input.passengers.map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        discountType: p.discountType,
      })),
      p_contact: input.contact,
      p_idempotency_key: input.idempotencyKey,
      p_verified_unit_price: verifiedUnitPrice,
    });

    if (rpcError) throw new Error(`booking rpc failed: ${rpcError.message}`);
    if (!result?.success) {
      // Business messages come from our own SQL functions (safe to show).
      const msg = String(result?.error || 'Не вдалося створити бронювання');
      throw new ApiError(msg.includes('Недостатньо місць') ? 409 : 400, msg);
    }

    return res.status(200).json({
      success: true,
      booking_id: result.booking_id,
      total_price: result.total_price,
      currency: result.currency,
      status: result.status ?? (isAltrans ? 'pending' : 'confirmed'),
      idempotent: Boolean(result.idempotent),
    });
  } catch (err: any) {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ success: false, error: err.message, ...(err.extra || {}) });
    }
    // Never leak internals to the client.
    console.error(JSON.stringify({ reqId, msg: 'booking endpoint error', error: String(err?.message || err) }));
    return res.status(500).json({ success: false, error: 'Внутрішня помилка сервера', requestId: reqId });
  }
}
