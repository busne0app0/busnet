import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Undo2, Search, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';

const RefundsTab: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addLog } = useAdminStore();

  useEffect(() => {
    const fetchRefunds = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['cancelled', 'CANCELLED'])
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setRefunds(data);
      }
      setLoading(false);
    };

    fetchRefunds();

    const channel = supabase.channel(`refunds_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchRefunds)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleProcessRefund = async (id: string, action: 'approve' | 'reject') => {
    if (confirm(`Підтвердити дію (${action === 'approve'? 'Повернути гроші' : 'Відхилити'}) для квитка ${id}?`)) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ refundStatus: action === 'approve' ? 'PROCESSED' : 'REJECTED' })
          .eq('id', id);
        
        if (error) throw error;
        addLog({
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: 'Admin',
          role: 'owner',
          action: 'UPDATE',
          obj: `Повернення ${id} -> ${action}`,
          icon: '🔄'
        });
      } catch (e) {
        alert('Помилка оновлення статусу повернення коштів.');
      }
    }
  };

  const filtered = refunds.filter(r => r.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-6 bg-[#f44336] rounded-full shadow-[0_0_10px_#f44336]" />
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-sans">Повернення Коштів</h2>
           </div>
           <p className="text-[#7a9ab5] text-sm font-medium tracking-wide ml-5">Управління скасованими квитками та запитами на Refund</p>
        </div>
      </div>

      <div className="bg-[#0f1520] border border-[#1c2e48] p-5 rounded-3xl flex gap-4 overflow-x-auto no-scrollbar shadow-xl">
         <div className="relative min-w-[300px] flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d5670]" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за PNR або ID квитка..." 
              className="w-full bg-[#070912] border border-[#1c2e48] rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:border-[#00c8ff] outline-none transition-all placeholder:text-[#3d5670]"
            />
         </div>
         <div className="flex gap-4">
             <div className="bg-[#151e2e] border border-[#1c2e48] rounded-2xl px-6 py-2 flex items-center gap-3">
                <span className="text-2xl font-black text-[#f44336] italic">{refunds.filter(r => !r.refundStatus || r.refundStatus === 'PENDING').length}</span>
                <span className="text-[9px] font-black uppercase text-[#7a9ab5] tracking-widest">Очікують<br/>повернення</span>
             </div>
         </div>
      </div>

      <div className="bg-[#0f1520] border border-[#1c2e48] rounded-[2.5rem] overflow-hidden shadow-2xl">
         {loading ? (
            <div className="py-20 text-center text-[#f44336]">Loading...</div>
         ) : (
         <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-[800px] w-full text-left">
              <thead>
                <tr className="bg-[#151e2e]/30 border-b border-[#1c2e48]">
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Квиток (PNR)</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Пасажир</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Сума (EUR)</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Статус повернення</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em] text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2e48]/50">
                {filtered.map((r, idx) => {
                  const pName = r.passengers?.[0] ? `${r.passengers[0].firstName} ${r.passengers[0].lastName}` : 'Guest';
                  const rStatus = r.refundStatus || 'PENDING';
                  
                  return (
                  <motion.tr 
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-5 px-6">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${rStatus==='PENDING'?'bg-[#ff9800]/10 border-[#ff9800]/20 text-[#ff9800] animate-pulse':'bg-[#f44336]/10 border-[#f44336]/20 text-[#f44336]'}`}>
                             {rStatus === 'PENDING' ? <Clock size={16} /> : <Undo2 size={16} />}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white uppercase italic">{r.id.substring(0,8)}***</p>
                             <p className="text-[9px] text-[#3d5670] font-black uppercase mt-0.5">Клас: Refundable</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-6 font-bold text-white">{pName}</td>
                    <td className="py-5 px-6">
                        <div className="text-lg font-black tracking-tight text-white">
                            €{Math.round(r.totalPrice / 42)}
                        </div>
                    </td>
                    <td className="py-5 px-6">
                       <span className={`
                         px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border
                         ${rStatus === 'PROCESSED' ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 
                           rStatus === 'REJECTED' ? 'bg-[#f44336]/10 text-[#f44336] border-[#f44336]/20' :
                           'bg-[#ff9800]/10 text-[#ff9800] border-[#ff9800]/20'}
                       `}>
                          {rStatus === 'PROCESSED' ? 'ПОВЕРНЕНО' : rStatus === 'REJECTED' ? 'ВІДХИЛЕНО' : 'ОЧІКУЄ'}
                       </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                       {rStatus === 'PENDING' ? (
                         <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleProcessRefund(r.id, 'approve')}
                              className="px-4 py-2 bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00e676] hover:text-black transition-all"
                            >
                               Схвалити
                            </button>
                            <button 
                              onClick={() => handleProcessRefund(r.id, 'reject')}
                              className="px-4 py-2 bg-[#f44336]/10 text-[#f44336] border border-[#f44336]/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f44336] hover:text-white transition-all"
                            >
                               Відхилити
                            </button>
                         </div>
                       ) : (
                         <span className="text-[10px] font-black text-[#3d5670] uppercase tracking-widest">
                            ОБРОБЛЕНО
                         </span>
                       )}
                    </td>
                  </motion.tr>
                )})}
              </tbody>
            </table>
         </div>
         )}
      </div>
    </div>
  );
};

export default RefundsTab;

