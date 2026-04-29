/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'framer-motion';
import { Map, Search, ArrowRight, ExternalLink, Navigation, Compass, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES_DATA } from './constants';

export default function Routes() {
  const navigate = useNavigate();

  const handleRouteClick = (r: any) => {
    // Navigate to booking with pre-filled search (conceptually)
    navigate(`/book?from=${r.from}&to=${r.to}`);
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
            Маршрути
          </h1>
          <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
            Всі доступні напрямки для бронювання
          </p>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5c72] group-focus-within:text-[#7c5cfc] transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Пошук маршруту..." 
            className="w-full bg-[#121824] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc] transition-all w-[240px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7c5cfc05] blur-[120px] rounded-full pointer-events-none" />
        
        <div className="overflow-x-auto scrollbar-hide relative z-10">
          <table className="min-w-[800px] w-full text-left border-collapse">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className="px-6 py-5 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Маршрут</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Відстань</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5 text-center">Перевізників</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Найближчий рейс</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Попит</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5 text-right">Ціна від</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {ROUTES_DATA.map((r, i) => (
                <motion.tr 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleRouteClick(r)}
                  className="group hover:bg-white/[0.015] transition-all cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#7c5cfc] shrink-0 group-hover:bg-[#7c5cfc] group-hover:text-white transition-all shadow-inner">
                        <MapPin size={12} />
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-tighter italic text-white">
                        <span>{r.from}</span>
                        <ArrowRight size={10} className="text-[#4a5c72] mx-1 group-hover:text-[#7c5cfc] transition-colors" />
                        <span>{r.to}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[11px] font-bold text-[#7a8fa8]">{r.km} км</div>
                    <div className="text-[9px] text-[#4a5c72] font-black uppercase mt-1">~{r.time}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-black text-white italic bg-white/5 px-2 py-1 rounded-lg border border-white/10">{r.carriers}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#a28afd]">
                      <Compass size={10} /> {r.next}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-1 bg-black/40 rounded-full overflow-hidden border border-white/[0.02]">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${r.demand}%` }} 
                          className={`h-full ${r.demand > 80 ? 'bg-[#00d97e]' : 'bg-[#00c4d4]'}`} 
                        />
                      </div>
                      <span className="text-[10px] font-black text-[#4a5c72] uppercase">{r.demand}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-['Syne'] font-black text-[#00d97e] text-base tracking-tighter italic">€{r.price}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-10 h-10 rounded-xl bg-[#7c5cfc1a] border border-[#7c5cfc33] flex items-center justify-center text-[#7c5cfc] hover:bg-[#7c5cfc] hover:text-white transition-all shadow-lg group-hover:scale-110 active:scale-95">
                         <ArrowRight size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

