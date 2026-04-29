import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, Bus, 
  CreditCard, Undo2, Handshake, Star, 
  ArrowUpRight, Brain, AlertCircle, MapPin, Search, Loader2,
  Zap, Activity, Target, Cpu
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';

const DashboardTab: React.FC = () => {
  const { conflicts, approvals, bookings: storeBookings, leads, metrics, statsExtra, loading: statsLoading, fetchStats } = useAdminStore();
  const [activeTab, setActiveTab] = useState('realtime');

  useEffect(() => {
    fetchStats();
  }, []);

  const activeConflicts = conflicts.filter(c => c.status === 'pending');
  
  const chartData = React.useMemo(() => {
    const weeksRev = [0, 0, 0, 0];
    if (storeBookings.length > 0) {
      storeBookings.forEach(b => {
        const date = new Date(b.timestamp);
        if (date && !isNaN(date.getTime())) {
            const dateDay = date.getDate();
            const weekIndex = Math.min(Math.floor((dateDay - 1) / 7), 3);
            weeksRev[weekIndex] += parseFloat(b.amount.replace('€','')) || 0;
        }
      });
      return weeksRev.map((rev, i) => ({
        name: `W${i + 1}`,
        revenue: Math.round(rev),
        profit: Math.round(rev * 0.15)
      }));
    }
    return [
      { name: 'W1', revenue: 4200, profit: 800 },
      { name: 'W2', revenue: 5800, profit: 1100 },
      { name: 'W3', revenue: 5100, profit: 950 },
      { name: 'W4', revenue: 7200, profit: 1400 },
    ];
  }, [storeBookings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Mission Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex items-center gap-4 mb-2"
           >
              <div className="w-1.5 h-8 bg-[#00D4FF] rounded-full shadow-[0_0_15px_#00D4FF]" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                Панель <span className="text-[#00D4FF]">Управління</span>
              </h2>
           </motion.div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
             Статистика в реальному часі · Оновлено {new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
           </p>
        </div>
        
        <div className="flex gap-4 p-1.5 glass-mission-control rounded-2xl">
          {[
            { id: 'realtime', label: 'Лайв' },
            { id: 'analytics', label: 'Аналітика' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-[#00D4FF] text-black shadow-[0_0_20px_rgba(0,212,255,0.4)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📊 High-Glow KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Обіг Системи', val: `€${metrics.gmv.toLocaleString()}`, delta: '+14.2%', icon: CreditCard, color: '#00D4FF' },
          { label: 'Продано Квитків', val: metrics.ticketsSold.toLocaleString(), delta: `+${statsExtra.bookingsToday} сьогодні`, icon: Target, color: '#10B981' },
          { label: 'Активні Рейси', val: statsExtra.activeTrips.toLocaleString(), delta: 'Стабільно', icon: Activity, color: '#F59E0B' },
          { label: 'Партнерів', val: statsExtra.totalCarriers.toLocaleString(), delta: 'Зростає', icon: Cpu, color: '#8B5CF6' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="glass-mission-control luminous-border p-6 group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white/50 group-hover:text-white group-hover:border-[#00D4FF]/30 transition-all duration-500">
                  <stat.icon size={20} style={{ color: stat.color }} />
               </div>
               <span className="text-[10px] font-black text-[#00D4FF] tracking-widest">{stat.delta}</span>
            </div>
            <div className="text-3xl font-black text-white tracking-tighter italic mb-1">{stat.val}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-300 transition-colors">{stat.label}</div>
            
            {/* Liquid Accent Line */}
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/5 overflow-hidden">
               <motion.div 
                 initial={{ x: '-100%' }}
                 animate={{ x: '100%' }}
                 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 className="w-1/2 h-full"
                 style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }}
               />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🌊 Liquid Data Flow Chart */}
        <div className="lg:col-span-2 glass-mission-control rounded-[2.5rem] p-8 relative">
          <div className="flex justify-between items-center mb-10">
             <div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 italic">
                  <TrendingUp size={16} className="text-[#00D4FF]" /> Динаміка Доходів
                </h3>
                <p className="text-[9px] text-slate-500 font-black uppercase mt-1">Фінансовий потік за поточний період</p>
             </div>
             <div className="flex gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_10px_#00D4FF]" />
                   <span className="text-[9px] font-black uppercase text-slate-400">Дохід</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]" />
                   <span className="text-[9px] font-black uppercase text-slate-400">Прибуток</span>
                </div>
             </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#3d5670', fontSize: 10, fontWeight: 800 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#3d5670', fontSize: 10, fontWeight: 800 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(13, 18, 30, 0.95)', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: '#fff',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#00D4FF" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#8B5CF6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorProf)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🧠 AI Insights (The Brain) */}
        <div className="glass-mission-control rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col">
          <div className="neural-network-glow absolute -top-20 -right-20 w-64 h-64 pointer-events-none" />
          
          <div className="flex justify-between items-center mb-8 relative z-10">
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 italic">
                <Brain size={18} className="text-[#00D4FF]" /> ШІ Асистент
             </h3>
             <motion.div 
               animate={{ opacity: [0.4, 1, 0.4] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="px-2 py-0.5 bg-[#8B5CF6]/20 text-[#8B5CF6] text-[8px] font-black rounded-full uppercase tracking-widest"
             >
               Обчислення
             </motion.div>
          </div>

          <div className="space-y-6 flex-1 relative z-10">
            <motion.div 
              whileHover={{ x: 5 }}
              className="p-5 bg-white/5 border border-white/5 rounded-2xl group cursor-pointer hover:border-[#00D4FF]/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                 <Zap size={14} className="text-[#00D4FF]" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00D4FF]">Оптимізація Мережі</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed group-hover:text-slate-200">
                Піковий попит на <span className="text-white font-bold">Київ → Рим</span>. 
                Застосовується множник динамічного ціноутворення <span className="text-[#00D4FF] font-black">×1.2</span>.
              </p>
            </motion.div>

            {activeConflicts.map((conf) => (
              <div key={conf.id} className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl group hover:border-red-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                   <AlertCircle size={14} className="text-red-500" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">Виявлено Аномалію</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{conf.description}</p>
                <button className="mt-4 w-full py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                  Виконати Протокол
                </button>
              </div>
            ))}

            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl group hover:border-[#10B981]/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                 <Activity size={14} className="text-[#10B981]" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#10B981]">Статус Автопарку</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                98% ресурсів мережі працюють в межах норми. Затримок не виявлено.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
             <button className="w-full py-4 glass-mission-control rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black transition-all">
               Сформувати Звіт ШІ
             </button>
          </div>
        </div>
      </div>

      {/* 🛸 Recent Transactions (Glass Table) */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-mission-control rounded-[2.5rem] p-8 overflow-hidden"
      >
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 italic">
               <Bus size={18} className="text-[#00D4FF]" /> Останні Транзакції
            </h3>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="px-6 pb-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Оператор</th>
                  <th className="px-6 pb-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Маршрут</th>
                  <th className="px-6 pb-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Час</th>
                  <th className="px-6 pb-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Дохід</th>
                  <th className="px-6 pb-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Статус</th>
                  <th className="px-6 pb-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {storeBookings.slice(0, 6).map((booking) => (
                  <tr key={booking.id} className="group">
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all rounded-l-2xl border-y border-l border-white/5 first:rounded-l-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-[10px] text-[#00D4FF]">
                          {booking.passengerName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-white">{booking.passengerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">{booking.route}</span>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                      <span className="text-[10px] font-black text-slate-500">{booking.date}</span>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                      <span className="text-xs font-black text-[#10B981]">{booking.amount}</span>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                       <div className={`
                         px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-2
                         ${booking.status === 'active' ? 'bg-[#00D4FF]/10 text-[#00D4FF]' : 
                           booking.status === 'completed' ? 'bg-[#10B981]/10 text-[#10B981]' : 
                           'bg-red-500/10 text-red-500'}
                       `}>
                          <div className={`w-1 h-1 rounded-full animate-pulse ${
                            booking.status === 'active' ? 'bg-[#00D4FF]' : 
                            booking.status === 'completed' ? 'bg-[#10B981]' : 'bg-red-500'
                          }`} />
                          {booking.status === 'active' ? 'АКТИВНИЙ' : booking.status === 'completed' ? 'ЗАВЕРШЕНО' : 'СКАСОВАНО'}
                       </div>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-right border-white/5 rounded-r-2xl text-right">
                       <button className="p-2 text-slate-600 hover:text-white transition-colors">
                          <Search size={14} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </motion.div>
    </div>
  );
};

export default DashboardTab;
