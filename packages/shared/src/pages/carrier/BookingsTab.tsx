import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Search, Filter, Calendar, MapPin, User, CheckCircle2, Clock, XCircle, ChevronDown, Loader2, MoreVertical } from 'lucide-react';
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

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get bookings with trip information for this carrier
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trips!inner(
            id,
            departureCity,
            arrivalCity,
            departureDate,
            departureTime,
            carrierId
          )
        `)
        .eq('trips.carrierId', user.uid)
        .order('createdAt', { ascending: false })
        .limit(50);

      if (error) throw error;

      const results: Booking[] = (data || []).map(booking => ({
        id: booking.id,
        tripId: booking.tripId,
        passengerName: booking.passengers?.[0] ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}` : 'N/A',
        route: booking.trips ? `${booking.trips.departureCity} → ${booking.trips.arrivalCity}` : 'Unknown Route',
        date: booking.trips?.departureDate || 'N/A',
        time: booking.trips?.departureTime || 'N/A',
        seats: booking.passengers?.length || 0,
        totalPrice: booking.totalPrice || 0,
        status: booking.status || 'pending',
        createdAt: booking.createdAt
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

  const filtered = bookings.filter(b => filterStatus === 'all' || b.status === filterStatus);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-[#ff6b35] rounded-full shadow-[0_0_10px_rgba(255,107,53,0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">Бронювання</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">Усі замовлення квитків на ваші рейси</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 p-1 bg-[#111520] rounded-2xl w-fit border border-white/5">
        {['all', 'confirmed', 'pending', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`
              px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
              ${filterStatus === status 
                ? 'bg-[#ff6b35] text-white shadow-lg' 
                : 'text-[#5a6a85] hover:text-white hover:bg-white/5'}
            `}
          >
            {status === 'all' ? 'Всі' : status === 'confirmed' ? 'Підтверджені' : status === 'pending' ? 'Очікують' : 'Скасовані'}
          </button>
        ))}
      </div>

      <div className="bg-[#111520] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="text-[#ff6b35] animate-spin" size={40} />
              <p className="text-[#5a6a85] text-[10px] font-black uppercase tracking-widest">Завантаження бронювань...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Ticket className="mx-auto text-[#1c2e48]" size={60} />
              <p className="text-[#5a6a85] text-sm font-bold uppercase italic tracking-tighter">Бронювань не знайдено</p>
            </div>
          ) : (
            <table className="min-w-[800px] w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Квиток / ID</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Пасажир</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Рейс та Маршрут</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Місць / Ціна</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Статус</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em] text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((b, idx) => (
                  <motion.tr 
                    key={b.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-white/[0.01] transition-all"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#ff6b35]/10 border border-[#ff6b35]/20 flex items-center justify-center text-[#ff6b35]">
                          <Ticket size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white italic tracking-widest uppercase">#{b.id.substring(0, 6).toUpperCase()}</p>
                          <p className="text-[9px] text-[#3d5670] font-bold uppercase mt-0.5">
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString('uk-UA') : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                       <div className="flex items-center gap-2">
                          <User size={12} className="text-[#5a6a85]" />
                          <p className="text-sm font-bold text-white tracking-tight">{b.passengerName}</p>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                       <div className="space-y-1">
                          <p className="text-xs font-bold text-white leading-none">{b.route}</p>
                          <div className="flex items-center gap-2 text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">
                             <Calendar size={10} /> {b.date} · <Clock size={10} /> {b.time}
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                       <div className="space-y-0.5">
                          <p className="text-xs font-black text-white italic">{b.seats} Місць</p>
                          <p className="text-[10px] font-black text-[#00e676] uppercase tracking-widest">€{b.totalPrice.toLocaleString()}</p>
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
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                            >
                              Підтвердити
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                              disabled={updating === b.id}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        ) : (
                          <button className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#8899b5] hover:text-white hover:border-white/10 transition-all">
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

