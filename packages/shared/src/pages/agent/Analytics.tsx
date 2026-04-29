/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Users, 
  Target, Zap, PieChart, Star,
  ArrowUpRight, ArrowDownRight,
  TrendingDown, Activity, Download,
  Share2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Analytics() {
  const handleExportPDF = () => {
    toast.loading('Підготовка звіту до друку...', { duration: 1500 });
    setTimeout(() => {
      window.print();
      toast.success('Вікно друку відкрито');
    }, 1500);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Посилання скопійовано у буфер обміну!');
    }).catch(() => {
      toast.error('Не вдалося скопіювати посилання');
    });
  };

  const STATS = [
    { label: 'Продажів (квіт.)', val: '347', delta: '▲ +43 до берез.', type: 'green' },
    { label: 'Конверсія', val: '34%', delta: '▲ +2.1%', type: 'purple' },
    { label: 'Нових пасажирів', val: '6', delta: '→ стабільно', type: 'cyan' },
    { label: 'Avg. квиток', val: '€62', delta: '▲ +€4', type: 'gold' },
  ];

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
            Статистика агента
          </h1>
          <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
            Детальна аналітика ефективності вашої роботи
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#7a8fa8] hover:text-white transition-all shadow-lg"
            title="Поділитися"
          >
            <Share2 size={16} />
          </button>
          <button 
            onClick={handleExportPDF}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#7a8fa8] hover:text-white transition-all shadow-lg"
            title="Експорт PDF"
          >
            <Download size={16} />
          </button>
          <select className="bg-[#121824] border border-white/5 rounded-xl py-2 px-4 text-xs font-bold text-white outline-none focus:border-[#a28afd] appearance-none cursor-pointer">
            <option>Квітень 2026</option><option>Березень 2026</option><option>Лютий 2026</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#151c28] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all shadow-lg"
          >
            <div className={`absolute top-0 left-0 w-full h-[2px] 
              ${stat.type === 'green' ? 'bg-[#00d97e]' : ''}
              ${stat.type === 'purple' ? 'bg-[#7c5cfc]' : ''}
              ${stat.type === 'cyan' ? 'bg-[#00c4d4]' : ''}
              ${stat.type === 'gold' ? 'bg-[#f5c842]' : ''}
            `} />
            <div className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest mb-2">{stat.label}</div>
            <div className="font-['Syne'] text-2xl font-black text-white italic tracking-tighter leading-none mb-1">{stat.val}</div>
            <div className={`text-[10px] font-bold ${stat.delta.includes('▲') ? 'text-[#00d97e]' : 'text-[#4a5c72]'}`}>{stat.delta}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart View */}
        <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-['Syne'] font-bold text-sm text-white uppercase italic tracking-tight tracking-wider">Продажі по місяцях</h3>
          </div>
          <div className="p-8">
            <div className="h-[130px] flex items-end gap-3">
              {[180, 220, 260, 304, 304, 347, 347].map((v, i) => (
                <div key={i} className="flex-1 group relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(v/347)*100}%` }}
                    className={`
                      w-full rounded-t-lg transition-all shadow-lg
                      ${i === 6 ? 'bg-[#7c5cfc] opacity-100 shadow-[0_0_20px_rgba(124,92,252,0.4)]' : 'bg-white/5 opacity-50 hover:opacity-80 group-hover:bg-[#a28afd]'}
                    `}
                  />
                  <div className="text-[9px] font-black text-[#4a5c72] uppercase text-center mt-4 tracking-widest italic leading-none whitespace-nowrap">
                    {['Жов', 'Лис', 'Гру', 'Січ', 'Лют', 'Бер', 'Квіт'][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Routes Analytics */}
        <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-['Syne'] font-bold text-sm uppercase italic tracking-tight tracking-wider">Топ маршрути агента</h3>
          </div>
          <div className="p-6 space-y-6">
            {[
              { name: 'Київ → Варшава', sales: 148, pct: 100, comm: 407 },
              { name: 'Київ → Берлін', sales: 87, pct: 59, comm: 304 },
              { name: 'Київ → Прага', sales: 62, pct: 42, comm: 186 },
              { name: 'Київ → Відень', sales: 50, pct: 34, comm: 162 },
            ].map((route, i) => (
              <div key={i} className="space-y-2 group">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-white uppercase italic tracking-tighter leading-none block">{route.name}</span>
                    <span className="text-[9px] text-[#4a5c72] font-black uppercase tracking-widest block">{route.sales} квитків оформлено</span>
                  </div>
                  <span className="font-['Syne'] text-sm font-black text-[#a28afd] italic tracking-tight group-hover:scale-110 transition-transform">€{route.comm}</span>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden border border-white/[0.02]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${route.pct}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#7c5cfc] to-[#a28afd] group-hover:from-[#a28afd] group-hover:to-[#fff] transition-all" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales Chart */}
        <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-['Syne'] font-bold text-sm text-white uppercase italic tracking-tight tracking-wider">Продажі за тижнями місяця</h3>
          </div>
          <div className="p-8">
            <div className="h-[130px] flex items-end gap-10 px-8">
              {[68, 92, 108, 79].map((v, i) => (
                <div key={i} className="flex-1 group relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(v/108)*100}%` }}
                    className={`
                      w-full rounded-t-xl transition-all shadow-lg
                      ${i === 2 ? 'bg-[#00d97e] opacity-100' : 'bg-white/5 group-hover:bg-[#7c5cfc] group-hover:opacity-80'}
                    `}
                  />
                  <div className="text-[9px] font-black text-[#4a5c72] uppercase text-center mt-5 tracking-[0.2em] italic">Тиж {i+1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-['Syne'] font-bold text-sm uppercase italic tracking-tight tracking-wider">Джерела пасажирів</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6 mb-8">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#7c5cfc1a] text-[#a28afd] border border-[#7c5cfc33] uppercase">СВОЇ</span>
                    <span className="text-xs text-[#7a8fa8] font-bold tracking-tight">Власні клієнти (10%)</span>
                  </div>
                  <span className="text-xs font-black text-[#a28afd] tracking-tight">17 · 4.9%</span>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden border border-white/[0.02]">
                  <motion.div initial={{ width: 0 }} animate={{ width: '5%' }} className="h-full bg-[#7c5cfc]" />
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#00c4d41a] text-[#00c4d4] border border-[#00c4d433] uppercase">BUSNET</span>
                    <span className="text-xs text-[#7a8fa8] font-bold tracking-tight">Платформа BUSNET (5%)</span>
                  </div>
                  <span className="text-xs font-black text-[#00c4d4] tracking-tight">330 · 95.1%</span>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden border border-white/[0.02]">
                  <motion.div initial={{ width: 0 }} animate={{ width: '95%' }} transition={{ duration: 1.5 }} className="h-full bg-[#00c4d4]" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/[0.015] p-3 rounded-2xl border border-white/5 space-y-1">
                <div className="text-[8px] text-[#4a5c72] font-black uppercase tracking-widest">Рейтинг регіону</div>
                <div className="text-[11px] font-black text-[#f5c842] uppercase italic tracking-tighter">TOP-1 КИЇВ</div>
              </div>
              <div className="bg-white/[0.015] p-3 rounded-2xl border border-white/5 space-y-1">
                <div className="text-[8px] text-[#4a5c72] font-black uppercase tracking-widest">Платформа</div>
                <div className="text-[11px] font-black text-[#a28afd] uppercase italic tracking-tighter">#1 з 47</div>
              </div>
              <div className="bg-white/[0.015] p-3 rounded-2xl border border-white/5 space-y-1">
                <div className="text-[8px] text-[#4a5c72] font-black uppercase tracking-widest">LTV Клієнтів</div>
                <div className="text-[11px] font-black text-[#00d97e] uppercase italic tracking-tighter">67% повтори</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
