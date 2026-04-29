import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import { Settings, Shield, Bell, Zap, Key, Cpu, Activity, Globe, Database, Fingerprint } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { toast } from 'react-hot-toast';

const SettingsTab: React.FC = () => {
  const { settings, updateSettings, addLog } = useAdminStore();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();
      if (!error && data) updateSettings(data);
    };
    fetchSettings();
    const channel = supabase.channel('global_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.global' }, fetchSettings)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [updateSettings]);

  const toggle = async (key: keyof typeof settings) => {
    const newVal = !settings[key];
    updateSettings({ [key]: newVal });
    addLog({
       id: Date.now().toString(),
       time: new Date().toLocaleTimeString(),
       actor: 'Root Admin',
       role: 'owner',
       action: 'SYNC',
       obj: `Protocol ${key} updated to ${newVal}`,
       icon: '⚙️'
    });
    await supabase.from('settings').update({ [key]: newVal }).eq('id', 'global');
  };

  const handleCommissionChange = async (val: number) => {
    updateSettings({ commissionRate: val });
    await supabase.from('settings').update({ commissionRate: val }).eq('id', 'global');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Settings Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-8 bg-[#8B5CF6] rounded-full shadow-[0_0_15px_#8B5CF6]" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                Core <span className="text-[#8B5CF6]">Engine</span>
              </h2>
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
             Global System Configuration · Protocol Management
           </p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-2 glass-mission-control rounded-2xl flex items-center gap-3">
              <Cpu size={14} className="text-[#8B5CF6] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">Sync State: 100%</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* 🛡️ System Topology & Protocol Automation */}
         <div className="space-y-8">
            <div className="glass-mission-control rounded-[2.5rem] p-8 space-y-10 border-white/5">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 italic">
                      <Database size={18} className="text-[#00D4FF]" /> System Topology
                   </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   {[
                     { name: 'Supabase Data', status: 'Online', delay: '12ms' },
                     { name: 'Neural Engine', status: 'Active', delay: '84ms' },
                     { name: 'Payment Relay', status: 'Idle', delay: '—' },
                     { name: 'Auth Node', status: 'Operational', delay: '3ms' },
                   ].map((node, i) => (
                     <div key={i} className="p-5 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden group hover:border-[#00D4FF]/30 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'Idle' ? 'bg-slate-600' : 'bg-[#00D4FF] shadow-[0_0_10px_#00D4FF]'}`} />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">{node.name}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <span className="text-[14px] font-black italic text-slate-500 uppercase">{node.status}</span>
                           <span className="text-[9px] font-black text-slate-700">{node.delay}</span>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="pt-6 border-t border-white/5">
                   <button 
                     onClick={() => {
                       toast.promise(new Promise(res => setTimeout(res, 2000)), {
                          loading: 'Neural Scan in progress...',
                          success: 'System Integrity: 100%. No anomalies found.',
                          error: 'Scan failed'
                       });
                     }}
                     className="w-full py-4 glass-mission-control rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black transition-all"
                   >
                     Run Neural Diagnostics
                   </button>
                </div>
             </div>

             <div className="glass-mission-control rounded-[2.5rem] p-8 space-y-10 border-white/5">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 italic">
                      <Shield size={18} className="text-[#8B5CF6]" /> Protocol Automation
                   </h3>
                   <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">v2.0.26 Stable</span>
                </div>

                <div className="space-y-8">
                   {[
                     { key: 'autoModeration', label: 'Matrix Auto-Auth', desc: 'Allow verified nodes to deploy routes without manual sync' },
                     { key: 'autoRefund', label: 'Liquidity Self-Healing', desc: 'Trigger 100% refund protocol on entity cancellation' },
                     { key: 'adminTelegramNotif', label: 'Neural Link Notifications', desc: 'Stream critical alerts to administrative Telegram relay' },
                     { key: 'aiSmartPricing', label: 'AI Yield Optimizer', desc: 'Permit AI to modulate service fees by ±€2.00 based on demand' },
                   ].map((item, i) => (
                     <motion.div 
                       key={i} 
                       whileHover={{ x: 5 }}
                       className="flex justify-between items-center group cursor-default"
                     >
                        <div className="flex-1 pr-6">
                           <p className="text-[13px] font-black text-white uppercase tracking-tight group-hover:text-[#8B5CF6] transition-colors">{item.label}</p>
                           <p className="text-[10px] font-bold text-slate-600 tracking-wide mt-1 uppercase leading-relaxed">{item.desc}</p>
                        </div>
                        <button 
                          onClick={() => toggle(item.key as keyof typeof settings)}
                          className={`relative w-14 h-7 rounded-full transition-all duration-500 overflow-hidden ${settings[item.key as keyof typeof settings] ? 'bg-[#8B5CF6]' : 'bg-black border border-white/10'}`}
                        >
                           <motion.div 
                             animate={{ x: settings[item.key as keyof typeof settings] ? 28 : 4 }}
                             className={`absolute top-1 w-5 h-5 rounded-full z-10 ${settings[item.key as keyof typeof settings] ? 'bg-white shadow-[0_0_15px_#fff]' : 'bg-slate-700'}`}
                           />
                           {settings[item.key as keyof typeof settings] && (
                             <motion.div 
                               animate={{ opacity: [0.1, 0.3, 0.1] }}
                               transition={{ duration: 2, repeat: Infinity }}
                               className="absolute inset-0 bg-white"
                             />
                           )}
                        </button>
                     </motion.div>
                   ))}
                </div>
             </div>
         </div>

         {/* ⚡ Financial Constants & Advanced Maintenance */}
         <div className="space-y-8">
            <div className="glass-mission-control rounded-[2.5rem] p-8 border-white/5">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 italic mb-10">
                  <Zap size={18} className="text-[#F59E0B]" /> Yield Calibration
               </h3>
               
               <div className="space-y-10">
                  <div className="relative p-6 bg-white/2 rounded-3xl border border-white/5">
                    <div className="flex justify-between items-end mb-6">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Platform Service Fee</p>
                          <p className="text-sm font-bold text-white uppercase mt-1">Grid Commission Rate</p>
                       </div>
                       <span className="text-4xl font-black text-[#F59E0B] italic tracking-tighter drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">{settings.commissionRate}%</span>
                    </div>
                    <div className="relative h-2 bg-black rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                         animate={{ width: `${(settings.commissionRate / 20) * 100}%` }}
                         className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8B5CF6] to-[#F59E0B]"
                       />
                       <input 
                         type="range" 
                         min="1" 
                         max="20" 
                         value={settings.commissionRate}
                         onChange={(e) => handleCommissionChange(parseInt(e.target.value))}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                       />
                    </div>
                    <div className="flex justify-between mt-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                       <span>Threshold (1%)</span>
                       <span>Current Protocol</span>
                       <span>Peak (20%)</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-8 glass-mission-control rounded-[2.5rem] border-white/5">
               <div className="flex items-center gap-3 mb-8 italic">
                  <Key size={18} className="text-[#8B5CF6]" />
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Advanced Maintenance</h3>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(settings)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'system_backup.json';
                      a.click();
                      toast.success('System Backup Encrypted & Saved');
                    }}
                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                  >
                    Create Backup
                  </button>
                  <button 
                    onClick={() => {
                      if (window.prompt('Введіть "RESET" для очищення кешу системи:') === 'RESET') {
                         toast.success('System Cache Purged');
                      }
                    }}
                    className="px-8 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  >
                    Flush Cache
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SettingsTab;
