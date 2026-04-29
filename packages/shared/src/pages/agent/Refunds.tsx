/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Info, Hash, User, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Refunds() {
  const [pendingActions, setPendingActions] = useState<Record<string, 'confirming' | 'appealing'>>({});

  const handleAction = (id: string, action: 'confirming' | 'appealing') => {
    setPendingActions(prev => ({ ...prev, [id]: action }));
    const msg = action === 'confirming' ? 'Запит на повернення відправлено адміну' : 'Оскарження відправлено на розгляд адміна';
    toast.success(msg);
  };

  const REFUNDS = [
    {id:'BK-4799',pax:'Юлія Петренко',route:'Київ → Прага',date:'15.03.2026',amount:60,reason:'Особиста причина',status:'pending',comm:3},
    {id:'BK-4780',pax:'Дмитро Олійник',route:'Київ → Варшава',date:'10.03.2026',amount:55,reason:'Хвороба (є довідка)',status:'approved',comm:2.75},
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
          Повернення
        </h1>
        <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
          Запити на повернення по вашим бронюванням
        </p>
      </div>

      {/* Refunds List */}
      <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center shadow-xl shadow-black/20">
          <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-tight">Черга повернень</h3>
          <span className="bg-[#ff9d001a] text-[#ff9d00] px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">2 очікують</span>
        </div>
        <div className="p-4 space-y-3">
          {REFUNDS.map((r, i) => (
            <motion.div 
              key={r.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#121824] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#a28afd] font-black text-[10px]">#{i+1}</div>
                  <div>
                    <span className="font-['Syne'] font-black text-[#7c5cfc] text-sm tracking-tight">{r.id}</span>
                    <div className="text-[10px] text-[#7a8fa8] font-bold uppercase mt-1 italic tracking-tight">{r.pax} · {r.route} · {r.date}</div>
                  </div>
                </div>
                <span className={`
                  px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                  ${r.status === 'pending' ? 'bg-[#ff9d001a] text-[#ff9d00] border-[#ff9d0026]' : 'bg-[#00d97e1a] text-[#00d97e] border-[#00d97e26]'}
                `}>
                  {r.status === 'pending' ? 'Очікує' : 'Схвалено'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 px-2">
                <div className="space-y-1">
                  <div className="text-[8px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Причина</div>
                  <div className="text-xs font-bold text-white italic">"{r.reason}"</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Сума повернення</div>
                  <div className="text-lg font-['Syne'] font-black text-[#ff9d00] italic leading-none tracking-tighter">€{r.amount}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Ваша комісія</div>
                  <div className="text-sm font-black text-[#ff3d5a] italic leading-none tracking-tighter">-€{r.comm.toFixed(2)}</div>
                </div>
              </div>

              {r.status === 'pending' ? (
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  {pendingActions[r.id] ? (
                    <div className="flex-1 py-2 bg-white/5 border border-white/10 text-[#7a8fa8] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 italic">
                      <Clock size={12} /> {pendingActions[r.id] === 'confirming' ? 'Очікує підтвердження адміна' : 'Оскарження на розгляді'}
                    </div>
                  ) : (
                    <>
                      <button onClick={() => handleAction(r.id, 'confirming')} className="flex-1 py-2 bg-[#00d97e12] text-[#00d97e] border border-[#00d97e26] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00d97e24] transition-all">
                        Підтвердити повернення
                      </button>
                      <button onClick={() => handleAction(r.id, 'appealing')} className="flex-1 py-2 bg-white/5 border border-white/10 text-[#7a8fa8] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                        Оскаржити
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-[#00d97e] text-[10px] font-bold uppercase tracking-widest italic animate-in fade-in duration-1000">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> Рішення адміна: повернення схвалено
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rules Section */}
      <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          <Info size={16} className="text-[#a28afd]" />
          <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-tight">Правила повернень</h3>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: '72+ год до відправлення', val: '100% повернення пасажиру', type: 'green' },
            { label: '24–72 год до відправлення', val: '50% повернення', type: 'orange' },
            { label: 'Менше 24 год', val: 'Повернення відсутнє', type: 'red' },
            { label: 'Ваша комісія', val: 'Повертається пропорційно', type: 'muted' },
            { label: 'Рішення приймає', val: 'Адміністратор BUSNET UA', type: 'muted' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center text-[11px] pb-3 border-b border-white/[0.02] last:border-0 last:pb-0">
              <span className="text-[#4a5c72] uppercase font-bold tracking-widest text-[9px]">{item.label}</span>
              <span className={`
                font-black italic tracking-tight
                ${item.type === 'green' ? 'text-[#00d97e]' : ''}
                ${item.type === 'orange' ? 'text-[#ff9d00]' : ''}
                ${item.type === 'red' ? 'text-[#ff3d5a]' : ''}
                ${item.type === 'muted' ? 'text-[#7a8fa8]' : ''}
              `}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
