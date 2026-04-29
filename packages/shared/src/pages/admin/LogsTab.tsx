import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, Shield, Briefcase, Bus, Trash2, Database, Terminal, Radio, Activity } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';

const LogsTab: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('time', { ascending: false })
        .limit(100);
      if (!error && data) setLogs(data);
    };
    fetchLogs();
    const channel = supabase.channel(`audit_logs_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, fetchLogs)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'agent': return 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20';
      case 'carrier': return 'text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/20';
      default: return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Audit Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-8 bg-slate-500 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                Audit <span className="text-slate-400">Stream</span>
              </h2>
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-6 font-mono">
             Raw Operational Ledger · Read Access Level 4
           </p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-2 glass-mission-control rounded-2xl flex items-center gap-3">
              <Terminal size={14} className="text-[#10B981]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white font-mono">Terminal Active</span>
           </div>
        </div>
      </div>

      {/* 📜 Neural Stream Ledger */}
      <div className="glass-mission-control rounded-[2.5rem] overflow-hidden border-white/5">
         <div className="overflow-x-auto no-scrollbar px-6 pb-6 pt-4">
            <table className="w-full text-left border-separate border-spacing-y-1">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono">Timestamp</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono text-center">Sigil</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono">Actor Entity</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono">Protocol Action</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono">Object Reference</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {logs.map((log, idx) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group"
                  >
                    <td className="px-6 py-3 bg-white/2 group-hover:bg-white/5 transition-all rounded-l-xl border-y border-l border-white/5">
                       <span className="text-[10px] font-black text-slate-400 group-hover:text-white transition-colors tracking-widest">{log.time}</span>
                    </td>
                    <td className="px-6 py-3 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5 text-center text-lg">
                       {log.icon || '📝'}
                    </td>
                    <td className="px-6 py-3 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                      <div className="flex items-center gap-3">
                         <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getRoleBadge(log.role)}`}>
                            {log.role}
                         </div>
                         <span className="text-[11px] font-black text-white uppercase italic tracking-tighter">{log.actor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                       <span className="text-[9px] font-black text-[#00D4FF] uppercase bg-[#00D4FF]/10 px-3 py-1 rounded-full border border-[#00D4FF]/20">
                         {log.action}
                       </span>
                    </td>
                    <td className="px-6 py-3 bg-white/2 group-hover:bg-white/5 transition-all rounded-r-xl border-y border-r border-white/5">
                       <div className="flex items-center gap-2 text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
                          <span className="font-black uppercase">{log.obj}</span>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            
            {logs.length === 0 && (
              <div className="py-24 text-center">
                 <Radio size={32} className="text-slate-700 mx-auto mb-4 animate-pulse" />
                 <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">Listening for Neural Pulse...</p>
              </div>
            )}
         </div>
      </div>
      
      {/* 🚀 System Activity Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="glass-mission-control rounded-[2.5rem] p-8 border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 scale-150 rotate-12 transition-all">
               <Activity size={100} className="text-[#10B981]" />
            </div>
            <div className="relative z-10 space-y-4">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white italic">Neural Link Integrity</h3>
               <div className="flex items-center gap-6">
                  <div className="text-4xl font-black text-[#10B981] italic tracking-tighter">99.9%</div>
                  <div className="flex-1 space-y-2">
                     <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          animate={{ width: '99.9%' }}
                          className="h-full bg-[#10B981] shadow-[0_0_10px_#10B981]"
                        />
                     </div>
                     <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Real-time Data Throughput Nominal</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="glass-mission-control rounded-[2.5rem] p-8 border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 scale-150 rotate-12 transition-all">
               <Database size={100} className="text-[#00D4FF]" />
            </div>
            <div className="relative z-10 space-y-4">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white italic">Log Retention Matrix</h3>
               <div className="flex items-center gap-6">
                  <div className="text-4xl font-black text-[#00D4FF] italic tracking-tighter">4.2GB</div>
                  <div className="flex-1 space-y-2">
                     <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          animate={{ width: '65%' }}
                          className="h-full bg-[#00D4FF] shadow-[0_0_10px_#00D4FF]"
                        />
                     </div>
                     <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">65% Node Capacity Occupied</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default LogsTab;
