import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

export function useAdminStats() {
  const [stats, setStats] = useState({
    pendingTemplates: 0,
    activeTrips: 0,
    totalCarriers: 0,
    totalBuses: 0,
    activeConflicts: 0,
    gmv: 0,
    ticketsSold: 0,
    bookingsToday: 0
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const channelsRef = useRef<any[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      // Pending Templates
      const { count: pendingCount } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setStats(s => ({ ...s, pendingTemplates: pendingCount || 0 }));

      // Active Trips
      const { count: activeCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      setStats(s => ({ ...s, activeTrips: activeCount || 0 }));

      // Total Carriers
      const { count: carriersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'carrier');
      setStats(s => ({ ...s, totalCarriers: carriersCount || 0 }));

      // Total Buses
      const { count: busesCount } = await supabase
        .from('buses')
        .select('*', { count: 'exact', head: true });
      setStats(s => ({ ...s, totalBuses: busesCount || 0 }));

      // Bookings stats — column is created_at (snake_case) in Supabase
      try {
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*');

        if (!bookingError && bookingData) {
          setBookings(bookingData);
          let totalGmv = 0;
          let totalTickets = 0;
          let todayCount = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          bookingData.forEach(booking => {
            if (['confirmed', 'active', 'completed', 'BOARDED', 'SETTLED'].includes(booking.status)) {
              totalGmv += booking.totalPrice || 0;
              totalTickets += booking.passengers?.length || 0;
            }
            const bookingDate = booking.created_at || booking.createdAt;
            if (bookingDate && new Date(bookingDate) >= today) {
              todayCount++;
            }
          });

          setStats(s => ({
            ...s,
            gmv: totalGmv,
            ticketsSold: totalTickets,
            bookingsToday: todayCount
          }));
        } else if (bookingError) {
          console.warn('Bookings query error (non-fatal):', bookingError.message);
        }
      } catch (bookingErr) {
        console.warn('Bookings fetch failed (non-fatal):', bookingErr);
      }

      // Leads — table may not exist yet, gracefully skip
      try {
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .limit(10);

        if (!leadError && leadData) setLeads(leadData);
        else if (leadError) console.warn('Leads table not available (non-fatal):', leadError.message);
      } catch (leadErr) {
        console.warn('Leads fetch failed (non-fatal):', leadErr);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setLoading(false);
    }
  }, []);

  const hasAdminRole = user?.role === 'admin';

  useEffect(() => {
    if (!hasAdminRole) return;

    // Закрий старі канали перед створенням нових
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = [];

    fetchStats();

    // Фіксований suffix — не змінюється між рендерами
    const suffix = 'admin_stats';

    channelsRef.current = [
      supabase.channel('routes_' + suffix).on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, fetchStats).subscribe(),
      supabase.channel('trips_' + suffix).on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchStats).subscribe(),
      supabase.channel('users_' + suffix).on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchStats).subscribe(),
      supabase.channel('buses_' + suffix).on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, fetchStats).subscribe(),
      supabase.channel('bookings_' + suffix).on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchStats).subscribe(),
      supabase.channel('leads_' + suffix).on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchStats).subscribe(),
    ];

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [hasAdminRole, fetchStats]);

  return { stats, bookings, leads, loading, fetchStats };
}
