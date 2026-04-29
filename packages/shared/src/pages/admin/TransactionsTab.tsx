import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, ArrowUpRight, CheckCircle2, TrendingUp, TrendingDown, Clock, SearchIcon, Filter } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';

interface Transaction {
  id: string;
  amount: number;
  type: 'sale' | 'refund' | 'payout' | 'fee';
  status: string;
  createdAt: any;
  passengerName: string;
  source: string;
}

const TransactionsTab: React.FC = () => {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Treat active/completed bookings as payment transactions
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .not('totalPrice', 'is', null)
        .order('createdAt', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching transactions:', error);
        setLoading(false);
        return;
      }

      const results: Transaction[] = (data || []).map(booking => ({
        id: booking.id,
        amount: booking.totalPrice / 42, // EUR approx
        type: booking.status === 'cancelled' || booking.status === 'CANCELLED' ? 'refund' : 'sale',
        status: booking.status,
        createdAt: booking.createdAt,
        passengerName: booking.passengers?.[0] ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}` : 'Guest User',
        source: booking.agent ? `Agent: ${booking.agent}` : 'Web Portal'
      }));

      setTxs(results);
      setLoading(false);
    };

    fetchTransactions();

    // Realtime subscription
    const channel = supabase
      .channel(`transactions_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchTransactions)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = txs.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.passengerName.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const header = ['ID', 'Type', 'Source', 'Passenger', 'Amount', 'Status'];
    const rows = filtered.map(t => [
       t.id, t.type, t.source, t.passengerName, Math.round(t.amount).toString(), t.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + header.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `busnet_transactions_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-6 bg-[#00e676] rounded-full shadow-[0_0_10px_#00e676]" />
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-sans">Транзакції</h2>
           </div>
           <p className="text-[#7a9ab5] text-sm font-medium tracking-wide ml-5">Живий потік платежів, продажів та повернень</p>
        </div>
        <button onClick={exportCSV} className="px-8 py-3 bg-[#00e676] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white hover:text-black transition-all shadow-[0_10px_20px_rgba(0,230,118,0.2)]">
          Export CSV
        </button>
      </div>

      <div className="bg-[#0f1520] border border-[#1c2e48] p-5 rounded-3xl flex gap-4 overflow-x-auto no-scrollbar shadow-xl">
         <div className="relative min-w-[300px] flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d5670]" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за ID транзакції або пасажиром..." 
              className="w-full bg-[#070912] border border-[#1c2e48] rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:border-[#00c8ff] outline-none transition-all placeholder:text-[#3d5670]"
            />
         </div>
         <div className="flex gap-2">
            <button className="px-6 rounded-2xl bg-[#151e2e] border border-[#1c2e48] text-[#7a9ab5] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
               <Filter size={14} /> Тип
            </button>
            <button className="px-6 rounded-2xl bg-[#151e2e] border border-[#1c2e48] text-[#7a9ab5] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
               <Clock size={14} /> Дата
            </button>
         </div>
      </div>

      <div className="bg-[#0f1520] border border-[#1c2e48] rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="overflow-x-auto custom-scrollbar">
            {loading ? (
               <div className="py-20 text-center text-[#00e676]">Loading...</div>
            ) : (
            <table className="min-w-[800px] w-full text-left">
              <thead>
                <tr className="bg-[#151e2e]/30 border-b border-[#1c2e48]">
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Транзакція</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Джерело</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Клієнт</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Сума</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Статус</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em] text-right">Деталі</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2e48]/50">
                {filtered.map((t, idx) => (
                  <motion.tr 
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-5 px-6">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform ${
                             t.type === 'sale' ? 'bg-[#00e676]/10 border-[#00e676]/20 text-[#00e676]' 
                             : 'bg-[#f44336]/10 border-[#f44336]/20 text-[#f44336]'
                          }`}>
                             {t.type === 'sale' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white uppercase italic">{t.type === 'sale' ? 'Продаж Квитка' : 'Повернення (Refund)'}</p>
                             <p className="text-[9px] text-[#3d5670] font-black uppercase mt-0.5">ID: {t.id}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                        <span className="text-xs font-bold text-[#7a9ab5]">{t.source}</span>
                    </td>
                    <td className="py-5 px-6 font-bold text-white">{t.passengerName}</td>
                    <td className="py-5 px-6">
                        <div className={`text-lg font-black tracking-tight ${t.type === 'sale' ? 'text-[#00e676]' : 'text-[#f44336]'}`}>
                            {t.type === 'sale' ? '+' : '-'}€{Math.round(t.amount)}
                        </div>
                    </td>
                    <td className="py-5 px-6">
                       <span className={`
                         px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border
                         ${t.type === 'sale' ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 
                           'bg-[#f44336]/10 text-[#f44336] border-[#f44336]/20'}
                       `}>
                          {t.type === 'sale' ? 'Успішно' : 'Списано'}
                       </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                       <button className="w-8 h-8 rounded-lg bg-[#151e2e] border border-[#1c2e48] inline-flex items-center justify-center text-[#7a9ab5] hover:text-[#00c8ff] transition-all">
                          <ArrowUpRight size={14} />
                       </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            )}
         </div>
      </div>
    </div>
  );
};

export default TransactionsTab;

