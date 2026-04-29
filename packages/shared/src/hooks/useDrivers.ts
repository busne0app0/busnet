/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
import { supabase } from '@busnet/shared/supabase/config';

export interface Driver {
  id: string;
  carrierId: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  rating: number;
  status: 'active' | 'on_trip' | 'resting' | 'inactive';
}

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrivers = useCallback(async (carrierId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('carrierId', carrierId);
      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addDriver = async (driverData: Omit<Driver, 'id'>) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .insert(driverData);
      if (error) throw error;
      await fetchDrivers(driverData.carrierId);
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  };

  const updateDriver = async (driverId: string, carrierId: string, data: Partial<Driver>) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update(data)
        .eq('id', driverId);
      if (error) throw error;
      await fetchDrivers(carrierId);
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  };

  const deleteDriver = async (driverId: string, carrierId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);
      if (error) throw error;
      await fetchDrivers(carrierId);
    } catch (error) {
      console.error('Error deleting driver:', error);
      throw error;
    }
  };

  return { drivers, loading, fetchDrivers, addDriver, updateDriver, deleteDriver };
}
