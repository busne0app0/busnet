/**
 * Al-Trans Live Integration Service
 * Динамічне отримання реальних бронювань з Al-Trans API.
 * БЕЗ хардкоду — всі дані тягнуться живцем з API.
 */

export const ALTRANS_CARRIER_UID = 'ec987229-0773-49b9-bac8-69d562a794d1';

export function isAltransCarrier(userOrUid?: any): boolean {
  if (!userOrUid) return false;
  if (typeof userOrUid === 'string') {
    return (
      userOrUid === ALTRANS_CARRIER_UID ||
      userOrUid.includes('ec987229') ||
      userOrUid.includes('infobus')
    );
  }
  const email = (userOrUid.email || '').toLowerCase();
  const company = (userOrUid.companyName || userOrUid.company_name || '').toLowerCase();
  const uid = userOrUid.uid || userOrUid.id || '';

  return (
    uid === ALTRANS_CARRIER_UID ||
    email.includes('infobus') ||
    email.includes('al-trans') ||
    email.includes('altrans') ||
    company.includes('al trans') ||
    company.includes('al-trans') ||
    company.includes('altrans')
  );
}

export interface AltransLiveSeatBooking {
  id: string;
  tripId: string;
  passengerName: string;
  phone?: string;
  email?: string;
  route: string;
  date: string;
  time: string;
  seats: number;
  seatNumber: string;
  floor: number;
  totalPrice: number;
  currency: string;
  status: 'confirmed' | 'pending';
  createdAt: string;
  busDescription?: string;
}

// --- Singleton Promise кеш ---
// Якщо кілька компонентів викликають одночасно — чекають на один і той самий проміс
let _cacheData: AltransLiveSeatBooking[] | null = null;
let _cacheTs: number = 0;
let _fetchPromise: Promise<AltransLiveSeatBooking[]> | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 хвилин

// Маршрути Al-Trans (пари cityFromId → cityToId)
const ROUTE_PAIRS = [
  { from: 1, to: 41 }, // Львів → Рим
  { from: 1, to: 42 }, // Львів → Мілан
  { from: 1, to: 46 }, // Львів → Болонья
  { from: 2, to: 41 }, // Київ → Рим
  { from: 2, to: 46 }, // Київ → Болонья
  { from: 3, to: 41 }, // Мукачево → Рим
  { from: 3, to: 46 }, // Мукачево → Болонья
  { from: 4, to: 41 }, // Ужгород → Рим
  { from: 1, to: 47 }, // Львів → Неаполь
  { from: 2, to: 47 }, // Київ → Неаполь
];

async function _doFetch(): Promise<AltransLiveSeatBooking[]> {
  const allBookings: AltransLiveSeatBooking[] = [];
  const seenTripIds = new Set<string>();

  // Дати: сьогодні + 7 днів
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  console.log('[AltransLive] Starting live fetch for dates:', dates);

  for (const dateStr of dates) {
    for (const pair of ROUTE_PAIRS) {
      try {
        const res = await fetch('/api/altrans/api/v2/booking/search_trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            departure_city_id: pair.from,
            arrival_city_id: pair.to,
            depature_date: dateStr + 'T00:00:00',
            passengers_count: 1,
            currecny_code: 'EUR',
            enable_external_search: false,
          }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const sequences = data.trips_sequences || data.sequences || (Array.isArray(data) ? data : []);

        for (const seq of sequences) {
          const trips: any[] = seq.trips || (seq.trip ? [seq.trip] : []);
          const depDate: string = seq.departure_date || seq.departureDate || dateStr;
          const depTime: string = seq.departure_time_hhmm || seq.departure_time || '';
          const currency: string = seq.currency_code || seq.currency || 'EUR';
          const price: number = Number(seq.min_price || seq.price || seq.minPrice || 0);

          for (const trip of trips) {
            const tripId = String(trip.id || trip.tripId || '');
            if (!tripId || seenTripIds.has(tripId)) continue;
            seenTripIds.add(tripId);

            try {
              const mapUrl = `/api/altrans/api/v3/booking/get_bus_map_for_trip_id?tripId=${tripId}&cityFromId=${pair.from}&cityToId=${pair.to}`;
              const mapRes = await fetch(mapUrl);
              if (!mapRes.ok) continue;
              const mapData = await mapRes.json();
              const busPlaces: any[] = mapData.busPlaces || [];
              const busDescription: string = mapData.busDescription || '';

              const occupied = busPlaces.filter(
                (p: any) => p.type === 'seat' &&
                  (p.status === 'purchased' || p.status === 'reserved')
              );

              for (const place of occupied) {
                const td = (place.trips && place.trips[0]) || {};
                const fromCity = td.CityFromName || trip.departure_city || `Місто ${pair.from}`;
                const toCity = td.CityToName || trip.arrival_city || `Місто ${pair.to}`;
                const isPurchased = place.status === 'purchased';

                allBookings.push({
                  id: `altrans_${tripId}_seat_${place.name}`,
                  tripId,
                  passengerName: `Пасажир (Місце ${place.name})`,
                  phone: '—',
                  email: '—',
                  route: `${fromCity} → ${toCity}`,
                  date: depDate,
                  time: depTime,
                  seats: 1,
                  seatNumber: String(place.name),
                  floor: place.floor || 1,
                  totalPrice: isPurchased ? price : 0,
                  currency,
                  status: isPurchased ? 'confirmed' : 'pending',
                  createdAt: new Date().toISOString(),
                  busDescription,
                });
              }
            } catch {
              // skip bad trip
            }
          }
        }
      } catch {
        // skip failed pair/date
      }
    }
  }

  console.log('[AltransLive] Done! Total live bookings:', allBookings.length);
  return allBookings;
}

/**
 * Отримати живі бронювання з Al-Trans.
 * Використовує singleton-проміс: якщо кілька компонентів
 * викликають одночасно — всі чекають на один запит.
 * Кешується на 5 хвилин.
 */
export async function fetchAltransLiveBookings(): Promise<AltransLiveSeatBooking[]> {
  // Якщо є свіжий кеш — повертаємо відразу
  if (_cacheData !== null && Date.now() - _cacheTs < CACHE_TTL_MS) {
    console.log('[AltransLive] Cache hit, entries:', _cacheData.length);
    return _cacheData;
  }

  // Якщо вже йде запит — чекаємо на нього (не запускаємо ще один)
  if (_fetchPromise) {
    console.log('[AltransLive] Already fetching, waiting...');
    return _fetchPromise;
  }

  // Запускаємо новий запит
  _fetchPromise = _doFetch()
    .then(data => {
      _cacheData = data;
      _cacheTs = Date.now();
      _fetchPromise = null;
      return data;
    })
    .catch(err => {
      console.warn('[AltransLive] Fetch failed:', err);
      _fetchPromise = null;
      return _cacheData || [];
    });

  return _fetchPromise;
}

/** Скидає кеш (наприклад, при ручному оновленні) */
export function clearAltransCache(): void {
  _cacheData = null;
  _cacheTs = 0;
  _fetchPromise = null;
}
