/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'framer-motion';
import { 
  Wallet, Clock, ArrowRight, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BOOKINGS_DATA, PASSENGERS_DATA, ROUTES_DATA } from './constants';

export default function AgentDashboard() {
  const navigate = useNavigate();

  const activeBookings = BOOKINGS_DATA.filter(b => ['onboard', 'booked'].includes(b.status));
  const totalComm = BOOKINGS_DATA.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.comm, 0);
  const ownComm = BOOKINGS_DATA.filter(b => b.type === 'own' && b.status !== 'cancelled').reduce((sum, b) => sum + b.comm, 0);
  const busnetComm = BOOKINGS_DATA.filter(b => b.type === 'busnet' && b.status !== 'cancelled').reduce((sum, b) => sum + b.comm, 0);
  const ownCount = BOOKINGS_DATA.filter(b => b.type === 'own' && b.status !== 'cancelled').length;
  const busnetCount = BOOKINGS_DATA.filter(b => b.type === 'busnet' && b.status !== 'cancelled').length;

  const topRoutes = [...ROUTES_DATA].sort((a, b) => b.demand - a.demand).slice(0, 4);

  const STATS = [
    { label: 'Зароблено цього місяця', val: `€${totalComm.toFixed(2)}`, sub: `${BOOKINGS_DATA.filter(b => b.status !== 'cancelled').length} продажів · до виплати`, delta: '▲ +12%', type: 'purple' },
    { label: 'Активних бронювань', val: activeBookings.length.toString(), sub: 'в дорозі та заброньовано', delta: '▲ 2', type: 'green' },
    { label: 'Пасажирів у базі', val: PASSENGERS_DATA.length.toString(), sub: `${PASSENGERS_DATA.filter(p => p.status === 'active').length} активних за 30 днів`, delta: '▲ 1', type: 'cyan' },
    { label: 'Конверсія', val: '8.4%', sub: 'З переглядів у квиток', delta: '▼ 0.5%', type: 'gold' },
  ];

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
            Дашборд агента
          </h1>
          <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
            Агентський портал · Квітень 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/analytics')}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#7a8fa8] hover:text-white hover:bg-white/10 transition-all"
          >
            Аналітика (в розробці)
          </button>
          <button 
            onClick={() => navigate('/book')}
            className="px-4 py-2 bg-[#7c5cfc] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            + Нове бронювання
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`
              bg-[#151c28] border border-white/5 rounded-2xl p-4 relative overflow-hidden group cursor-pointer 
              hover:border-white/10 transition-all hover:-translate-y-1
            `}
          >
            <div className={`absolute top-0 left-0 w-full h-[2px] 
              ${stat.type === 'purple' ? 'bg-gradient-to-r from-[#7c5cfc] to-[#a28afd]' : ''}
              ${stat.type === 'green' ? 'bg-gradient-to-r from-[#00d97e] to-[#009955]' : ''}
              ${stat.type === 'cyan' ? 'bg-gradient-to-r from-[#00c4d4] to-[#007788]' : ''}
              ${stat.type === 'gold' ? 'bg-gradient-to-r from-[#f5c842] to-[#cc9900]' : ''}
            `} />
            <div className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest mb-2">{stat.label}</div>
            <div className="font-['Syne'] text-2xl font-black text-white italic tracking-tighter leading-none mb-1">{stat.val}</div>
            <div className={`text-[10px] font-bold ${stat.delta.includes('▲') ? 'text-[#00d97e]' : 'text-[#4a5c72]'}`}>{stat.delta} до минулого</div>
            <div className="text-[10px] text-[#4a5c72] mt-2">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Commission Breakdown */}
      <div className="bg-gradient-to-br from-[#7c5cfc14] to-[#7c5cfc0a] border border-[#7c5cfc33] rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
          <Wallet size={120} />
        </div>
        <div className="relative z-10">
          <div className="space-y-3 mb-5">
            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#7c5cfc1a] text-[#a28afd] border border-[#7c5cfc33] uppercase">СВОЇ</span>
                <span className="text-xs text-[#7a8fa8] font-medium tracking-tight">Власні пасажири (10% комісія)</span>
              </div>
              <div className="text-xs font-bold text-white tracking-tight">
                {ownCount} квитків · €{BOOKINGS_DATA.filter(b => b.type === 'own' && b.status !== 'cancelled').reduce((sum, b) => sum + b.price, 0)} → <span className="text-[#a28afd]">€{ownComm.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#00c4d41a] text-[#00c4d4] border border-[#00c4d433] uppercase">BUSNET</span>
                <span className="text-xs text-[#7a8fa8] font-medium tracking-tight">Пасажири BUSNET UA (5% комісія)</span>
              </div>
              <div className="text-xs font-bold text-white tracking-tight">
                {busnetCount} квитків · €{BOOKINGS_DATA.filter(b => b.type === 'busnet' && b.status !== 'cancelled').reduce((sum, b) => sum + b.price, 0)} → <span className="text-[#00c4d4]">€{busnetComm.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="h-px bg-[#7c5cfc26] mb-4" />
          <div className="flex justify-between items-center px-2">
            <div className="text-sm font-bold text-white">Разом до виплати (травень)</div>
            <div className="font-['Syne'] text-2xl font-black text-[#7c5cfc] italic tracking-tighter leading-none">€{totalComm.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Revenue & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-['Syne'] font-bold text-sm tracking-tight">Дохід по тижнях (квітень)</h3>
              <button className="text-[10px] text-[#4a5c72] hover:text-white uppercase font-black transition-all">Звіт</button>
            </div>
            <div className="p-10 flex items-center justify-center text-slate-500 font-medium">
               Недостатньо даних для графіку
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-['Syne'] font-bold text-sm tracking-tight">Останні бронювання</h3>
              <button onClick={() => navigate('/mybookings')} className="text-[10px] text-[#4a5c72] hover:text-white uppercase font-black transition-all flex items-center gap-1">
                Всі →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-left border-collapse">
                <tbody className="divide-y divide-white/[0.02]">
                  {BOOKINGS_DATA.slice(0, 4).map((b, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => navigate('/mybookings')}>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-white">{b.pax}</div>
                        <div className="text-[9px] text-[#4a5c72] font-black uppercase tracking-widest">{b.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[11px] text-[#7a8fa8] font-bold italic">{b.route}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-black text-[#00d97e] italic">€{b.comm.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight size={14} className="text-[#4a5c72] group-hover:text-white transition-all transform group-hover:translate-x-1" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Activity & Routes */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-['Syne'] font-bold text-sm tracking-tight text-white flex items-center gap-2">
                <Clock size={16} className="text-[#7c5cfc]" /> Активність
              </h3>
            </div>
            <div className="p-8 text-center text-slate-500 text-sm">
              Немає нових активностей.
            </div>
          </div>

          {/* Top Routes */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-['Syne'] font-bold text-sm tracking-tight">Топ маршрути</h3>
            </div>
            <div className="divide-y divide-white/[0.02]">
              {topRoutes.map((route, i) => (
                <div 
                  key={i} 
                  onClick={() => navigate(`/book?from=${route.from}&to=${route.to}`)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#7c5cfc] transition-colors">{route.from} → {route.to}</div>
                    <div className="text-[9px] text-[#4a5c72] font-black uppercase tracking-widest">{route.km} км · {route.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-[#00d97e] italic">Попит {route.demand}%</div>
                    <div className="text-[9px] text-[#4a5c72] font-bold">від €{route.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

