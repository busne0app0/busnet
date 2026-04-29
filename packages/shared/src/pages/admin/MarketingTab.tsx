import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, Send, Rocket, Target, 
  BarChart3, Users, Zap, Calendar,
  MoreVertical, Plus, CheckCircle2
} from 'lucide-react';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import { supabase } from '@busnet/shared/supabase/config';
import toast from 'react-hot-toast';

const MarketingTab: React.FC = () => {
  const { addLog } = useAdminStore();
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*');
      
      if (!error && data) {
        setCampaigns(data);
      }
    };

    fetchCampaigns();

    const channel = supabase.channel('marketing_campaigns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, fetchCampaigns)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateCampaign = async () => {
    const name = prompt('Назва нової кампанії:');
    if (!name) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({
          name,
          type: 'Push',
          reach: '0',
          conv: '0%',
          status: 'active',
          spend: '€0',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      toast.success('Кампанія створена успішно!');
      addLog({
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Admin',
        role: 'owner',
        action: 'MARKETING',
        obj: `Нова кампанія: ${name}`,
        icon: '🚀'
      });
    } catch (e) {
      toast.error('Помилка при створенні');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-6 bg-[#ff4081] rounded-full shadow-[0_0_10px_#ff4081]" />
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-sans">Маркетинг & Промо</h2>
           </div>
           <p className="text-[#7a9ab5] text-sm font-medium tracking-wide ml-5">Керування кампаніями, розсилками та лояльністю</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleCreateCampaign}
            className="px-6 py-2.5 bg-[#ff4081] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all shadow-lg flex items-center gap-2"
          >
             <Plus size={14} /> Нова кампанія
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Загальне охоплення', val: '42.8k', icon: Users, color: '#00c8ff' },
           { label: 'Середня конверсія', val: '8.4%', icon: Target, color: '#00e676' },
           { label: 'Активні промокоди', val: '12', icon: Zap, color: '#ffd600' },
         ].map((s, i) => (
           <div key={i} className="bg-[#0f1520] border border-[#1c2e48] rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                 <s.icon size={120} style={{ color: s.color }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3d5670] mb-2">{s.label}</p>
              <h3 className="text-3xl font-black text-white italic tracking-tighter">{s.val}</h3>
           </div>
         ))}
      </div>

      <div className="bg-[#0f1520] border border-[#1c2e48] rounded-[2.5rem] p-8 shadow-2xl">
         <div className="flex justify-between items-center mb-10">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 italic">
               <Megaphone size={18} className="text-[#ff4081]" /> Активні кампанії
            </h3>
         </div>

         <div className="space-y-4">
            {campaigns.map((cmp, i) => (
              <motion.div 
                key={cmp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#151e2e]/30 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-[#ff4081]/30 transition-colors"
              >
                <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 text-white/50`}>
                      {cmp.type === 'Email' ? <Send size={20} /> : cmp.type === 'Push' ? <Zap size={20} /> : <Megaphone size={20} />}
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{cmp.name}</h4>
                      <p className="text-[9px] text-[#3d5670] font-black uppercase mt-1 tracking-widest">{cmp.type} · Охоплення: {cmp.reach}</p>
                   </div>
                </div>

                <div className="flex items-center gap-12">
                   <div className="text-center">
                      <p className="text-[9px] font-black text-[#3d5670] uppercase mb-1">Конверсія</p>
                      <p className="text-sm font-black text-[#00e676] italic">{cmp.conv}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-black text-[#3d5670] uppercase mb-1">Статус</p>
                      <div className="flex items-center gap-1.5 ring-offset-2 ring-1 ring-[#00e676]/20 px-2 rounded-full">
                         <div className={`w-1.5 h-1.5 rounded-full ${cmp.status === 'active' ? 'bg-[#00e676]' : 'bg-[#ff9800]'}`} />
                         <span className="text-[8px] font-black uppercase tracking-tighter text-white">{cmp.status === 'active' ? 'Live' : 'Paused'}</span>
                      </div>
                   </div>
                   <button className="w-10 h-10 rounded-xl bg-[#070912] border border-[#1c2e48] flex items-center justify-center text-[#7a9ab5] hover:text-white transition-all">
                      <MoreVertical size={16} />
                   </button>
                </div>
              </motion.div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default MarketingTab;
