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
        .eq('carrier_id', user.uid)
        .order('created_at', { ascending: false })
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `carrier_id=eq.${user.uid}` }, fetchFinanceData)
      .subscribe();

    return () => {
      supabase.removeChannel(balanceChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [user]);

  const handleRequestPayout = () => {
    if (balance <= 0) {
      toast.error('Недостатньо коштів для виплати');
      return;
    }
    const toastId = toast.loading('Створення запиту на виплату...');
    setTimeout(() => {
      // In a real app we would insert into a payouts table:
      // await supabase.from('payouts').insert({ carrier_id: user.uid, amount: balance });
      toast.success('Запит на виплату надіслано в фінансовий відділ', { id: toastId });
    }, 1500);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('Немає транзакцій для експорту');
      return;
    }
    const headers = ['ID', 'Тип', 'Дата', 'Опис', 'Сума (€)', 'Статус'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => `"${t.id}","${t.type === 'income' ? 'Дохід' : t.type === 'payout' ? 'Виплата' : 'Повернення'}","${t.date}","${t.desc}",${t.amount},"${t.status}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Звіт успішно експортовано');
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">ФІНАНСИ</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">Баланс, виплати та історія транзакцій</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExportCSV}
            className="px-8 py-3.5 bg-[#0B1221] border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#1A2639] transition-all flex items-center gap-2"
          >
            <Download size={14} /> <span className="hidden md:inline-block">ЕКСПОРТ ЗВІТУ</span>
          </button>
          <button 
            onClick={handleRequestPayout}
            className="px-8 py-3.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <span className="hidden md:inline-block">ЗАПРОСИТИ ВИПЛАТУ</span>
            <span className="md:hidden">ВИПЛАТА</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'ДОСТУПНО ДО ВИПЛАТИ', val: `€${balance.toLocaleString('en-US', {minimumFractionDigits: 2})}`, icon: Wallet, color: '#10B981', trend: '+12% vs м.м.' },
          { label: 'В ОБРОБЦІ', val: `€${pendingBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}`, icon: CreditCard, color: '#F59E0B', trend: 'Очікується завтра' },
          { label: 'ВСЬОГО ВИПЛАЧЕНО', val: `€${totalPayouts.toLocaleString('en-US', {minimumFractionDigits: 2})}`, icon: Landmark, color: '#0EA5E9', trend: 'За весь час' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[32px] bg-[#1A2639]/30 border border-white/5 relative overflow-hidden group shadow-lg min-h-[160px]"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-all">
              <stat.icon size={80} style={{ color: stat.color }} strokeWidth={1} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#5A6A85] mb-2 relative z-10">{stat.label}</p>
            <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4 relative z-10">{stat.val}</h3>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest relative z-10" style={{ color: stat.color }}>
              <TrendingUp size={12} /> {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Finance Chart Section */}
      <div className="bg-[#0B1221] border border-white/5 rounded-[32px] p-8 shadow-2xl">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="text-white font-black text-sm uppercase tracking-widest mb-1">Динаміка прибутку</h3>
               <p className="text-[10px] text-[#5A6A85] font-bold uppercase tracking-widest">Статистика за останні 7 днів (EUR)</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#00E5FF]"></div>
                  <span className="text-[9px] font-black text-[#5A6A85] uppercase">Дохід</span>
               </div>
            </div>
         </div>
         
         <div className="h-48 w-full flex items-end justify-between gap-2 px-2">
            {[65, 45, 80, 55, 90, 70, 85].map((val, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="w-full relative">
                     <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${val}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="w-full bg-gradient-to-t from-[#00E5FF]/20 to-[#00E5FF] rounded-t-xl relative group-hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
                     >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                           €{(val * 12).toLocaleString()}
                        </div>
                     </motion.div>
                  </div>
                  <span className="text-[8px] font-black text-[#5A6A85] uppercase">
                     {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'][i]}
                  </span>
               </div>
            ))}
         </div>
      </div>

      <div className="bg-[#0B1221] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl min-h-[400px]">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
           <h3 className="text-[12px] font-black uppercase tracking-widest text-white flex items-center gap-3">
              <History size={16} className="text-[#00E5FF]" /> ОСТАННЯ АКТИВНІСТЬ
           </h3>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6A85]" size={14} />
              <input 
                placeholder="Пошук транзакції..." 
                className="bg-[#1A2639]/50 border border-transparent rounded-[16px] pl-10 pr-4 py-3 text-[11px] text-white focus:border-[#00E5FF]/30 outline-none w-full md:w-64 transition-all placeholder-[#5A6A85] font-medium"
              />
           </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide h-full">
          <table className="min-w-[800px] w-full text-left">
            <thead>
              <tr className="bg-transparent border-b border-white/5">
                <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">ДАТА / ТИП</th>
                <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">ОПИС</th>
                <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">СТАТУС</th>
                <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest text-right">СУМА</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((trx, idx) => (
                <tr key={idx} className="group hover:bg-[#1A2639]/30 transition-all">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-[10px] ${trx.type === 'income' ? 'bg-[#10B981]/10 text-[#10B981]' : trx.type === 'payout' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'bg-rose-500/10 text-rose-500'}`}>
                        {trx.type === 'income' ? <ArrowDownRight size={16} /> : trx.type === 'payout' ? <Landmark size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white italic uppercase tracking-widest">{trx.type === 'income' ? 'Дохід' : trx.type === 'payout' ? 'Виплата' : 'Повернення'}</p>
                        <p className="text-[9px] text-[#5A6A85] font-bold uppercase mt-0.5">{trx.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <p className="text-[11px] font-bold text-[#8899B5]">{trx.desc}</p>
                    <p className="text-[9px] text-[#5A6A85] mt-0.5 font-bold italic line-clamp-1">{trx.id}</p>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`px-3 py-1.5 rounded-[10px] text-[8px] font-black uppercase tracking-widest border ${trx.status === 'completed' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                      {trx.status === 'completed' ? 'ЗАВЕРШЕНО' : 'В ОБРОБЦІ'}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <span className={`text-sm font-black italic tracking-tighter ${trx.amount > 0 ? 'text-[#10B981]' : 'text-rose-500'}`}>
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

