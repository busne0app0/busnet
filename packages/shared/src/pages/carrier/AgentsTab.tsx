import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Handshake, Search, Filter, TrendingUp, Users, Target, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

const AgentsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState({ count: 0, tickets: 0, comm: 0 });

  useEffect(() => {
    if (!user) return;
    
    const fetchAgentsAndStats = async () => {
      try {
        const { data: agentsData } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'agent');
        
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('carrierId', user.uid)
          .eq('status', 'confirmed');
        
        let totalAgentTickets = 0;
        let totalAgentCommission = 0;
        let agentSales: Record<string, { tickets: number, revenue: number, commission: number }> = {};
        
        if (bookingsData) {
          bookingsData.forEach(b => {
             if (b.agentId) {
                if (!agentSales[b.agentId]) {
                   agentSales[b.agentId] = { tickets: 0, revenue: 0, commission: 0 };
                }
                const tix = b.passengers?.length || 1;
                const rev = (b.totalPrice || 0) / 42;
                const comm = rev * 0.10;
                
                agentSales[b.agentId].tickets += tix;
                agentSales[b.agentId].revenue += rev;
                agentSales[b.agentId].commission += comm;
                
                totalAgentTickets += tix;
                totalAgentCommission += comm;
             }
          });
        }
        
        if (agentsData) {
          const loadedAgents = agentsData.map((d) => {
            const sales = agentSales[d.uid] || { tickets: 0, revenue: 0, commission: 0 };
            return {
              id: `AG-${d.uid.slice(0,4).toUpperCase()}`,
              name: d.companyName || d.firstName || 'Агент',
              tickets: sales.tickets,
              revenue: sales.revenue,
              commission: sales.commission,
              rating: d.rating !== undefined ? d.rating : 4.8, 
              status: d.status === 'active' ? 'active' : 'review'
            };
          });
          
          loadedAgents.sort((a,b) => b.tickets - a.tickets);
          setAgents(loadedAgents);
          setStats({ count: loadedAgents.length, tickets: totalAgentTickets, comm: totalAgentCommission });
        }
      } catch (err) {
         console.error('Error fetching agent stats', err);
      }
    };
    
    fetchAgentsAndStats();
  }, [user]);

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-[#9c6fff] rounded-full shadow-[0_0_10px_rgba(156,111,255,0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">Агенти</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">Партнерська мережа та ефективність продажів</p>
        </div>
        <button 
          onClick={() => toast.success('Запит на партнерство надіслано в BUSNET Admin')}
          className="px-8 py-3 bg-[#9c6fff] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all shadow-[0_10px_20px_rgba(156,111,255,0.2)]"
        >
          Додати партнера
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Всього агентів', val: String(stats.count), icon: Users, color: '#9c6fff' },
          { label: 'Квитків від агентів', val: String(stats.tickets), icon: Target, color: '#00c8ff' },
          { label: 'Виплачено коміїсії', val: `€${stats.comm.toLocaleString('en-US')}`, icon: TrendingUp, color: '#00e676' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#111520] border border-white/5 p-8 rounded-[32px] group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                <stat.icon size={60} style={{ color: stat.color }} />
             </div>
             <p className="text-[10px] font-black uppercase text-[#5a6a85] tracking-widest mb-2">{stat.label}</p>
             <h3 className="text-3xl font-black text-white italic tracking-tighter">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="bg-[#111520] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
         <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left">
               <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Агент / Компанія</th>
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Квитків</th>
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Обіг (€)</th>
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Комісія (€)</th>
                     <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em] text-right">Статус</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {agents.map((agent, idx) => (
                     <tr key={idx} className="group hover:bg-white/[0.01] transition-all">
                        <td className="py-5 px-6">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#9c6fff]/10 border border-[#9c6fff]/20 flex items-center justify-center text-[#9c6fff]">
                                 <Handshake size={20} />
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-white tracking-tight">{agent.name}</p>
                                 <p className="text-[9px] text-[#3d5670] font-black uppercase tracking-widest mt-0.5">{agent.id}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-5 px-6 font-black text-white italic text-sm">{agent.tickets}</td>
                        <td className="py-5 px-6 font-black text-white italic text-sm">€{agent.revenue.toLocaleString()}</td>
                        <td className="py-5 px-6">
                           <span className="text-sm font-black text-[#00e676] italic">€{agent.commission.toLocaleString()}</span>
                           <p className="text-[9px] text-[#5a6a85] font-bold uppercase mt-0.5">10% ставка</p>
                        </td>
                        <td className="py-5 px-6 text-right">
                           <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${agent.status === 'active' ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                              {agent.status === 'active' ? 'Активний' : 'На перевірці'}
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

export default AgentsTab;

