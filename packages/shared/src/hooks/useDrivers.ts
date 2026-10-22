/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
import { supabase } from '@busnet/shared/supabase/config';

export interface Driver {
  id: string;
  uid?: string;           // Supabase Auth UID (after account creation)
  carrierId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  rating: number;
  status: 'active' | 'on_trip' | 'resting' | 'inactive' | 'fired';
  tripsCount?: number;
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
        .eq('carrier_id', carrierId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Map snake_case DB columns → camelCase
      setDrivers((data || []).map((d: any) => ({
        id: d.id,
        uid: d.uid,
        carrierId: d.carrier_id,
        firstName: d.firstName || d.first_name || '',
        lastName: d.lastName || d.last_name || '',
        phone: d.phone || '',
        email: d.email || '',
        licenseNumber: d.licenseNumber || d.license_number || '',
        rating: d.rating || 5.0,
        status: d.status || 'active',
        tripsCount: d.tripsCount || d.trips_count || 0,
      })));
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Create driver WITH Supabase Auth account via Edge Function */
  const createDriverWithAuth = async (driverData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    licenseNumber?: string;
    carrierId: string;
  }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error('Не авторизовано');

    const res = await supabase.functions.invoke('create-driver', {
      body: {
        action: 'create',
        email: driverData.email,
        password: driverData.password,
        firstName: driverData.firstName,
        lastName: driverData.lastName,
        phone: driverData.phone || '',
        licenseNumber: driverData.licenseNumber || '',
      },
    });

    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);

    await fetchDrivers(driverData.carrierId);
    return res.data;
  };

  /** Legacy addDriver — adds only to drivers table (no auth account) */
  const addDriver = async (driverData: Omit<Driver, 'id'>) => {
    const { error } = await supabase.from('drivers').insert({
      carrier_id: driverData.carrierId,
      firstName: driverData.firstName,
      lastName: driverData.lastName,
      phone: driverData.phone,
      licenseNumber: driverData.licenseNumber,
      rating: driverData.rating,
      status: driverData.status,
    });
    if (error) throw error;
    await fetchDrivers(driverData.carrierId);
  };

  const updateDriver = async (driverId: string, carrierId: string, data: Partial<Driver>) => {
    const dbData: any = { ...data };
    // camelCase → what DB expects
    if (data.carrierId) dbData.carrier_id = data.carrierId;
    delete dbData.carrierId;

    const { error } = await supabase
      .from('drivers')
      .update(dbData)
      .eq('id', driverId);
    if (error) throw error;
    await fetchDrivers(carrierId);
  };

  const blockDriver = async (driverId: string, carrierId: string) => {
    const res = await supabase.functions.invoke('create-driver', {
      body: { action: 'block', driverId },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    await fetchDrivers(carrierId);
  };

  const unblockDriver = async (driverId: string, carrierId: string) => {
    const res = await supabase.functions.invoke('create-driver', {
      body: { action: 'unblock', driverId },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    await fetchDrivers(carrierId);
  };

  const fireDriver = async (driverId: string, carrierId: string) => {
    const res = await supabase.functions.invoke('create-driver', {
      body: { action: 'fire', driverId },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    await fetchDrivers(carrierId);
  };

  const resetDriverPassword = async (driverUid: string, newPassword: string, carrierId: string) => {
    const res = await supabase.functions.invoke('create-driver', {
      body: { action: 'reset_password', updates: { uid: driverUid, newPassword } },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
  };

  const deleteDriver = async (driverId: string, carrierId: string) => {
    const { error } = await supabase.from('drivers').delete().eq('id', driverId);
    if (error) throw error;
    await fetchDrivers(carrierId);
  };

  return {
    drivers,
    loading,
    fetchDrivers,
    addDriver,
    createDriverWithAuth,
    updateDriver,
    blockDriver,
    unblockDriver,
    fireDriver,
    resetDriverPassword,
    deleteDriver,
  };
}
