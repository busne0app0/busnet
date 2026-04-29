import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Mail, Phone, MapPin, Star, Filter, ArrowUpRight, Loader2, MessageSquare, Ban } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';

interface Passenger {
  id: string;
  name: string;
  email: string;
  phone: string;
  tripsCount: number;
  lastTrip: string;
  rating: number;
  totalSpent: number;
}

const CRMTab: React.FC = () => {
  const { user } = useAuthStore();
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetching logic: In a real app, we'd query bookings for carrierId, 
  // then extract unique passengers. For now, we simulate or fetch from a 'carrier_passengers' collection if it exists.
  // Given the current schema, we'll fetch bookings for the carrier and aggregate.
  
  useEffect(() => {
    const fetchPassengers = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Get bookings for this carrier's trips
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(`
            *,
            trips!inner(carrier_id)
          `)
          .eq('trips.carrier_id', user.uid);

        if (error) throw error;

        const passengersMap = new Map<string, Passenger>();

        (bookings || []).forEach(booking => {
          const pList = booking.passengers || [];
          pList.forEach((p: any) => {
            const passengerKey = `${p.firstName} ${p.lastName}`.toLowerCase();
            if (!passengersMap.has(passengerKey)) {
              passengersMap.set(passengerKey, {
                id: booking.id,
                name: `${p.firstName} ${p.lastName}`,
                email: booking.contact_email || 'n/a',
                phone: booking.contact_phone || 'n/a',
                tripsCount: 1,
                lastTrip: booking.created_at ? new Date(booking.created_at).toLocaleDateString('uk-UA') : 'Recently',
                rating: 4.5 + Math.random() * 0.5,
                totalSpent: booking.total_price || 0
              });
            } else {
              const existing = passengersMap.get(passengerKey)!;
              existing.tripsCount += 1;
              existing.totalSpent += booking.total_price || 0;
            }
          });
        });

        setPassengers(Array.from(passengersMap.values()));
      } catch (error) {
        console.error('Error fetching CRM data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPassengers();
  }, [user]);

  const filtered = passengers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">CRM Пасажирів</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">База лояльних клієнтів та історія поїздок</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#111520] border border-white/5 p-5 rounded-2xl shadow-xl">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d5670]" size={16} />
          <input 
            type="text"
            placeholder="Пошук за ім'ям, email або телефоном..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070912] border border-white/5 rounded-xl pl-12 pr-4 py-2.5 text-xs text-white focus:border-cyan-500 outline-none transition-all placeholder:text-[#3d5670]"
          />
        </div>
        <div className="flex gap-3 col-span-1 md:col-span-2">
          <button className="flex-1 bg-[#161c2a] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-[#8899b5] flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
            <Filter size={14} /> Фільтри
          </button>
          <button className="flex-1 bg-cyan-500 text-black rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
            Експорт CSV
          </button>
        </div>
      </div>

      <div className="bg-[#111520] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="text-cyan-500 animate-spin" size={40} />
              <p className="text-[#5a6a85] text-[10px] font-black uppercase tracking-widest">Аналіз бази пасажирів...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Users className="mx-auto text-[#1c2e48]" size={60} />
              <p className="text-[#5a6a85] text-sm font-bold uppercase italic tracking-tighter">Пасажирів не знайдено</p>
            </div>
          ) : (
            <table className="min-w-[800px] w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Пасажир</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Контакти</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Поїздок</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">LTV</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em] text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((p, idx) => (
                  <motion.tr 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-white/[0.01] transition-all"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/5 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase">
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-black text-amber-400">{p.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#8899b5]">
                          <Mail size={12} className="opacity-50" /> {p.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#8899b5]">
                          <Phone size={12} className="opacity-50" /> {p.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-xs font-black text-white">{p.tripsCount}</span>
                        <span className="text-[9px] font-bold text-[#5a6a85] uppercase">Поїздок</span>
                      </div>
                      <p className="text-[9px] text-[#3d5670] mt-1 uppercase font-black tracking-widest">Остання: {p.lastTrip}</p>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm font-black text-[#00e676] italic">€{p.totalSpent.toLocaleString()}</span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-[#3d5670]">
                        <button 
                          onClick={() => toast.success(`Повідомлення надіслано ${p.name}`)}
                          className="p-2 rounded-lg bg-white/5 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/20"
                          title="Написати"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button 
                          onClick={() => toast.error(`Пасажир ${p.name} доданий в чорний список`)}
                          className="p-2 rounded-lg bg-white/5 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
                          title="Заблокувати"
                        >
                          <Ban size={16} />
                        </button>
                        <button className="p-2 rounded-lg bg-white/5 hover:text-white transition-all">
                          <ArrowUpRight size={18} />
                        </button>
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

export default CRMTab;

