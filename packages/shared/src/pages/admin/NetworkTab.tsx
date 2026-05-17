import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Handshake, Users, ChevronRight, Activity, Zap, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';

export default function NetworkTab() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real scenario, this fetches from user_relationships and referral_links
    // Mocking the network for the visualization
    setNodes([
      { id: 1, type: 'carrier', name: 'ТОВ "Автолюкс"', agents: 5, pax: 120 },
      { id: 2, type: 'carrier', name: 'Євроклуб', agents: 2, pax: 45 },
      { id: 3, type: 'agent', name: 'ФОП Коваленко', parent: 'ТОВ "Автолюкс"', pax: 80, comm: 3400 },
      { id: 4, type: 'agent', name: 'Турагентство "Світ"', parent: 'ТОВ "Автолюкс"', pax: 40, comm: 1200 },
    ]);
    setTimeout(() => setLoading(false), 800);
  }, []);

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-500 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Дерево Рефералів</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">
            Глобальний огляд мережі партнерів та B2B зв'язків
          </p>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="px-4 py-2 bg-[#0B1221] border border-white/5 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">Перевізники</span>
          </div>
          <div className="px-4 py-2 bg-[#0B1221] border border-white/5 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF]">Агенти</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'ПЕРЕВІЗНИКІВ У МЕРЕЖІ', val: '45', color: '#8B5CF6' },
          { label: 'АКТИВНИХ АГЕНТІВ', val: '128', color: '#00D4FF' },
          { label: 'ЗАЛУЧЕНИХ ПАСАЖИРІВ', val: '14,050', color: '#10B981' },
          { label: 'КОМІСІЯ АГЕНТІВ (€)', val: '45,200', color: '#F59E0B' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0B1221] border border-white/5 p-6 rounded-[24px] relative overflow-hidden shadow-lg">
             <div className="absolute right-0 top-1/2 -translate-y-1/2 p-6 opacity-[0.03]">
                <Network size={80} style={{ color: stat.color }} />
             </div>
             <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest mb-1">{stat.label}</p>
             <h3 className="text-3xl font-black text-white italic tracking-tighter" style={{ textShadow: `0 0 20px ${stat.color}40` }}>{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="bg-[#0B1221] border border-white/5 rounded-[32px] p-6 md:p-8 min-h-[500px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Activity className="text-[#00D4FF] animate-pulse" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            {nodes.filter(n => n.type === 'carrier').map((carrier, i) => (
              <div key={i} className="bg-[#1A2639]/30 border border-[#8B5CF6]/30 rounded-[20px] p-5 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center border border-[#8B5CF6]/20">
                      <Bus size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase tracking-tight text-sm">{carrier.name}</h4>
                      <p className="text-[10px] text-[#5A6A85] font-black uppercase tracking-widest mt-1">
                        {carrier.agents} Агентів · {carrier.pax} Рефералів
                      </p>
                    </div>
                  </div>
                  <button className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest hover:text-white transition-colors bg-[#8B5CF6]/10 px-4 py-2 rounded-lg border border-[#8B5CF6]/20">
                    Переглянути чати
                  </button>
                </div>
                
                <div className="pl-14 space-y-3">
                  {nodes.filter(n => n.parent === carrier.name).map((agent, j) => (
                    <div key={j} className="bg-[#0B1221] border border-[#00E5FF]/20 rounded-[16px] p-4 flex justify-between items-center group hover:border-[#00E5FF]/50 transition-all">
                      <div className="flex items-center gap-4">
                        <ChevronRight className="text-[#5A6A85]" size={16} />
                        <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20">
                          <Handshake size={14} />
                        </div>
                        <div>
                          <p className="text-white font-bold uppercase tracking-tight text-xs">{agent.name}</p>
                          <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-0.5">
                            Комісія: €{agent.comm} · Пасажирів: {agent.pax}
                          </p>
                        </div>
                      </div>
                      <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#5A6A85] opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 hover:text-white">
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  ))}
                  <button className="flex items-center gap-2 text-[#5A6A85] hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mt-2 ml-2">
                    <Users size={12} /> Показати всіх ({carrier.agents})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
