import { useState, useCallback } from 'react';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../busnet/types';
import { SearchParams } from '../types';

// ─── Day-of-week helper ───────────────────────────────────────────────────────
const UA_DAYS = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'] as const;

function getUaDayOfWeek(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00Z');
  return UA_DAYS[date.getUTCDay()];
}

// ─── Route → Trip adapter ─────────────────────────────────────────────────────
function routeToTrip(route: any, fromStop: any, toStop: any, date: string): Trip {
  // БАГ 2 ФІКС: seatsBooked не існує в таблиці routes → завжди 0
  const seatsTotal: number = route.seats ?? 50;
  const seatsBooked: number = 0; // routes не має цього поля
  const availableSeats: number = seatsTotal - seatsBooked; // завжди число, ніколи NaN

  // БАГ 1 ФІКС: якщо fromStop.price = 0 (проміжна зупинка без ціни),
  // беремо першу зупинку з ціною > 0
  const allStops: any[] = route.outbound?.stops ?? [];
  const fallbackPrice = allStops.find((s: any) => (s.price ?? 0) > 0)?.price ?? 0;
  const price: number = (fromStop.price ?? 0) > 0 ? fromStop.price : fallbackPrice;

  return {
    id: `${route.id}_${fromStop.id ?? 'start'}_${toStop.id ?? 'end'}_${date}`,
    carrierId: route.carrier_id ?? route.carrierId,
    carrierName: route.operator ?? route.carrier_name ?? 'Перевізник',
    from: fromStop.city,
    to: toStop.city,
    routeId: route.id,
    name: route.name,
    operator: route.operator,
    departureCity: fromStop.city,
    arrivalCity: toStop.city,
    departureDate: date,
    departureTime: fromStop.time,
    arrivalTime: toStop.time,
    price,
    currency: route.currency ?? 'ГРН',
    availableSeats,
    totalSeats: seatsTotal,
    seatsTotal,
    seatsBooked,
    busInfo: route.busInfo ?? 'Комфортабельний автобус',
    amenities: route.amenities ?? [],
    status: route.status,
    stops: allStops,
  } as Trip;
}

// ─── Core client-side filter ──────────────────────────────────────────────────
function filterRoutes(
  routes: any[],
  from: string,
  to: string,
  uaDay: string
): Trip[] {
  const results: Trip[] = [];

  for (const route of routes) {
    const stops: any[] = route.outbound?.stops ?? [];
    const days: string[] = route.outbound?.days ?? [];

    if (uaDay && !days.includes(uaDay)) continue;

    const fromIdx = stops.findIndex(s =>
      s.city?.toLowerCase().includes(from.toLowerCase())
    );
    const toIdx = stops.findIndex(s =>
      s.city?.toLowerCase().includes(to.toLowerCase())
    );

    if (fromIdx === -1 || toIdx === -1 || (from && to && fromIdx >= toIdx)) continue;

    results.push(routeToTrip(route, stops[fromIdx], stops[toIdx], ''));
  }

  return results;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);

    try {
      // ✅ FIX 1: status = 'active'
      const { data: routes, error: dbErr } = await supabase
        .from('routes')
        .select('*')
        .eq('status', 'active');

      if (dbErr) throw dbErr;

      if (!routes || routes.length === 0) {
        setTrips([]);
        return;
      }

      const uaDay = params.date ? getUaDayOfWeek(params.date) : '';
      const from = params.from?.trim() ?? '';
      const to = params.to?.trim() ?? '';

      if (!from && !to && !params.date) {
        const all: Trip[] = [];
        for (const route of routes) {
          const stops: any[] = route.outbound?.stops ?? [];
          if (stops.length >= 2) {
            all.push(routeToTrip(route, stops[0], stops[stops.length - 1], ''));
          }
        }
        setTrips(all);
        return;
      }

      const filtered = filterRoutes(routes, from, to, uaDay)
        .map(t => ({ ...t, departureDate: params.date ?? '' }));

      setTrips(filtered);
    } catch (err: any) {
      console.error('[useTrips] fetchTrips error:', err);
      setError(err.message ?? 'Помилка пошуку рейсів');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableDates = useCallback(
    async (params: { from: string; to: string }): Promise<string[]> => {
      try {
        // ✅ FIX 1 (same): status = 'active'
        const { data: routes, error: dbErr } = await supabase
          .from('routes')
          .select('id, outbound, status')
          .eq('status', 'active');

        if (dbErr) throw dbErr;
        if (!routes) return [];

        const today = new Date();
        const dates: string[] = [];

        for (let i = 0; i < 90; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const iso = d.toISOString().split('T')[0];
          const uaDay = getUaDayOfWeek(iso);

          const hasMatch = routes.some(route => {
            const stops: any[] = route.outbound?.stops ?? [];
            const days: string[] = route.outbound?.days ?? [];
            if (!days.includes(uaDay)) return false;

            const fromIdx = stops.findIndex(s =>
              s.city?.toLowerCase().includes(params.from.toLowerCase())
            );
            const toIdx = stops.findIndex(s =>
              s.city?.toLowerCase().includes(params.to.toLowerCase())
            );
            return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
          });

          if (hasMatch) dates.push(iso);
        }

        return dates;
      } catch (err) {
        console.error('[useTrips] fetchAvailableDates error:', err);
        return [];
      }
    },
    []
  );

  const fetchCarrierTrips = useCallback(async (carrierId: string) => {
    setLoading(true);
    setError(null);

    try {
      // ✅ FIX 2: column is 'carrier_id' snake_case
      const { data: routes, error: dbErr } = await supabase
        .from('routes')
        .select('*')
        .eq('carrier_id', carrierId);

      if (dbErr) throw dbErr;

      const normalized: Trip[] = (routes ?? []).map((route: any) => {
        const stops: any[] = route.outbound?.stops ?? [];
        const first = stops[0] ?? { city: 'N/A', time: '00:00' };
        const last = stops[stops.length - 1] ?? { city: 'N/A', time: '00:00' };
        return routeToTrip(route, first, last, '');
      });

      setTrips(normalized);
    } catch (err: any) {
      console.error('[useTrips] fetchCarrierTrips error:', err);
      setError(err.message ?? 'Помилка завантаження рейсів перевізника');
    } finally {
      setLoading(false);
    }
  }, []);

  return { trips, loading, error, fetchTrips, fetchAvailableDates, fetchCarrierTrips };
}


