import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Search, Filter, Calendar, MapPin, User, CheckCircle2, Clock, XCircle, ChevronDown, Loader2, MoreVertical, X } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';

interface Booking {
  id: string;
  tripId: string;
  passengerName: string;
  route: string;
  date: string;
  time: string;
  seats: number;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: any;
}

const BookingsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get bookings with trip information for this carrier
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          routes!inner(
            id,
            name,
            carrier_id
          )
        `)
        .eq('routes.carrier_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const results: Booking[] = (data || []).map(booking => ({
        id: booking.id,
        tripId: booking.trip_id,
        passengerName: booking.passengers?.[0]
          ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`
          : 'N/A',
        // route_from/route_to (snake_case) — або ім'я маршруту з джоїну
        route: (booking as any).routes?.name ||
          (booking.route_from && booking.route_to
            ? `${booking.route_from} → ${booking.route_to}`
            : 'Невідомий маршрут'),
        date: booking.departure_date ||
          (booking.created_at ? new Date(booking.created_at).toLocaleDateString('uk-UA') : 'N/A'),
        time: booking.departure_time || 'N/A',
        seats: booking.seats || booking.passengers?.length || 0,
        totalPrice: booking.total_price || 0,
        status: booking.status || 'pending',
        createdAt: booking.created_at
      }));

      setBookings(results);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['status']) => {
    setUpdating(bookingId);
    const toastId = toast.loading('Оновлення статусу...');
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(newStatus === 'confirmed' ? 'Бронювання підтверджено!' : 'Бронювання скасовано', { id: toastId });
      fetchBookings();
    } catch (error) {
      toast.error('Помилка оновлення', { id: toastId });
    } finally {
      setUpdating(null);
    }
  };

  const filtered = bookings.filter(b => {
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesSearch = !searchTerm || 
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (b.passengerName && b.passengerName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#F97316] shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">БРОНЮВАННЯ</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">Усі замовлення квитків на ваші рейси</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0B1221] rounded-full w-fit border border-white/5 shadow-lg">
          {['all', 'confirmed', 'pending', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`
                px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                ${filterStatus === status 
                  ? 'bg-[#F97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                  : 'text-[#5A6A85] hover:text-white hover:bg-[#1A2639]'}
              `}
            >
              {status === 'all' ? 'Всі' : status === 'confirmed' ? 'Підтверджені' : status === 'pending' ? 'Очікують' : 'Скасовані'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6A85]" size={14} />
          <input 
            type="text"
            placeholder="Пошук за ID або ім'ям..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B1221] border border-white/5 rounded-full pl-10 pr-10 py-3 text-[11px] text-white focus:border-[#F97316]/50 outline-none transition-all placeholder-[#5A6A85] font-bold"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6A85] hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#0B1221] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative min-h-[400px]">
        <div className="overflow-x-auto scrollbar-hide h-full">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                  <div className="w-20 h-6 rounded-full bg-white/5" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <Ticket className="text-[#1A2639]" size={70} />
              <p className="text-[#5A6A85] text-[11px] font-black uppercase tracking-widest">БРОНЮВАНЬ НЕ ЗНАЙДЕНО</p>
              <button 
                onClick={() => navigate('/newtrip')}
                className="mt-4 px-6 py-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#F97316] hover:text-white transition-all"
              >
                Створити рейс
              </button>
            </div>
          ) : (
            <table className="min-w-[800px] w-full text-left h-full">
              <thead>
                <tr className="bg-transparent border-b border-white/5">
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em]">Квиток / ID</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em]">Пасажир</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em]">Рейс та Маршрут</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em]">Місць / Ціна</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em]">Статус</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em] text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((b, idx) => (
                  <motion.tr 
                    key={b.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-[#1A2639]/30 transition-all"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
                          <Ticket size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white italic tracking-widest uppercase group-hover:text-[#F97316] transition-colors">#{b.id.substring(0, 6).toUpperCase()}</p>
                          <p className="text-[9px] text-[#5A6A85] font-bold uppercase mt-0.5">
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString('uk-UA') : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                       <div className="flex items-center gap-2">
                          <User size={12} className="text-[#5A6A85]" />
                          <p className="text-sm font-bold text-white tracking-tight">{b.passengerName}</p>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                       <div className="space-y-1">
                          <p className="text-xs font-bold text-white leading-none">{b.route}</p>
                          <div className="flex items-center gap-2 text-[10px] text-[#5A6A85] font-black uppercase tracking-widest">
                             <Calendar size={10} /> {b.date} · <Clock size={10} /> {b.time}
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                       <div className="space-y-0.5">
                          <p className="text-xs font-black text-white italic">{b.seats} Місць</p>
                          <p className="text-[10px] font-black text-[#00E5FF] uppercase tracking-widest">€{b.totalPrice.toLocaleString()}</p>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                       <span className={`
                          px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border
                          ${b.status === 'confirmed' ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 
                            b.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                            'bg-rose-500/10 text-rose-500 border-rose-500/20'}
                       `}>
                          {b.status === 'confirmed' ? 'Підтверджено' : b.status === 'pending' ? 'Очікує' : 'Скасовано'}
                       </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                        {b.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                              disabled={updating === b.id}
                              className="px-3 py-1.5 rounded-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                            >
                              Підтвердити
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                              disabled={updating === b.id}
                              className="p-1.5 rounded-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        ) : (
                          <button className="px-4 py-1.5 rounded-[10px] bg-[#1A2639] border border-transparent text-[9px] font-black uppercase tracking-widest text-[#8899B5] hover:text-white hover:border-white/10 transition-all">
                            Деталі
                          </button>
                        )}
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsTab;

