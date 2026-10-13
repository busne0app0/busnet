import { useState, useEffect, useRef } from 'react';
import { supabase } from '@busnet/shared/supabase/config';
import { getUaDayOfWeek, formatISODate } from '../lib/dateUtils';
import { isCityMatch } from '../lib/cityUtils';

export interface CalendarDayInfo {
  count: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
  routes: string[];
  amenities: string[];
  isAvailable: boolean;
}

export interface RouteStopRecord {
  city: string;
  price?: number | null;
  time?: string;
  id?: string;
  address?: string;
}

export interface RouteDirectionRecord {
  stops?: RouteStopRecord[];
  days?: string[];
}

export interface RouteRecord {
  id: string;
  name: string;
  outbound?: RouteDirectionRecord;
  inbound?: RouteDirectionRecord;
  amenities?: string[];
  currency?: string;
  status: string;
  pricesThere?: Record<string, number>;
  pricesBack?: Record<string, number>;
  seats?: number;
}

interface UseCalendarScheduleOptions {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  from?: string;
  to?: string;
}

// Bounded in-memory LRU cache to prevent memory leaks (item 5)
const MAX_CACHE_SIZE = 50;
const scheduleCache = new Map<string, Record<number, CalendarDayInfo>>();

export function useCalendarSchedule({ year, month, from = '', to = '' }: UseCalendarScheduleOptions) {
  const [monthTrips, setMonthTrips] = useState<Record<number, CalendarDayInfo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search parameters to prevent spamming Supabase during typing (item 2)
  const [debouncedFrom, setDebouncedFrom] = useState(from);
  const [debouncedTo, setDebouncedTo] = useState(to);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFrom(from);
      setDebouncedTo(to);
    }, 180);
    return () => clearTimeout(timer);
  }, [from, to]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmedFrom = debouncedFrom.trim();
    const trimmedTo = debouncedTo.trim();
    const cacheKey = `${year}-${month}-${trimmedFrom}-${trimmedTo}`;

    if (scheduleCache.has(cacheKey)) {
      setMonthTrips(scheduleCache.get(cacheKey)!);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let isMounted = true;

    async function fetchSchedule() {
      setLoading(true);
      setError(null);

      try {
        const { data: rawRoutes, error: dbError } = await supabase
          .from('routes')
          .select('id, name, outbound, inbound, amenities, currency, status, pricesThere, pricesBack, seats')
          .eq('status', 'active')
          .abortSignal(controller.signal);

        if (dbError) throw dbError;
        if (!isMounted) return;

        const routes: RouteRecord[] = (rawRoutes as RouteRecord[]) || [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const data: Record<number, CalendarDayInfo> = {};

        // Helper to check a direction (outbound or inbound)
        const checkDirection = (
          dir: RouteDirectionRecord | undefined,
          pricesMap: Record<string, number> | undefined,
          defaultCurrency: string,
          routeAmenities: string[],
          dayNum: number,
          uaDay: string
        ) => {
          if (!dir || !dir.stops || !dir.days) return;
          if (!dir.days.includes(uaDay)) return;

          const stops = dir.stops;
          if (stops.length < 2) return;

          let fromIdx = -1;
          let toIdx = -1;

          if (trimmedFrom) {
            fromIdx = stops.findIndex(s => isCityMatch(s.city, trimmedFrom));
          }
          if (trimmedTo) {
            toIdx = stops.findIndex(s => isCityMatch(s.city, trimmedTo));
          }

          // Both cities provided: must appear in proper sequence
          if (trimmedFrom && trimmedTo) {
            if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return;
          } else if (trimmedFrom) {
            if (fromIdx === -1) return;
          } else if (trimmedTo) {
            if (toIdx === -1) return;
          }

          // Calculate price properly
          let calculatedPrice = 0;
          if (fromIdx !== -1 && toIdx !== -1 && pricesMap) {
            const matrixKey = `${fromIdx}-${toIdx}`;
            if (typeof pricesMap[matrixKey] === 'number') {
              calculatedPrice = pricesMap[matrixKey];
            }
          }

          if (calculatedPrice <= 0) {
            const destStopPrice = toIdx !== -1 ? stops[toIdx]?.price : undefined;
            const originStopPrice = fromIdx !== -1 ? stops[fromIdx]?.price : undefined;

            if (typeof destStopPrice === 'number' && destStopPrice > 0) {
              calculatedPrice = destStopPrice;
            } else if (typeof originStopPrice === 'number' && originStopPrice > 0) {
              calculatedPrice = originStopPrice;
            } else {
              const pricedStop = stops.find(s => (s.price ?? 0) > 0);
              calculatedPrice = pricedStop?.price ?? 0;
            }
          }

          const firstStopCity = stops[0]?.city || '';
          const lastStopCity = stops[stops.length - 1]?.city || '';
          const routeStr = `${firstStopCity} → ${lastStopCity}`;

          if (!data[dayNum]) {
            data[dayNum] = {
              count: 0,
              minPrice: Infinity,
              maxPrice: 0,
              currency: defaultCurrency || 'ГРН',
              routes: [],
              amenities: [],
              isAvailable: true,
            };
          }

          data[dayNum].count += 1;

          // Currency collision fix (item 1): bind currency to lowest price found
          if (calculatedPrice > 0) {
            if (calculatedPrice < data[dayNum].minPrice) {
              data[dayNum].minPrice = calculatedPrice;
              data[dayNum].currency = defaultCurrency || 'ГРН';
            }
            data[dayNum].maxPrice = Math.max(data[dayNum].maxPrice, calculatedPrice);
          }

          if (!data[dayNum].routes.includes(routeStr)) {
            data[dayNum].routes.push(routeStr);
          }

          // Amenities using Set for O(N) deduplication
          if (routeAmenities.length > 0) {
            const amenitySet = new Set(data[dayNum].amenities);
            for (const a of routeAmenities) {
              amenitySet.add(a);
            }
            data[dayNum].amenities = Array.from(amenitySet);
          }
        };

        // Scan each day of the month
        for (let d = 1; d <= daysInMonth; d++) {
          const iso = formatISODate(year, month + 1, d);
          const uaDay = getUaDayOfWeek(iso);

          for (const route of routes) {
            const cur = route.currency || 'ГРН';
            const amenities = route.amenities || [];

            // Check outbound
            checkDirection(route.outbound, route.pricesThere, cur, amenities, d, uaDay);

            // Check inbound
            checkDirection(route.inbound, route.pricesBack, cur, amenities, d, uaDay);
          }

          if (data[d]) {
            if (data[d].minPrice === Infinity) data[d].minPrice = 0;
          }
        }

        // Bounded LRU cache clean-up (item 5)
        if (scheduleCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = scheduleCache.keys().next().value;
          if (oldestKey) scheduleCache.delete(oldestKey);
        }
        scheduleCache.set(cacheKey, data);

        if (isMounted) {
          setMonthTrips(data);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError' && isMounted) {
          console.error('[useCalendarSchedule] Error loading schedule:', err);
          setError((err as Error)?.message || 'Помилка завантаження розкладу');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSchedule();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [year, month, debouncedFrom, debouncedTo]);

  return { monthTrips, loading, error };
}
