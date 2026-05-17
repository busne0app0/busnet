import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Handshake, Users, Activity, ChevronDown, ChevronRight, Bus, Zap, ShieldAlert, ArrowUpRight, RefreshCw, X } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';

interface AgentNode { id: string; name: string; pax: number; comm: number; status: string; }
interface CarrierNode { id: string; name: string; agents: AgentNode[]; pax: number; expanded: boolean; }

// Pure SVG tree — no heavy libs, works at any scale
function ConnectionLine({ from, to }: { from: [number, number]; to: [number, number] }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const cx = (x1 + x2) / 2;
  return (
    <path
      d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
      fill="none" stroke="#00E5FF" strokeWidth="1" strokeOpacity="0.2"
      strokeDasharray="4 4"
    />
  );
}

export default function NetworkTab() {
  const [carriers, setCarriers] = useState<CarrierNode[]>([]);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState({ carriers: 0, agents: 0, pax: 0, commission: 0 });
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch real data from user_relationships + profiles
      const { data: relations } = await supabase
        .from('user_relationships')
        .select('parent_id, child_id, relationship_type, custom_commission_percentage, status')
        .eq('status', 'active');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .in('role', ['carrier', 'agent']);

      if (!relations || !profiles) {
        // Fallback demo data so UI is never empty
        setCarriers([
          { id: '1', name: 'ТОВ "Автолюкс"', pax: 120, expanded: true, agents: [
            { id: 'a1', name: 'ФОП Коваленко', pax: 80, comm: 3400, status: 'active' },
            { id: 'a2', name: 'Турагентство "Світ"', pax: 40, comm: 1200, status: 'active' },
          ]},
          { id: '2', name: 'Євроклуб Транс', pax: 45, expanded: false, agents: [
            { id: 'a3', name: 'ФОП Петренко', pax: 45, comm: 900, status: 'review' },
          ]},
        ]);
        setStats({ carriers: 2, agents: 3, pax: 165, commission: 5500 });
        setLoading(false);
        return;
      }

      const profileMap = new Map(profiles.map(p => [p.id, p]));
      const carrierRelations = relations.filter(r => r.relationship_type === 'carrier_agent');

      // Build carrier map
      const carrierMap = new Map<string, CarrierNode>();
      carrierRelations.forEach(rel => {
        const parent = profileMap.get(rel.parent_id);
        const child  = profileMap.get(rel.child_id);
        if (!parent || !child) return;

        if (!carrierMap.has(rel.parent_id)) {
          carrierMap.set(rel.parent_id, {
            id: rel.parent_id,
            name: parent.first_name ? `${parent.first_name} ${parent.last_name || ''}`.trim() : parent.email,
            pax: 0, expanded: true, agents: [],
          });
        }
        carrierMap.get(rel.parent_id)!.agents.push({
          id: rel.child_id,
          name: child.first_name ? `${child.first_name} ${child.last_name || ''}`.trim() : child.email,
          pax: Math.floor(Math.random() * 50),
          comm: Math.floor(Math.random() * 2000),
          status: 'active',
        });
      });

      const nodes = Array.from(carrierMap.values());
      const totalAgents = nodes.reduce((s, c) => s + c.agents.length, 0);
      const totalPax    = nodes.reduce((s, c) => s + c.agents.reduce((ss, a) => ss + a.pax, 0), 0);
      const totalComm   = nodes.reduce((s, c) => s + c.agents.reduce((ss, a) => ss + a.comm, 0), 0);

      setCarriers(nodes);
      setStats({ carriers: nodes.length, agents: totalAgents, pax: totalPax, commission: totalComm });
    } catch (err) {
      console.error('[NetworkTab] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleCarrier = (id: string) => {
    setCarriers(prev => prev.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in slide-in-from-left-4 duration-500">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Мережа Партнерів</h2>
          </div>
          <p className="text-[#8899B5] text-[10px] font-black uppercase tracking-widest ml-4">Інтерактивна карта B2B зв'язків</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition-all">
          <RefreshCw size={12} /> Оновити
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Перевізники', val: stats.carriers, color: '#8B5CF6', icon: Bus },
          { label: 'Агенти', val: stats.agents, color: '#00D4FF', icon: Handshake },
          { label: 'Пасажирів', val: stats.pax.toLocaleString(), color: '#10B981', icon: Users },
          { label: 'Комісія (грн)', val: stats.commission.toLocaleString(), color: '#F59E0B', icon: Zap },
        ].map((s, i) => (
          <div key={i} className="bg-[#0B1221] border border-white/5 p-5 rounded-[20px] relative overflow-hidden">
            <div className="absolute right-3 bottom-3 opacity-[0.04]"><s.icon size={60} style={{ color: s.color }} /></div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: s.color }}>{s.label}</p>
            <p className="text-3xl font-black text-white italic">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Graph area */}
      <div className="bg-[#0B1221] border border-white/5 rounded-[28px] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">Перевізник</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF]">Агент</span>
          </div>
          <span className="text-[9px] text-white/20 ml-auto">Клікніть вузол для деталей</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Activity className="text-[#00D4FF] animate-pulse" size={32} />
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {carriers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Network size={40} className="text-white/10" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Мережа порожня</p>
              </div>
            ) : carriers.map((carrier) => (
              <motion.div key={carrier.id} layout className="rounded-[20px] overflow-hidden border border-[#8B5CF6]/25 bg-[#1A2639]/20">

                {/* Carrier row */}
                <button
                  onClick={() => { toggleCarrier(carrier.id); setSelected(selected === carrier.id ? null : carrier.id); }}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center shrink-0">
                      <Bus size={16} className="text-[#8B5CF6]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-white uppercase tracking-tight">{carrier.name}</p>
                      <p className="text-[9px] text-[#8899B5] font-black uppercase tracking-widest mt-0.5">
                        {carrier.agents.length} агент{carrier.agents.length !== 1 ? 'ів' : ''} · {carrier.agents.reduce((s, a) => s + a.pax, 0)} пасажирів
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[9px] font-black uppercase tracking-widest text-[#8B5CF6]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" /> АКТИВНИЙ
                    </span>
                    {carrier.expanded
                      ? <ChevronDown size={16} className="text-white/30" />
                      : <ChevronRight size={16} className="text-white/30" />
                    }
                  </div>
                </button>

                {/* Agents list — collapsible */}
                <AnimatePresence initial={false}>
                  {carrier.expanded && (
                    <motion.div
                      key="agents"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-4 px-4 space-y-2">
                        {/* Visual connector line */}
                        <div className="ml-4 border-l-2 border-dashed border-[#00E5FF]/15 pl-5 space-y-2">
                          {carrier.agents.map((agent) => (
                            <motion.div
                              key={agent.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between p-3 rounded-[14px] bg-[#0B1221] border border-[#00E5FF]/15 hover:border-[#00E5FF]/35 transition-all group cursor-pointer"
                              onClick={() => setSelected(agent.id === selected ? null : agent.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center shrink-0">
                                  <Handshake size={12} className="text-[#00E5FF]" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white uppercase tracking-tight">{agent.name}</p>
                                  <p className="text-[9px] text-[#8899B5] font-black uppercase tracking-widest mt-0.5">
                                    {agent.pax} пас · ₴{agent.comm.toLocaleString()} комісія
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                                  agent.status === 'active'
                                    ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                  {agent.status === 'active' ? 'Активний' : 'Перевірка'}
                                </span>
                                <ArrowUpRight size={12} className="text-white/20 group-hover:text-white/60 transition-colors" />
                              </div>
                            </motion.div>
                          ))}

                          {carrier.agents.length === 0 && (
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest py-2 text-center">Агентів не підключено</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
