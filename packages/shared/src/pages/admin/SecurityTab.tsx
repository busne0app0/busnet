import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Smartphone, Monitor, Globe, XCircle, ShieldCheck, Activity } from 'lucide-react';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import { supabase } from '@busnet/shared/supabase/config';

const SecurityTab: React.FC = () => {
  const { addLog } = useAdminStore();
  const [blockedIps, setBlockedIps] = useState<{ip: string, reason: string, date: string}[]>([]);

  useEffect(() => {
    const fetchSecuritySettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'security')
        .single();
      
      if (!error && data?.data?.blockedIps) {
        setBlockedIps(data.data.blockedIps);
      }
    };

    fetchSecuritySettings();

    const channel = supabase.channel('security_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.security' }, fetchSecuritySettings)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTerminateSession = (device: string) => {
    addLog({
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: 'Admin',
      role: 'owner',
      action: 'SECURITY',
      obj: `Сесію завершено: ${device}`,
      icon: '🛡️'
    });
  };

  const handleUnblockIp = async (ip: string) => {
    const newIps = blockedIps.filter(b => b.ip !== ip);
    await supabase.from('settings').upsert({ id: 'security', data: { blockedIps: newIps } });
    
    addLog({
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: 'Admin',
      role: 'owner',
      action: 'SECURITY',
      obj: `IP розблоковано: ${ip}`,
      icon: '🔓'
    });
  };

  const handleAddBlock = async () => {
    const ip = prompt('Введіть IP для блокування:');
    if (!ip) return;
    const newIps = [...blockedIps, { ip, reason: 'Manual block', date: new Date().toLocaleDateString('uk-UA') }];
    await supabase.from('settings').upsert({ id: 'security', data: { blockedIps: newIps } });
  };

  const sessions = [
    { id: 1, device: 'Chrome / Windows 11', ip: '178.150.XX.XX', location: 'Київ, UA', time: 'Зараз', current: true, icon: Monitor },
    { id: 2, device: 'iOS / iPhone 15 Pro', ip: '91.240.XX.XX', location: 'Львів, UA', time: '2 год тому', current: false, icon: Smartphone },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-[#00e676] rounded-full shadow-[0_0_10px_#00e676]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-sans">Безпека системи</h2>
          </div>
          <p className="text-[#7a9ab5] text-sm font-medium tracking-wide ml-5">Управління доступом та захист платформи</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Рівень фроду', val: '0.3%', sub: '↓ Низький', color: '#00e676' },
           { label: 'Uptime API', val: '99.9%', sub: '✓ Стабільно', color: '#00c8ff' },
           { label: 'Блок IP (24г)', val: '12', sub: 'Загрози відбито', color: '#ff9800' },
           { label: '2FA Статус', val: 'Active', sub: 'God Mode On', color: '#9c6fff' },
         ].map((s, i) => (
           <div key={i} className="bg-[#0f1520] border border-[#1c2e48] rounded-3xl p-6 group hover:border-[#ddeeff]/10 transition-colors">
              <div className="text-[10px] font-black text-[#3d5670] uppercase tracking-widest mb-2">{s.label}</div>
              <div className="text-2xl font-black text-white italic tracking-tight">{s.val}</div>
              <div className="text-[10px] font-bold mt-1" style={{ color: s.color }}>{s.sub}</div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#3d5670] px-5 flex items-center gap-2 italic">
               <Activity size={16} /> Активні сесії
            </h3>
            <div className="bg-[#0f1520] border border-[#1c2e48] rounded-[32px] overflow-hidden">
               {sessions.map((s, i) => (
                 <div key={i} className="p-6 border-b border-[#1c2e48] last:border-0 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-[#070912] border border-[#1c2e48] flex items-center justify-center text-[#7a9ab5] group-hover:text-[#00c8ff] transition-colors">
                          <s.icon size={22} />
                       </div>
                       <div>
                          <div className="flex items-center gap-3">
                             <p className="text-sm font-bold text-white">{s.device}</p>
                             {s.current && <span className="px-2 py-0.5 bg-[#00e676]/10 text-[#00e676] text-[8px] font-black uppercase rounded">Поточна</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-1 font-mono text-[10px] text-[#3d5670]">
                             <span className="flex items-center gap-1 text-[#7a9ab5]"><Globe size={10} /> {s.ip}</span>
                             <span className="flex items-center gap-1"><Lock size={10} /> {s.location}</span>
                             <span>{s.time}</span>
                          </div>
                       </div>
                    </div>
                    {!s.current && (
                      <button 
                        onClick={() => handleTerminateSession(s.device)}
                        className="px-4 py-2 border border-[#f44336]/20 text-[#f44336] text-[10px] font-black uppercase rounded-lg hover:bg-[#f44336] hover:text-white transition-all"
                      >
                        Завершити
                      </button>
                    )}
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#3d5670] px-5 flex items-center gap-2 italic">
               <XCircle size={16} /> Blocked IPs
            </h3>
            <div className="bg-[#0f1520] border border-[#1c2e48] rounded-[32px] p-6 space-y-4">
               {blockedIps.map((b, i) => (
                 <div key={i} className="flex justify-between items-center bg-[#070912] p-4 rounded-2xl border border-rose-500/10">
                    <div>
                       <p className="font-mono text-xs text-rose-500 font-bold">{b.ip}</p>
                       <p className="text-[9px] text-[#3d5670] uppercase font-black mt-1">{b.reason}</p>
                    </div>
                    <button 
                      onClick={() => handleUnblockIp(b.ip)}
                      className="text-[10px] font-black text-[#00c8ff] uppercase hover:underline"
                    >
                      Розблокувати
                    </button>
                 </div>
               ))}
               <button onClick={handleAddBlock} className="w-full py-3 border border-dashed border-[#1c2e48] rounded-2xl text-[10px] font-black text-[#3d5670] uppercase hover:border-[#00c8ff]/50 hover:text-[#00c8ff] transition-all">
                  + Додати IP в блок
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SecurityTab;
