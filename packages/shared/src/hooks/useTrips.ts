import { useState, useCallback } from 'react';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../busnet/types';
import { SearchParams } from '../types';
import { getUaDayOfWeek, formatISODate } from '../lib/dateUtils';
import { isCityMatch } from '../lib/cityUtils';

export interface RouteStop {
  id?: string;
  city: string;
  time?: string;
  price?: number;
  address?: string;
}

export interface RouteDirection {
  stops?: RouteStop[];
  days?: string[];
}

export interface DatabaseRoute {
  id: string;
  name?: string;
  carrier_id?: string;
  carrierId?: string;
  operator?: string;
  carrier_name?: string;
  status?: string;
  currency?: string;
  seats?: number;
  busInfo?: string;
  amenities?: string[];
  outbound?: RouteDirection;
  inbound?: RouteDirection;
  pricesThere?: Record<string, number>;
  pricesBack?: Record<string, number>;
}

// ─── Route → Trip adapter ─────────────────────────────────────────────────────
function routeToTrip(
  route: DatabaseRoute,
  fromStop: RouteStop,
  toStop: RouteStop,
  date: string,
  segmentPrice?: number
): Trip {
  const seatsTotal: number = route.seats ?? 50;
  const seatsBooked: number = 0;
  const availableSeats: number = seatsTotal - seatsBooked;

  const allStops: RouteStop[] = route.outbound?.stops ?? [];
  let finalPrice = segmentPrice ?? 0;

  if (finalPrice <= 0) {
    if ((toStop.price ?? 0) > 0) {
      finalPrice = toStop.price!;
    } else if ((fromStop.price ?? 0) > 0) {
      finalPrice = fromStop.price!;
    } else {
      const fallbackPrice = allStops.find((s) => (s.price ?? 0) > 0)?.price ?? 0;
      finalPrice = fallbackPrice;
    }
  }

  return {
    id: `${route.id}_${fromStop.id ?? fromStop.city}_${toStop.id ?? toStop.city}_${date}`,
    carrierId: route.carrier_id ?? route.carrierId ?? '',
    carrierName: route.operator ?? route.carrier_name ?? 'Перевізник',
    from: fromStop.city,
    to: toStop.city,
    routeId: route.id,
    name: route.name ?? `${fromStop.city} - ${toStop.city}`,
    operator: route.operator ?? 'Перевізник',
    departureCity: fromStop.city,
    arrivalCity: toStop.city,
    departureDate: date,
    departureTime: fromStop.time ?? '00:00',
    arrivalTime: toStop.time ?? '00:00',
    price: finalPrice,
    currency: route.currency ?? 'ГРН',
    availableSeats,
    totalSeats: seatsTotal,
    seatsTotal,
    seatsBooked,
    busInfo: route.busInfo ?? 'Комфортабельний автобус',
    amenities: route.amenities ?? [],
    status: (route.status as any) ?? 'active',
    stops: allStops,
  } as Trip;
}

// ─── Core client-side filter with Inbound & Outbound support (items 8, 16) ────
function filterRoutes(
  routes: DatabaseRoute[],
  from: string,
  to: string,
  uaDay: string
): Trip[] {
  const results: Trip[] = [];

  const checkDirection = (
    route: DatabaseRoute,
    dir: RouteDirection | undefined,
    pricesMap: Record<string, number> | undefined
  ) => {
    if (!dir || !dir.stops || !dir.days) return;
    if (uaDay && !dir.days.includes(uaDay)) return;

    const stops = dir.stops;
    if (stops.length < 2) return;

    let fromIdx = -1;
    let toIdx = -1;

    if (from) {
      fromIdx = stops.findIndex((s) => isCityMatch(s.city, from));
    }
    if (to) {
      toIdx = stops.findIndex((s) => isCityMatch(s.city, to));
    }

    if (from && to) {
      if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return;
    } else if (from) {
      if (fromIdx === -1) return;
      toIdx = stops.length - 1;
    } else if (to) {
      if (toIdx === -1) return;
      fromIdx = 0;
    }

    let segmentPrice: number | undefined;
    if (fromIdx !== -1 && toIdx !== -1 && pricesMap) {
      segmentPrice = pricesMap[`${fromIdx}-${toIdx}`];
    }

    results.push(routeToTrip(route, stops[fromIdx], stops[toIdx], '', segmentPrice));
  };

  for (const route of routes) {
    // 1. Check outbound
    checkDirection(route, route.outbound, route.pricesThere);

    // 2. Check inbound (item 8)
    checkDirection(route, route.inbound, route.pricesBack);
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
      const { data: rawRoutes, error: dbErr } = await supabase
        .from('routes')
        .select('*')
        .eq('status', 'active');

      if (dbErr) throw dbErr;

      const routes = (rawRoutes as DatabaseRoute[]) || [];
      if (routes.length === 0) {
        setTrips([]);
        return;
      }

      const uaDay = params.date ? getUaDayOfWeek(params.date) : '';
      const from = params.from?.trim() ?? '';
      const to = params.to?.trim() ?? '';

      if (!from && !to && !params.date) {
        const all: Trip[] = [];
        for (const route of routes) {
          const stops = route.outbound?.stops ?? [];
          if (stops.length >= 2) {
            all.push(routeToTrip(route, stops[0], stops[stops.length - 1], ''));
          }
        }
        setTrips(all);
        return;
      }

      const filtered = filterRoutes(routes, from, to, uaDay).map((t) => ({
        ...t,
        departureDate: params.date ?? '',
      }));

      setTrips(filtered);
    } catch (err: unknown) {
      console.error('[useTrips] fetchTrips error:', err);
      setError((err as Error)?.message ?? 'Помилка пошуку рейсів');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableDates = useCallback(
    async (params: { from: string; to: string }): Promise<string[]> => {
      try {
        const { data: rawRoutes, error: dbErr } = await supabase
          .from('routes')
          .select('id, outbound, inbound, status')
          .eq('status', 'active');

        if (dbErr) throw dbErr;
        const routes = (rawRoutes as DatabaseRoute[]) || [];
        if (routes.length === 0) return [];

        const today = new Date();
        const dates: string[] = [];

        for (let i = 0; i < 90; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const iso = formatISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
          const uaDay = getUaDayOfWeek(iso);

          const hasMatch = routes.some((route) => {
            const check = (dir?: RouteDirection) => {
              if (!dir?.stops || !dir?.days?.includes(uaDay)) return false;
              const fromIdx = dir.stops.findIndex((s) => isCityMatch(s.city, params.from));
              const toIdx = dir.stops.findIndex((s) => isCityMatch(s.city, params.to));
              return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
            };
            return check(route.outbound) || check(route.inbound);
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
      const { data: rawRoutes, error: dbErr } = await supabase
        .from('routes')
        .select('*')
        .eq('carrier_id', carrierId);

      if (dbErr) throw dbErr;

      const routes = (rawRoutes as DatabaseRoute[]) || [];
      const normalized: Trip[] = routes.map((route) => {
        const stops = route.outbound?.stops ?? [];
        const first = stops[0] ?? { city: 'N/A', time: '00:00' };
        const last = stops[stops.length - 1] ?? { city: 'N/A', time: '00:00' };
        return routeToTrip(route, first, last, '');
      });

      setTrips(normalized);
    } catch (err: unknown) {
      console.error('[useTrips] fetchCarrierTrips error:', err);
      setError((err as Error)?.message ?? 'Помилка завантаження рейсів перевізника');
    } finally {
      setLoading(false);
    }
  }, []);

  return { trips, loading, error, fetchTrips, fetchAvailableDates, fetchCarrierTrips };
}
