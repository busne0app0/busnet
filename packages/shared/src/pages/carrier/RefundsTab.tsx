import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Search, Filter, AlertCircle, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

const RefundsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchRefunds = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('carrierId', user.uid)
        .eq('status', 'cancelled');
      
      if (!error && data) {
        let pc = 0;
        const parsed = data.map(d => {
          if (d.refundStatus !== 'completed') pc++;
          return {
            id: `REF-${d.id.slice(0, 6).toUpperCase()}`,
            passenger: d.passengers?.[0] ? `${d.passengers[0].firstName} ${d.passengers[0].lastName}` : 'Пасажир',
            amount: (d.totalPrice || 0) / 42,
            method: 'Original Payment',
            status: d.refundStatus === 'completed' ? 'completed' : 'pending',
            reason: 'Скасування',
            requestDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('uk-UA') : '—'
          };
        });
        setRefunds(parsed);
        setPendingCount(pc);
      }
    };

    fetchRefunds();

    const channel = supabase.channel('carrier_refunds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `carrierId=eq.${user.uid}` }, fetchRefunds)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">Повернення</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">Опрацювання заявок на повернення коштів</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-[#111520] border border-amber-500/20 p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
               <RotateCcw size={80} className="text-amber-500" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-[#5a6a85] tracking-widest">В очікуванні</p>
               <h3 className="text-2xl font-black text-white italic">{String(pendingCount).padStart(2, '0')} запити</h3>
            </div>
         </div>
      </div>

      <div className="bg-[#111520] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
         <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left">
               <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">ID Запиту</th>
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Пасажир</th>
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Сума / Спосіб</th>
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Статус</th>
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em] text-right">Дії</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {refunds.map((ref, idx) => (
                     <tr key={idx} className="group hover:bg-white/[0.01] transition-all">
                        <td className="py-5 px-6">
                           <p className="text-xs font-black text-white italic tracking-widest">{ref.id}</p>
                           <p className="text-[9px] text-[#3d5670] font-bold uppercase mt-0.5">{ref.requestDate}</p>
                        </td>
                        <td className="py-5 px-6">
                           <p className="text-sm font-bold text-white tracking-tight">{ref.passenger}</p>
                           <p className="text-[9px] text-[#5a6a85] font-black uppercase tracking-widest mt-1 italic">{ref.reason}</p>
                        </td>
                        <td className="py-5 px-6">
                           <p className="text-sm font-black text-amber-400 italic">€{ref.amount.toFixed(2)}</p>
                           <p className="text-[9px] text-[#5a6a85] font-bold uppercase mt-1 tracking-tighter">{ref.method}</p>
                        </td>
                        <td className="py-5 px-6">
                           <span className={`
                              px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border
                              ${ref.status === 'completed' ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 
                                ref.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                'bg-rose-500/10 text-rose-500 border-rose-500/20'}
                           `}>
                              {ref.status === 'completed' ? 'Виплачено' : ref.status === 'pending' ? 'Очікує' : 'Відхилено'}
                           </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                           {ref.status === 'pending' ? (
                              <button 
                                onClick={() => toast.success(`Запит ${ref.id} взято в роботу`)}
                                className="px-6 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-amber-500/10"
                              >
                                 Обробити →
                              </button>
                           ) : (
                              <button 
                                onClick={() => toast.success(`Деталі за запитом ${ref.id} завантажуються...`)}
                                className="px-4 py-2 rounded-xl bg-white/5 text-[#5a6a85] text-[10px] font-black uppercase tracking-widest border border-white/5"
                              >
                                 Деталі
                              </button>
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default RefundsTab;

