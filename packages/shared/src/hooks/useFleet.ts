/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
import { supabase } from '@busnet/shared/supabase/config';

export interface Bus {
  id: string;
  carrierId: string;
  number: string;
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  amenities: string[];
  lastMaintenance?: string;
  carrier_id?: string; // Add this for DB mapping
}

export function useFleet() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFleet = useCallback(async (carrierId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('carrier_id', carrierId);
      if (error) throw error;
      setBuses((data || []).map((d: any) => ({
        ...d,
        carrierId: d.carrier_id
      })));
    } catch (error) {
      console.error('Error fetching fleet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addBus = async (busData: Omit<Bus, 'id'>) => {
    try {
      const { carrierId, ...rest } = busData as any;
      const { error } = await supabase
        .from('buses')
        .insert({ ...rest, carrier_id: carrierId });
      if (error) throw error;
      await fetchFleet(busData.carrierId);
    } catch (error) {
      console.error('Error adding bus:', error);
      throw error;
    }
  };

  const updateBus = async (busId: string, carrierId: string, data: Partial<Bus>) => {
    try {
      const { error } = await supabase
        .from('buses')
        .update(data)
        .eq('id', busId);
      if (error) throw error;
      await fetchFleet(carrierId);
    } catch (error) {
      console.error('Error updating bus:', error);
      throw error;
    }
  };

  const deleteBus = async (busId: string, carrierId: string) => {
    try {
      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', busId);
      if (error) throw error;
      await fetchFleet(carrierId);
    } catch (error) {
      console.error('Error deleting bus:', error);
      throw error;
    }
  };

  return { buses, loading, fetchFleet, addBus, updateBus, deleteBus };
}
