/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, CheckCircle2, Users, Star, 
  TrendingUp, Info, ChevronRight, Plus,
  MapPin, Clock, Edit3, Trash2, Bus, AlertCircle, Brain, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { busnetService } from '../../services/busnetService';
import { RouteTemplate } from '../../busnet/types';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';

export default function CarrierDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [routes, setRoutes] = useState<RouteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState({
    revenue: 0,          
    revenueTotal: 0,     
    tripsCount: 0,
    passengers: 0,
    rating: 5.0,
    chart: [] as { name: string, date: string, rev: number }[],
    activeTripsLive: [] as any[]
  });

  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const currency = (user as any)?.currency || '€';
    return (
      <div className="bg-[#050B14] border border-[#00E5FF]/20 rounded-lg p-2 text-[10px]">
        <p className="text-[#8899B5] font-bold mb-1">{label}</p>
        <p className="text-[#00E5FF] font-black">{currency}{payload[0]?.value?.toLocaleString()}</p>
      </div>
    );
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardStats = async () => {
      try {
        const now = new Date();
        const since = new Date();
        since.setDate(now.getDate() - 6);
        since.setHours(0, 0, 0, 0);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(since);
          d.setDate(since.getDate() + i);
          return d.toISOString().split('T')[0];
        });

        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('total_price, passengers, created_at')
          .eq('carrier_id', user!.uid)
          .eq('status', 'confirmed')
          .gte('created_at', since.toISOString())
          .lte('created_at', now.toISOString());

        if (bookingsError) throw bookingsError;

        let totalRevenue7d = 0;
        let totalPassengers = 0;
        const dailyRevMap: Record<string, number> = {};

        last7Days.forEach(date => dailyRevMap[date] = 0);

        (bookings || []).forEach(booking => {
          const amount = (booking.total_price || 0);
          totalRevenue7d += amount;
          let passengers = booking.passengers;
          if (typeof passengers === 'string') {
            try { passengers = JSON.parse(passengers); } catch (e) { passengers = []; }
          }
          totalPassengers += (Array.isArray(passengers) ? passengers.length : 0);

          const createdAt = booking.created_at;
          if (createdAt) {
            const dateKey = typeof createdAt === 'string' ? createdAt.split('T')[0] : new Date(createdAt).toISOString().split('T')[0];
            if (dailyRevMap[dateKey] !== undefined) {
              dailyRevMap[dateKey] += amount;
            }
          }
        });

        const { data: allBookings, error: allBookingsError } = await supabase
          .from('bookings')
          .select('total_price')
          .eq('carrier_id', user!.uid)
          .eq('status', 'confirmed');

        if (allBookingsError) throw allBookingsError;

        const revenueTotal = (allBookings || []).reduce((acc, b) => acc + (b.total_price || 0), 0);

        const dayLabels = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const chart = last7Days.map(dateStr => {
          const date = new Date(dateStr);
          return {
            name: dayLabels[date.getDay()],
            date: dateStr,
            rev: Math.round(dailyRevMap[dateStr] || 0),
          };
        });

        setLiveStats(prev => ({
          ...prev,
          revenue: Math.round(totalRevenue7d),
          revenueTotal: Math.round(revenueTotal),
          passengers: totalPassengers,
          chart
        }));

        const { data: trips, error: tripsError } = await supabase
          .from('routes')
          .select('*')
          .eq('carrier_id', user!.uid)
          .eq('status', 'active');

        if (tripsError) throw tripsError;

        if (trips) {
          const today = now.toISOString().split('T')[0];
          const activeToday = trips.filter((t: any) => (t.departure_date || t.departureDate) === today);

          setLiveStats(prev => ({ 
            ...prev, 
            tripsCount: trips.length,
            activeTripsLive: activeToday
          }));
        }
        
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('carrier_id', user!.uid);

        if (reviewsError) throw reviewsError;

        if (reviews && reviews.length > 0) {
          const avg = reviews.reduce((acc, d) => acc + (d.rating || 5), 0) / reviews.length;
          setLiveStats(prev => ({ ...prev, rating: Number(avg.toFixed(1)) }));
        }

        setError(null);
      } catch (err: any) {
        console.error('Dashboard stats fetch error:', err);
        setError(`Помилка завантаження даних дашборду. Перевірте з'єднання.`);
      }
    };

    fetchDashboardStats();
    
    const channel = supabase.channel(`carrier_dashboard_stats_${user.uid}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `carrier_id=eq.${user.uid}` }, fetchDashboardStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes', filter: `carrier_id=eq.${user.uid}` }, fetchDashboardStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `carrier_id=eq.${user.uid}` }, fetchDashboardStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    loadRoutes();
  }, [user]);

  const loadRoutes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await busnetService.getMyRouteTemplates();
      setRoutes(data);
    } catch (err: any) {
      console.error('Load routes error:', err);
      toast.error('Не вдалося завантажити маршрути');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoute = (route: RouteTemplate) => {
    navigate('/newtrip', { state: { editRoute: route } });
  };

  const handleDeleteRoute = async (route: RouteTemplate) => {
    const confirmed = confirm(`Видалити маршрут "${route.name}"?\n\nЦю дію неможливо скасувати.`);
    if (!confirmed) return;

    setDeletingRouteId(route.id);
    try {
      await busnetService.deleteRouteTemplate(route.id);
      toast.success(`Маршрут "${route.name}" видалено`);
      loadRoutes();
    } catch (error: any) {
      if (error.message?.includes('доступ заборонено') || error.message?.includes('not found')) {
        toast.error('Ви не можете видалити цей маршрут');
      } else {
        toast.error('Помилка при видаленні. Спробуйте ще раз.');
      }
    } finally {
      setDeletingRouteId(null);
    }
  };

  // Mock data for AI banner chart
  const aiChartData = [
    { name: 'Пн', value: 20 }, { name: 'ВТ', value: 45 }, { name: 'СР', value: 30 },
    { name: 'ЧТ', value: 80 }, { name: 'ПТ', value: 65 }, { name: 'СБ', value: 100 },
    { name: 'НД', value: 85 }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans bg-transparent min-h-screen text-white">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-syne font-black italic uppercase tracking-tighter text-white mb-1">
            Дашборд перевізника
          </h2>
          <p className="text-[11px] text-[#8899B5] uppercase tracking-widest font-medium flex items-center gap-2">
            {user?.companyName || 'AI TRANS'} · Травень 2026 · Активний акаунт 
            <span className="text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
              [Оптимізовано AI]
            </span>
          </p>
        </div>
        <button 
          onClick={() => navigate('/newtrip')}
          className="px-6 py-2.5 bg-gradient-to-r from-[#00E5FF]/20 to-[#00E5FF]/10 border border-[#00E5FF]/50 text-[#00E5FF] hover:bg-[#00E5FF]/30 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)]"
        >
          <Plus size={16} /> <span className="hidden md:inline-block">Створити маршрут</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-bold flex items-center gap-3">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* AI Banner */}
      <div className="bg-[#0B1221] border border-[#00E5FF]/30 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_20px_rgba(0,229,255,0.05)]">
        {/* Background decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/10 to-transparent pointer-events-none" />
        
        <div className="flex items-start gap-4 z-10 flex-1">
          <div className="w-12 h-12 rounded-xl bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] border border-[#00E5FF]/40 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-[#00E5FF] font-black text-sm uppercase tracking-widest mb-1 shadow-[#00E5FF]">
              Інтелектуальний помічник Busnet AI
            </h3>
            <p className="text-[#8899B5] text-[11px] mb-2 font-medium">
              Live-streaming трафіку, гео локаційні, предикативні AI оптимізації і маршрутування
            </p>
            <p className="text-[#00E5FF] text-[10px] font-bold bg-[#00E5FF]/10 inline-block px-2 py-1 rounded">
              AI Рекомендація: Збільшити частоту на маршруті №14 за рахунок №18 (+20% доходу прогнозовано)
            </p>
          </div>
        </div>
        <div className="h-24 md:h-16 w-full md:w-[300px] z-10 opacity-70">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={aiChartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <motion.div 
          whileHover={{ y: -5, borderColor: 'rgba(0, 229, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#0B1221] border border-[#1A2639] rounded-2xl p-5 transition-all flex flex-col justify-between h-[150px] relative overflow-hidden group cursor-pointer shadow-xl"
        >
          <div className="flex justify-between items-start">
            <span className="text-[#8899B5] text-[11px] uppercase font-bold tracking-widest">Дохід</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp size={10} /> +18%
            </span>
          </div>
          <div className="text-2xl md:text-4xl font-black text-white group-hover:text-[#00E5FF] transition-colors">{(user as any)?.currency || '€'}{liveStats.revenueTotal.toLocaleString()}</div>
          <div className="h-12 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={liveStats.chart.slice(-7)}>
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,229,255,0.05)'}} />
                <Bar dataKey="rev" fill="#00E5FF" radius={[2,2,0,0]}>
                  {liveStats.chart.slice(-7).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === liveStats.chart.slice(-7).length - 1 ? '#00E5FF' : '#1A2639'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 2: Active Trips */}
        <motion.div 
          whileHover={{ y: -5, borderColor: 'rgba(0, 229, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#0B1221] border border-[#1A2639] rounded-2xl p-5 transition-all flex flex-col justify-between h-[150px] relative group cursor-pointer shadow-xl"
        >
          <span className="text-[#8899B5] text-[11px] uppercase font-bold tracking-widest">Активні Рейси ({liveStats.tripsCount})</span>
          <div className="flex items-center justify-between mt-1">
            <div className="text-3xl md:text-5xl font-black text-[#00E5FF]">{liveStats.tripsCount}</div>
            <div className="relative w-16 h-16 flex items-center justify-center text-[#00E5FF]">
              <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 36 36">
                <path className="text-[#1A2639]" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-[#00E5FF]" strokeDasharray="65, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <Activity className="z-10 animate-pulse" size={20} />
            </div>
          </div>
          <div className="text-[10px] text-[#8899B5] mt-1 font-medium">{liveStats.activeTripsLive.length} в дорозі, завантажуються</div>
        </motion.div>

        {/* Card 3: Passengers */}
        <motion.div 
          whileHover={{ y: -5, borderColor: 'rgba(0, 229, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#0B1221] border border-[#1A2639] rounded-2xl p-5 transition-all flex flex-col justify-between h-[150px] relative group cursor-pointer shadow-xl"
        >
          <div className="flex justify-between items-start">
            <span className="text-[#8899B5] text-[11px] uppercase font-bold tracking-widest">Пасажирів ({liveStats.passengers})</span>
          </div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-black text-white">{liveStats.passengers}</span>
            <span className="text-[#8899B5] text-[9px] font-bold bg-[#1A2639]/50 px-2 py-0.5 rounded">Усього за травень: 1,450</span>
          </div>
          <div className="h-12 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={[
                {v: 20},{v: 40},{v: 30},{v: 80},{v: 100},{v: 60},{v: 40},{v: 20},{v: 10},{v: 5}
              ]}>
                <Bar dataKey="v" fill="#0EA5E9" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Card 4: Rating */}
        <motion.div 
          whileHover={{ y: -5, borderColor: 'rgba(0, 229, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          className="bg-[#0B1221] border border-[#1A2639] rounded-2xl p-5 transition-all flex flex-col justify-between h-[150px] relative group cursor-pointer shadow-xl"
        >
          <div className="flex justify-between items-start">
            <span className="text-[#8899B5] text-[11px] uppercase font-bold tracking-widest">Рейтинг ({liveStats.rating.toFixed(1)})</span>
            <span className="bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.2)]">СУПЕР-НАДІЙНИЙ</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-5xl font-black text-white">{liveStats.rating.toFixed(1)}</span>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(liveStats.rating) ? 'fill-[#00E5FF] text-[#00E5FF] drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]' : 'text-[#1A2639]'} />
                ))}
              </div>
              <span className="text-[9px] text-[#8899B5]">На основі 128 відгуків</span>
            </div>
          </div>
          <div className="text-[9px] text-[#00E5FF] bg-[#00E5FF]/5 p-2 rounded border border-[#00E5FF]/10 mt-auto flex gap-1.5 items-start">
            <Info size={12} className="shrink-0" />
            <span className="leading-tight">AI-рекомендація: Збільшити кількість рейсів на вихідні.</span>
          </div>
        </motion.div>

      </div>

      {/* Routes Section */}
      <div>
        <h3 className="text-white font-bold text-lg uppercase tracking-tight mb-4 flex items-center gap-2">
          Ваші маршрути
        </h3>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-[#0B1221] border border-[#1A2639] animate-pulse rounded-2xl" />)}
          </div>
        ) : routes.length === 0 ? (
          <div className="bg-[#0B1221] border border-dashed border-[#1A2639] rounded-2xl p-10 text-center">
            <Plus size={32} className="text-[#8899B5] mx-auto mb-3" />
            <p className="text-[#8899B5] text-xs uppercase font-bold">У вас поки немає маршрутів</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route, index) => {
              const stops = (route as any).outbound?.stops || route.stopsThere || [];
              const time = stops[0]?.time || '--:--';
              const firstCity = stops[0]?.city || 'Київ';
              const lastCity = stops[stops.length - 1]?.city || 'Салерно';
              
              return (
                <div key={route.id} className="bg-[#0B1221] border border-[#1A2639] rounded-[24px] p-6 hover:border-[#00E5FF]/40 transition-all flex flex-col justify-between group shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  {/* Title Area */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-white font-black text-sm uppercase tracking-tight flex items-center gap-2">
                        {route.name}
                      </h4>
                      <p className="text-[#8899B5] text-[10px] uppercase font-bold mt-1.5">
                        {stops.length} зупинок · {route.direction === 'roundtrip' ? 'Туди-назад' : 'В один бік'}
                      </p>
                    </div>
                    <div className="text-[#8899B5] text-[9px] font-black uppercase bg-[#1A2639]/50 px-2.5 py-1 rounded-md border border-white/5">
                      {route.status === 'approved' ? 'Схвалено' : route.status === 'pending' ? 'Модерація' : 'Чернетка'}
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    
                    {/* Left Column: Time & Days */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-2 text-[#8899B5]">
                        <Clock size={16} />
                        <span className="text-white text-2xl font-black">{time}</span>
                      </div>
                      
                      <div className="flex gap-1.5">
                        {[0,1,2,3,4,5,6].map(d => {
                          const dayMap: Record<number, string> = { 0: 'НД', 1: 'ПН', 2: 'ВТ', 3: 'СР', 4: 'ЧТ', 5: 'ПТ', 6: 'СБ' };
                          const dayName = dayMap[d];
                          const isActive = ((route as any).outbound?.days || []).includes(dayName);
                          
                          // Different colors for active days to match design
                          const activeColors = [
                            'bg-[#1A2639] text-[#8899B5]', // Н (grey)
                            'bg-[#00E5FF] text-black shadow-[0_0_8px_rgba(0,229,255,0.4)]', // П (cyan)
                            'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]', // В (orange)
                            'bg-[#00E5FF] text-black shadow-[0_0_8px_rgba(0,229,255,0.4)]', // С (cyan)
                            'bg-fuchsia-500 text-black shadow-[0_0_8px_rgba(217,70,239,0.4)]', // Ч (pink)
                            'bg-[#0EA5E9] text-black shadow-[0_0_8px_rgba(14,165,233,0.4)]', // П (blue)
                            'bg-[#00E5FF] text-black shadow-[0_0_8px_rgba(0,229,255,0.4)]'  // С (cyan)
                          ];

                          return (
                            <div key={d} className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-black transition-colors ${isActive ? activeColors[d] : 'bg-[#1A2639] text-[#5A6A85]'}`}>
                              {['Н','П','В','С','Ч','П','С'][d]}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Right Column: Graphic & Buttons */}
                    <div className="flex flex-col items-end gap-4">
                      
                      {/* Graphic (Alternating styles) */}
                      {index % 2 === 0 ? (
                        /* Map Graphic */
                        <div className="flex flex-col items-center justify-center w-[160px] h-[70px] border border-[#1A2639]/80 rounded-xl relative bg-[#050B14]/40 overflow-hidden group-hover:border-[#00E5FF]/30 transition-colors">
                           <svg className="w-full h-full p-3" viewBox="0 0 100 40" preserveAspectRatio="none">
                             <path d="M 5 30 Q 25 5 50 20 T 95 10" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="4 2" />
                             <circle cx="5" cy="30" r="4" fill="#00E5FF" className="animate-pulse shadow-[0_0_10px_#00E5FF]" />
                             <circle cx="95" cy="10" r="4" fill="#EF4444" className="animate-pulse shadow-[0_0_10px_#EF4444]" />
                           </svg>
                           <span className="absolute top-1.5 right-2 text-[7px] text-[#8899B5] font-bold uppercase">{firstCity}</span>
                           <span className="absolute bottom-1.5 right-2 text-[7px] text-[#8899B5] font-bold uppercase">{lastCity}</span>
                        </div>
                      ) : (
                        /* Insight Graphic (Gauge) */
                        <div className="flex items-center gap-3 border border-[#1A2639]/80 rounded-xl p-2.5 bg-[#050B14]/40 group-hover:border-[#0EA5E9]/30 transition-colors">
                          <div className="relative w-10 h-10 flex items-center justify-center">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                              <path className="text-[#1A2639]" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                              <path className="text-emerald-500" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            </svg>
                            <div className="absolute w-1 h-3 bg-white origin-bottom rotate-45 rounded-full" style={{ bottom: '50%' }} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[8px] text-[#8899B5] uppercase font-bold leading-none">Швидкість оновлення<br/><span className="text-white">12 в дорозі, 5 завантажується</span></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-rose-500" />
                              <span className="text-[8px] text-[#8899B5] uppercase font-bold leading-none">Потенціал трафіку<br/><span className="text-rose-400">Трафік малий</span></span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditRoute(route)}
                          className="w-8 h-8 flex items-center justify-center bg-[#1A2639] hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] hover:border-[#00E5FF]/30 hover:shadow-[0_0_10px_rgba(0,229,255,0.2)] border border-transparent rounded-lg text-[#8899B5] transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRoute(route)}
                          disabled={deletingRouteId === route.id}
                          className="w-8 h-8 flex items-center justify-center bg-[#1A2639] hover:bg-rose-500/20 hover:text-rose-500 hover:border-rose-500/30 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)] border border-transparent rounded-lg text-[#8899B5] transition-all"
                        >
                          {deletingRouteId === route.id ? <AlertCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
