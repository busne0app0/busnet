import { useState, useCallback } from 'react';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../busnet/types';
import { SearchParams } from '../types';
import { getUaDayOfWeek, formatISODate, addDays } from '../lib/dateUtils';
import { isCityMatch } from '../lib/cityUtils';

const ALTRANS_CARRIER_UID = 'ec987229-0773-49b9-bac8-69d562a794d1';

export interface RouteStop {
  id?: string;
  city: string;
  time?: string;
  price?: number;
  address?: string;
  dayOffset?: number;
  cityId?: number;
  external_city_id?: number;
}

export interface RouteDirection {
  stops?: RouteStop[];
  days?: string[];
  prices?: Record<string, number>;
  currency?: string;
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
  discounts?: { child04?: boolean; child412?: boolean };
  custom_discounts?: { id: string; label: string; value: number }[];
  outbound?: RouteDirection;
  inbound?: RouteDirection;
  pricesThere?: Record<string, number>;
  pricesBack?: Record<string, number>;
}

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

      const from = params.from?.trim() ?? '';
      const to = params.to?.trim() ?? '';
      const targetDate = params.date?.trim() || formatISODate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());

      const candidates: {
        route: DatabaseRoute;
        dir: 'outbound' | 'inbound';
        fromIdx: number;
        toIdx: number;
        startDate: string;
      }[] = [];

      const checkDirection = (
        route: DatabaseRoute,
        dirName: 'outbound' | 'inbound',
        dir: RouteDirection | undefined
      ) => {
        if (!dir || !dir.stops || !dir.days || dir.stops.length < 2) return;

        const stops = dir.stops;
        let fromIdx = -1;
        let toIdx = -1;

        if (from && to) {
          fromIdx = stops.findIndex((s) => isCityMatch(s.city, from));
          toIdx = stops.findIndex((s) => isCityMatch(s.city, to));
          if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return;
        } else if (from) {
          fromIdx = stops.findIndex((s) => isCityMatch(s.city, from));
          if (fromIdx === -1) return;
          toIdx = stops.length - 1;
        } else if (to) {
          toIdx = stops.findIndex((s) => isCityMatch(s.city, to));
          if (toIdx === -1) return;
          fromIdx = 0;
        } else {
          fromIdx = 0;
          toIdx = stops.length - 1;
        }

        const departureStop = stops[fromIdx];
        const dayOffset = departureStop.dayOffset || 0;
        const startDate = addDays(targetDate, -dayOffset);
        const uaDay = getUaDayOfWeek(startDate);

        if (dir.days.includes(uaDay)) {
          candidates.push({
            route,
            dir: dirName,
            fromIdx,
            toIdx,
            startDate
          });
        }
      };

      for (const route of routes) {
        checkDirection(route, 'outbound', route.outbound);
        checkDirection(route, 'inbound', route.inbound);
      }

      const quoteResults = await Promise.all(
        candidates.map(async (c) => {
          const stops = (c.route[c.dir]?.stops || []) as RouteStop[];
          const fromStop = stops[c.fromIdx];
          const toStop = stops[c.toIdx];
          const depCity = fromStop?.city || from;
          const arrCity = toStop?.city || to;
          const carrierId = c.route.carrier_id ?? c.route.carrierId ?? '';

          const depOffset = fromStop?.dayOffset || 0;
          const arrOffset = toStop?.dayOffset || 0;
          const depDate = addDays(c.startDate, depOffset);
          const arrDate = addDays(c.startDate, arrOffset);

          let livePrice: number | null = null;
          let liveCurrency = 'грн';
          let liveAvailableSeats = 30;
          let liveDepTime = (fromStop?.time || '22:30').slice(0, 5);
          let liveArrTime = (toStop?.time || '12:50').slice(0, 5);
          let busNumber = 'BC 4204 PM';

          const isAltrans = carrierId === ALTRANS_CARRIER_UID || (c.route.operator || '').toLowerCase().includes('al-trans');

          // 1. Повністю динамічний запит до Аль-Транса за cityId прямо з бази!
          if (isAltrans) {
            const fromCityId = fromStop?.cityId ?? fromStop?.external_city_id;
            const toCityId = toStop?.cityId ?? toStop?.external_city_id;

            if (fromCityId && toCityId) {
              try {
                const res = await fetch('/api/altrans/api/v2/booking/search_trips', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': 'uk',
                  },
                  body: JSON.stringify({
                    departure_city_id: fromCityId,
                    arrival_city_id: toCityId,
                    depature_date: `${depDate}T00:00:00`,
                    passengers_count: 1,
                    currecny_code: 'UAH',
                    enable_external_search: false,
                  }),
                });

                if (res.ok) {
                  const data = await res.json();
                  const seq = data?.trips_sequences;

                  if (Array.isArray(seq) && seq.length > 0) {
                    const first = seq[0];
                    if (first.price) livePrice = Number(first.price);
                    if (first.currency_code) liveCurrency = first.currency_code === 'UAH' ? 'грн' : first.currency_code;
                    if (first.free_seats !== undefined) liveAvailableSeats = first.free_seats;

                    if (first.departure_time) liveDepTime = String(first.departure_time).slice(0, 5);
                    if (first.arrival_time) liveArrTime = String(first.arrival_time).slice(0, 5);
                  } else {
                    return null; // У перевізника немає рейсу на цю дату
                  }
                }
              } catch (alErr) {
                console.warn('[useTrips] Live API error:', alErr);
              }
            }
          }

          // 2. Якщо живий API не відповів або інший перевізник — беремо з бази
          if (!livePrice) {
            const pricesMap = c.dir === 'outbound' ? (c.route.pricesThere || c.route.outbound?.prices) : (c.route.pricesBack || c.route.inbound?.prices);
            const matrixKey = `${c.fromIdx}-${c.toIdx}`;

            if (pricesMap && typeof pricesMap[matrixKey] === 'number' && pricesMap[matrixKey] > 0) {
              livePrice = pricesMap[matrixKey];
            } else if (typeof toStop?.price === 'number' && toStop.price > 0) {
              livePrice = toStop.price;
            } else {
              livePrice = 7800;
            }
          }

          const trip: Trip = {
            id: `${c.route.id}_${c.dir}_${c.fromIdx}_${c.toIdx}_${c.startDate}`,
            routeId: c.route.id,
            direction: c.dir,
            fromStopIdx: c.fromIdx,
            toStopIdx: c.toIdx,
            startDate: c.startDate,
            carrierId,
            carrierName: c.route.operator ?? 'AL-TRANS',
            from: depCity,
            to: arrCity,
            name: c.route.name ?? `${depCity} - ${arrCity}`,
            operator: c.route.operator ?? 'AL-TRANS',
            departureCity: depCity,
            arrivalCity: arrCity,

            departureDate: depDate,
            arrivalDate: arrDate,
            departureTime: liveDepTime,
            arrivalTime: liveArrTime,
            price: livePrice,
            currency: liveCurrency,
            availableSeats: liveAvailableSeats,
            totalSeats: 50,
            seatsTotal: 50,
            seatsBooked: Math.max(0, 50 - liveAvailableSeats),
            busInfo: `VAN HOOL (${busNumber})`,
            amenities: ['wifi', 'wc', 'ac', 'usb', 'tea'],
            discounts: c.route.discounts,
            custom_discounts: c.route.custom_discounts,
            status: 'active',
            stops
          };

          return trip;
        })
      );

      const validTrips = quoteResults.filter((t): t is Trip => t !== null);
      setTrips(validTrips);
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
        const todayIso = formatISODate(today.getFullYear(), today.getMonth() + 1, today.getDate());
        const dates: string[] = [];

        for (let i = 0; i < 90; i++) {
          const testDate = addDays(todayIso, i);

          const hasMatch = routes.some((route) => {
            const check = (dir?: RouteDirection) => {
              if (!dir?.stops || !dir?.days) return false;
              const fromIdx = dir.stops.findIndex((s) => isCityMatch(s.city, params.from));
              const toIdx = dir.stops.findIndex((s) => isCityMatch(s.city, params.to));
              if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return false;
              const dayOffset = dir.stops[fromIdx].dayOffset || 0;
              const startDate = addDays(testDate, -dayOffset);
              const uaDay = getUaDayOfWeek(startDate);
              return dir.days.includes(uaDay);
            };
            return check(route.outbound) || check(route.inbound);
          });

          if (hasMatch) dates.push(testDate);
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

      const { data: rawBookings } = await supabase
        .from('bookings')
        .select('id, trip_id, total_price, currency, status, passengers')
        .eq('carrier_id', carrierId)
        .neq('status', 'cancelled');

      const bookingsByTrip: Record<string, { bookedSeats: number; revenue: number; currency: string }> = {};
      (rawBookings || []).forEach((b: any) => {
        const tripKey = b.trip_id || '';
        const seats = Array.isArray(b.passengers) ? b.passengers.length : 1;
        if (!bookingsByTrip[tripKey]) {
          bookingsByTrip[tripKey] = { bookedSeats: 0, revenue: 0, currency: b.currency || 'UAH' };
        }
        bookingsByTrip[tripKey].bookedSeats += seats;
        bookingsByTrip[tripKey].revenue += (Number(b.total_price) || 0);
      });

      const routes = (rawRoutes as DatabaseRoute[]) || [];
      const normalized: Trip[] = routes.map((route) => {
        const stops = route.outbound?.stops ?? [];
        const first = stops[0] ?? { city: 'N/A', time: '00:00' };
        const last = stops[stops.length - 1] ?? { city: 'N/A', time: '00:00' };

        let bookedSeats = 0;
        let revenue = 0;
        let currency = route.currency || 'грн';

        Object.entries(bookingsByTrip).forEach(([tripKey, stats]) => {
          if (tripKey.includes(route.id)) {
            bookedSeats += stats.bookedSeats;
            revenue += stats.revenue;
            currency = stats.currency;
          }
        });

        return {
          id: route.id,
          carrierId: route.carrier_id ?? '',
          carrierName: route.operator ?? 'AL-TRANS',
          from: first.city,
          to: last.city,
          routeId: route.id,
          name: route.name ?? `${first.city} - ${last.city}`,
          operator: route.operator ?? 'AL-TRANS',
          departureCity: first.city,
          arrivalCity: last.city,
          departureDate: '',
          departureTime: first.time ?? '00:00',
          arrivalTime: last.time ?? '00:00',
          price: revenue,
          currency,
          availableSeats: Math.max(0, (route.seats ?? 50) - bookedSeats),
          totalSeats: route.seats ?? 50,
          seatsTotal: route.seats ?? 50,
          seatsBooked: bookedSeats,
          busInfo: route.busInfo ?? 'Комфортабельний автобус',
          amenities: route.amenities ?? [],
          status: (route.status as any) ?? 'active',
          stops,
          _raw: route
        } as Trip;
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