import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bus, Clock, MoreVertical, Phone, AlertCircle, Radio, Zap, Globe, Navigation, Activity, ShieldAlert } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';

const LiveTripsTab: React.FC = () => {
  const [liveTrips, setLiveTrips] = useState<any[]>([]);

  useEffect(() => {
    const fetchLiveTrips = async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .in('status', ['active', 'in_progress', 'delayed']);
      if (!error && data) setLiveTrips(data);
    };
    fetchLiveTrips();
    const channel = supabase.channel('live_trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchLiveTrips)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 📡 Tactical Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-8 bg-[#10B981] rounded-full shadow-[0_0_15px_#10B981]" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                Fleet <span className="text-[#10B981]">Telemetry</span>
              </h2>
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
             Global GPS Synchronization · Real-time Signal Access
           </p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-2 glass-mission-control rounded-2xl flex items-center gap-3">
              <Radio size={14} className="text-[#10B981] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{liveTrips.length} Nodes Online</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🗺️ Tactical Radar Grid */}
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video glass-mission-control rounded-[2.5rem] relative overflow-hidden group shadow-2xl border-white/5">
             {/* Radar Scanning Line */}
             <motion.div 
               animate={{ y: ['0%', '100%'] }}
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#10B981]/50 to-transparent z-10 pointer-events-none"
             />
             
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10B981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
             
             {/* Tactical Map Mockup */}
             <svg className="w-full h-full opacity-30" viewBox="0 0 800 450">
                <path d="M150,100 Q400,50 650,100 T750,300" stroke="#10B981" strokeWidth="1" fill="none" strokeDasharray="8,8" />
                <circle cx="150" cy="100" r="3" fill="#10B981" />
                <circle cx="650" cy="100" r="3" fill="#10B981" />
                <circle cx="750" cy="300" r="3" fill="#10B981" />
             </svg>

             {/* Dynamic Telemetry Pins */}
             {liveTrips.map((trip, i) => (
               <motion.div
                 key={trip.id}
                 initial={{ opacity: 0, scale: 0 }}
                 animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                 className="absolute cursor-pointer group/pin"
                 style={{ left: i === 0 ? '55%' : '30%', top: i === 0 ? '15%' : '52%' }}
               >
                 <div className="relative">
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 glass-mission-control px-4 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-all duration-300 z-10 shadow-2xl scale-95 group-hover/pin:scale-100">
                       <p className="text-[9px] font-black uppercase tracking-widest text-[#10B981] mb-0.5">{trip.id}</p>
                       <p className="text-[10px] font-black text-white uppercase">{trip.route}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-black flex items-center justify-center shadow-[0_0_20px_#10B981/40] group-hover/pin:scale-110 transition-transform relative">
                       <Bus size={22} />
                       <motion.div 
                         animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                         transition={{ duration: 1.5, repeat: Infinity }}
                         className="absolute inset-0 bg-[#10B981] rounded-2xl -z-10"
                       />
                    </div>
                 </div>
               </motion.div>
             ))}

             <div className="absolute bottom-8 left-8 p-5 glass-mission-control rounded-2xl">
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Nominal Flux</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Sync Latency</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="glass-mission-control rounded-[2.5rem] p-8 space-y-6">
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white italic flex items-center gap-3">
                <Navigation size={18} className="text-[#00D4FF]" /> Active Vectors
             </h3>
             <div className="space-y-3">
                {liveTrips.map((trip, idx) => (
                  <motion.div 
                    key={trip.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/2 border border-white/5 rounded-2xl p-5 hover:bg-white/5 hover:border-[#10B981]/20 transition-all group flex items-center gap-8"
                  >
                     <div className={`w-1.5 h-10 rounded-full ${trip.status === 'active' ? 'bg-[#10B981] shadow-[0_0_10px_#10B981]' : 'bg-[#F59E0B] shadow-[0_0_10px_#F59E0B]'}`} />
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="text-sm font-black text-white uppercase italic tracking-tight leading-none group-hover:text-[#00D4FF] transition-colors">{trip.id} · {trip.route}</h4>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{trip.seats} Units Occupied</span>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                           <span>{trip.carrier}</span>
                           <div className="w-1 h-1 bg-white/10 rounded-full" />
                           <span className="text-[#00D4FF]">{trip.depart} → {trip.arrive}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        {trip.delay && (
                          <div className="px-3 py-1.5 bg-white/5 border border-[#F59E0B]/20 rounded-xl flex items-center gap-2 text-[#F59E0B]">
                             <Clock size={12} className="animate-spin-slow" />
                             <span className="text-[9px] font-black uppercase">+{trip.delay}</span>
                          </div>
                        )}
                        <button className="w-11 h-11 rounded-xl bg-black border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/30 transition-all">
                           <Activity size={18} />
                        </button>
                     </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* 🎚️ Fleet Telemetry & Ops */}
        <div className="space-y-8">
           <div className="glass-mission-control rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8">Fleet Diagnostics</h3>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: 'Ops Flux', val: '12', color: '#10B981' },
                   { label: 'Anomalies', val: '3', color: '#F59E0B' },
                   { label: 'ETA Sync', val: '8', color: '#00D4FF' },
                   { label: 'Capacity', val: '94%', color: '#8B5CF6' },
                 ].map((s, i) => (
                   <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-2xl group hover:border-white/20 transition-all">
                      <div className="text-2xl font-black italic tracking-tighter" style={{ color: s.color }}>{s.val}</div>
                      <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1 group-hover:text-slate-400 transition-colors">{s.label}</div>
                   </div>
                 ))}
              </div>
              
              <div className="mt-8 space-y-4">
                 <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4">
                    <ShieldAlert size={18} className="text-red-500 shrink-0 animate-pulse" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
                      Grid Alert: <span className="text-white">BN-1203</span> Boundary delay detected (45m).
                    </p>
                 </div>
                 <div className="p-4 bg-[#00D4FF]/5 border border-[#00D4FF]/10 rounded-2xl flex gap-4">
                    <Radio size={18} className="text-[#00D4FF] shrink-0" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
                      Update: <span className="text-white">BN-2105</span> Signal relocated to Central Node.
                    </p>
                 </div>
              </div>
           </div>

           <div className="glass-mission-control rounded-[2.5rem] p-8">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 mb-8 italic">
                 <Phone size={18} className="text-[#10B981]" /> Ops Communication
              </h3>
              <div className="space-y-6">
                {[
                  { name: 'Unit IVAN', bus: 'BN-2847', phone: '+380 67...', status: 'active' },
                  { name: 'Unit PETRO', bus: 'BN-1203', phone: '+380 50...', status: 'delay' },
                  { name: 'Unit OLEG', bus: 'BN-3301', phone: '+380 63...', status: 'active' },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-4 group cursor-default">
                     <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs relative overflow-hidden transition-all duration-500 ${
                       d.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
                     }`}>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {d.name.slice(5, 6)}
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-black text-white tracking-tight uppercase group-hover:text-[#00D4FF] transition-colors">{d.name}</p>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">{d.bus} · {d.phone}</p>
                     </div>
                     <button className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-slate-500 hover:text-[#10B981] hover:border-[#10B981]/30 transition-all">
                        <Phone size={14} />
                     </button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-4 border border-dashed border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all">
                Global Comms Sync
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTripsTab;
