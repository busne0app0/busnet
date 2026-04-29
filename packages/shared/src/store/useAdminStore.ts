import { create } from 'zustand';
import { supabase } from '../supabase/config';

// ============================================================
// INTERFACES
// ============================================================
export interface AdminBooking {
  id: string;
  passengerName: string;
  route: string;
  date: string;
  seats: number;
  amount: string;
  status: 'active' | 'completed' | 'cancelled';
  agent?: string | null;
  timestamp: string;
}

export interface AdminCarrier {
  id: string;
  uid: string;
  name: string;
  email: string;
  routes: number;
  rating: number;
  tripsPerMonth: number;
  status: 'active' | 'review' | 'blocked';
  commission: number;
}

export interface AdminAgent {
  id: string;
  uid: string;
  name: string;
  email: string;
  region: string;
  sales: number;
  earned: number;
  commission: number;
  status: 'top' | 'active' | 'new' | 'suspicious';
}

export interface AdminLiveTrip {
  id: string;
  route: string;
  carrier: string;
  depart: string;
  arrive: string;
  seats: string;
  status: 'active' | 'delay';
  delay?: string;
}

export interface AdminLog {
  id: string;
  time: string;
  actor: string;
  role: string;
  action: string;
  obj: string;
  icon: string;
}

export interface AdminConflict {
  id: string;
  type: 'overlap' | 'fraud' | 'price' | 'overbook';
  priority: 'high' | 'medium' | 'low';
  description: string;
  status: 'pending' | 'resolved' | 'ignored';
}

export interface AdminApproval {
  id: string;
  carrierId: string;
  carrierName: string;
  route: string;
  date: string;
  seats: number;
  price: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface AdminState {
  bookings: AdminBooking[];
  carriers: AdminCarrier[];
  agents: AdminAgent[];
  liveTrips: AdminLiveTrip[];
  logs: AdminLog[];
  approvals: AdminApproval[];
  conflicts: AdminConflict[];
  loading: boolean;
  settings: {
    autoModeration: boolean;
    autoRefund: boolean;
    adminTelegramNotif: boolean;
    aiSmartPricing: boolean;
    commissionRate: number;
  };
  metrics: {
    gmv: number;
    profit: number;
    ticketsSold: number;
    activePassengers: number;
    refundsWaiting: number;
    agentPayouts: number;
    carrierPayouts: number;
    avgRating: number;
  };
  leads: any[];
  statsExtra: {
    pendingTemplates: number;
    activeTrips: number;
    totalCarriers: number;
    totalBuses: number;
    activeConflicts: number;
    bookingsToday: number;
  };
  globalDateRange: { start: string; end: string } | null;

  // Actions
  setGlobalDateRange: (range: { start: string; end: string } | null) => void;
  fetchStats: () => Promise<void>;
  fetchCarriers: () => Promise<void>;
  fetchAgents: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  addLog: (log: AdminLog) => Promise<void>;
  updateMetrics: (data: Partial<AdminState['metrics']>) => void;
  updateCarrierStatus: (uid: string, status: AdminCarrier['status']) => Promise<void>;
  updateAgentStatus: (uid: string, status: AdminAgent['status']) => Promise<void>;
  updateSettings: (data: Partial<AdminState['settings']>) => void;
  handleApproval: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  resolveConflict: (id: string, status: 'resolved' | 'ignored') => Promise<void>;
  blockCarrier: (uid: string) => Promise<void>;
  blockAgent: (uid: string) => Promise<void>;
  fetchApprovals: () => Promise<void>;
  fetchConflicts: () => Promise<void>;
  addBooking: (booking: AdminBooking) => void;
  deleteBooking: (id: string) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
}

// ============================================================
// STORE
// ============================================================
export const useAdminStore = create<AdminState>((set, get) => ({
  bookings: [],
  carriers: [],
  agents: [],
  liveTrips: [],
  logs: [],
  approvals: [],
  conflicts: [],
  loading: false,
  settings: {
    autoModeration: false,
    autoRefund: true,
    adminTelegramNotif: true,
    aiSmartPricing: true,
    commissionRate: 8,
  },
  metrics: {
    gmv: 0,
    profit: 0,
    ticketsSold: 0,
    activePassengers: 0,
    refundsWaiting: 0,
    agentPayouts: 0,
    carrierPayouts: 0,
    avgRating: 5.0,
  },
  leads: [],
  statsExtra: {
    pendingTemplates: 0,
    activeTrips: 0,
    totalCarriers: 0,
    totalBuses: 0,
    activeConflicts: 0,
    bookingsToday: 0,
  },
  globalDateRange: null,

  setGlobalDateRange: (range) => {
    set({ globalDateRange: range });
    get().fetchStats(); // Re-fetch on change
  },

  // ============================================================
  // FETCH ALL STATS (головний дашборд)
  // ============================================================
  fetchStats: async () => {
    set({ loading: true });
    try {
      const { globalDateRange } = get();
      
      // Bookings
      let query = supabase
        .from('bookings')
        .select('*, trips(departureCity, arrivalCity)')
        .order('createdAt', { ascending: false });
        
      if (globalDateRange) {
        query = query.gte('createdAt', globalDateRange.start).lte('createdAt', globalDateRange.end);
      }

      const { data: bookingData } = await query;

      if (bookingData) {
        let gmv = 0;
        let ticketsSold = 0;
        let refundsWaiting = 0;

        const mapped: AdminBooking[] = bookingData.map((b: any) => {
          const price = b.totalPrice || 0;
          if (['confirmed', 'active', 'completed'].includes(b.status)) {
            gmv += price;
            ticketsSold += b.passengers?.length || 1;
          }
          if (b.status === 'cancelled') refundsWaiting++;

          const passenger = b.passengers?.[0];
          const name = passenger
            ? `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim()
            : 'Гість';

          return {
            id: b.id,
            passengerName: name || 'Гість',
            route: `${b.trips?.departureCity || '—'} → ${b.trips?.arrivalCity || '—'}`,
            date: b.createdAt
              ? new Date(b.createdAt).toLocaleDateString('uk-UA')
              : '—',
            seats: b.passengers?.length || 1,
            amount: `€${(price).toFixed(2)}`,
            status: ['confirmed', 'BOARDED', 'SETTLED', 'PENDING'].includes(b.status)
                ? 'active'
                : (b.status === 'cancelled' || b.status === 'CANCELLED')
                ? 'cancelled'
                : 'completed',
            timestamp: b.createdAt || '',
          };
        });

        // ПУНКТ 13: Вираховуємо реальний прибуток (наприклад, сума комісій платформи)
        // Якщо в таблиці bookings є поле platformFee, використовуємо його.
        // Якщо немає - використовуємо 15% як динамічний розрахунок, але дозволяємо налаштування.
        const totalProfit = bookingData.reduce((acc: number, b: any) => acc + (b.platformFee || (b.totalPrice * 0.15)), 0);

        set((state) => ({
          bookings: mapped,
          metrics: {
            ...state.metrics,
            gmv,
            profit: totalProfit,
            ticketsSold,
            refundsWaiting,
          },
        }));
      }

      // Active passengers
      const { count: passCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'passenger');

      // Live trips
      const { data: tripData } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (tripData) {
        const liveTrips: AdminLiveTrip[] = tripData.map((t: any) => ({
          id: t.id,
          route: `${t.departureCity || '—'} → ${t.arrivalCity || '—'}`,
          carrier: t.carrierName || '—',
          depart: t.departureTime || '—',
          arrive: '—',
          seats: `${t.seatsBooked || 0}/${t.seatsTotal || 0}`,
          status: 'active',
        }));
        set({ liveTrips });
      }

      set((state) => ({
        loading: false,
        metrics: {
          ...state.metrics,
          activePassengers: passCount || 0,
        },
      }));

      // ✅ БАГ 4 ФІКС — Тягнемо все при завантаженні стат
      await get().fetchApprovals();
      await get().fetchConflicts();
      await get().fetchLogs();

      // Leads
      try {
        const { data: leadData, error: leadError } = await supabase
          .from('leads').select('*').limit(10);
        if (!leadError && leadData) set({ leads: leadData });
      } catch (e) { console.warn('leads fetch failed:', e); }

      // Extra stats
      const { count: pendingCount } = await supabase
        .from('routes').select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      const { count: activeTripsCount } = await supabase
        .from('trips').select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      const { count: carriersCount } = await supabase
        .from('users').select('*', { count: 'exact', head: true })
        .eq('role', 'carrier');
      
      const { count: busesCount } = await supabase
        .from('buses').select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingsState = get().bookings;
      const todayCount = bookingsState.filter(b => 
        b.timestamp && new Date(b.timestamp) >= today
      ).length;

      set(state => ({
        statsExtra: {
          pendingTemplates: pendingCount || 0,
          activeTrips: activeTripsCount || 0,
          totalCarriers: carriersCount || 0,
          totalBuses: busesCount || 0,
          activeConflicts: state.conflicts.filter(c => c.status === 'pending').length,
          bookingsToday: todayCount,
        }
      }));
    } catch (err) {
      console.error('fetchStats error:', err);
      set({ loading: false });
    }
  },

  // ============================================================
  // FETCH CARRIERS
  // ============================================================
  fetchCarriers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'carrier')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const carriers: AdminCarrier[] = (data || []).map((u: any) => ({
        id: u.uid,
        uid: u.uid,
        name: u.companyName || u.email || '—',
        email: u.email || '',
        routes: 0,
        rating: 5.0,
        tripsPerMonth: 0,
        status: u.status || 'active',
        commission: 8,
      }));

      set({ carriers });
    } catch (err) {
      console.error('fetchCarriers error:', err);
    }
  },

  // ============================================================
  // FETCH AGENTS
  // ============================================================
  fetchAgents: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const agents: AdminAgent[] = (data || []).map((u: any) => ({
        id: u.uid,
        uid: u.uid,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '—',
        email: u.email || '',
        region: u.address || '—',
        sales: 0,
        earned: 0,
        commission: 5,
        status: u.status === 'active' ? 'active' : 'new',
      }));

      set({ agents });
    } catch (err) {
      console.error('fetchAgents error:', err);
    }
  },

  // ✅ БАГ 2 ФІКС — Нові функції завантаження
  fetchApprovals: async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('status', 'pending')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      const approvals: AdminApproval[] = (data || []).map((r: any) => ({
        id: r.id,
        carrierId: r.carrierId || '',
        carrierName: '—', // В цій таблиці немає імені, треба було б джоінити або просто ID
        route: r.name || r.direction || '—',
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('uk-UA') : '—',
        seats: r.seats || 0,
        price: `€${r.singlePrice || r.zoneAPrice || 0}`,
        status: 'pending',
      }));

      set({ approvals });
    } catch (err) {
      console.error('fetchApprovals error:', err);
    }
  },

  fetchConflicts: async () => {
    try {
      const { data, error } = await supabase
        .from('conflicts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('conflicts table not available:', error.message);
        return;
      }

      set({ conflicts: (data || []) as AdminConflict[] });
    } catch (err) {
      console.error('fetchConflicts error:', err);
    }
  },

  // ============================================================
  // FETCH BOOKINGS
  // ============================================================
  fetchBookings: async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, trips(departureCity, arrivalCity)')
        .order('createdAt', { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped: AdminBooking[] = (data || []).map((b: any) => {
        const passenger = b.passengers?.[0];
        const name = passenger
          ? `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim()
          : 'Гість';
        return {
          id: b.id,
          passengerName: name || 'Гість',
          route: `${b.trips?.departureCity || '—'} → ${b.trips?.arrivalCity || '—'}`,
          date: b.createdAt
            ? new Date(b.createdAt).toLocaleDateString('uk-UA')
            : '—',
          seats: b.passengers?.length || 1,
          amount: `€${(b.totalPrice || 0).toFixed(2)}`,
          status: ['confirmed', 'BOARDED', 'SETTLED', 'PENDING'].includes(b.status)
                ? 'active'
                : (b.status === 'cancelled' || b.status === 'CANCELLED')
                ? 'cancelled'
                : 'completed',
          timestamp: b.createdAt || '',
        };
      });

      set({ bookings: mapped });
    } catch (err) {
      console.error('fetchBookings error:', err);
    }
  },

  // ============================================================
  // FETCH LOGS
  // ============================================================
  fetchLogs: async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      set({ logs: (data || []) as AdminLog[] });
    } catch (err) {
      console.error('fetchLogs error:', err);
    }
  },

  // ============================================================
  // ADD LOG → зберігає в Supabase
  // ============================================================
  addLog: async (log) => {
    try {
      const { data, error } = await supabase.from('logs').insert({
        id: log.id || Date.now().toString(),
        time: log.time,
        actor: log.actor,
        role: log.role,
        action: log.action,
        obj: log.obj,
        icon: log.icon,
        created_at: new Date().toISOString(),
      }).select();
      
      if (!error && data && data.length > 0) {
        set((state) => ({ logs: [data[0], ...state.logs] }));
      } else {
        set((state) => ({ logs: [log, ...state.logs] }));
      }
    } catch (e) {
      console.error('Failed to write log:', e);
      set((state) => ({ logs: [log, ...state.logs] }));
    }
  },

  updateMetrics: (data) =>
    set((state) => ({ metrics: { ...state.metrics, ...data } })),

  // ============================================================
  // UPDATE CARRIER STATUS → зберігає в Supabase
  // ============================================================
  updateCarrierStatus: async (uid, status) => {
    // Оновлюємо локально одразу
    set((state) => ({
      carriers: state.carriers.map((c) =>
        c.uid === uid ? { ...c, status } : c
      ),
    }));
    // Зберігаємо в БД
    try {
      const { error } = await supabase
        .from('users')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('uid', uid);
      if (error) throw error;

      await get().addLog({
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString('uk-UA'),
        actor: 'Admin',
        role: 'admin',
        action: `Статус перевізника змінено на ${status}`,
        obj: uid,
        icon: '🚌',
      });
    } catch (err) {
      console.error('updateCarrierStatus error:', err);
    }
  },

  // ============================================================
  // UPDATE AGENT STATUS → зберігає в Supabase
  // ============================================================
  updateAgentStatus: async (uid, status) => {
    set((state) => ({
      agents: state.agents.map((a) =>
        a.uid === uid ? { ...a, status } : a
      ),
    }));
    try {
      const { error } = await supabase
        .from('users')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('uid', uid);
      if (error) throw error;
    } catch (err) {
      console.error('updateAgentStatus error:', err);
    }
  },

  updateSettings: (data) =>
    set((state) => ({ settings: { ...state.settings, ...data } })),

  // ============================================================
  // HANDLE APPROVAL → оновлює статус маршруту в Supabase
  // ============================================================
  handleApproval: async (id, status) => {
    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    }));
    try {
      const { error } = await supabase
        .from('routes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      await get().addLog({
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString('uk-UA'),
        actor: 'Admin',
        role: 'admin',
        action: `Маршрут ${status === 'approved' ? 'схвалено' : 'відхилено'}`,
        obj: id,
        icon: status === 'approved' ? '✅' : '❌',
      });
    } catch (err) {
      console.error('handleApproval error:', err);
    }
  },

  // ============================================================
  // RESOLVE CONFLICT → зберігає статус конфлікту
  // (таблиця conflicts — якщо є, інакше тільки локально)
  // ============================================================
  resolveConflict: async (id, status) => {
    // Оновлюємо локально одразу
    set((state) => ({
      conflicts: state.conflicts.map((c) =>
        c.id === id ? { ...c, status } : c
      ),
    }));
    // Зберігаємо статус в Supabase
    try {
      const { error } = await supabase
        .from('conflicts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('resolveConflict save error:', err);
    }
    await get().addLog({
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('uk-UA'),
      actor: 'Admin',
      role: 'admin',
      action: `Конфлікт ${status === 'resolved' ? 'вирішено' : 'проігноровано'}`,
      obj: id,
      icon: '⚖️',
    });
  },

  // ============================================================
  // DELETE BOOKING → видаляє з Supabase
  // ============================================================
  deleteBooking: async (id) => {
    set((state) => ({
      bookings: state.bookings.filter((b) => b.id !== id),
    }));
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('deleteBooking error:', err);
    }
  },

  // ✅ БАГ 5 ФІКС — Перейменування в block
  blockCarrier: async (uid) => {
    set((state) => ({
      carriers: state.carriers.filter((c) => c.uid !== uid),
    }));
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'blocked', updated_at: new Date().toISOString() })
        .eq('uid', uid);
      if (error) throw error;
    } catch (err) {
      console.error('blockCarrier error:', err);
    }
  },

  blockAgent: async (uid) => {
    set((state) => ({
      agents: state.agents.filter((a) => a.uid !== uid),
    }));
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'blocked', updated_at: new Date().toISOString() })
        .eq('uid', uid);
      if (error) throw error;
    } catch (err) {
      console.error('blockAgent error:', err);
    }
  },

  // addBooking лишається для сумісності
  addBooking: (booking) =>
    set((state) => ({
      bookings: [booking, ...state.bookings],
    })),

  deleteUser: async (uid) => {
    try {
      const { error } = await supabase.rpc('delete_user_account', { user_uid: uid });
      if (error) throw error;
      
      set(state => ({
        carriers: state.carriers.filter(c => c.uid !== uid),
        agents: state.agents.filter(a => a.uid !== uid)
      }));

      await get().addLog({
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString('uk-UA'),
        actor: 'Admin',
        role: 'admin',
        action: 'DELETE_USER',
        obj: uid,
        icon: '🗑️'
      });
    } catch (e) {
      console.error('Delete user failed:', e);
    }
  }
}));