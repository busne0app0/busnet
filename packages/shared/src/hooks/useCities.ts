import { useEffect, useState } from 'react';
import { supabase } from '@busnet/shared/supabase/config';
import { cities as staticCities, City } from '@busnet/shared/data/cities';

export interface ExtendedCity extends City {
  fromDb?: boolean;
}

const STATIC_CITIES: ExtendedCity[] = staticCities.map((c) => ({ ...c, fromDb: false }));

/** Ключ для зіставлення: регістр, апострофи, пробіли */
const normalize = (s: string) =>
  s
    .normalize('NFC')
    .replace(/[’ʼ`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

// Індекс статики за всіма мовами (uk / en / it)
const staticIndex = new Map<string, City>();
for (const c of staticCities) {
  for (const name of Object.values(c.names)) {
    if (name) staticIndex.set(normalize(name), c);
  }
}

async function loadCities(): Promise<ExtendedCity[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('outbound, inbound')
    .eq('status', 'active');
  if (error) throw error;

  const byId = new Map<string, ExtendedCity>();

  for (const route of data ?? []) {
    const stops = [route.outbound?.stops, route.inbound?.stops]
      .filter(Array.isArray)
      .flat();

    for (const stop of stops) {
      const raw = typeof stop?.city === 'string' ? stop.city.trim() : '';
      if (!raw) continue;

      const known = staticIndex.get(normalize(raw));
      const city: ExtendedCity = known
        ? { ...known, fromDb: true }
        : {
            id: `db-${normalize(raw).replace(/[^\p{L}\p{N}]+/gu, '-')}`,
            names: { uk: raw, en: raw, it: raw },
            countryCode: '',
            popular: false,
            fromDb: true,
          };

      if (!byId.has(city.id)) byId.set(city.id, city);
    }
  }

  // Статичні міста без активних маршрутів
  for (const sc of staticCities) {
    if (!byId.has(sc.id)) byId.set(sc.id, { ...sc, fromDb: false });
  }

  return [...byId.values()];
}

// Кэш на рівні модуля: один запит на сесію для всіх компонентів
let citiesPromise: Promise<ExtendedCity[]> | null = null;
let resolvedCities: ExtendedCity[] | null = null;

export function useCities() {
  const [dbCities, setDbCities] = useState<ExtendedCity[]>(resolvedCities ?? STATIC_CITIES);
  const [isFetched, setIsFetched] = useState(resolvedCities !== null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (resolvedCities) return;
    let cancelled = false;

    if (!citiesPromise) {
      citiesPromise = loadCities().catch((e) => {
        citiesPromise = null; // дозволяємо повторну спробу при наступному монтуванні
        throw e;
      });
    }

    citiesPromise
      .then((list) => {
        resolvedCities = list;
        if (!cancelled) {
          setDbCities(list);
          setIsFetched(true);
        }
      })
      .catch((e) => {
        console.error('[useCities] Помилка завантаження міст:', e);
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { dbCities, isFetched, error, loading: !isFetched };
}
