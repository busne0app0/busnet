/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Map as MapIcon, Navigation, Bus, Clock, 
  Phone, AlertTriangle, ChevronRight, LocateFixed,
  Thermometer, MoreHorizontal, Users
} from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

export default function LiveTrips() {
  const { user } = useAuthStore();
  const [liveTrips, setLiveTrips] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchLiveTrips = async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('carrierId', user.uid)
        .in('status', ['active', 'in_progress']);
      
      if (!error && data) {
        setLiveTrips(data.map(d => ({
          id: d.id.slice(0,8).toUpperCase(),
          from: d.departureCity || 'Київ',
          to: d.arrivalCity || 'Варшава',
          dep: d.departureTime || '08:00',
          totalSeats: d.seatsTotal || 50,
          bookedSeats: d.seatsBooked || 0,
          driver: d.driverId || 'Водій',
          bus: d.busId || 'Автобус',
          speed: '87 км/год',
          temp: '+12°C',
          eta: d.arrivalTime || '18:30'
        })));
      }
    };

    fetchLiveTrips();

    const channel = supabase.channel('live_trips_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `carrierId=eq.${user.uid}` }, fetchLiveTrips)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-syne font-black text-3xl italic tracking-tighter uppercase text-white">Мої рейси Live</h2>
          <div className="text-[#5a6a85] text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Відстеження в реальному часі · {liveTrips.length} активних рейси
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-2 bg-white/[0.03] border border-white/5 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/[0.07] transition-all">
            Оновити дані
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Trips List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-xs font-black text-[#5a6a85] uppercase tracking-widest">Список активних рейсів</h3>
            <span className="text-[10px] font-bold text-emerald-400">● Оновлено щойно</span>
          </div>
          
          <div className="space-y-4">
            {liveTrips.map((trip, idx) => (
              <motion.div 
                key={trip.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#1a2235] border border-white/5 rounded-[32px] p-6 hover:border-[#ff6b35]/30 transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-orange-500 uppercase tracking-widest">{trip.id}</span>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-xs font-bold text-white uppercase italic tracking-tighter">{trip.from} → {trip.to}</span>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-lg bg-white/[0.03] text-[#5a6a85] flex items-center justify-center hover:text-white transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3 relative h-6 mb-8 px-4">
                  <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] z-10" />
                  <div className="flex-1 h-0.5 bg-white/[0.05] relative rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ left: ['10%', '100%'] }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#ff6b35] to-transparent blur-sm"
                    />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 z-10" />
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-1">
                    <p className="text-[9px] text-[#5a6a85] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={10} /> Виїзд
                    </p>
                    <p className="text-sm font-bold text-white italic tracking-tighter uppercase">{trip.dep}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] text-[#5a6a85] font-black uppercase tracking-widest flex items-center gap-1.5 justify-end">
                      <Navigation size={10} /> ETA
                    </p>
                    <p className="text-sm font-bold text-emerald-400 italic tracking-tighter uppercase">{trip.eta}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-[#5a6a85] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Bus size={10} /> Автобус
                    </p>
                    <p className="text-sm font-bold text-white italic tracking-tighter uppercase">{trip.bus}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] text-[#5a6a85] font-black uppercase tracking-widest flex items-center gap-1.5 justify-end">
                      <Users size={10} /> Місць
                    </p>
                    <p className={`text-sm font-bold italic tracking-tighter uppercase ${trip.bookedSeats === trip.totalSeats ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {trip.bookedSeats} / {trip.totalSeats}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-2">
                  <button className="flex-1 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2">
                    <Phone size={12} /> Дзвінок водію
                  </button>
                  <button className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all">
                    <AlertTriangle size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: GPS Map Mock */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#1a2235] border border-white/5 rounded-[40px] p-8 h-full relative overflow-hidden min-h-[500px] flex flex-col">
            <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
              <div className="px-4 py-2 rounded-2xl bg-[#0b0e14]/80 backdrop-blur-md border border-white/10 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] text-white font-black uppercase tracking-widest italic">Live GPS Active</span>
              </div>
            </div>

            <div className="absolute inset-0 bg-[#0b0e14] opacity-50 pointer-events-none">
              {/* Pattern grid */}
              <div className="w-full h-full opacity-10" style={{ 
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', 
                backgroundSize: '24px 24px' 
              }} />
            </div>

            {/* Mock Map Viewport */}
            <div className="relative flex-1 rounded-[32px] overflow-hidden border border-white/5">
               {/* Simplified stylized map lines */}
               <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 600">
                 <path d="M100 100 L 700 500" stroke="#ff6b35" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                 <path d="M200 400 L 600 200" stroke="#ff6b35" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                 <path d="M50 300 L 750 300" stroke="#ff6b35" strokeWidth="1" strokeDasharray="8 8" fill="none" />
               </svg>

               {/* City Markers */}
               {[
                 { name: 'Київ', x: '75%', y: '25%' },
                 { name: 'Львів', x: '45%', y: '40%' },
                 { name: 'Варшава', x: '35%', y: '20%' },
                 { name: 'Берлін', x: '15%', y: '30%' },
                 { name: 'Відень', x: '25%', y: '60%' },
                 { name: 'Прага', x: '20%', y: '45%' },
               ].map((city, idx) => (
                 <div key={idx} className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{ left: city.x, top: city.y }}>
                   <div className="w-3 h-3 rounded-full bg-white/20 border border-white/30 flex items-center justify-center p-0.5 group-hover:scale-125 transition-transform">
                      <div className="w-full h-full rounded-full bg-white opacity-50" />
                   </div>
                   <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest whitespace-nowrap group-hover:text-white transition-colors">{city.name}</span>
                 </div>
               ))}

               {/* Bus Markers (Animated) */}
               {liveTrips.slice(0, 3).map((trip, idx) => {
                 // Mock positions
                 const pos = [
                   { x: '60%', y: '25%' },
                   { x: '30%', y: '35%' },
                   { x: '35%', y: '50%' },
                 ][idx];
                 return (
                   <motion.div 
                    key={trip.id}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.5 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10" 
                    style={{ left: pos.x, top: pos.y }}
                   >
                     <div className="p-2 rounded-xl bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400 relative flex flex-col items-center">
                        <Bus size={18} />
                        <div className="absolute -bottom-8 bg-[#161c2a]/90 backdrop-blur px-2 py-1 rounded-md border border-white/10 whitespace-nowrap">
                           <p className="text-[8px] font-black uppercase text-white tracking-widest">{trip.id}</p>
                        </div>
                     </div>
                   </motion.div>
                 );
               })}
            </div>

            {/* Telemetry Footer */}
            <div className="mt-8 flex flex-wrap items-center gap-6 px-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-cyan-400">
                    <Navigation size={18} />
                 </div>
                 <div className="space-y-0.5">
                   <p className="text-[8px] font-black text-[#5a6a85] uppercase tracking-widest">Середня швидкість</p>
                   <p className="text-xs font-bold text-white uppercase italic">88 км/год</p>
                 </div>
               </div>
               <div className="w-px h-8 bg-white/5 mx-2" />
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-amber-400">
                    <Thermometer size={18} />
                 </div>
                 <div className="space-y-0.5">
                   <p className="text-[8px] font-black text-[#5a6a85] uppercase tracking-widest">Температура на борту</p>
                   <p className="text-xs font-bold text-white uppercase italic">+21°C</p>
                 </div>
               </div>
               <div className="w-px h-8 bg-white/5 mx-2" />
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-rose-400">
                    <LocateFixed size={18} />
                 </div>
                 <div className="space-y-0.5">
                   <p className="text-[8px] font-black text-[#5a6a85] uppercase tracking-widest">Сигнал GPS</p>
                   <p className="text-xs font-bold text-white uppercase italic">Сильний (100%)</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
