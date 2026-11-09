/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Clock, Users, ArrowUpRight, Bus, Wallet, Star, Info, Plus, Handshake, Link,
  TrendingUp, ChevronRight, MapPin, Edit3, Trash2, AlertCircle, Brain, Bell, Phone, Sun, Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { busnetService } from '../../services/busnetService';
import { RouteTemplate } from '../../busnet/types';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import { isAltransCarrier, fetchAltransLiveBookings } from '../../services/altransLiveService';
// Спільний AudioContext з автоматичним розблокуванням у браузері
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
};

// Розблокуємо звук після першого кліку в будь-якому місці сайту
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  };
  window.addEventListener('click', unlockAudio, { once: true });
}

// 🔔 Гучний і дзвінкий звук "Каса / Нове бронювання"
export const playCashChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Дзвінкий приємний тембр дзвоника
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Акорд каси: 3 дзвінкі ноти
    playTone(1046.5, now, 0.35, 0.4);        // До (C6)
    playTone(1318.5, now + 0.1, 0.45, 0.5);  // Мі (E6)
    playTone(2093.0, now + 0.22, 0.8, 0.6);  // До високе (C7) - яскравий фінальний дзвін
  } catch (err) {
    console.warn('Audio play error:', err);
  }
};
// 1. Оновлення червоної цифри на іконці Windows та у заголовку вкладки
export const updateAppBadge = (count: number) => {
  try {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (count > 0) {
        (navigator as any).setAppBadge(count);
      } else {
        (navigator as any).clearAppBadge();
      }
    }

    if (typeof document !== 'undefined') {
      if (count > 0) {
        document.title = `(${count}) Нові бронювання — Busnet CARRIER`;
      } else {
        document.title = 'Busnet CARRIER';
      }
    }
  } catch (e) { }
};

// 2. Системне спливаюче вікно на робочому столі Windows
export const showDesktopNotification = (title: string, body: string) => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'new-booking'
      });

      notif.onclick = () => {
        window.focus();
      };
    }
  } catch (e) { }
};

export default function CarrierDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState({
    revenue: 0,
    revenueTotal: 0,
    tripsCount: 0,
    passengers: 0,
    passengersThisMonth: 0,
    rating: null as number | null,
    reviewsCount: 0,
    chart: [] as { name: string, date: string, rev: number }[],
    passengerChart: [] as { name: string, v: number }[],
    activeTripsLive: [] as any[]
  });

  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('busnet_theme') !== 'light');

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('busnet_theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    if (showNotifDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifDropdown]);

  const ratingBadge = useMemo(() => {
    const rating = liveStats.rating;
    if (rating === null || liveStats.reviewsCount === 0) {
      return { text: 'НЕМАЄ ВІДГУКІВ', color: 'bg-white/5 text-[#8899B5] border border-white/10 text-[9px] font-black px-2 py-0.5 rounded-full' };
    }
    if (rating < 3.0) return { text: 'ПОТРЕБУЄ УВАГИ', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.2)]' };
    if (rating < 4.0) return { text: 'ДОБРЕ', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)]' };
    return { text: 'СУПЕР-НАДІЙНИЙ', color: 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.2)]' };
  }, [liveStats.rating, liveStats.reviewsCount]);

  const aiRecommendation = useMemo(() => {
    if (routes.length === 0) {
      return {
        dashboard: "AI Рекомендація: Створіть перший маршрут, щоб запустити аналіз Busnet AI",
        rating: "AI-рекомендація: Залучіть більше пасажирів для збору перших відгуків."
      };
    }
    const mostPopular = routes[0]?.name || 'основному маршруті';
    const hasManyRoutes = routes.length > 1;
    const alternative = hasManyRoutes ? routes[1]?.name : '';

    return {
      dashboard: hasManyRoutes
        ? `AI Рекомендація: Збільшити частоту на "${mostPopular}" за рахунок зменшення інтервалів на "${alternative}" (+22% доходу прогнозовано)`
        : `AI Рекомендація: Додайте рейс на вихідні для "${mostPopular}", прогнозується ріст попиту на 18%`,
      rating: `AI-рекомендація: Зверніть увагу на відгуки для "${mostPopular}" для підвищення лояльності.`
    };
  }, [routes]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#050B14] border border-[#00E5FF]/20 rounded-lg p-2 text-[10px]">
        <p className="text-[#8899B5] font-bold mb-1">{label}</p>
        <p className="text-[#00E5FF] font-black">{payload[0]?.value?.toLocaleString('uk-UA')} грн</p>
      </div>
    );
  };

  useEffect(() => {
    if (!user) return;

    const fetchBookingsStats = async () => {
      try {
        const now = new Date();
        const since = new Date();
        since.setUTCDate(now.getUTCDate() - 6);
        since.setUTCHours(0, 0, 0, 0);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(since);
          d.setUTCDate(since.getUTCDate() + i);
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
        const dailyPassengersMap: Record<string, number> = {};

        last7Days.forEach(date => {
          dailyRevMap[date] = 0;
          dailyPassengersMap[date] = 0;
        });

        (bookings || []).forEach(booking => {
          const amount = (booking.total_price || 0);
          totalRevenue7d += amount;
          const passengers = booking.passengers;
          const passengersCount = Array.isArray(passengers) ? passengers.length : 0;
          totalPassengers += passengersCount;

          const createdAt = booking.created_at;
          if (createdAt) {
            const dateKey = typeof createdAt === 'string' ? createdAt.split('T')[0] : new Date(createdAt).toISOString().split('T')[0];
            if (dailyRevMap[dateKey] !== undefined) {
              dailyRevMap[dateKey] += amount;
              dailyPassengersMap[dateKey] += passengersCount;
            }
          }
        });

        const { data: allBookings, error: allBookingsError } = await supabase
          .from('bookings')
          .select('total_price, passengers, created_at')
          .eq('carrier_id', user!.uid)
          .eq('status', 'confirmed');

        if (allBookingsError) throw allBookingsError;

        let mergedAllBookings = allBookings || [];


        // Підтягуємо останні 5 реальних замовлень для дзвіночка
        const latest5 = (mergedAllBookings || [])
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 5);
        setRecentBookings(latest5);

        const revenueTotal = (mergedAllBookings || []).reduce((acc, b) => acc + (b.total_price || 0), 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let passengersThisMonth = 0;
        (mergedAllBookings || []).forEach(booking => {
          const bookingDate = new Date(booking.created_at || (booking as any).createdAt);
          if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
            const passengers = booking.passengers;
            passengersThisMonth += (Array.isArray(passengers) ? passengers.length : 0);
          }
        });

        const dayLabels = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const chart = last7Days.map(dateStr => {
          const date = new Date(dateStr);
          return {
            name: dayLabels[date.getDay()],
            date: dateStr,
            rev: Math.round(dailyRevMap[dateStr] || 0),
          };
        });

        const passengerChart = last7Days.map(dateStr => {
          const date = new Date(dateStr);
          return {
            name: dayLabels[date.getDay()],
            v: dailyPassengersMap[dateStr] || 0
          };
        });

        setLiveStats(prev => ({
          ...prev,
          revenue: Math.round(totalRevenue7d),
          revenueTotal: Math.round(revenueTotal),
          passengers: totalPassengers,
          passengersThisMonth,
          chart,
          passengerChart
        }));
      } catch (err) {
        console.error('Bookings stats error:', err);
      }
    };

    const fetchTripsStats = async () => {
      try {
        const { data: trips, error: tripsError } = await supabase
          .from('routes')
          .select('*')
          .eq('carrier_id', user!.uid)
          .eq('status', 'active');

        if (tripsError) throw tripsError;

        if (trips) {
          const today = new Date().toISOString().split('T')[0];
          const activeToday = trips.filter((t: any) => (t.departure_date || t.departureDate) === today);

          setLiveStats(prev => ({
            ...prev,
            tripsCount: trips.length,
            activeTripsLive: activeToday
          }));
        }
      } catch (err) {
        console.error('Trips stats error:', err);
      }
    };

    const fetchReviewsStats = async () => {
      try {
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('carrier_id', user!.uid);

        if (reviewsError) throw reviewsError;

        const v = (reviews ?? []).map(x => Number(x.rating)).filter(Number.isFinite);
        if (v.length > 0) {
          const avg = Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
          setLiveStats(prev => ({ ...prev, rating: avg, reviewsCount: v.length }));
        } else {
          setLiveStats(prev => ({ ...prev, rating: null, reviewsCount: 0 }));
        }
      } catch (err) {
        console.error('Reviews stats error:', err);
      }
    };

    fetchBookingsStats();
    fetchTripsStats();
    fetchReviewsStats();

    const carrierUid = user.uid || (user as any).id;

    // Підписка на нові бронювання з перевіркою та відтворенням звуку
    const channel = supabase
      .channel(`carrier_realtime_${carrierUid}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          const b = payload.new as any;
          if (!b) return;

          // Якщо бронювання стосується нашого перевізника
          if (b.carrier_id === carrierUid) {
            if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && b.status === 'confirmed')) {
              playCashChime(); // 🔔 Грає дзвінок каси!

              const passengerName = b.passengers?.[0]?.lastName || b.passengers?.[0]?.firstName || 'Пасажир';
              const priceText = b.currency === 'EUR' ? `€${b.total_price}` : `${b.total_price} грн`;

              // 🔴 1. З'являється червона цифра на іконці знизу в Windows:
              updateAppBadge(recentBookings.length + 1);

              // 🖥️ 2. Випливає системне вікно на робочому столі Windows:
              showDesktopNotification(
                '🔔 Нове бронювання на Busnet!',
                `${b.route_from || 'Рейс'} ➔ ${b.route_to || ''} (${priceText})\nПасажир: ${passengerName}`
              );

              toast.success(`🔔 НОВЕ БРОНЮВАННЯ!\n${b.route_from || 'Рейс'} ➔ ${b.route_to || ''} (${priceText})\nПасажир: ${passengerName}`, {
                duration: 9000,
                position: 'top-right',
                icon: '💰'
              });

              setRecentBookings(prev => [b, ...prev]);
              fetchBookingsStats();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routes', filter: `carrier_id=eq.${carrierUid}` },
        fetchTripsStats
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews', filter: `carrier_id=eq.${carrierUid}` },
        fetchReviewsStats
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadRoutes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: routesErr } = await supabase
        .from('routes')
        .select('*')
        .eq('carrier_id', user.uid)
        .order('created_at', { ascending: false });
      if (routesErr) throw routesErr;

      const parseField = (field: any, defaultVal: any) => {
        if (typeof field === 'string') {
          try { return JSON.parse(field); } catch { return field; }
        }
        return field ?? defaultVal;
      };

      const parsed = (data || []).map(r => ({
        ...r,
        outbound: parseField(r.outbound, { stops: [], days: [] }),
        inbound: parseField(r.inbound, { stops: [], days: [] }),
        amenities: parseField(r.amenities, []),
        rules: parseField(r.rules, []),
      }));

      setRoutes(parsed);
    } catch (err: any) {
      console.error('Load routes error:', err);
      toast.error('Не вдалося завантажити маршрути');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoute = (route: any) => {
    ['busnet_trip_draft', 'busnet_current_step'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('busnet_editing_route_id', route.id);
    localStorage.setItem('busnet_editing_route_status', route.status || 'pending');
    navigate(`/newtrip?edit=${route.id}`, { state: { editRoute: route } });
  };

  const executeDeleteRoute = async (routeId: string, routeName: string) => {
    setDeletingRouteId(routeId);
    try {
      const { error: delErr } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId)
        .eq('carrier_id', user?.uid);
      if (delErr) throw delErr;
      toast.success(`Маршрут "${routeName}" видалено`);
      loadRoutes();
    } catch (error: any) {
      toast.error('Помилка при видаленні маршруту');
    } finally {
      setDeletingRouteId(null);
    }
  };

  const handleDeleteRoute = (route: any) => {
    toast((t) => (
      <div className="flex items-center justify-between gap-3 min-w-[220px]">
        <span className="text-xs font-bold text-white truncate">Видалити {route.name}?</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDeleteRoute(route.id, route.name);
            }}
            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[10px] font-black uppercase transition-all"
          >
            Так
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-md text-[10px] font-bold uppercase transition-all"
          >
            Ні
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  // Mock data for AI banner chart
  const aiChartData = [
    { name: 'Пн', value: 20 }, { name: 'ВТ', value: 45 }, { name: 'СР', value: 30 },
    { name: 'ЧТ', value: 80 }, { name: 'ПТ', value: 65 }, { name: 'СБ', value: 100 },
    { name: 'НД', value: 85 }
  ];

  const currentDateStr = new Date().toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });

  return (
    <div className={`space-y-6 pb-12 font-sans min-h-screen transition-colors duration-500 ${isDark ? 'bg-transparent text-white' : 'bg-slate-100 text-slate-900'}`}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-syne font-black italic uppercase tracking-tighter text-white mb-1">
            Дашборд перевізника
          </h2>
          <p className="text-[11px] text-[#8899B5] uppercase tracking-widest font-medium flex items-center gap-2">
            {user?.companyName || 'AL-TRANS'} · <span className="capitalize">{currentDateStr}</span> · Акаунт
            <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              API Аль-Транс: В мережі
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 relative">
          {/* Дзвіночок швидких сповіщень на дашборді */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                updateAppBadge(0);
              }}
              className="w-10 h-10 rounded-full bg-[#0B1221] border border-[#00E5FF]/30 hover:border-[#00E5FF] flex items-center justify-center text-[#00E5FF] transition-all shadow-[0_0_15px_rgba(0,229,255,0.15)] relative"
              title="Сповіщення про бронювання"
            >
              <Bell size={18} />
              {liveStats.passengers > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
                  {liveStats.passengers}
                </span>
              )}
            </button>

            {/* Випадаюче вікно сповіщень */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-12 w-80 bg-[#0B1221] border border-cyan-500/30 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Bell size={14} className="text-[#00E5FF]" /> Останні бронювання
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold">{recentBookings.length} нових</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide">
                  {recentBookings.length === 0 ? (
                    <p className="text-[11px] text-slate-500 text-center py-6 font-bold uppercase tracking-wider">
                      Немає нових бронювань
                    </p>
                  ) : (
                    recentBookings.map((b, i) => {
                      const pax = Array.isArray(b.passengers) ? b.passengers[0] : null;
                      const paxName = pax ? `${pax.firstName || ''} ${pax.lastName || ''}`.trim() : (b.route_from || 'Пасажир');
                      const dateFormatted = b.departure_date ? new Date(b.departure_date).toLocaleDateString('uk-UA') : '';
                      return (
                        <div
                          key={b.id || i}
                          onClick={() => {
                            setShowNotifDropdown(false);
                            // Перемикаємо вкладку через подію кабінету або через URL-параметр
                            window.dispatchEvent(new CustomEvent('switch-carrier-tab', { detail: 'passengers' }));
                            const url = new URL(window.location.href);
                            url.searchParams.set('tab', 'passengers');
                            window.history.pushState({}, '', url.toString());
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {b.route_from && b.route_to ? `${b.route_from} ➔ ${b.route_to}` : (b.route_name || 'Рейс Україна — Італія')}
                            </span>
                            <span className="text-xs font-black text-cyan-400">
                              {Number(b.total_price || 0).toLocaleString('uk-UA')} грн
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 font-medium">Пасажир: {paxName}</p>
                          <p className="text-[9px] text-slate-500 mt-1 font-mono">
                            {dateFormatted} {b.departure_time ? `(${b.departure_time})` : ''} · Квиток {b.id}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Перемикач теми День / Ніч */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-[#0B1221] border border-white/10 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-all shadow-lg shrink-0"
            title={isDark ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-cyan-400" />}
          </button>

          <button
            onClick={() => {
              ['busnet_trip_draft', 'busnet_current_step', 'busnet_editing_route_id', 'busnet_editing_route_status']
                .forEach(k => localStorage.removeItem(k));
              navigate('/newtrip');
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-[#00E5FF]/20 to-[#00E5FF]/10 border border-[#00E5FF]/50 text-[#00E5FF] hover:bg-[#00E5FF]/30 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)]"
          >
            <Plus size={16} />
            <span className="hidden sm:inline-block">Створити маршрут</span>
            <span className="inline-block sm:hidden">Створити</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-bold flex items-center gap-3">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* AI Banner */}
      <div className={`rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 transition-all border ${isDark ? 'bg-[#0B1221] border-[#00E5FF]/30 shadow-[0_0_20px_rgba(0,229,255,0.05)]' : 'bg-white border-cyan-500/20 shadow-lg shadow-cyan-500/5'}`}>
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
              {aiRecommendation.dashboard}
            </p>
          </div>
        </div>
        <div className="h-24 md:h-16 w-full md:w-[300px] z-10 opacity-70">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={aiChartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Revenue */}
        <motion.div
          whileHover={{ y: -5, borderColor: 'rgba(0, 229, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.dispatchEvent(new CustomEvent('switch-carrier-tab', { detail: 'finances' }))}
          className={`rounded-2xl p-5 transition-all flex flex-col justify-between h-[150px] relative overflow-hidden group cursor-pointer shadow-xl border ${isDark ? 'bg-[#0B1221] border-[#1A2639]' : 'bg-white border-slate-200 shadow-slate-200/50'}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[#8899B5] text-[11px] uppercase font-bold tracking-widest">Загальний дохід</span>
            {liveStats.revenueTotal > 0 ? (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp size={10} /> За весь час
              </span>
            ) : (
              <span className="bg-white/5 text-[#8899B5] border border-white/10 text-[9px] font-black px-2 py-0.5 rounded-full">
                Немає продажів
              </span>
            )}
          </div>
          <div className="text-2xl md:text-4xl font-black text-white group-hover:text-[#00E5FF] transition-colors">{liveStats.revenueTotal.toLocaleString('uk-UA')} <span className="text-lg font-bold text-[#00E5FF]">грн</span></div>
          {/* Фінансовий статус: Каса та До виплати */}
          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold">
            <span className="text-slate-400">Каса: <span className="text-white">{liveStats.revenueTotal.toLocaleString('uk-UA')} грн</span></span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-emerald-400">До виплати: <span>{liveStats.revenueTotal.toLocaleString('uk-UA')} грн</span></span>
          </div>
          <div className="h-12 w-full mt-2 relative">
            {liveStats.revenueTotal === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[#8899B5] uppercase font-bold tracking-widest text-center">
                Немає даних за цей період
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={liveStats.chart.slice(-7)}>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,229,255,0.05)' }} />
                  <Bar dataKey="rev" fill="#00E5FF" radius={[2, 2, 0, 0]}>
                    {liveStats.chart.slice(-7).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === liveStats.chart.slice(-7).length - 1 ? '#00E5FF' : '#1A2639'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Card 2: Active Trips */}
        <motion.div
          whileHover={{ y: -5, borderColor: 'rgba(0, 229, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          className={`rounded-2xl p-5 transition-all flex flex-col justify-between h-[150px] relative group cursor-pointer shadow-xl border ${isDark ? 'bg-[#0B1221] border-[#1A2639]' : 'bg-white border-slate-200 shadow-slate-200/50'}`}
        >
          <span className="text-[#8899B5] text-[11px] uppercase font-bold tracking-widest">Активні маршрути</span>
          <div className="flex items-center justify-between mt-1">
            <div className="text-3xl md:text-5xl font-black text-[#00E5FF]">{liveStats.tripsCount}</div>
            <div className="relative w-16 h-16 flex items-center justify-center text-[#00E5FF]">
              <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 36 36">
                <path className="text-[#1A2639]" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-[#00E5FF]" strokeDasharray={`${liveStats.tripsCount > 0 ? Math.min(100, Math.round((liveStats.tripsCount / 10) * 100)) : 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <Activity className="z-10 animate-pulse" size={20} />
            </div>
          </div>
          <div className="text-[10px] text-[#8899B5] mt-1 font-medium">Маршрутів на платформі</div>
        </motion.div>

        {/* Card 3: Passengers */}
        <motion.div
          whileHover={{ y: -5, borderColor: 'rgba(0, 229, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.dispatchEvent(new CustomEvent('switch-carrier-tab', { detail: 'passengers' }))}
          className={`rounded-2xl p-5 transition-all flex flex-col justify-between h-[150px] relative group cursor-pointer shadow-xl border ${isDark ? 'bg-[#0B1221] border-[#1A2639]' : 'bg-white border-slate-200 shadow-slate-200/50'}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[#8899B5] text-[11px] uppercase font-bold tracking-widest">Пасажирів ({liveStats.passengers})</span>
          </div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-black text-white">{liveStats.passengers}</span>
            <span className="text-[#8899B5] text-[9px] font-bold bg-[#1A2639]/50 px-2 py-0.5 rounded">Усього за цей місяць: {liveStats.passengersThisMonth.toLocaleString('uk-UA')}</span>
          </div>
          <div className="h-12 w-full mt-auto">
            {liveStats.passengers === 0 ? (
              <div className="h-full flex items-center justify-center text-[9px] text-[#8899B5] uppercase font-bold tracking-widest">Немає даних</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={liveStats.passengerChart}>
                  <Bar dataKey="v" fill="#0EA5E9" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Card 4: Rating */}
        <motion.div
          whileHover={{ y: -5, borderColor: 'rgba(0, 229, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          className={`rounded-2xl p-5 transition-all flex flex-col justify-between h-[150px] relative group cursor-pointer shadow-xl border ${isDark ? 'bg-[#0B1221] border-[#1A2639]' : 'bg-white border-slate-200 shadow-slate-200/50'}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[#8899B5] text-[11px] uppercase font-bold tracking-widest">
              Рейтинг {liveStats.rating !== null ? `(${liveStats.rating.toFixed(1)})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-5xl font-black text-white">
              {liveStats.rating !== null ? liveStats.rating.toFixed(1) : '—'}
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={liveStats.rating !== null && i < Math.round(liveStats.rating) ? 'fill-[#00E5FF] text-[#00E5FF] drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]' : 'text-[#1A2639]'}
                  />
                ))}
              </div>
              <span className="text-[9px] text-[#8899B5]">На основі {liveStats.reviewsCount} відгуків</span>
            </div>
          </div>
          <div className="text-[9px] text-[#00E5FF] bg-[#00E5FF]/5 p-2 rounded border border-[#00E5FF]/10 mt-auto flex gap-1.5 items-start">
            <Info size={12} className="shrink-0" />
            <span className="leading-tight">{aiRecommendation.rating}</span>
          </div>
        </motion.div>

      </div>

      {/* Жива стрічка останніх бронювань */}
      <div className={`rounded-2xl p-5 shadow-xl mb-6 transition-all border ${isDark ? 'bg-[#0B1221] border-white/10' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">
              Останні замовлення квитків (Live)
            </h3>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
            {recentBookings.length} оформлено
          </span>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center font-bold">Очікування перших замовлень...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentBookings.slice(0, 3).map((b, i) => {
              const pax = Array.isArray(b.passengers) ? b.passengers[0] : null;
              const paxName = pax ? `${pax.firstName || ''} ${pax.lastName || ''}`.trim() : 'Пасажир';
              const phone = b.contact?.phone || '—';
              return (
                <div
                  key={b.id || i}
                  onClick={() => window.dispatchEvent(new CustomEvent('switch-carrier-tab', { detail: 'bookings' }))}
                  className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {b.route_from && b.route_to ? `${b.route_from} ➔ ${b.route_to}` : (b.route_name || 'Рейс')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate font-medium">
                      {paxName} {phone !== '—' && `• ${phone}`}
                    </p>
                    <span className="text-[9px] text-cyan-400 font-mono mt-1 block">Квиток {b.id}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-white block">
                      {Number(b.total_price || 6240).toLocaleString('uk-UA')} грн
                    </span>
                    <span className="text-[9px] px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider">
                      Бронь (Оплата водію)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Network Expansion Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-8 bg-gradient-to-r from-[#7c5cfc]/20 to-[#00E5FF]/10 border border-[#7c5cfc]/30 rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-[0_0_30px_rgba(124,92,252,0.15)]"
      >
        <div className="absolute top-0 left-1/4 w-1/2 h-full bg-[#7c5cfc] opacity-20 blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 z-10 w-full">
          <div className="w-14 h-14 rounded-[16px] bg-[#0B1221]/80 backdrop-blur-md border border-[#7c5cfc]/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(124,92,252,0.4)] text-[#7c5cfc]">
            <Handshake size={28} />
          </div>
          <div className="text-center sm:text-left min-w-0">
            <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase mb-1">
              Розвиток Мережі
            </h3>
            <p className="text-[#8899B5] text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed">
              Запрошуйте агентів та партнерів для збільшення продажів. Вони автоматично отримуватимуть 10% комісії.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(`https://busnet.ua/invite/agent/${(user as any)?.referral_code || user?.uid}`);
            toast.success('Посилання для запрошення агентів скопійовано!');
          }}
          className="w-full md:w-auto px-8 py-4 bg-[#7c5cfc] text-white text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-[#6b4ae8] hover:scale-105 hover:shadow-[0_0_20px_rgba(124,92,252,0.6)] transition-all flex items-center justify-center gap-3 shrink-0 z-10"
        >
          <Link size={16} /> ЗГЕНЕРУВАТИ ЛІНК
        </button>
      </motion.div>
      {/* Routes Section */}
      < div >
        <h3 className="text-white fon-lg uppercase tracking-tight mb-4 flex items-center gap-2">
          Ваші маршрути
        </h3>

        {
          loading ? (
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
                      <div className="text-[9px] font-black uppercase">
                        {route.status === 'active' ? (
                          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md">● Активний</span>
                        ) : route.status === 'pending' ? (
                          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md">⌛ Модерація</span>
                        ) : route.status === 'cancelled' ? (
                          <span className="text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-md">✕ Скасовано</span>
                        ) : (
                          <span className="text-slate-300 bg-slate-500/10 border border-slate-500/30 px-2.5 py-1 rounded-md">✎ Чернетка</span>
                        )}
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
                          {[0, 1, 2, 3, 4, 5, 6].map(d => {
                            const dayMap: Record<number, string> = { 0: 'НД', 1: 'ПН', 2: 'ВТ', 3: 'СР', 4: 'ЧТ', 5: 'ПТ', 6: 'СБ' };
                            const dayName = dayMap[d];
                            const isActive = ((route as any).outbound?.days || []).includes(dayName);

                            // Consistent accent color for active days
                            const activeColor = 'bg-[#00E5FF] text-black shadow-[0_0_8px_rgba(0,229,255,0.4)]';

                            return (
                              <div key={d} className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-black transition-colors ${isActive ? activeColor : 'bg-[#1A2639] text-[#5A6A85]'}`}>
                                {['Н', 'П', 'В', 'С', 'Ч', 'П', 'С'][d]}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Column: Route Map Graphic & Buttons */}
                      <div className="flex flex-col items-end gap-4">

                        {/* Шкала завантаженості рейсу замість мертвої кривої */}
                        <div className="w-[170px] p-2.5 rounded-xl bg-[#050B14]/80 border border-white/10 flex flex-col justify-between">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-1">
                            <span className="text-slate-400">Місць у рейсі</span>
                            <span className="text-cyan-400 font-mono">50 місць</span>
                          </div>
                          {/* Смуга прогресу */}
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(15, (liveStats.passengers / 50) * 100))}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1 font-bold">
                            <span>{firstCity}</span>
                            <span className="text-emerald-400">Вільні є</span>
                            <span>{lastCity}</span>
                          </div>
                        </div>

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
          )
        }
      </div >

    </div >
  );
}
