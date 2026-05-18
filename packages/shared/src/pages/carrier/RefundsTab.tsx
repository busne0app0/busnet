/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, CheckCircle2, Clock, ArrowRightLeft, Search, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

interface Refund {
  id: string;
  originalId: string;
  passenger: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  reason: string;
  method: string;
  requestDate: string;
}

const RefundsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRefunds = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('carrier_id', user.uid)
        .eq('status', 'cancelled');
      
      if (error) throw error;

      if (data) {
        let pc = 0;
        const parsed: Refund[] = data.map(d => {
          const isCompleted = d.refundStatus === 'completed';
          if (!isCompleted) pc++;
          
          return {
            id: `REF-${d.id.slice(0, 6).toUpperCase()}`,
            originalId: d.id,
            passenger: d.passengers?.[0] 
              ? `${d.passengers[0].firstName} ${d.passengers[0].lastName}` 
              : 'Пасажир',
            amount: Number(d.total_price || d.totalPrice || 0),
            status: isCompleted ? 'completed' : 'pending',
            reason: d.cancel_reason || d.cancelReason || 'Скасування',
            method: d.payment_method || d.paymentMethod || 'Original Payment',
            requestDate: d.created_at || d.createdAt 
              ? new Date(d.created_at || d.createdAt).toLocaleDateString('uk-UA') 
              : '—'
          };
        });
        setRefunds(parsed);
        setPendingCount(pc);
      }
    } catch (e) {
      console.error('Error fetching refunds:', e);
      toast.error('Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRefunds();

    if (!user) return;

    // Realtime channel sync
    const channel = supabase.channel('carrier_refunds')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `carrier_id=eq.${user.uid}` },
        () => {
          fetchRefunds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRefunds, user]);

  const handleProcessRefund = async (id: string, originalId: string) => {
    setProcessingId(originalId);
    const toastId = toast.loading('Обробка запиту...');
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ refundStatus: 'completed' })
        .eq('id', originalId);

      if (error) throw error;

      toast.success(`Запит ${id} успішно оброблено`, { id: toastId });
      setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' as const } : r));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
      toast.error('Помилка обробки запиту', { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered and searched refunds list
  const filteredRefunds = useMemo(() => {
    return refunds.filter(ref => {
      const matchesStatus = filterStatus === 'all' || ref.status === filterStatus;
      const matchesSearch = !searchTerm || 
        ref.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        ref.passenger.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.reason.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [refunds, filterStatus, searchTerm]);

  // Statistics memoization
  const stats = useMemo(() => {
    const pendingAmount = refunds
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);

    const completedAmount = refunds
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);

    const completedCount = refunds.filter(r => r.status === 'completed').length;

    return {
      pendingAmount,
      completedAmount,
      completedCount
    };
  }, [refunds]);

  const statusBadge = (status: string) => {
    if (status === 'completed') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'pending') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  };

  const statusLabel = (status: string) => status === 'completed' ? '● ВИПЛАЧЕНО' : 'ОЧІКУЄ';

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* HEADER з фірмовим акцентом */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {/* Яркая полоска со свечением, как в LiveTrips */}
            <div className="w-1.5 h-6 bg-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">ПОВЕРНЕННЯ КОШТІВ</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">Система автоматизованого рефанд-менеджменту</p>
        </div>
        
        {/* Фірмова кнопка */}
        <button 
          onClick={() => toast.success('Архів завантажується...')}
          className="px-6 py-3 bg-[#1A2639]/50 border border-[#F59E0B]/30 text-[#F59E0B] rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#F59E0B]/10 transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
        >
          Архів запитів
        </button>
      </div>

      {/* STATS у великих картках із ховер-ефектами та моноширинними цифрами */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A2639]/30 border border-white/5 p-8 rounded-[32px] relative overflow-hidden group backdrop-blur-md transition-all hover:border-[#F59E0B]/20">
          <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
            <RotateCcw size={120} className="text-[#F59E0B]" strokeWidth={1} />
          </div>
          <p className="text-[11px] font-black uppercase text-[#8899B5] tracking-[0.12em] mb-2 font-bold">Очікують обробки</p>
          <h3 className="text-4xl font-black text-white italic tracking-tighter font-mono tabular-nums">
            {pendingCount}{' '}
            <span className="text-sm text-[#F59E0B] not-italic ml-2 font-sans font-bold">запитів</span>
          </h3>
          <p className="text-[10px] text-[#5A6A85] font-bold uppercase mt-2 font-mono tabular-nums">
            Сума очікування: €{stats.pendingAmount.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#1A2639]/30 border border-white/5 p-8 rounded-[32px] relative overflow-hidden group backdrop-blur-md transition-all hover:border-[#10B981]/20">
          <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
            <CheckCircle2 size={120} className="text-[#10B981]" strokeWidth={1} />
          </div>
          <p className="text-[11px] font-black uppercase text-[#8899B5] tracking-[0.12em] mb-2 font-bold">Виконані повернення</p>
          <h3 className="text-4xl font-black text-white italic tracking-tighter font-mono tabular-nums">
            {stats.completedCount}{' '}
            <span className="text-sm text-[#10B981] not-italic ml-2 font-sans font-bold">виплат</span>
          </h3>
          <p className="text-[10px] text-[#5A6A85] font-bold uppercase mt-2 font-mono tabular-nums">
            Загальна сума: €{stats.completedAmount.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#1A2639]/30 border border-white/5 p-8 rounded-[32px] relative overflow-hidden group backdrop-blur-md transition-all hover:border-[#00E5FF]/20">
          <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
            <ArrowRightLeft size={120} className="text-[#00E5FF]" strokeWidth={1} />
          </div>
          <p className="text-[11px] font-black uppercase text-[#8899B5] tracking-[0.12em] mb-2 font-bold">Загальний об'єм</p>
          <h3 className="text-4xl font-black text-white italic tracking-tighter font-mono tabular-nums">
            {refunds.length}{' '}
            <span className="text-sm text-[#00E5FF] not-italic ml-2 font-sans font-bold">заявок</span>
          </h3>
          <p className="text-[10px] text-[#5A6A85] font-bold uppercase mt-2 font-mono tabular-nums">
            Всього оброблено в системі
          </p>
        </div>
      </div>

      {/* ФІЛЬТРИ ТА ПОШУК */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0B1221] rounded-full w-fit border border-white/5 shadow-lg">
          {(['all', 'pending', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`
                px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                ${filterStatus === status 
                  ? 'bg-[#F59E0B] text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                  : 'text-[#5A6A85] hover:text-white hover:bg-[#1A2639]'}
              `}
            >
              {status === 'all' ? 'Всі' : status === 'pending' ? 'Очікують' : 'Виплачені'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6A85]" size={14} />
          <input 
            type="text"
            placeholder="Пошук за ID, пасажиром чи причиною..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B1221] border border-white/5 rounded-full pl-10 pr-10 py-3 text-[11px] text-white focus:border-[#F59E0B]/50 outline-none transition-all placeholder-[#5A6A85] font-bold"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6A85] hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Список в стилі "Таблиця-карточки" */}
      <div className="bg-[#0B1221] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative min-h-[350px]">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Черга на повернення</h3>
           <Clock size={16} className="text-[#5A6A85]" />
        </div>

        {/* Мобільний вигляд */}
        <div className="md:hidden p-4 space-y-3">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-[#1A2639]/30 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredRefunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-[#1A2639]/10 rounded-[24px] border border-white/5">
              <RotateCcw className="text-[#1A2639]" size={40} />
              <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest">ПОВЕРНЕНЬ НЕ ЗНАЙДЕНО</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredRefunds.map((ref, idx) => (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-[#1A2639]/20 border border-white/5 rounded-[24px] p-5 space-y-4 hover:border-[#F59E0B]/20 transition-all"
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
                      <p className="text-sm font-bold text-white tracking-tight">{ref.passenger}</p>
                      <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest italic">{ref.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#F59E0B] italic">€{ref.amount.toLocaleString()}</p>
                      <p className="text-[9px] text-[#5A6A85] uppercase">{ref.method}</p>
                    </div>
                  </div>
                  {ref.status === 'pending' && (
                    <button
                      onClick={() => handleProcessRefund(ref.id, ref.originalId)}
                      disabled={processingId === ref.originalId}
                      className="w-full py-3 rounded-xl bg-[#F59E0B] text-black text-[9px] font-black uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2"
                    >
                      {processingId === ref.originalId ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        'ОБРОБИТИ'
                      )}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Десктопна таблиця */}
        <div className="hidden md:block overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-8 rounded-full bg-white/5" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9px] font-black text-[#5a6a85] uppercase tracking-widest border-b border-white/5 bg-[#1A2639]/10">
                  <th className="py-5 px-8">Транзакція</th>
                  <th className="py-5 px-8">Пасажир</th>
                  <th className="py-5 px-8">Сума / Спосіб</th>
                  <th className="py-5 px-8">Статус</th>
                  <th className="py-5 px-8 text-right">Управління</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <RotateCcw className="text-[#1A2639] mx-auto mb-4 opacity-20" size={48} />
                      <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest">Запитів на повернення не знайдено</p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filteredRefunds.map((ref, idx) => (
                      <motion.tr 
                        key={ref.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.05)] group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all">
                              <ArrowRightLeft size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-white italic tracking-widest uppercase group-hover:text-[#F59E0B] transition-colors">{ref.id}</p>
                              <p className="text-[9px] text-[#5A6A85] font-bold mt-0.5">{ref.requestDate}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <p className="text-sm font-bold text-white tracking-tight">{ref.passenger}</p>
                          <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-1 italic">{ref.reason}</p>
                        </td>
                        <td className="py-6 px-8">
                          <p className="text-sm font-black text-[#F59E0B] italic">€{ref.amount.toLocaleString()}</p>
                          <p className="text-[9px] text-[#5A6A85] font-bold uppercase mt-1 tracking-tighter">{ref.method}</p>
                        </td>
                        <td className="py-6 px-8">
                          <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${statusBadge(ref.status)}`}>
                            {statusLabel(ref.status)}
                          </span>
                        </td>
                        <td className="py-6 px-8 text-right">
                          {ref.status === 'pending' ? (
                            <button 
                              onClick={() => handleProcessRefund(ref.id, ref.originalId)}
                              disabled={processingId === ref.originalId}
                              className="px-6 py-2.5 bg-[#F59E0B] text-black text-[9px] font-black uppercase rounded-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-white transition-all flex items-center justify-center gap-2 ml-auto"
                            >
                              {processingId === ref.originalId ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                'Підтвердити'
                              )}
                            </button>
                          ) : (
                            <button 
                              onClick={() => toast.success(`Запит ${ref.id} вже оброблено`)}
                              className="p-2.5 bg-white/5 rounded-xl text-[#5A6A85] hover:text-white transition-all"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundsTab;
