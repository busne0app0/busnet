import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handshake, Search, Filter, TrendingUp, Users, Target, ArrowUpRight, ShieldCheck, Plus, X, Link, Copy, Check, MessageCircle, Send as SendIcon, QrCode, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

// Lightweight SVG QR-code placeholder — shows a scannable-looking pattern
// In production, swap with: import QRCode from 'react-qr-code'
function QRDisplay({ value }: { value: string }) {
  if (!value) return null;
  // Generate a simple visual that looks like a QR code
  const seed = value.slice(-16);
  const grid = Array.from({ length: 11 }, (_, r) =>
    Array.from({ length: 11 }, (_, c) => {
      // Corner squares pattern
      if ((r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3)) return true;
      const idx = (r * 11 + c) % seed.length;
      return seed.charCodeAt(idx) % 2 === 0;
    })
  );
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 bg-white rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] border-2 border-[#A855F7]/30">
        <svg width="132" height="132" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
          {grid.map((row, r) =>
            row.map((filled, c) =>
              filled ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0B1221" /> : null
            )
          )}
        </svg>
      </div>
      <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest text-center">Скануйте QR для переходу</p>
    </div>
  );
}

const AgentsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState({ count: 0, tickets: 0, comm: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedLinkId, setGeneratedLinkId] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const generateInviteLink = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('referral_links')
        .insert({ owner_id: user.uid, target_role: 'agent', status: 'active' })
        .select()
        .single();
        
      if (error) throw error;
      const link = `https://busnet.ua/invite/agent/${data.id}`;
      setGeneratedLink(link);
      setGeneratedLinkId(data.id);
    } catch (err) {
      console.error('Error generating link', err);
      setGeneratedLink(`https://busnet.ua/invite/agent/${user.uid}`);
    }
  };

  const deactivateLink = async () => {
    if (!generatedLinkId) return;
    await supabase.from('referral_links').update({ status: 'inactive' }).eq('id', generatedLinkId);
    setGeneratedLink('');
    setGeneratedLinkId('');
    setShowQR(false);
    toast('🔴 Посилання деактивовано');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    toast.success('Лінк скопійовано!');
    setTimeout(() => setIsCopied(false), 2000);
  };

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
            setIsModalOpen(true);
            if (!generatedLink) generateInviteLink();
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-[#0B1221] rounded-[24px] border border-white/5">
            <Users className="text-[#1A2639]" size={40} />
            <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest">АГЕНТІВ НЕМАЄ</p>
          </div>
        ) : agents.map((agent, idx) => (
          <div key={idx} className="bg-[#0B1221] border border-white/5 rounded-[20px] p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                  <Handshake size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight uppercase">{agent.name}</p>
                  <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-0.5">{agent.id}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-[10px] text-[8px] font-black uppercase border ${agent.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                {agent.status === 'active' ? 'АКТИВНИЙ' : 'ПЕРЕВІРКА'}
              </span>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-white/5">
              <div>
                <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest">КВИТКІВ</p>
                <p className="text-sm font-black text-white italic">{agent.tickets}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest">ОБІГ</p>
                <p className="text-sm font-black text-white italic">€{agent.revenue.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest">КОМІСІЯ</p>
                <p className="text-sm font-black text-[#10B981] italic">€{agent.commission.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto min-h-[400px]">
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

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 max-md:backdrop-blur-none md:backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-[#0B1221] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 bg-[#1A2639]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                  <Link size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">ЗАПРОСИТИ АГЕНТА</h3>
                  <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-0.5">Рекрутинг партнерів</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <p className="text-xs text-white/60 leading-relaxed font-medium">
                Надішліть це унікальне посилання агенту. Після реєстрації він автоматично отримає доступ до продажу ваших рейсів.
              </p>

              {/* Link Input Box */}
              <div className="p-1 rounded-2xl bg-[#050C15] border border-white/5 flex items-center gap-2">
                <input 
                  readOnly 
                  value={generatedLink || 'Генерація посилання...'} 
                  className="bg-transparent border-none text-white text-xs font-mono px-4 py-3 w-full outline-none opacity-70"
                />
                <button 
                  onClick={copyToClipboard}
                  className={`p-3 rounded-xl flex items-center justify-center transition-all ${isCopied ? 'bg-[#10B981] text-black' : 'bg-[#1A2639] text-white hover:bg-white/20'}`}
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              {/* QR Code toggle */}
              {generatedLink && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowQR(p => !p)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] text-[10px] font-black uppercase tracking-widest hover:bg-[#A855F7]/20 transition-all"
                  >
                    <QrCode size={13} /> {showQR ? 'Сховати QR' : 'Показати QR-код'}
                  </button>
                  <AnimatePresence>
                    {showQR && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden flex justify-center"
                      >
                        <QRDisplay value={generatedLink} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Deactivate link */}
              {generatedLinkId && (
                <button
                  onClick={deactivateLink}
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] text-white/30 hover:text-red-400 font-black uppercase tracking-widest transition-colors"
                >
                  <Ban size={11} /> Деактивувати це посилання
                </button>
              )}

              {/* Quick Share Buttons */}
              <div className="space-y-3">
                <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest text-center">Швидке надсилання</p>
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={`https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${encodeURIComponent('Вітаю! Запрошую стати офіційним агентом з продажу моїх квитків на BUSNET.')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2AABEE]/10 text-[#2AABEE] border border-[#2AABEE]/20 hover:bg-[#2AABEE]/20 transition-all"
                  >
                    <SendIcon size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Telegram</span>
                  </a>
                  <a 
                    href={`viber://forward?text=${encodeURIComponent('Вітаю! Запрошую стати офіційним агентом з продажу моїх квитків на BUSNET: ' + generatedLink)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7360F2]/10 text-[#7360F2] border border-[#7360F2]/20 hover:bg-[#7360F2]/20 transition-all"
                  >
                    <MessageCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Viber</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AgentsTab;

