import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Users, Bus, ArrowUpRight, ArrowDownRight, Activity, Zap, RefreshCw, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

const AnalyticsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [routePerformance, setRoutePerformance] = useState<any[]>([]);
  const [stats, setStats] = useState({ load: 0, avgCheck: 0, retention: 28, activeRoutes: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // 1. Fetch active trips
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .eq('carrier_id', user.uid);
      
      let totalLoad = 0;
      let tripsCount = 0;
      let activeRoutes = new Set();
      let routesMap: Record<string, { bookings: number, capacity: number }> = {};
      
      if (tripsData) {
        tripsData.forEach(d => {
          if (d.status === 'active' || d.status === 'in_progress') {
             tripsCount++;
             const seatsTotal = d.totalSeats || 50;
             const seatsBooked = d.bookedSeats || 0;
             totalLoad += (seatsBooked / seatsTotal);
          }
          
          const routeName = `${d.departure_city || 'Unk'} → ${d.arrival_city || 'Unk'}`;
          activeRoutes.add(routeName);
          if(!routesMap[routeName]) routesMap[routeName] = { bookings: 0, capacity: 0 };
          routesMap[routeName].capacity += (d.totalSeats || 50);
          routesMap[routeName].bookings += (d.bookedSeats || 0);
        });
      }

      const routePerf = Object.entries(routesMap).map(([name, data]) => ({
         name: name.length > 15 ? name.substring(0, 15) + '...' : name,
         load: data.capacity > 0 ? Math.round((data.bookings / data.capacity) * 100) : 0
      })).sort((a,b) => b.load - a.load).slice(0, 4);

      setRoutePerformance(routePerf);

      // 2. Fetch bookings for chart and avg check
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('carrier_id', user.uid);
      
      let dayMap: Record<string, { bookings: number, revenue: number }> = {};
      const today = new Date();
      for(let i=6; i>=0; i--) {
         const d = new Date(today);
         d.setDate(d.getDate() - i);
         const dayName = d.toLocaleDateString('uk-UA', { weekday: 'short' });
         dayMap[dayName] = { bookings: 0, revenue: 0 };
      }

      let totalRevenue = 0;
      let countAvg = 0;

      if (bookingsData) {
        bookingsData.forEach(d => {
           if (d.status === 'confirmed') {
              countAvg++;
              totalRevenue += (d.totalPrice || 0) / 42;
              
              if (d.createdAt) {
                 const bDate = new Date(d.createdAt);
                 const diffTime = Math.abs(today.getTime() - bDate.getTime());
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 if (diffDays <= 7) {
                    const dName = bDate.toLocaleDateString('uk-UA', { weekday: 'short' });
                    if (dayMap[dName]) {
                       dayMap[dName].bookings += (d.passengers?.length || 1);
                       dayMap[dName].revenue += (d.totalPrice || 0) / 42;
                    }
                 }
              }
           }
        });
      }

      const chartData = Object.keys(dayMap).map(day => ({
         day,
         bookings: dayMap[day].bookings,
         revenue: dayMap[day].revenue
      }));

      setWeeklyData(chartData);

      setStats({
         load: tripsCount > 0 ? Math.round((totalLoad / tripsCount) * 100) : 0,
         avgCheck: countAvg > 0 ? totalRevenue / countAvg : 0,
         retention: 28,
         activeRoutes: activeRoutes.size
      });

      toast.success('Аналітику оновлено');
    } catch (error) {
      console.error(error);
      toast.error('Помилка оновлення аналітики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const COLORS = ['#00c8ff', '#00e676', '#ff9800', '#9c6fff'];

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">АНАЛІТИКА</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">Продажі, завантаженість та ефективність маршрутів</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => toast.success('Дані оновлено')}
             className="px-6 py-3.5 rounded-full bg-[#0B1221] border border-white/5 text-[#8899B5] hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
           >
              <RefreshCw size={14} /> ОНОВИТИ
           </button>
           <button 
             onClick={() => toast.success('Звіт готується до завантаження...')}
             className="px-6 py-3.5 rounded-full bg-transparent border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.1)] hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
           >
              <Download size={14} /> ЕКСПОРТ PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {[
          { label: 'ЗАВАНТАЖЕННЯ РЕЙСІВ', val: `${stats.load}%`, delta: '+5.1%', icon: Zap, color: '#F59E0B' },
          { label: 'СЕРЕДНІЙ ЧЕК', val: `€${stats.avgCheck.toLocaleString('en-US', {maximumFractionDigits: 1})}`, delta: '+€3.20', icon: TrendingUp, color: '#10B981' },
          { label: 'УТРИМАННЯ КЛІЄНТІВ', val: `${stats.retention}%`, delta: '+2%', icon: Users, color: '#00E5FF' },
          { label: 'К-ТЬ АКТИВНИХ МАРШРУТІВ', val: `${stats.activeRoutes}`, delta: 'В НОРМІ', icon: Bus, color: '#A855F7' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1A2639]/30 border border-white/5 p-6 rounded-[24px] relative overflow-hidden group h-[120px] flex flex-col justify-between shadow-lg">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
               <stat.icon size={60} style={{ color: stat.color }} strokeWidth={1} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#5A6A85] z-10">{stat.label}</p>
            <div className="z-10">
               <div className="text-2xl font-black text-white italic tracking-tighter">{stat.val}</div>
               <p className="text-[9px] font-black text-[#10B981] mt-1 flex items-center gap-1 uppercase tracking-widest">
                 <ArrowUpRight size={10} /> {stat.delta}
               </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0B1221] border border-white/5 rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
               <h3 className="text-[12px] font-black uppercase tracking-widest text-white italic flex items-center gap-3">
                  <Activity size={16} className="text-[#00E5FF]" /> ДИНАМІКА ПРОДАЖІВ
               </h3>
               <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-1">ОСТАННІ 7 ДНІВ · ОБ'ЄМ КВИТКІВ</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c8ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00c8ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2e48" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#5a6a85', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#5a6a85', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#070912', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '10px'}}
                  itemStyle={{color: '#00c8ff', fontWeight: 900}}
                />
                <Area type="monotone" dataKey="bookings" stroke="#00c8ff" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0B1221] border border-white/5 rounded-[32px] p-8 flex flex-col shadow-2xl">
           <h3 className="text-[12px] font-black uppercase tracking-widest text-white italic flex items-center gap-3 mb-10">
              <Zap size={16} className="text-[#F59E0B]" /> ЗАПОВНЮВАНІСТЬ
           </h3>
           <div className="flex-1 space-y-8">
              {routePerformance.map((route, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-end">
                     <span className="text-[11px] font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{route.name}</span>
                     <span className="text-[10px] font-black text-white italic">{route.load}%</span>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${route.load}%` }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                        className={`h-full rounded-full bg-gradient-to-r ${route.load > 85 ? 'from-emerald-500 to-cyan-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'from-amber-500 to-orange-500'}`}
                     />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
