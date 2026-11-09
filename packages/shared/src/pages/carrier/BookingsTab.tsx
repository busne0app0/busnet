import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Search, Calendar, User, Clock, XCircle, X } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Очікує', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  confirmed: { label: 'Підтверджено', cls: 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' },
  boarded: { label: 'Посаджено', cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  settled: { label: 'Розраховано', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  completed: { label: 'Завершено', cls: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
  cancelled: { label: 'Скасовано', cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
};

const FILTERS = ['all', 'pending', 'confirmed', 'boarded', 'completed', 'cancelled'];
const FILTER_LABEL: Record<string, string> = {
  all: 'Всі',
  pending: 'Очікують',
  confirmed: 'Підтверджені',
  boarded: 'Посаджені',
  completed: 'Завершені',
  cancelled: 'Скасовані',
};

interface Booking {
  id: string;
  tripId: string;
  passengerName: string;
  phone?: string;
  email?: string;
  route: string;
  date: string;
  time: string;
  seats: number;
  totalPrice: number;
  currency: string;
  status: string;
  createdAt: any;
}

const BookingsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Завантажуємо виключно квитки з Supabase (0.1 секунди)
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const carrierId = user?.uid || (user as any)?.id;

      // Беремо всі бронювання перевізника з лендінгу
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (carrierId) {
        query = query.or(`carrier_id.eq.${carrierId},carrier_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = data ?? [];
      const results: Booking[] = rows.map(b => {
        const ps = Array.isArray(b.passengers) ? b.passengers : [];
        const f = ps[0];
        const rawName = f ? `${f.firstName || ''} ${f.lastName || ''}`.trim() : (b.passenger_name || '');
        const passengerName = (rawName || 'Пасажир') + (ps.length > 1 ? ` +${ps.length - 1}` : '');

        const contactObj = typeof b.contact === 'string'
          ? (() => { try { return JSON.parse(b.contact); } catch { return {}; } })()
          : (b.contact || {});

        const route = b.route_name || (b.route_from && b.route_to ? `${b.route_from} ➔ ${b.route_to}` : 'Рейс');

        return {
          id: b.id,
          tripId: b.trip_id || '',
          passengerName,
          phone: contactObj.phone || f?.phone || b.phone || '—',
          email: contactObj.email || f?.email || b.email || '—',
          route,
          date: b.departure_date || '—',
          time: b.departure_time || '—',
          seats: b.seats || ps.length || 1,
          totalPrice: Number(b.total_price) || 0,
          currency: b.currency || 'UAH',
          status: b.status || 'pending',
          createdAt: b.created_at,
        };
      });

      setBookings(results);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Не вдалося завантажити бронювання');
    } finally {
      setLoading(false); // Миттєво прибирає скелетони
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();

    // Слухаємо нові квитки з лендінгу наживо
    const channel = supabase
      .channel('bookings_realtime_instant')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setUpdating(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Статус оновлено!');
      fetchBookings();
    } catch (error) {
      toast.error('Помилка оновлення');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = bookings.filter(b => {
    const matchesStatus = filterStatus === 'all' ? true : b.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const digits = searchTerm.replace(/\D/g, '');

    const matchesSearch =
      !searchTerm ||
      b.id.toLowerCase().includes(q) ||
      b.passengerName.toLowerCase().includes(q) ||
      b.route.toLowerCase().includes(q) ||
      (digits.length >= 3 && b.phone && b.phone.replace(/\D/g, '').includes(digits));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 font-sans pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-7 bg-[#00E5FF] rounded-full shadow-[0_0_12px_rgba(0,229,255,0.6)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">БРОНЮВАННЯ</h2>
          </div>
          <p className="text-slate-400 text-xs font-semibold ml-5">
            Усі замовлення з лендінгу ({filtered.length} квитків)
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0B1221] rounded-full w-fit border border-white/5 shadow-lg">
          {FILTERS.map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-[#1A2639]'
                }`}
            >
              {FILTER_LABEL[status]}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Пошук за ID, ім'ям, телефоном або рейсом..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B1221] border border-white/5 rounded-full pl-10 pr-10 py-3 text-xs text-white focus:border-[#00E5FF]/50 outline-none transition-all placeholder-slate-500 font-medium"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Таблиця замовлень */}
      <div className="bg-[#0B1221] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative min-h-[350px]">
        <div className="overflow-x-auto scrollbar-hide h-full">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Ticket className="text-slate-700" size={60} />
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Бронювань поки немає</p>
            </div>
          ) : (
            <table className="min-w-[800px] w-full text-left h-full">
              <thead>
                <tr className="bg-transparent border-b border-white/5">
                  <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Квиток</th>
                  <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Пасажир</th>
                  <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Рейс / Дата</th>
                  <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Сума</th>
                  <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Статус</th>
                  <th className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((b, idx) => {
                  const s = STATUS[b.status] ?? { label: b.status, cls: 'bg-white/5 text-slate-400 border-white/10' };
                  const isEur = b.currency === 'EUR' || b.currency === '€';
                  const priceLabel = isEur ? `€${b.totalPrice}` : `${b.totalPrice} грн`;

                  return (
                    <motion.tr key={b.id || idx} className="group hover:bg-[#1A2639]/30 transition-all">
                      <td className="py-5 px-6">
                        <span className="text-xs font-black text-cyan-400 font-mono tracking-wider block">#{b.id.slice(-8)}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{b.seats} місць</span>
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-sm font-bold text-white tracking-tight">{b.passengerName}</p>
                        {b.phone && b.phone !== '—' && (
                          <a href={`tel:${b.phone}`} className="text-xs font-mono font-bold text-slate-400 hover:text-cyan-400 transition-colors">📞 {b.phone}</a>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-xs font-bold text-white leading-none">{b.route}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">{b.date} {b.time}</p>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xs font-black text-white font-mono block">{priceLabel}</span>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                            disabled={updating === b.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase hover:bg-emerald-500 hover:text-black transition-all"
                          >
                            Підтвердити
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsTab;