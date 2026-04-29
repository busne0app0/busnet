import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Download, ArrowUpRight, ArrowDownRight, CreditCard, Landmark, History, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';

const FinanceTab: React.FC = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [totalPayouts, setTotalPayouts] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchFinanceData = async () => {
      // 1. Fetch balance
      const { data: balanceData } = await supabase
        .from('balances')
        .select('*')
        .eq('id', user.uid)
        .single();
      
      if (balanceData) {
        setBalance(balanceData.totalDebtToAdmin || 0);
        setPendingBalance(balanceData.pendingBalance || 0);
        setTotalPayouts(balanceData.totalPayouts || 0);
      }

      // 2. Fetch recent bookings as transactions
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('carrierId', user.uid)
        .order('createdAt', { ascending: false })
        .limit(10);
      
      if (bookingsData) {
        setTransactions(bookingsData.map(d => ({
          id: `TRX-${d.id.slice(0, 8).toUpperCase()}`,
          type: d.status === 'cancelled' ? 'refund' : 'income',
          amount: (d.totalPrice || 0) / 42,
          status: d.status === 'confirmed' ? 'completed' : d.status === 'cancelled' ? 'refunded' : 'processing',
          date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('uk-UA') : '—',
          desc: d.status === 'cancelled' ? `Повернення квитка #${d.id.slice(0, 8)}` : `Продаж квитка`
        })));
      }
    };

    fetchFinanceData();

    const balanceChannel = supabase.channel('carrier_balance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balances', filter: `id=eq.${user.uid}` }, fetchFinanceData)
      .subscribe();

    const bookingsChannel = supabase.channel('carrier_transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `carrierId=eq.${user.uid}` }, fetchFinanceData)
      .subscribe();

    return () => {
      supabase.removeChannel(balanceChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-[#00e676] rounded-full shadow-[0_0_10px_rgba(0,230,118,0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">Фінанси</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">Баланс, виплати та історія транзакцій</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => toast.success('Звіт успішно згенеровано та підготовлено до завантаження')}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Експорт звіту
          </button>
          <button 
            onClick={() => toast.loading('Запит обробляється банком...', { duration: 2000 })}
            className="px-6 py-3 bg-[#00e676] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_10px_20px_rgba(0,230,118,0.2)]"
          >
            Запросити виплату
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Доступно до виплати', val: `€${balance.toLocaleString('en-US', {minimumFractionDigits: 2})}`, icon: Wallet, color: '#00e676', trend: '+12% vs м.м.' },
          { label: 'В обробці', val: `€${pendingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}`, icon: CreditCard, color: '#ff9800', trend: 'Очікується завтра' },
          { label: 'Всього виплачено', val: `€${totalPayouts.toLocaleString('en-US', {minimumFractionDigits: 2})}`, icon: Landmark, color: '#00c8ff', trend: 'За весь час' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[32px] bg-[#111520] border border-white/5 relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform">
              <stat.icon size={80} style={{ color: stat.color }} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5a6a85] mb-2">{stat.label}</p>
            <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4">{stat.val}</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold" style={{ color: stat.color }}>
              <TrendingUp size={12} /> {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#111520] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4">
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
              <History size={18} className="text-cyan-400" /> Остання активність
           </h3>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d5670]" size={14} />
              <input 
                placeholder="Пошук транзакції..." 
                className="bg-[#070912] border border-white/5 rounded-lg pl-9 pr-4 py-2 text-[10px] text-white focus:border-cyan-500 outline-none w-full md:w-64"
              />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-left">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Дата / Тип</th>
                <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Опис</th>
                <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Статус</th>
                <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em] text-right">Сума</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((trx, idx) => (
                <tr key={idx} className="group hover:bg-white/[0.01] transition-all">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${trx.type === 'income' ? 'bg-[#00e676]/10 text-[#00e676]' : trx.type === 'payout' ? 'bg-[#00c8ff]/10 text-[#00c8ff]' : 'bg-rose-500/10 text-rose-500'}`}>
                        {trx.type === 'income' ? <ArrowDownRight size={16} /> : trx.type === 'payout' ? <Landmark size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white italic uppercase tracking-widest">{trx.type === 'income' ? 'Дохід' : trx.type === 'payout' ? 'Виплата' : 'Повернення'}</p>
                        <p className="text-[9px] text-[#5a6a85] font-bold uppercase mt-0.5">{trx.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <p className="text-[11px] font-bold text-[#8899b5]">{trx.desc}</p>
                    <p className="text-[9px] text-[#3d5670] mt-0.5 font-bold italic line-clamp-1">{trx.id}</p>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${trx.status === 'completed' ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                      {trx.status === 'completed' ? 'Завершено' : 'В обробці'}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <span className={`text-sm font-black italic tracking-tighter ${trx.amount > 0 ? 'text-[#00e676]' : 'text-rose-500'}`}>
                      {trx.amount > 0 ? '+' : ''}€{trx.amount.toLocaleString()}
                    </span>
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

export default FinanceTab;

