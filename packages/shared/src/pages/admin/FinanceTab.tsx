import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, ArrowUpRight, ArrowDownLeft, 
  Clock, DollarSign, FileText, Download, 
  TrendingUp, Wallet, CheckCircle2, AlertTriangle,
  Zap, ShieldCheck, Activity, Globe
} from 'lucide-react';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import { supabase } from '@busnet/shared/supabase/config';

const FinanceTab: React.FC = () => {
  const { metrics, updateMetrics, addLog } = useAdminStore();
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      const { data: carrierBalances } = await supabase.from('balances').select('balance');
      if (carrierBalances) {
        const totalCarrier = carrierBalances.reduce((acc, d) => acc + (d.balance || 0), 0);
        updateMetrics({ carrierPayouts: totalCarrier });
      }
      const { data: agentBalances } = await supabase.from('agent_balances').select('balance');
      if (agentBalances) {
        const totalAgent = agentBalances.reduce((acc, d) => acc + (d.balance || 0), 0);
        updateMetrics({ agentPayouts: totalAgent });
      }
    };
    fetchBalances();
    const channel = supabase.channel(`finance_balances_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balances' }, fetchBalances)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_balances' }, fetchBalances)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [updateMetrics]);

  useEffect(() => {
    const fetchRecentTx = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(6);
      if (!error && data) {
        setRecentTx(data.map(d => ({
          id: `TX-${d.id.slice(0, 8)}`,
          type: d.status === 'cancelled' ? 'refund' : 'income',
          entity: d.passengers?.[0] ? `${d.passengers[0].firstName} ${d.passengers[0].lastName}` : 'Unit Passenger',
          amount: `€${((d.totalPrice || 0) / 42).toFixed(0)}`,
          status: d.status === 'confirmed' ? 'completed' : d.status,
          date: new Date(d.createdAt).toLocaleDateString('uk-UA')
        })));
      }
    };
    fetchRecentTx();
  }, []);

  const handlePayout = () => {
    const totalPayout = metrics.carrierPayouts + metrics.agentPayouts;
    if (totalPayout === 0) return;
    updateMetrics({ carrierPayouts: 0, agentPayouts: 0 });
    addLog({
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      actor: 'Root Admin',
      role: 'owner',
      action: 'PAYOUT',
      obj: `Partners Liquidity Release: €${totalPayout.toLocaleString()}`,
      icon: '💎'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* 🚀 Finance Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-8 bg-[#F59E0B] rounded-full shadow-[0_0_15px_#F59E0B]" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                Liquidity <span className="text-[#F59E0B]">Control</span>
              </h2>
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
             Financial Node Synchronization · Secure Ledger
           </p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 glass-mission-control rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all flex items-center gap-2">
             <FileText size={14} /> Intelligence Report
          </button>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePayout}
            disabled={metrics.carrierPayouts + metrics.agentPayouts === 0}
            className="px-8 py-3 bg-[#F59E0B] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-20"
          >
             Execute Payout Protocol
          </motion.button>
        </div>
      </div>

      {/* 💎 Liquidity Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <motion.div 
           whileHover={{ y: -5 }}
           className="glass-mission-control luminous-border p-8 relative overflow-hidden group"
         >
            <div className="absolute -top-10 -right-10 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700">
               <Wallet size={160} className="text-[#10B981]" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Total System Value</p>
            <h3 className="text-5xl font-black text-white italic tracking-tighter">€{metrics.gmv.toLocaleString()}</h3>
            <div className="mt-8 flex items-center gap-3 text-[#10B981]">
               <TrendingUp size={16} className="animate-bounce" />
               <span className="text-[10px] font-black uppercase tracking-widest">+18.4% Flux Accuracy</span>
            </div>
         </motion.div>

         <motion.div 
           whileHover={{ y: -5 }}
           className="glass-mission-control p-8 group relative"
         >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Partner Pending Yield</p>
            <h3 className="text-5xl font-black text-white italic tracking-tighter">€{(metrics.carrierPayouts + metrics.agentPayouts).toLocaleString()}</h3>
            <div className="mt-8 grid grid-cols-2 gap-4">
               <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Carriers</span>
                  <span className="text-sm font-black text-[#00D4FF]">€{metrics.carrierPayouts.toLocaleString()}</span>
               </div>
               <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Agents</span>
                  <span className="text-sm font-black text-[#8B5CF6]">€{metrics.agentPayouts.toLocaleString()}</span>
               </div>
            </div>
         </motion.div>

         <motion.div 
           whileHover={{ y: -5 }}
           className="glass-mission-control p-8 border-red-500/20 group"
         >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Refund Protocol Queue</p>
            <h3 className="text-5xl font-black text-red-500 italic tracking-tighter">€{metrics.refundsWaiting.toLocaleString()}</h3>
            <div className="mt-8 flex items-center gap-3 text-red-500/60">
               <AlertTriangle size={16} className="animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">4 Anomalies Detected</span>
            </div>
         </motion.div>
      </div>

      {/* 🧾 Transaction Ledger */}
      <div className="glass-mission-control rounded-[2.5rem] p-8">
         <div className="flex justify-between items-center mb-10">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 italic">
               <Activity size={18} className="text-[#F59E0B]" /> Recent Ledger Entries
            </h3>
            <div className="flex gap-4">
               <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-colors">
                  <Download size={18} />
               </button>
            </div>
         </div>

         <div className="space-y-3">
            {recentTx.map((tx, i) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/2 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/5 hover:border-[#F59E0B]/20 transition-all cursor-default"
              >
                <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                     tx.type === 'income' ? 'bg-[#10B981]/10 text-[#10B981] group-hover:shadow-[0_0_15px_#10B981/30]' : 
                     'bg-red-500/10 text-red-500 group-hover:shadow-[0_0_15px_#red-500/30]'
                   }`}>
                      {tx.type === 'income' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                   </div>
                   <div>
                      <h4 className="text-[14px] font-black text-white tracking-tight group-hover:text-[#F59E0B] transition-colors">{tx.entity}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{tx.id}</span>
                         <div className="w-1 h-1 bg-white/10 rounded-full" />
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{tx.date}</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-10">
                   <div className="text-right">
                      <div className={`text-xl font-black italic tracking-tighter ${tx.type === 'income' ? 'text-[#10B981]' : 'text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount}
                      </div>
                      <div className={`text-[8px] font-black uppercase tracking-[0.3em] mt-1.5 ${tx.status === 'completed' ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                         {tx.status}
                      </div>
                   </div>
                   <button className="w-11 h-11 rounded-xl bg-black border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-[#F59E0B]/40 transition-all">
                      <ShieldCheck size={18} />
                   </button>
                </div>
              </motion.div>
            ))}
         </div>
         
         <motion.button 
           whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
           className="w-full mt-8 py-5 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-[#F59E0B] transition-all"
         >
            Sync Archive Database →
         </motion.button>
      </div>
    </div>
  );
};

export default FinanceTab;
