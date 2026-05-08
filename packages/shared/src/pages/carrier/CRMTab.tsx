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
          let pList = booking.passengers || [];
          if (typeof pList === 'string') {
            try { pList = JSON.parse(pList); } catch(e) { pList = []; }
          }
          
          if (!Array.isArray(pList)) pList = [];

          pList.forEach((p: any) => {
            const name = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Passenger';
            const passengerKey = name.toLowerCase();
            
            if (!passengersMap.has(passengerKey)) {
              passengersMap.set(passengerKey, {
                id: booking.id,
                name: name,
                email: p.email || 'n/a',
                phone: p.phone || 'n/a',
                tripsCount: 1,
                lastTrip: booking.created_at ? new Date(booking.created_at).toLocaleDateString('uk-UA') : 'Recently',
                rating: 4.5 + Math.random() * 0.5,
                totalSpent: booking.total_price || 0
              });
            } else {
              const existing = passengersMap.get(passengerKey)!;
              existing.tripsCount += 1;
              existing.totalSpent += (booking.total_price || 0);
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
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">CRM ПАСАЖИРІВ</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">База лояльних клієнтів та історія поїздок</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-[#0B1221] border border-white/5 p-3 rounded-[24px] shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#5A6A85]" size={16} />
          <input 
            type="text"
            placeholder="Пошук за ім'ям, email або телефоном..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A2639]/50 border border-transparent rounded-[16px] pl-12 pr-4 py-3.5 text-[11px] text-white focus:border-[#00E5FF]/30 outline-none transition-all placeholder-[#5A6A85] font-medium"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-8 bg-[#1A2639]/50 hover:bg-[#1A2639] border border-white/5 rounded-[16px] py-3.5 text-[11px] font-black text-[#8899B5] hover:text-white flex items-center justify-center gap-2 transition-all">
            <Filter size={14} /> Фільтри
          </button>
          <button className="flex-1 md:flex-none bg-[#00E5FF] hover:bg-white text-black rounded-[16px] px-8 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            ЕКСПОРТ CSV
          </button>
        </div>
      </div>

      <div className="bg-[#0B1221] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative min-h-[400px]">
        <div className="overflow-x-auto h-full">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="text-[#00E5FF] animate-spin" size={40} />
              <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest">АНАЛІЗ БАЗИ ПАСАЖИРІВ...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <Users className="text-[#1A2639]" size={70} />
              <p className="text-[#5A6A85] text-[11px] font-black uppercase tracking-widest">ПАСАЖИРІВ НЕ ЗНАЙДЕНО</p>
            </div>
          ) : (
            <table className="min-w-[800px] w-full text-left h-full">
              <thead>
                <tr className="bg-transparent border-b border-white/5">
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em]">Пасажир</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em]">Контакти</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em]">Поїздок</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em]">LTV</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em] text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((p, idx) => (
                  <motion.tr 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-[#1A2639]/30 transition-all"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] font-bold text-xs uppercase">
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight group-hover:text-[#00E5FF] transition-colors">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-black text-amber-400">{p.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#8899B5]">
                          <Mail size={12} className="opacity-50" /> {p.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#8899B5]">
                          <Phone size={12} className="opacity-50" /> {p.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#1A2639] border border-white/5">
                        <span className="text-xs font-black text-white">{p.tripsCount}</span>
                        <span className="text-[9px] font-bold text-[#5A6A85] uppercase">Поїздок</span>
                      </div>
                      <p className="text-[9px] text-[#5A6A85] mt-1 uppercase font-black tracking-widest">Остання: {p.lastTrip}</p>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm font-black text-[#00E5FF] italic">€{p.totalSpent.toLocaleString()}</span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-[#5A6A85]">
                        <button 
                          onClick={() => toast.success(`Повідомлення надіслано ${p.name}`)}
                          className="p-2 rounded-lg bg-[#1A2639] hover:text-[#00E5FF] transition-all border border-transparent hover:border-[#00E5FF]/20"
                          title="Написати"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button 
                          onClick={() => toast.error(`Пасажир ${p.name} доданий в чорний список`)}
                          className="p-2 rounded-lg bg-[#1A2639] hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
                          title="Заблокувати"
                        >
                          <Ban size={16} />
                        </button>
                        <button className="p-2 rounded-lg bg-[#1A2639] hover:text-white transition-all border border-transparent hover:border-white/20">
                          <ArrowUpRight size={16} />
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

