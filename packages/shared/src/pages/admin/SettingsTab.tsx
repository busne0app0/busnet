import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import { Settings, Shield, Bell, Zap, Key, Cpu, Activity, Globe, Database, Fingerprint } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';

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
         {/* 🛡️ Protocol Automation */}
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

         {/* ⚡ Financial Constants & API Matrix */}
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

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Database size={14} /> Integrated API Nodes
                     </p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-5 glass-mission-control rounded-2xl border-white/5 group hover:border-[#00D4FF]/30 transition-all cursor-default">
                           <div className="w-10 h-10 bg-[#00D4FF]/10 text-[#00D4FF] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Bell size={18} />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">Notification Node</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                 <p className="text-[8px] font-black text-[#10B981] uppercase tracking-widest">OneSignal Active</p>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 p-5 glass-mission-control rounded-2xl border-white/5 group hover:border-[#8B5CF6]/30 transition-all cursor-default">
                           <div className="w-10 h-10 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Fingerprint size={18} />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">Auth Matrix</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                 <p className="text-[8px] font-black text-[#10B981] uppercase tracking-widest">Supabase Secured</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="glass-mission-control rounded-[2.5rem] p-8 border-white/5 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10 flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white">
                     <Activity size={24} />
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Neural System Diagnostics</h4>
                     <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Initialize deep scan of global operational parameters</p>
                  </div>
                  <button className="ml-auto px-6 py-2 glass-mission-control rounded-xl text-[10px] font-black uppercase tracking-widest text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black transition-all">
                     Run Scan
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SettingsTab;
