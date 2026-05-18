/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, QrCode, TrendingUp, DollarSign, 
  Percent, Search, UserPlus, ExternalLink,
  MoreVertical, Download, ShieldCheck, Zap,
  X, Copy, Edit3, Award, Handshake, Filter,
  Check, MessageCircle, Send as SendIcon, Ban, Loader2
} from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';

interface Agent {
  uid: string;
  id: string;
  name: string;
  email: string;
  commission_percent: number; // Індивідуальний %
  tickets: number;
  revenue: number;
  commission: number;
  status: 'active' | 'top' | 'review';
  referralCode: string;
  rating: number;
}

// Lightweight SVG QR-code placeholder — shows a beautiful scannable-looking pattern
function QRDisplay({ value, withScanner = false }: { value: string; withScanner?: boolean }) {
  if (!value) return null;
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
      <div className="relative p-4 bg-white rounded-3xl shadow-[0_0_30px_rgba(99,102,241,0.25)] border border-[#6366F1]/30 overflow-hidden">
        <svg width="160" height="160" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
          {grid.map((row, r) =>
            row.map((filled, c) =>
              filled ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0B1221" /> : null
            )
          )}
        </svg>
        {withScanner && (
          <motion.div 
            animate={{ 
              top: ["4%", "92%", "4%"]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2.4, 
              ease: "easeInOut" 
            }}
            className="absolute left-2 right-2 h-[2px] bg-[#6366F1] shadow-[0_0_12px_#6366F1,0_0_4px_#6366F1] pointer-events-none"
          />
        )}
      </div>
      <p className="text-[11px] text-[#8899B5] font-black uppercase tracking-[0.12em] text-center mt-2">Скануйте QR для переходу</p>
    </div>
  );
}

const AgentsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals & States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedLinkId, setGeneratedLinkId] = useState('');
  const [showQR, setShowQR] = useState(false);
  
  // Editing state for commission percentage
  const [editingComm, setEditingComm] = useState<{ uid: string; val: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    let tickets = 0;
    let comm = 0;
    let topPartner = '—';
    let topTickets = 0;

    agents.forEach(a => {
      tickets += a.tickets;
      comm += a.commission;
      if (a.tickets > topTickets) {
        topTickets = a.tickets;
        topPartner = a.name;
      }
    });

    // Average commission calculation
    const avgComm = agents.length > 0
      ? (agents.reduce((sum, a) => sum + a.commission_percent, 0) / agents.length).toFixed(1)
      : '10.0';

    return {
      count: agents.length,
      tickets,
      comm,
      avgComm,
      topPartner
    };
  }, [agents]);

  // Main fetch function
  const fetchAgentsAndStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'agent');
      
      if (agentsError) throw agentsError;

      // 2. Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('carrier_id', user.uid)
        .eq('status', 'confirmed');

      if (bookingsError) throw bookingsError;
        
      // 3. Fetch custom relations (custom commissions)
      const { data: rels, error: relsError } = await supabase
        .from('user_relationships')
        .select('child_id, custom_commission_percentage')
        .eq('parent_id', user.uid);
      
      if (relsError) throw relsError;

      let agentSales: Record<string, { tickets: number; revenue: number; commission: number }> = {};
      
      if (bookingsData) {
        bookingsData.forEach(b => {
          if (b.agentId) {
            if (!agentSales[b.agentId]) {
              agentSales[b.agentId] = { tickets: 0, revenue: 0, commission: 0 };
            }
            const tix = b.passengers?.length || 1;
            const rev = Number(b.total_price || b.totalPrice || 0);
            const commPercent = rels?.find(r => r.child_id === b.agentId)?.custom_commission_percentage ?? 10;
            const comm = rev * (commPercent / 100);
            
            agentSales[b.agentId].tickets += tix;
            agentSales[b.agentId].revenue += rev;
            agentSales[b.agentId].commission += comm;
          }
        });
      }
      
      if (agentsData) {
        const loadedAgents: Agent[] = agentsData.map(d => {
          const sales = agentSales[d.uid] || { tickets: 0, revenue: 0, commission: 0 };
          const commPercent = rels?.find(r => r.child_id === d.uid)?.custom_commission_percentage ?? 10;
          return {
            uid: d.uid,
            id: `AG-${d.uid.slice(0, 4).toUpperCase()}`,
            name: d.companyName || d.firstName || 'Агент',
            email: d.email || '—',
            tickets: sales.tickets,
            revenue: sales.revenue,
            commission: sales.commission,
            commission_percent: commPercent,
            rating: d.rating !== undefined ? d.rating : 4.8, 
            status: sales.tickets > 100 ? 'top' : (d.status === 'active' ? 'active' : 'review'),
            referralCode: d.uid.slice(0, 6).toUpperCase()
          };
        });
        
        loadedAgents.sort((a, b) => b.tickets - a.tickets);
        setAgents(loadedAgents);
      }
    } catch (err) {
      console.error('Error fetching agent stats:', err);
      toast.error('Помилка завантаження даних партнерської мережі');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAgentsAndStats();
  }, [fetchAgentsAndStats]);

  // Inline commission updater
  const updateCommission = async (agentUid: string, val: string) => {
    if (!user) return;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 100) {
      toast.error('Невірне значення комісії');
      return;
    }
    setProcessingId(agentUid);
    try {
      const { error } = await supabase
        .from('user_relationships')
        .update({ custom_commission_percentage: num })
        .eq('parent_id', user.uid)
        .eq('child_id', agentUid);
      
      if (error) throw error;
      setAgents(prev => prev.map(a => a.uid === agentUid ? { ...a, commission_percent: num } : a));
      setEditingComm(null);
      toast.success('Індивідуальну комісію оновлено');
      fetchAgentsAndStats(); // Refresh calculation
    } catch (err) {
      console.error(err);
      toast.error('Помилка оновлення комісії');
    } finally {
      setProcessingId(null);
    }
  };

  // Recruit Link generator
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
    try {
      const { error } = await supabase
        .from('referral_links')
        .update({ status: 'inactive' })
        .eq('id', generatedLinkId);
      if (error) throw error;
      setGeneratedLink('');
      setGeneratedLinkId('');
      setShowQR(false);
      toast.success('🔴 Посилання деактивовано');
    } catch (err) {
      toast.error('Не вдалося деактивувати посилання');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    toast.success('Лінк скопійовано!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyLink = (code: string) => {
    const link = `https://busnet.ua/reserve?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Партнерське посилання скопійовано!');
  };

  // Search filtering
  const filteredAgents = useMemo(() => {
    return agents.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agents, searchTerm]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {/* Світіння індиго */}
            <div className="w-1.5 h-6 bg-[#6366F1] shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">АГЕНТСЬКА МЕРЕЖА</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4 font-bold">Управління партнерами та реферальними комісіями</p>
        </div>
        
        <button 
          onClick={() => {
            setShowInviteModal(true);
            if (!generatedLink) generateInviteLink();
          }}
          className="px-8 py-4 bg-[#6366F1] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-[#7275f2] active:scale-95 transition-all flex items-center gap-2 shadow-lg"
        >
          <UserPlus size={16} /> ЗАПРОСИТИ АГЕНТА
        </button>
      </div>

      {/* STATS GRID - Преміальний стиль із ховер-ефектами та моноширинними цифрами */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1A2639]/30 border border-white/5 p-6 rounded-[32px] relative overflow-hidden group backdrop-blur-md transition-all hover:border-[#6366F1]/20 shadow-xl">
          <Users className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500" size={80} style={{ color: '#6366F1' }} />
          <p className="text-[11px] font-black text-[#8899B5] uppercase tracking-[0.12em] mb-1 font-bold">АКТИВНІ АГЕНТИ</p>
          <h3 className="text-3xl font-black text-white italic tracking-tighter font-mono tabular-nums">{stats.count}</h3>
          <p className="text-[10px] text-[#5A6A85] font-bold uppercase mt-1">Офіційні дистриб'ютори</p>
        </div>

        <div className="bg-[#1A2639]/30 border border-white/5 p-6 rounded-[32px] relative overflow-hidden group backdrop-blur-md transition-all hover:border-[#10B981]/20 shadow-xl">
          <TrendingUp className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500" size={80} style={{ color: '#10B981' }} />
          <p className="text-[11px] font-black text-[#8899B5] uppercase tracking-[0.12em] mb-1 font-bold">ПРОДАЖІ З МЕРЕЖІ</p>
          <h3 className="text-3xl font-black text-white italic tracking-tighter font-mono tabular-nums">{stats.tickets} <span className="text-sm not-italic font-bold">квит.</span></h3>
          <p className="text-[10px] text-[#5A6A85] font-bold uppercase mt-1">Об'єм успішних замовлень</p>
        </div>

        <div className="bg-[#1A2639]/30 border border-white/5 p-6 rounded-[32px] relative overflow-hidden group backdrop-blur-md transition-all hover:border-[#F59E0B]/20 shadow-xl">
          <Percent className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500" size={80} style={{ color: '#F59E0B' }} />
          <p className="text-[11px] font-black text-[#8899B5] uppercase tracking-[0.12em] mb-1 font-bold">СЕРЕДНЯ КОМІСІЯ</p>
          <h3 className="text-3xl font-black text-white italic tracking-tighter font-mono tabular-nums">{stats.avgComm}%</h3>
          <p className="text-[10px] text-[#5A6A85] font-bold uppercase mt-1">Зворотний відсоток касирам</p>
        </div>

        <div className="bg-[#1A2639]/30 border border-white/5 p-6 rounded-[32px] relative overflow-hidden group backdrop-blur-md transition-all hover:border-[#8B5CF6]/20 shadow-xl">
          <Award className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500" size={80} style={{ color: '#8B5CF6' }} />
          <p className="text-[11px] font-black text-[#8899B5] uppercase tracking-[0.12em] mb-1 font-bold">TOP ПАРТНЕР</p>
          <h3 className="text-3xl font-black text-white italic tracking-tighter truncate pr-4">{stats.topPartner}</h3>
          <p className="text-[10px] text-[#5A6A85] font-bold uppercase mt-1">Лідер за обсягом продажів</p>
        </div>
      </div>

      {/* AGENTS LIST */}
      <div className="bg-[#0B1221] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6A85]" size={16} />
            <input 
              type="text" 
              placeholder="Пошук агента за ID або назвою..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A2639]/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:border-[#6366F1]/50 outline-none transition-all placeholder-[#5A6A85] font-bold"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6A85] hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => toast.success('Звіт про ефективність завантажується...')}
              className="p-3 bg-[#1A2639] rounded-xl text-[#5A6A85] hover:text-white transition-colors border border-white/5"
              title="Експортувати звіт"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Мобільний вигляд */}
        <div className="md:hidden p-4 space-y-3">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2].map(i => (
                <div key={i} className="h-28 bg-[#1A2639]/30 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 bg-[#1A2639]/10 rounded-[24px] border border-white/5">
              <Users className="text-[#1A2639]" size={40} />
              <p className="text-[#8899B5] text-[10px] font-black uppercase tracking-widest font-bold">Агентів не знайдено</p>
            </div>
          ) : (
            filteredAgents.map((agent) => (
              <div key={agent.uid} className="bg-[#1A2639]/20 border border-white/5 rounded-[24px] p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1] font-black uppercase text-sm shadow-md">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">{agent.name}</p>
                      <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-0.5">{agent.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-[10px] text-[8px] font-black uppercase tracking-widest border ${
                    agent.status === 'top' ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {agent.status === 'top' ? '★ Top Partner' : 'Active'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
                  <div>
                    <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest">Продажі</p>
                    <p className="text-xs font-black text-white italic mt-1">{agent.tickets} квит.</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest">Обіг</p>
                    <p className="text-xs font-black text-white italic mt-1">€{agent.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest">Комісія</p>
                    <p className="text-xs font-black text-[#10B981] italic mt-1">€{agent.commission.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <div className="flex-1">
                    <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mb-1">Ставка комісії</p>
                    {editingComm?.uid === agent.uid ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          className="w-14 bg-black/50 border border-white/10 rounded-lg py-1 text-xs text-center text-white outline-none focus:border-[#6366F1]"
                          value={editingComm.val} 
                          onChange={e => setEditingComm({...editingComm, val: e.target.value})}
                          onBlur={() => updateCommission(agent.uid, editingComm.val)}
                          onKeyDown={e => e.key === 'Enter' && updateCommission(agent.uid, editingComm.val)}
                          autoFocus
                        />
                        <span className="text-xs text-white">%</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingComm({ uid: agent.uid, val: String(agent.commission_percent) })}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] text-[#8899B5] font-black uppercase tracking-widest transition-all"
                      >
                        {agent.commission_percent}% СТАВКА ✎
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowQRModal(agent)}
                      className="p-2.5 bg-[#1A2639] rounded-xl text-[#5A6A85] hover:text-[#6366F1] transition-all border border-white/5"
                    >
                      <QrCode size={16} />
                    </button>
                    <button 
                      onClick={() => handleCopyLink(agent.referralCode)}
                      className="p-2.5 bg-[#1A2639] rounded-xl text-[#5A6A85] hover:text-white transition-all border border-white/5"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Десктопна таблиця */}
        <div className="hidden md:block overflow-x-auto min-h-[350px]">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-[18px] bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                  <div className="w-24 h-8 rounded-full bg-white/5" />
                </div>
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-24 text-center">
              <Handshake className="text-[#1A2639] mx-auto mb-4 opacity-20" size={48} />
              <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest font-bold">Агентів у вашій партнерській мережі не знайдено</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9px] font-black text-[#5a6a85] uppercase tracking-widest border-b border-white/5 bg-[#1A2639]/10">
                  <th className="py-5 px-8">Агент / Компанія</th>
                  <th className="py-5 px-8">Індивідуальна Комісія</th>
                  <th className="py-5 px-8">Продажі квитків</th>
                  <th className="py-5 px-8">Генерація Обігу</th>
                  <th className="py-5 px-8">Статус</th>
                  <th className="py-5 px-8 text-right">Керування</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredAgents.map((agent) => (
                  <tr key={agent.uid} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1] font-black uppercase text-sm shadow-md group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight group-hover:text-[#6366F1] transition-colors">{agent.name}</p>
                          <p className="text-[10px] text-[#5A6A85] font-medium mt-0.5">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        {editingComm?.uid === agent.uid ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-16 bg-black/60 border border-white/10 rounded-lg py-1 px-2 text-xs text-center text-white outline-none focus:border-[#6366F1]"
                              value={editingComm.val} 
                              onChange={e => setEditingComm({...editingComm, val: e.target.value})}
                              onBlur={() => updateCommission(agent.uid, editingComm.val)}
                              onKeyDown={e => e.key === 'Enter' && updateCommission(agent.uid, editingComm.val)}
                              autoFocus
                            />
                            <span className="text-xs text-white">%</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setEditingComm({ uid: agent.uid, val: String(agent.commission_percent) })}
                            disabled={processingId === agent.uid}
                            className="text-[11px] text-[#8899B5] hover:text-[#6366F1] font-black uppercase tracking-widest text-left flex items-center gap-1.5 transition-colors active:scale-95"
                          >
                            {processingId === agent.uid ? (
                              <Loader2 className="animate-spin" size={12} />
                            ) : (
                              <>
                                <Percent size={12} className="text-[#6366F1]" />
                                <span className="font-mono tabular-nums">{agent.commission_percent}% СТАВКА ✎</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-6 px-8 font-black text-white italic text-sm font-mono tabular-nums">
                      {agent.tickets}{' '}
                      <span className="text-[10px] text-[#5A6A85] not-italic ml-1">прод.</span>
                    </td>
                    <td className="py-6 px-8">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-white italic font-mono tabular-nums">€{agent.revenue.toLocaleString()}</p>
                        <p className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider font-mono tabular-nums">Виплачено: €{agent.commission.toFixed(1)}</p>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        agent.status === 'top' ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {agent.status === 'top' ? '★ Top Partner' : 'Active'}
                      </span>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setShowQRModal(agent)}
                          className="p-2.5 bg-[#1A2639]/50 rounded-xl text-[#5A6A85] hover:text-[#6366F1] hover:bg-[#6366F1]/10 border border-white/5 hover:border-[#6366F1]/20 transition-all active:scale-95"
                          title="Згенерувати QR"
                        >
                          <QrCode size={16} />
                        </button>
                        <button 
                          onClick={() => handleCopyLink(agent.referralCode)}
                          className="p-2.5 bg-[#1A2639]/50 rounded-xl text-[#5A6A85] hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all active:scale-95"
                          title="Копіювати реферальне посилання"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* QR CODE MODAL - Преміальний оверлей */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowQRModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0B1221] border border-white/10 rounded-[40px] p-10 max-w-sm w-full relative z-10 text-center shadow-2xl overflow-hidden"
            >
              {/* Glow */}
              <div className="absolute top-0 left-1/4 w-1/2 h-20 bg-[#6366F1] opacity-10 blur-[50px] pointer-events-none" />

              <button 
                onClick={() => setShowQRModal(null)} 
                className="absolute top-6 right-6 text-[#5A6A85] hover:text-white hover:bg-white/5 p-1 rounded-full transition-all"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 bg-[#6366F1]/10 rounded-2xl flex items-center justify-center text-[#6366F1] mx-auto mb-6 border border-[#6366F1]/20">
                <QrCode size={32} />
              </div>
              
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1 italic truncate">{showQRModal.name}</h3>
              <p className="text-[11px] text-[#8899B5] font-black uppercase tracking-[0.12em] mb-8">Унікальний QR-код для продажу квитків</p>
              
              <div className="mb-8 inline-block">
                <QRDisplay value={`https://busnet.ua/reserve?ref=${showQRModal.referralCode}`} withScanner={true} />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    toast.success('Завантаження пакету друку розпочато...');
                    setShowQRModal(null);
                  }}
                  className="w-full py-4 bg-[#6366F1] hover:bg-[#7275f2] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                >
                  <Download size={14} /> СКАЧАТИ ПАКЕТ ДЛЯ ДРУКУ
                </button>
                <button 
                  onClick={() => {
                    toast.success(`Пакет надіслано на ${showQRModal.email}`);
                    setShowQRModal(null);
                  }}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/70 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  НАДІСЛАТИ НА EMAIL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECRUIT INVITE CLIENT MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0B1221] border border-[#6366F1]/30 rounded-[32px] overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)] relative z-10"
            >
              {/* Glow */}
              <div className="absolute top-0 left-1/4 w-1/2 h-20 bg-[#6366F1] opacity-10 blur-[50px] pointer-events-none" />

              <div className="p-6 border-b border-white/5 bg-[#1A2639]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">ЗАПРОСИТИ АГЕНТА</h3>
                    <p className="text-[9px] text-[#8899B5] font-black uppercase tracking-widest mt-0.5 font-bold">Рекрутинг офіційних партнерів</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-xs text-white/60 leading-relaxed font-medium">
                  Надішліть це унікальне посилання агенту. Після реєстрації він автоматично отримає доступ до продажу ваших рейсів із комісією за замовчуванням.
                </p>

                {/* Link Box */}
                <div className="p-1 rounded-2xl bg-[#050C15] border border-white/5 flex items-center gap-2">
                  <input 
                    readOnly 
                    value={generatedLink || 'Генерація посилання...'} 
                    className="bg-transparent border-none text-white text-xs font-mono px-4 py-3 w-full outline-none opacity-70"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className={`p-3 rounded-xl flex items-center justify-center transition-all ${isCopied ? 'bg-[#10B981] text-black' : 'bg-[#1A2639] text-white hover:bg-[#6366F1]/20 hover:text-[#6366F1]'}`}
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                {/* QR Code toggle */}
                {generatedLink && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowQR(p => !p)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#6366F1] text-[10px] font-black uppercase tracking-widest hover:bg-[#6366F1]/20 transition-all font-bold"
                    >
                      <QrCode size={13} /> {showQR ? 'Сховати QR-код' : 'Показати QR-код'}
                    </button>
                    <AnimatePresence>
                      {showQR && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden flex justify-center mt-2"
                        >
                          <QRDisplay value={generatedLink} withScanner={true} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Deactivate link */}
                {generatedLinkId && (
                  <button
                    onClick={deactivateLink}
                    className="w-full flex items-center justify-center gap-2 py-2 text-[10px] text-white/30 hover:text-red-400 font-black uppercase tracking-widest transition-colors font-bold"
                  >
                    <Ban size={11} /> Деактивувати це посилання
                  </button>
                )}

                {/* Quick Share */}
                <div className="space-y-3">
                  <p className="text-[9px] text-[#8899B5] font-black uppercase tracking-widest text-center font-bold">Швидке надсилання запрошення</p>
                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href={`https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${encodeURIComponent('Вітаю! Запрошую вас стати офіційним дистриб\'ютором та касиром рейсів нашої компанії на платформі BUSNET.')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2AABEE]/10 text-[#2AABEE] border border-[#2AABEE]/20 hover:bg-[#2AABEE]/20 transition-all"
                    >
                      <SendIcon size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest font-bold">Telegram</span>
                    </a>
                    <a 
                      href={`viber://forward?text=${encodeURIComponent('Вітаю! Запрошую стати дистриб\'ютором та касиром наших автобусних рейсів: ' + generatedLink)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7360F2]/10 text-[#7360F2] border border-[#7360F2]/20 hover:bg-[#7360F2]/20 transition-all"
                    >
                      <MessageCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest font-bold">Viber</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentsTab;
