/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Calendar, Bus, User, 
  ChevronRight, MoreHorizontal, Eye, Edit, 
  XCircle, Map, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '@busnet/shared/hooks/useTrips';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { Trip } from '../../busnet/types';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';

const STATUS_MAP: Record<string, { label: string, color: string, bg: string }> = {
  active: { label: 'Активний', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  pending: { label: 'Очікує', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  completed: { label: 'Завершено', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  cancelled: { label: 'Скасовано', color: 'text-rose-400', bg: 'bg-rose-500/10' },
};

export default function Schedule() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { trips, loading, fetchCarrierTrips } = useTrips();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCarrierTrips(user.uid);
    }
  }, [user, fetchCarrierTrips]);

  const handleCancel = async (tripId: string) => {
    if (!confirm('Ви впевнені, що хочете скасувати цей рейс? Усі пасажири отримають сповіщення.')) return;
    setCancelling(tripId);
    const toastId = toast.loading('Скасування рейсу...');
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'cancelled' })
        .eq('id', tripId);
      
      if (error) throw error;
      
      if (user) await fetchCarrierTrips(user.uid);
      toast.success('Рейс успішно скасовано', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Помилка при скасуванні', { id: toastId });
    } finally {
      setCancelling(null);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const routeStr = `${trip.departureCity} ${trip.arrivalCity}`.toLowerCase();
    const matchesSearch = routeStr.includes(search.toLowerCase()) || trip.id.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || trip.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-syne font-black text-3xl italic tracking-tighter uppercase text-white">Розклад рейсів</h2>
          <p className="text-[#5a6a85] text-sm font-medium mt-1 uppercase tracking-widest">Управління всіма рейсами вашої компанії</p>
        </div>
        <button 
          onClick={() => navigate('/carrier/newtrip')}
          className="px-6 py-2 bg-gradient-to-r from-[#ff6b35] to-[#cc3300] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all"
        >
          ➕ Новий рейс
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#161c2a] rounded-2xl w-fit border border-white/5">
        {[
          { id: 'all', label: 'Всі рейси' },
          { id: 'active', label: 'Активні' },
          { id: 'pending', label: 'На модерації' },
          { id: 'completed', label: 'Архів' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
              ${activeTab === tab.id 
                ? 'bg-[#1a2235] text-[#ff6b35] shadow-lg border border-white/5' 
                : 'text-[#5a6a85] hover:text-white'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-[#1a2235] border border-white/5 rounded-[32px] p-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6a85]" size={18} />
          <input 
            type="text" 
            placeholder="Пошук маршруту або ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-white placeholder:text-[#4a5a75] focus:outline-none focus:border-[#ff6b35] transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select className="flex-1 md:flex-none bg-black/20 border border-white/5 rounded-2xl py-3 px-6 text-xs font-bold uppercase text-[#5a6a85] outline-none">
            <option>Всі напрямки</option>
            <option>UA → EU</option>
            <option>EU → UA</option>
          </select>
          <button className="p-3 bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#ff6b35] rounded-2xl hover:bg-[#ff6b35]/20 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-[#1a2235] border border-white/5 rounded-[40px] overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-[800px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">ID / Маршрут</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Дата & Час</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Транспорт / Водій</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest text-center">Заповн.</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Дохід</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Статус</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                 <tr>
                   <td colSpan={7} className="py-20 text-center">
                     <Loader2 className="animate-spin text-[#ff6b35] mx-auto" size={40} />
                     <p className="text-[#5a6a85] text-xs uppercase font-black tracking-widest mt-4">Завантаження рейсів...</p>
                   </td>
                 </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                     <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto text-[#5a6a85] mb-4">
                        <Search size={40} />
                     </div>
                     <p className="text-white font-bold italic uppercase tracking-tight">Рейсів не знайдено</p>
                  </td>
                </tr>
              ) : filteredTrips.map((trip, idx) => {
                const fill = trip.seatsTotal > 0 ? Math.round((trip.seatsBooked / trip.seatsTotal) * 100) : 0;
                const status = STATUS_MAP[trip.status];
                return (
                  <motion.tr 
                    key={trip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-white/[0.01] transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-[#ff6b35] uppercase tracking-widest font-syne truncate max-w-[80px] block">
                          {trip.id.substring(0, 8)}
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-tight">{trip.departureCity} → {trip.arrivalCity}</h4>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/[0.03] text-[#5a6a85]">
                          <Calendar size={14} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-white italic tracking-tighter uppercase">{trip.departureDate}</p>
                          <p className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">{trip.departureTime}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-medium">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-[#8899b5]">
                          <Bus size={10} className="text-[#ff6b35]" /> {trip.busId || 'Не призначено'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#5a6a85]">
                          <User size={10} /> {trip.driverId || 'Не призначено'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col items-center gap-2 min-w-[80px]">
                        <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                          <div 
                             className={`h-full transition-all duration-1000 ${fill > 80 ? 'bg-emerald-500' : fill > 50 ? 'bg-cyan-500' : 'bg-amber-500'}`} 
                             style={{ width: `${fill}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-black text-white italic">{trip.seatsBooked} / {trip.seatsTotal} ({fill}%)</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm font-syne font-black text-emerald-400 italic tracking-tighter">
                        €{((trip.seatsBooked || 0) * trip.price).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${status?.bg || 'bg-white/5'} ${status?.color || 'text-white'} border-current/20`}>
                        {status?.label || trip.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[#8899b5] hover:text-white hover:border-[#ff6b35]/20 transition-all shadow-sm">
                           <Eye size={16} />
                        </button>
                        {trip.status === 'active' && (
                          <button 
                            onClick={() => navigate('/carrier/livetrips')}
                            className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
                          >
                            <Map size={16} />
                          </button>
                        )}
                        {trip.status === 'pending' && (
                           <button className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm">
                             <Edit size={16} />
                           </button>
                        )}
                        {trip.status !== 'cancelled' && trip.status !== 'completed' && (
                          <button 
                            onClick={() => handleCancel(trip.id)}
                            disabled={cancelling === trip.id}
                            className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
                          >
                            {cancelling === trip.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredTrips.length === 0 && (
          <div className="p-20 text-center space-y-4">
             <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto text-[#5a6a85]">
                <Search size={40} />
             </div>
             <div className="space-y-1">
                <p className="text-white font-bold italic uppercase tracking-tight">Рейсів не знайдено</p>
                <p className="text-[#5a6a85] text-xs uppercase font-black tracking-widest">Спробуйте змінити параметри пошуку або фільтри</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

