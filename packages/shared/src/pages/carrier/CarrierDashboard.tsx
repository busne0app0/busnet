/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, CheckCircle2, Users, Star, 
  TrendingUp, Info, ChevronRight, Plus,
  MapPin, Clock, Edit3, Trash2, Bus, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import OnboardingWidget from './OnboardingWidget';
import { busnetService } from '../../services/busnetService';
import { RouteTemplate } from '../../busnet/types';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

export default function CarrierDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [routes, setRoutes] = useState<RouteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState({
    revenue: 0,          // за 7 днів
    revenueTotal: 0,     // за весь час
    tripsCount: 0,
    passengers: 0,
    rating: 5.0,
    chart: [] as { name: string, date: string, rev: number }[],
    activeTripsLive: [] as any[]
  });

  const [editingRoute, setEditingRoute] = useState<RouteTemplate | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const dateStr = payload[0]?.payload?.date;
    const formattedDate = dateStr 
      ? new Date(dateStr).toLocaleDateString('uk-UA', { 
          day: 'numeric', 
          month: 'long'
        })
      : label;

    return (
      <div style={{
        backgroundColor: '#1a2235',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 12px',
        fontSize: '10px'
      }}>
        <p style={{ color: '#5a6a85', marginBottom: '4px', fontWeight: 800 }}>
          {formattedDate}
        </p>
        <p style={{ color: '#00c8ff', fontWeight: 800 }}>
          €{payload[0]?.value?.toLocaleString()}
        </p>
      </div>
    );
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardStats = async () => {
      try {
        // ─── Готуємо діапазон: останні 7 днів ───────────────────────────
        const now = new Date();
        const since = new Date();
        since.setDate(now.getDate() - 6);
        since.setHours(0, 0, 0, 0);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(since);
          d.setDate(since.getDate() + i);
          return d.toISOString().split('T')[0];
        });

        // ─── 1. Бронювання за останні 7 днів ────────────────────────────
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('totalPrice, passengers, createdAt')
          .eq('carrierId', user!.uid)
          .eq('status', 'confirmed')
          .gte('createdAt', since.toISOString())
          .lte('createdAt', now.toISOString());

        if (bookingsError) {
          toast.error('Помилка завантаження статистики бронювань');
          throw bookingsError;
        }

        let totalRevenue7d = 0;
        let totalPassengers = 0;
        const dailyRevMap: Record<string, number> = {};

        last7Days.forEach(date => {
          dailyRevMap[date] = 0;
        });

        (bookings || []).forEach(booking => {
          const amount = (booking.totalPrice || 0);
          totalRevenue7d += amount;
          totalPassengers += (booking.passengers?.length || 1);

          if (booking.createdAt) {
            const dateKey = booking.createdAt.split('T')[0];
            if (dailyRevMap[dateKey] !== undefined) {
              dailyRevMap[dateKey] += amount;
            }
          }
        });

        // ─── Рахуємо загальний дохід за весь час ────────────────────────
        const { data: allBookings, error: allBookingsError } = await supabase
          .from('bookings')
          .select('totalPrice')
          .eq('carrierId', user!.uid)
          .eq('status', 'confirmed');

        if (allBookingsError) throw allBookingsError;

        const revenueTotal = (allBookings || [])
          .reduce((acc, b) => acc + (b.totalPrice || 0), 0);

        // ─── Формуємо дані для графіка ──────────────────────────────────
        const dayLabels = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const chart = last7Days.map(dateStr => {
          const date = new Date(dateStr);
          const dayLabel = dayLabels[date.getDay()];
          const isToday = dateStr === now.toISOString().split('T')[0];

          return {
            name: isToday ? 'Сьогодні' : dayLabel,
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

        // ─── 2. Активні рейси ────────────────────────────────────────────
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .eq('carrierId', user!.uid)
          .eq('status', 'active');

        if (tripsError) throw tripsError;

        if (trips) {
          const today = now.toISOString().split('T')[0];
          const activeToday = trips.filter((t: any) => t.departureDate === today);

          setLiveStats(prev => ({ 
            ...prev, 
            tripsCount: trips.length,
            activeTripsLive: activeToday
          }));
        }
        
        // ─── 3. Рейтинг ──────────────────────────────────────────────────
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('carrierId', user!.uid);

        if (reviewsError) throw reviewsError;

        if (reviews && reviews.length > 0) {
          const avg = reviews.reduce((acc, d) => acc + (d.rating || 5), 0) / reviews.length;
          setLiveStats(prev => ({ ...prev, rating: Number(avg.toFixed(1)) }));
        }

        setError(null);
      } catch (err: any) {
        console.error('Dashboard stats fetch error:', err);
        setError('Помилка завантаження даних дашборду. Перевірте з’єднання.');
      }
    };

    fetchDashboardStats();
    
    const channel = supabase.channel(`carrier_dashboard_stats_${user.uid}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `carrierId=eq.${user.uid}` }, fetchDashboardStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `carrierId=eq.${user.uid}` }, fetchDashboardStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `carrierId=eq.${user.uid}` }, fetchDashboardStats)
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const STATS = [
    { label: 'Дохід всього', val: `€${liveStats.revenueTotal.toLocaleString()}`, sub: `За 7 днів: €${liveStats.revenue.toLocaleString()}`, delta: '+12%', icon: Wallet, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Активних рейсів', val: liveStats.tripsCount.toString(), sub: 'Сьогодні активних', delta: `+${liveStats.tripsCount}`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Пасажирів перевезено', val: liveStats.passengers.toLocaleString(), sub: 'Всього через BUSNET', delta: liveStats.passengers.toString(), icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { label: 'Рейтинг', val: liveStats.rating.toString(), sub: liveStats.rating >= 4.5 ? 'Надійний перевізник' : 'Потребує уваги', delta: '★', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ];

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
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
      console.error('Delete route error:', error);
    } finally {
      setDeletingRouteId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-syne font-black text-3xl italic tracking-tighter uppercase text-white">Дашборд перевізника</h2>
          <p className="text-[#5a6a85] text-sm font-medium mt-1 uppercase tracking-widest">Перевізник · Квітень 2026 · Активний акаунт</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              navigate('/newtrip');
            }}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-[#185FA5] text-black rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-cyan-950/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Створити маршрут
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-[28px] p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/20">
          <Info size={20} />
        </div>
        <div>
          <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-tight">Смарт-система BUSNET</h4>
          <p className="text-[#8899b5] text-xs mt-1 leading-relaxed">
            Ваші шаблони маршрутів перетворюються на реальні рейси автоматично після схвалення адміністратором.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-[#1a2235] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group hover:border-white/10 transition-all`}
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30 ${stat.color}`} />
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} border ${stat.border}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>
                {stat.delta}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">{stat.label}</p>
              <h3 className="font-syne font-black text-3xl text-white italic tracking-tighter">{stat.val}</h3>
              <p className="text-[10px] font-medium text-[#4a5a75] uppercase">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Routes List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white uppercase italic tracking-tight flex items-center gap-2">
             Ваші маршрути
             <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[10px] font-black uppercase border border-white/10">{routes.length}</span>
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="h-48 bg-white/5 animate-pulse rounded-[40px]" />)}
          </div>
        ) : routes.length === 0 ? (
          <div className="bg-[#1a2235] border border-dashed border-white/10 rounded-[40px] p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#5a6a85] mx-auto mb-4">
              <Plus size={32} />
            </div>
            <h4 className="text-white font-bold uppercase italic tracking-tight">У вас поки немає маршрутів</h4>
            <p className="text-[#5a6a85] text-xs mt-2 max-w-sm mx-auto">
              Створіть свій перший маршрут за допомогою смарт-парсера, щоб почати продавати квитки.
            </p>
            <button 
              onClick={() => navigate('/newtrip')}
              className="mt-6 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Створити перший маршрут
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {routes.map((route) => {
              const stops = (route as any).outbound?.stops || route.stopsThere || [];
              const amenities = (route as any).amenities || [];
              const rules = (route as any).rules || [];
              const discounts = (route as any).discounts || {};
              
              return (
                <motion.div 
                  key={route.id}
                  layoutId={route.id}
                  className="bg-[#1a2235] border border-white/5 rounded-[40px] p-8 group hover:border-white/10 transition-all relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-white font-bold text-xl uppercase italic tracking-tight">{route.name}</h4>
                      <p className="text-[#5a6a85] text-[10px] font-black uppercase tracking-widest mt-1">
                        {stops.length} зупинок · {route.direction === 'roundtrip' ? 'Туди-назад' : 'В один бік'}
                      </p>
                    </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    route.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    route.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {route.status === 'approved' ? 'Схвалено' : route.status === 'pending' ? 'Модерація' : 'Чернетка'}
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-8 py-4 border-y border-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#5a6a85]" />
                    <span className="text-white text-sm font-bold">
                      {stops[0]?.time || '--:--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#5a6a85]" />
                    <span className="text-[#8899b5] text-xs font-medium">
                      {stops[0]?.city || 'Не вказано'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[0,1,2,3,4,5,6].map(d => {
                        const dayMap: Record<number, string> = { 0: 'НД', 1: 'ПН', 2: 'ВТ', 3: 'СР', 4: 'ЧТ', 5: 'ПТ', 6: 'СБ' };
                        const dayName = dayMap[d];
                        const outboundDays = (route as any).outbound?.days || [];
                        const legacyDays = route.activeDays || [];
                        const isActive = outboundDays.includes(dayName) || legacyDays.includes(d);
                        
                        return (
                          <div key={d} className={`w-8 h-8 rounded-lg border-2 border-[#1a2235] flex items-center justify-center text-[8px] font-black uppercase ${
                            isActive ? 'bg-cyan-500 text-black' : 'bg-white/5 text-[#4a5a75]'
                          }`}>
                            {['Н','П','В','С','Ч','П','С'][d]}
                          </div>
                        );
                      })}
                   </div>
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditRoute(route)}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[#8899b5] hover:text-white transition-all"
                        title={`Редагувати "${route.name}"`}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRoute(route)}
                        disabled={deletingRouteId === route.id}
                        className={`p-3 bg-white/5 border border-white/10 rounded-2xl transition-all
                                   ${deletingRouteId === route.id 
                                     ? 'text-[#4a5a75] cursor-not-allowed'
                                     : 'text-[#8899b5] hover:text-rose-500 hover:border-rose-500/30'
                                   }`}
                        title={`Видалити "${route.name}"`}
                      >
                        {deletingRouteId === route.id 
                          ? <div className="w-[18px] h-[18px] border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                          : <Trash2 size={18} />
                        }
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>



      {/* Main Grid: Revenue & Active Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="bg-[#1a2235] border border-white/5 rounded-[40px] p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Дохід за 7 днів</h3>
              <p className="text-[#5a6a85] text-[10px] uppercase font-black tracking-widest mt-1">
                {(() => {
                  const since = new Date();
                  since.setDate(since.getDate() - 6);
                  return `${since.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} — 
                          ${new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}`;
                })()}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] text-[#5a6a85]">
              <TrendingUp size={20} />
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={liveStats.chart}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#5a6a85', fontSize: 10, fontWeight: 800}} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="rev" fill="#00c8ff" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Trips */}
        <div className="bg-[#1a2235] border border-white/5 rounded-[40px] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Рейси в дорозі</h3>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[10px] font-black uppercase border border-white/10">{liveStats.activeTripsLive.length} Live</span>
            </div>
            <button 
              onClick={() => navigate('/carrier/livetrips')}
              className="text-[#ff6b35] hover:text-white flex items-center gap-1.5 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              Детально <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
             {liveStats.activeTripsLive.length === 0 ? (
               <div className="text-center py-10 text-slate-500">
                  У вас немає активних рейсів в дорозі
               </div>
             ) : liveStats.activeTripsLive.map(trip => (
               <div key={trip.id} className="p-4 bg-black/20 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-[#ff6b35]/20 transition-all">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-[#ff6b35]/10 text-[#ff6b35] flex items-center justify-center animate-pulse">
                        <Bus size={18} />
                     </div>
                      <div>
                        <p className="text-xs font-bold text-white italic">{trip.name}</p>
                        <p className="text-[9px] text-[#5a6a85] font-black uppercase tracking-widest leading-none mt-1">{trip.departureCity} → {trip.arrivalCity}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Онлайн</div>
                     <div className="text-[8px] text-[#4a5a75] mt-1 uppercase">{trip.seatsBooked || 0}/{trip.seatsTotal || 50}</div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Bottom Row Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Routes */}
        <div className="bg-[#1a2235] border border-white/5 rounded-[40px] p-8">
          <h3 className="text-white font-bold uppercase italic tracking-tight mb-6">Топ маршрути</h3>
          <div className="text-center py-6 text-slate-500 text-sm">
             Немає даних
          </div>
        </div>

        {/* Payout Info */}
        <div className="bg-[#1a2235] border border-white/5 rounded-[40px] p-8">
          <h3 className="text-white font-bold uppercase italic tracking-tight mb-6">Фінанси та виплати</h3>
          <div className="space-y-4">
            {[
              { label: 'Зароблено всього', val: `€${liveStats.revenueTotal.toLocaleString()}`, color: 'text-emerald-400' },
              { label: 'Комісія BUSNET (8%)', val: `€${Math.round(liveStats.revenueTotal * 0.08).toLocaleString()}`, color: 'text-rose-400' },
              { label: 'До виплати чисто', val: `€${Math.round(liveStats.revenueTotal * 0.92).toLocaleString()}`, color: 'text-white' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <span className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">{item.label}</span>
                <span className={`text-xs font-bold ${item.color}`}>{item.val}</span>
              </div>
            ))}
            <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[9px] text-[#5a6a85] font-black uppercase tracking-widest">Статус</span>
                 <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[8px] font-black uppercase border border-white/10 tracking-tighter">Немає виплат</span>
               </div>
            </div>
            <button 
              onClick={() => navigate('/carrier/finance')}
              className="w-full mt-4 py-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-2xl text-[10px] text-white font-black uppercase tracking-widest transition-all"
            >
              Детальний звіт →
            </button>
          </div>
        </div>

        {/* Rating Details */}
        <div className="bg-[#1a2235] border border-white/5 rounded-[40px] p-8">
          <h3 className="text-white font-bold uppercase italic tracking-tight mb-6">Рейтинг за сервіс</h3>
          <div className="space-y-4">
             <div className="text-center py-6 text-slate-500 text-sm">
                Недостатньо відгуків для формування рейтингу
             </div>
            <button 
              onClick={() => navigate('/carrier/reviews')}
              className="w-full mt-6 py-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-2xl text-[10px] text-white font-black uppercase tracking-widest transition-all"
            >
              Всі відгуки →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
