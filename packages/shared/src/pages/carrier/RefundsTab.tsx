import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

const RefundsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const handleProcessRefund = async (id: string, originalId: string) => {
    const toastId = toast.loading('Обробка запиту...');
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ refundStatus: 'completed' })
        .eq('id', originalId);
      if (error) throw error;
      toast.success(`Запит ${id} успішно оброблено`, { id: toastId });
      setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      toast.error('Помилка обробки', { id: toastId });
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchRefunds = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('carrier_id', user.uid)
        .eq('status', 'cancelled');
      if (!error && data) {
        let pc = 0;
        const parsed = data.map(d => {
          if (d.refundStatus !== 'completed') pc++;
          return {
            id: `REF-${d.id.slice(0, 6).toUpperCase()}`,
            originalId: d.id,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `carrier_id=eq.${user.uid}` }, fetchRefunds)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const statusBadge = (status: string) => {
    if (status === 'completed') return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
    if (status === 'pending') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  };
  const statusLabel = (status: string) => status === 'completed' ? 'ВИПЛАЧЕНО' : status === 'pending' ? 'ОЧІКУЄ' : 'ВІДХИЛЕНО';

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-6 bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">ПОВЕРНЕННЯ</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">Опрацювання заявок на повернення коштів</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1A2639]/30 border border-white/5 p-5 rounded-[20px] flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 p-4 opacity-[0.03]">
            <RotateCcw size={70} className="text-[#F59E0B]" strokeWidth={1} />
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B1221] border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] z-10 shrink-0">
            <Clock size={16} />
          </div>
          <div className="z-10">
            <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest">В ОЧІКУВАННІ</p>
            <h3 className="text-2xl font-black text-white italic tracking-tighter mt-0.5">{String(pendingCount).padStart(2, '0')}</h3>
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {refunds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-[#0B1221] rounded-[24px] border border-white/5">
            <RotateCcw className="text-[#1A2639]" size={40} />
            <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest">ПОВЕРНЕНЬ НЕМАЄ</p>
          </div>
        ) : refunds.map((ref, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#0B1221] border border-white/5 rounded-[20px] p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black text-white italic uppercase tracking-widest">{ref.id}</p>
                <p className="text-[9px] text-[#5A6A85] font-bold uppercase">{ref.requestDate}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-[10px] text-[8px] font-black uppercase border ${statusBadge(ref.status)}`}>
                {statusLabel(ref.status)}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm font-bold text-white">{ref.passenger}</p>
                <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest italic">{ref.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[#F59E0B] italic">€{ref.amount.toFixed(2)}</p>
                <p className="text-[9px] text-[#5A6A85] uppercase">{ref.method}</p>
              </div>
            </div>
            {ref.status === 'pending' && (
              <button
                onClick={() => handleProcessRefund(ref.id, ref.originalId)}
                className="w-full py-2.5 rounded-xl bg-[#F59E0B] text-black text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all"
              >
                ОБРОБИТИ
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto min-h-[300px]">
        <table className="min-w-[800px] w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-[#1A2639]/30">
              <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest rounded-l-full">ID ЗАПИТУ</th>
              <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">ПАСАЖИР</th>
              <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">СУМА / СПОСІБ</th>
              <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">СТАТУС</th>
              <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest text-right rounded-r-full">ДІЇ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-transparent">
            {refunds.map((ref, idx) => (
              <tr key={idx} className="group hover:bg-[#1A2639]/10 transition-all">
                <td className="py-5 px-6 rounded-l-[16px]">
                  <p className="text-xs font-black text-white italic tracking-widest uppercase group-hover:text-[#F59E0B] transition-colors">{ref.id}</p>
                  <p className="text-[9px] text-[#5A6A85] font-bold uppercase mt-0.5">{ref.requestDate}</p>
                </td>
                <td className="py-5 px-6">
                  <p className="text-sm font-bold text-white tracking-tight">{ref.passenger}</p>
                  <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-1 italic">{ref.reason}</p>
                </td>
                <td className="py-5 px-6">
                  <p className="text-sm font-black text-[#F59E0B] italic">€{ref.amount.toFixed(2)}</p>
                  <p className="text-[9px] text-[#5A6A85] font-bold uppercase mt-1 tracking-tighter">{ref.method}</p>
                </td>
                <td className="py-5 px-6">
                  <span className={`px-3 py-1.5 rounded-[10px] text-[8px] font-black uppercase tracking-widest border ${statusBadge(ref.status)}`}>
                    {statusLabel(ref.status)}
                  </span>
                </td>
                <td className="py-5 px-6 text-right rounded-r-[16px]">
                  {ref.status === 'pending' ? (
                    <button
                      onClick={() => handleProcessRefund(ref.id, ref.originalId)}
                      className="px-6 py-2.5 rounded-[10px] bg-[#F59E0B] text-black text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    >
                      ОБРОБИТИ
                    </button>
                  ) : (
                    <button
                      onClick={() => toast.success(`Деталі за запитом ${ref.id} завантажуються...`)}
                      className="px-6 py-2.5 rounded-[10px] bg-[#0B1221] text-[#8899B5] text-[9px] font-black uppercase tracking-widest hover:text-white transition-all"
                    >
                      ДЕТАЛІ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RefundsTab;
