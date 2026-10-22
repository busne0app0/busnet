import { useState, useCallback } from 'react';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../busnet/types';
import { SearchParams } from '../types';
import { getUaDayOfWeek, formatISODate, addDays } from '../lib/dateUtils';
import { isCityMatch } from '../lib/cityUtils';

export interface RouteStop {
  id?: string;
  city: string;
  time?: string;
  price?: number;
  address?: string;
  dayOffset?: number;
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

      // Find candidates to quote across both directions
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

        // Rule 7: start_date = обрана дата − dayOffset зупинки посадки.
        // Дні рейсу (days) стосуються першої зупинки.
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

      // Rule 8: get quotes via get_trip_quote RPC
      const quoteResults = await Promise.all(
        candidates.map(async (c) => {
          try {
            const { data, error: quoteErr } = await supabase.rpc('get_trip_quote', {
              p_route_id: c.route.id,
              p_direction: c.dir,
              p_from_stop: c.fromIdx,
              p_to_stop: c.toIdx,
              p_start_date: c.startDate
            });

            if (quoteErr || !data || data.ok === false) {
              console.warn('[useTrips] quote error:', c.route.id, quoteErr || data?.error);
              return null;
            }

            const stops = (c.route[c.dir]?.stops || []) as RouteStop[];
            const depCity = data.from_city || stops[c.fromIdx]?.city;
            const arrCity = data.to_city || stops[c.toIdx]?.city;
            const depDate = data.dep_date || targetDate;
            const arrDate = data.arr_date || depDate;

            const trip: Trip = {
              id: `${c.route.id}_${c.dir}_${c.fromIdx}_${c.toIdx}_${c.startDate}`,
              routeId: c.route.id,
              direction: c.dir,
              fromStopIdx: c.fromIdx,
              toStopIdx: c.toIdx,
              startDate: c.startDate,
              carrierId: c.route.carrier_id ?? c.route.carrierId ?? '',
              carrierName: c.route.operator ?? c.route.carrier_name ?? 'Перевізник',
              from: depCity,
              to: arrCity,
              name: c.route.name ?? `${depCity} - ${arrCity}`,
              operator: c.route.operator ?? 'Перевізник',
              departureCity: depCity,
              arrivalCity: arrCity,
              departureDate: depDate,
              arrivalDate: arrDate,
              departureTime: data.dep_time || stops[c.fromIdx]?.time || '00:00',
              arrivalTime: data.arr_time || stops[c.toIdx]?.time || '00:00',
              price: data.price,
              currency: data.currency || c.route.currency || 'UAH',
              availableSeats: data.available,
              totalSeats: data.seats_total ?? (c.route.seats || 50),
              seatsTotal: data.seats_total ?? (c.route.seats || 50),
              seatsBooked: Math.max(0, (data.seats_total ?? (c.route.seats || 50)) - (data.available ?? 0)),
              busInfo: c.route.busInfo ?? 'Комфортабельний автобус',
              amenities: c.route.amenities ?? [],
              discounts: c.route.discounts,
              custom_discounts: c.route.custom_discounts,
              status: (c.route.status as any) ?? 'active',
              stops
            };
            return trip;
          } catch (e) {
            console.error('[useTrips] quote exception:', e);
            return null;
          }
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

      // Rule 14: заповненість і дохід брати з bookings
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
        let currency = route.currency || 'ГРН';

        Object.entries(bookingsByTrip).forEach(([tripKey, stats]) => {
          if (tripKey.includes(route.id)) {
            bookedSeats += stats.bookedSeats;
            revenue += stats.revenue;
            currency = stats.currency;
          }
        });

        const seatsTotal = route.seats ?? 50;
        return {
          id: route.id,
          carrierId: route.carrier_id ?? '',
          carrierName: route.operator ?? 'Перевізник',
          from: first.city,
          to: last.city,
          routeId: route.id,
          name: route.name ?? `${first.city} - ${last.city}`,
          operator: route.operator ?? 'Перевізник',
          departureCity: first.city,
          arrivalCity: last.city,
          departureDate: '',
          departureTime: first.time ?? '00:00',
          arrivalTime: last.time ?? '00:00',
          price: revenue,
          currency,
          availableSeats: Math.max(0, seatsTotal - bookedSeats),
          totalSeats: seatsTotal,
          seatsTotal,
          seatsBooked: bookedSeats,
          busInfo: route.busInfo ?? 'Комфортабельний автобус',
          amenities: route.amenities ?? [],
          status: (route.status as any) ?? 'pending',
          stops
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
