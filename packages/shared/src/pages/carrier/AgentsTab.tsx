import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Handshake, Search, Filter, TrendingUp, Users, Target, ArrowUpRight, ShieldCheck, Plus } from 'lucide-react';
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
          .eq('carrier_id', user.uid)
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
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#A855F7] shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">АГЕНТИ</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">Партнерська мережа та ефективність продажів</p>
        </div>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(`https://busnet.ua/agent-invite/${user?.uid}`);
            toast.success('Посилання для запрошення партнерів скопійовано!');
          }}
          className="px-8 py-3.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        >
          <span className="hidden md:inline-block">ДОДАТИ ПАРТНЕРА</span>
          <Plus size={16} className="md:hidden" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'ВСЬОГО АГЕНТІВ', val: String(stats.count), icon: Users, color: '#A855F7' },
          { label: 'КВИТКІВ ВІД АГЕНТІВ', val: String(stats.tickets), icon: Target, color: '#0EA5E9' },
          { label: 'ВИПЛАЧЕНО КОМІСІЇ', val: `€${stats.comm.toLocaleString('en-US')}`, icon: TrendingUp, color: '#10B981' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1A2639]/30 border border-white/5 p-6 md:p-8 rounded-[32px] group relative overflow-hidden h-[120px] flex flex-col justify-between shadow-lg">
             <div className="absolute right-0 top-1/2 -translate-y-1/2 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <stat.icon size={80} style={{ color: stat.color }} strokeWidth={1} />
             </div>
             <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest z-10">{stat.label}</p>
             <h3 className="text-4xl font-black text-white italic tracking-tighter z-10">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto min-h-[400px]">
         <table className="min-w-[800px] w-full text-left border-separate border-spacing-y-2">
            <thead>
               <tr className="bg-[#1A2639]/30">
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest rounded-l-full">АГЕНТ / КОМПАНІЯ</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">КВИТКІВ</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">ОБІГ (€)</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">КОМІСІЯ (€)</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest text-right rounded-r-full">СТАТУС</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
               {agents.map((agent, idx) => (
                  <tr key={idx} className="group hover:bg-[#1A2639]/10 transition-all rounded-[16px]">
                     <td className="py-5 px-6 rounded-l-[16px]">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-[12px] bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                              <Handshake size={20} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white tracking-tight uppercase">{agent.name}</p>
                              <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-0.5">{agent.id}</p>
                           </div>
                        </div>
                     </td>
                     <td className="py-5 px-6 font-black text-white italic text-sm">{agent.tickets}</td>
                     <td className="py-5 px-6 font-black text-white italic text-sm">€{agent.revenue.toLocaleString()}</td>
                     <td className="py-5 px-6">
                        <span className="text-sm font-black text-[#10B981] italic">€{agent.commission.toLocaleString()}</span>
                        <p className="text-[9px] text-[#5A6A85] font-bold uppercase mt-1 tracking-widest">10% СТАВКА</p>
                     </td>
                     <td className="py-5 px-6 text-right rounded-r-[16px]">
                        <span className={`px-3 py-1.5 rounded-[10px] text-[8px] font-black uppercase tracking-widest border ${agent.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                           {agent.status === 'active' ? 'АКТИВНИЙ' : 'НА ПЕРЕВІРЦІ'}
                        </span>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default AgentsTab;

