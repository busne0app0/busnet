import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, Handshake, Mail, DollarSign, Award, Target, Trash2 } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';

const AgentsTab: React.FC = () => {
  const { addLog } = useAdminStore();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'agent');

      if (error) {
        console.error('Error fetching agents:', error);
      } else if (isMounted) {
        setAgents(data || []);
      }
      if (isMounted) setLoading(false);
    };

    fetchAgents();

    const channel = supabase
      .channel(`agents_changes_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: 'role=eq.agent' }, () => {
        if (isMounted) fetchAgents();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (id: string, name: string) => {
    const nextStatus: any = { 'top': 'active', 'active': 'blocked', 'blocked': 'active' };
    const current = agents.find(a => a.id === id)?.status || 'active';

    try {
      const { error } = await supabase
        .from('users')
        .update({ status: nextStatus[current] })
        .eq('id', id);

      if (error) throw error;

      addLog({
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Admin',
        role: 'owner',
        action: 'UPDATE',
        obj: `Агент ${name} статус → ${nextStatus[current]}`,
        icon: '👤'
      });
    } catch (e) {
      console.error('Error updating agent:', e);
      alert('Помилка оновлення');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Ви впевнені, що хочете видалити агента ${name}? Це незворотна операція.`)) {
       const uid = agents.find(a => a.id === id || a.uid === id)?.uid || id;
       await useAdminStore.getState().deleteUser(uid);
    }
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-6 bg-[#9c6fff] rounded-full shadow-[0_0_10px_#9c6fff]" />
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-sans">Агентська мережа</h2>
           </div>
           <p className="text-[#7a9ab5] text-sm font-medium tracking-wide ml-5">Комісії, аналітика та управління партнерами з продажу</p>
        </div>
        <button className="px-8 py-3 bg-[#9c6fff] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white hover:text-black transition-all shadow-[0_10px_20px_rgba(156,111,255,0.2)]">
          + Додати агента
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Агентів', val: agents.length, icon: Handshake, color: '#9c6fff' },
           { label: 'До виплати', val: '€3,180', icon: DollarSign, color: '#00e676' },
           { label: 'Продажів', val: '€28,540', icon: Target, color: '#ff9800' },
           { label: 'Частка', val: '59.1%', icon: Award, color: '#00c8ff' },
         ].map((s, i) => (
           <div key={i} className="bg-[#0f1520] border border-[#1c2e48] rounded-3xl p-6 hover:border-white/10 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-2xl bg-[#070912] border border-[#1c2e48] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <s.icon size={20} style={{ color: s.color }} />
                 </div>
              </div>
              <div className="text-2xl font-black text-white italic tracking-tighter mb-1">{s.val}</div>
              <div className="text-[10px] font-black text-[#3d5670] uppercase tracking-widest">{s.label}</div>
           </div>
         ))}
      </div>

      <div className="bg-[#0f1520] border border-[#1c2e48] rounded-3xl overflow-hidden shadow-2xl">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-[800px] w-full text-left">
              <thead>
                <tr className="bg-[#151e2e]/30 border-b border-[#1c2e48]">
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Агент</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Регіон</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Продажів</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Зароблено</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Комісія</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Статус</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em] text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2e48]/50">
                {agents.map((a, idx) => {
                  const name = a.companyName || a.firstName ? `${a.firstName} ${a.lastName}` : a.email.split('@')[0];
                  const initial = name.slice(0, 2).toUpperCase();
                  return (
                  <motion.tr 
                    key={a.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-5 px-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1c2e48] to-[#070912] border border-[#1c2e48] flex items-center justify-center text-[10px] font-black text-[#9c6fff]">
                             {initial}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white tracking-tight">{name}</p>
                             <p className="text-[9px] text-[#3d5670] font-black uppercase mt-0.5">agent_id: {a.id.substring(0,8)}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-6 text-xs font-bold text-[#7a9ab5]">{a.region || 'Онлайн'}</td>
                    <td className="py-5 px-6 font-black text-white italic">{a.sales || 0}</td>
                    <td className="py-5 px-6 font-black text-[#00e676]">€{a.earned || 0}</td>
                    <td className="py-5 px-6">
                       <span className="px-2 py-0.5 bg-[#9c6fff]/10 text-[#9c6fff] text-[9px] font-black rounded-lg border border-[#9c6fff]/20">{a.commission || 10}%</span>
                    </td>
                    <td className="py-5 px-6">
                       <button 
                         onClick={() => handleStatusChange(a.id, name)}
                         className={`
                           px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border transition-all hover:scale-105 active:scale-95
                           ${a.status === 'top' ? 'bg-[#ffd600]/10 text-[#ffd600] border-[#ffd600]/20' : 
                             a.status === 'active' || !a.status ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 
                             'bg-[#f44336]/10 text-[#f44336] border border-[#f44336]/20'}
                         `}
                       >
                          {a.status === 'top' ? '★ TOP' : a.status === 'active' || !a.status ? '● Активний' : '✕ Блокований'}
                       </button>
                    </td>
                    <td className="py-5 px-6 text-right">
                       <div className="flex justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                          <button className="w-8 h-8 rounded-lg bg-[#151e2e] border border-[#1c2e48] flex items-center justify-center text-[#7a9ab5] hover:text-[#00c8ff] transition-all">
                             <Mail size={14} />
                          </button>
                          <button 
                             onClick={() => handleDelete(a.id, name)}
                             className="w-8 h-8 rounded-lg bg-[#151e2e] border border-rose-500/20 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                          >
                             <Trash2 size={14} />
                          </button>
                          <button className="w-8 h-8 rounded-lg bg-[#151e2e] border border-[#1c2e48] flex items-center justify-center text-[#7a9ab5] hover:text-white transition-all">
                             <MoreVertical size={14} />
                          </button>
                       </div>
                    </td>
                  </motion.tr>
                )})}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AgentsTab;

