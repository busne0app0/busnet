/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../busnet/types';
import { SearchParams } from '../types';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('trips')
        .select('*')
        .eq('status', 'active');

      if (params.date) {
        query = query.eq('departureDate', params.date);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results: Trip[] = data || [];

      // Client-side filtering for stops
      if (params.from && params.to) {
        const fromCity = params.from.toLowerCase();
        const toCity = params.to.toLowerCase();

        results = results.filter(trip => {
          const stopCities = (trip.stopCities || trip.stopsThere?.map((s: any) => s.city) || []).map(c => c.toLowerCase());
          const fromIdx = stopCities.indexOf(fromCity);
          const toIdx = stopCities.indexOf(toCity);
          return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
        });
      } else if (params.from) {
        const fromCity = params.from.toLowerCase();
        results = results.filter(trip => {
          const stopCities = (trip.stopCities || trip.stopsThere?.map((s: any) => s.city) || []).map(c => c.toLowerCase());
          return stopCities.includes(fromCity);
        });
      } else if (params.to) {
        const toCity = params.to.toLowerCase();
        results = results.filter(trip => {
          const stopCities = (trip.stopCities || trip.stopsThere?.map((s: any) => s.city) || []).map(c => c.toLowerCase());
          return stopCities.includes(toCity);
        });
      }

      setTrips(results);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCarrierTrips = useCallback(async (carrierId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('carrierId', carrierId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setTrips(data || []);
    } catch (err: any) {
      console.error('Error fetching carrier trips:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { trips, loading, error, fetchTrips, fetchCarrierTrips };
}
