import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Navigation, AlertCircle, Clock, Map as MapIcon } from 'lucide-react';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

const DriverDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] rounded-3xl p-6 border border-white/5 relative overflow-hidden"
      >
        <div className="relative z-10">
          <p className="text-[#7a9ab5] text-xs font-bold uppercase tracking-widest mb-1">Поточний рейс</p>
          <h2 className="text-2xl font-black italic tracking-tighter">Київ — Варшава</h2>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/30">
              <Clock size={12} /> В дорозі
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c8ff]/20 text-[#00c8ff] text-[10px] font-black uppercase tracking-widest border border-[#00c8ff]/30">
              <Users size={12} /> 24 / 45
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-10">
           <Navigation size={180} className="rotate-45" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a6a85] pl-2">Наступні зупинки</h3>
        
        {[
          { city: 'Житомир', time: '14:30', status: 'done', passengers: 0 },
          { city: 'Рівне', time: '16:45', status: 'next', passengers: 4 },
          { city: 'Луцьк', time: '18:15', status: 'pending', passengers: 2 },
          { city: 'Ягодин (Митниця)', time: '20:00', status: 'pending', passengers: 0 },
        ].map((stop, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${stop.status === 'next' ? 'bg-[#1a1f2e] border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'bg-[#0a0e1a] border-white/5'} flex items-center justify-between`}>
             <div className="flex items-center gap-4">
               <div className={`w-2 h-2 rounded-full ${stop.status === 'done' ? 'bg-green-500' : stop.status === 'next' ? 'bg-orange-500 animate-pulse' : 'bg-[#4a6a85]'}`} />
               <div>
                 <p className={`font-black tracking-tight ${stop.status === 'done' ? 'text-[#4a6a85]' : 'text-white'}`}>{stop.city}</p>
                 <p className="text-[10px] font-bold text-[#7a9ab5] uppercase">{stop.time}</p>
               </div>
             </div>
             {stop.passengers > 0 && (
               <div className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-orange-400">
                 +{stop.passengers} пас.
               </div>
             )}
          </div>
        ))}
      </div>

      <div className="bg-[#0a0e1a] border border-white/5 rounded-3xl p-6 relative group overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-black uppercase tracking-widest italic">Посадка (Чек-ін)</h4>
          <button className="text-[10px] font-bold text-[#00c8ff] uppercase hover:underline">Список</button>
        </div>
        <button className="w-full py-4 rounded-2xl bg-orange-500 text-black font-black uppercase italic tracking-tighter shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
          Відкрити сканер QR
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
          <AlertCircle className="text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Сигнал SOS</span>
        </button>
        <button className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
          <MapIcon className="text-[#00c8ff]" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Навігація</span>
        </button>
      </div>
    </div>
  );
};

export default DriverDashboard;
