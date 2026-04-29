/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Map, Calendar, PlusCircle, Users, Ticket, 
  Wallet, RotateCcw, FileText, BarChart3, Star, Handshake, 
  Bus, UserCircle2, MessageSquare, Bell, Building2, ClipboardList, 
  Settings, LogOut, Search, Clock, ChevronRight, Menu, X
} from 'lucide-react';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export default function CarrierLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [clock, setClock] = useState(new Date().toLocaleTimeString('uk-UA'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return false;
    return true;
  });
  const [stats, setStats] = useState({ activeTrips: 0, revenueToday: 0, passengersToday: 0, newBookings: 0, newTickets: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  const carrierName = user?.companyName || user?.firstName || 'Перевізник';
  const carrierInitials = carrierName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      // 1. Fetch active trips count
      const { count: activeTripsCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('carrierId', user.uid)
        .in('status', ['active', 'in_progress']);

      // 2. Fetch bookings for today's revenue and passengers
      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);
      
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('carrierId', user.uid);

      let dailyRev = 0;
      let dailyPax = 0;
      let pendingTicks = 0;

      if (bookings) {
        bookings.forEach(data => {
          if (data.status === 'confirmed') pendingTicks++;
          const createdAt = new Date(data.createdAt);
          if (createdAt >= startOfToday) {
            if (data.status === 'confirmed') {
              dailyRev += (data.totalPrice || 0) / 42;
              dailyPax += data.passengers?.length || 0;
            }
          }
        });
      }

      // 3. Fetch open support tickets
      const { count: supportCount } = await supabase
        .from('support')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user.uid)
        .eq('status', 'open');

      setStats({
        activeTrips: activeTripsCount || 0,
        revenueToday: dailyRev,
        passengersToday: dailyPax,
        newBookings: pendingTicks,
        newTickets: supportCount || 0
      });
    };

    fetchStats();
    
    // Subscribe to changes
    const channel = supabase.channel(`carrier_stats_${user.uid}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `carrierId=eq.${user.uid}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `carrierId=eq.${user.uid}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support', filter: `userId=eq.${user.uid}` }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('uk-UA'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const NAV_GROUPS: NavGroup[] = [
    {
      group: 'Огляд',
      items: [
        { id: 'dashboard', label: 'Дашборд', path: '/', icon: LayoutDashboard, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        { id: 'livetrips', label: 'Мої рейси Live', path: '/livetrips', icon: Map, badge: stats.activeTrips || undefined, badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      ]
    },
    {
      group: 'Управління',
      items: [
        { id: 'trips', label: 'Розклад рейсів', path: '/trips', icon: Calendar },
        { id: 'newtrip', label: 'Створити рейс', path: '/newtrip', icon: PlusCircle },
        { id: 'passengers', label: 'Пасажири', path: '/passengers', icon: Users, badge: stats.newBookings || undefined, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
        { id: 'bookings', label: 'Бронювання', path: '/bookings', icon: Ticket },
      ]
    },
    {
      group: 'Фінанси',
      items: [
        { id: 'finance', label: 'Доходи & Виплати', path: '/finance', icon: Wallet },
        { id: 'refunds', label: 'Повернення', path: '/refunds', icon: RotateCcw, badge: undefined, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
        { id: 'invoices', label: 'Інвойси', path: '/invoices', icon: FileText },
      ]
    },
    {
      group: 'Аналітика',
      items: [
        { id: 'analytics', label: 'Аналітика маршрутів', path: '/analytics', icon: BarChart3 },
        { id: 'reviews', label: 'Відгуки & Рейтинг', path: '/reviews', icon: Star },
        { id: 'agents', label: 'Агенти', path: '/agents', icon: Handshake },
      ]
    },
    {
      group: 'Транспорт',
      items: [
        { id: 'buses', label: 'Мій автопарк', path: '/buses', icon: Bus },
        { id: 'drivers', label: 'Водії', path: '/drivers', icon: UserCircle2 },
      ]
    },
    {
      group: 'Комунікація',
      items: [
        { id: 'support', label: 'Підтримка', path: '/support', icon: MessageSquare, badge: stats.newTickets || undefined, badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
        { id: 'notifications', label: 'Сповіщення', path: '/notifications', icon: Bell },
      ]
    },
    {
      group: 'Профіль',
      items: [
        { id: 'profile', label: 'Профіль компанії', path: '/profile', icon: Building2 },
        { id: 'docs', label: 'Документи', path: '/docs', icon: ClipboardList },
        { id: 'settings', label: 'Налаштування', path: '/settings', icon: Settings },
      ]
    }
  ];

  const activeItem = NAV_GROUPS.flatMap(g => g.items).find(i => 
    i.path === location.pathname || (i.path !== '/' && location.pathname.startsWith(i.path))
  ) || NAV_GROUPS[0].items[0];

  return (
    <div className="flex h-screen bg-[#0b0e14] text-[#e8edf5] overflow-hidden font-sans">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 w-[250px]' : '-translate-x-full lg:w-[80px] lg:translate-x-0'} 
        bg-[#111520] border-r border-white/5 flex flex-col h-full transition-all duration-300 ease-in-out shrink-0
      `}>
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b35] to-[#cc3300] rounded-xl flex items-center justify-center shrink-0">
            <Bus className="text-white" size={24} />
          </div>
          {isSidebarOpen && (
            <div className="flex-1">
              <div className="font-syne font-black text-sm tracking-tight">BUS<span className="text-[#ff6b35]">NET</span> UA</div>
              <div className="text-[9px] text-[#5a6a85] uppercase tracking-widest leading-none mt-1">Cabinet</div>
            </div>
          )}
          <button className="lg:hidden text-[#8899b5]" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Carrier Info Area */}
        {isSidebarOpen && (
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center font-black text-white shrink-0 shadow-lg shadow-orange-500/10">
                {carrierInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate leading-tight text-white">{carrierName}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-none">Verified Partner</span>
                </div>
              </div>
            </div>
            <div className="mt-4 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-2 group cursor-help transition-all hover:bg-amber-500/10">
              <Star size={12} className="text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-amber-400 tracking-tighter">4.8 Rating</span>
              <div className="flex-1" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/20" />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="mb-4">
              {isSidebarOpen && (
                <div className="px-6 mb-2 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">
                  {group.group}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-6 py-2 transition-all relative
                        ${isActive 
                          ? 'bg-[#ff6b35]/12 text-[#ff6b35] border-l-4 border-[#ff6b35] font-semibold' 
                          : 'text-[#8899b5] hover:bg-white/[0.03] hover:text-white border-l-4 border-transparent'}
                      `}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {isSidebarOpen && (
                        <>
                          <span className="text-xs flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-all text-xs font-semibold"
          >
            <LogOut size={16} />
            {isSidebarOpen && "Вийти з кабінету"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-[54px] bg-[#111520] border-b border-white/5 flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-30 shadow-lg">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-[#ff6b35]" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <activeItem.icon size={18} className="text-[#ff6b35] hidden sm:block" />
            <h1 className="font-syne font-bold text-sm tracking-tight">{activeItem.label}</h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-1.5">
              <div className="relative group hidden sm:block">
                <button className="w-9 h-9 rounded-xl bg-[#161c2a] border border-white/5 flex items-center justify-center text-[#8899b5] hover:text-cyan-400 hover:border-cyan-500/30 transition-all focus:ring-2 ring-cyan-500/20 outline-none">
                  <Search size={16} />
                </button>
              </div>
              <button className="w-9 h-9 rounded-xl bg-[#161c2a] border border-white/5 flex items-center justify-center text-[#8899b5] hover:text-rose-400 hover:border-rose-500/30 transition-all relative">
                <Bell size={16} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[#111520] animate-bounce">5</span>
              </button>
            </div>
            
            <div className="h-4 w-px bg-white/5 mx-2 hidden sm:block" />
            
            <div className="bg-[#161c2a] border border-white/5 px-2 py-1.5 lg:px-4 lg:py-1.5 rounded-xl flex items-center gap-3 text-[#5a6a85] group overflow-hidden hidden sm:flex">
              <div className="flex flex-col items-end text-right">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1">Potentia Sync</span>
                <span className="font-mono font-bold text-xs tracking-widest text-[#ff6b35]">{clock}</span>
              </div>
              <div className="w-1 h-6 bg-[#ff6b35]/20 rounded-full group-hover:bg-[#ff6b35]/40 transition-colors" />
            </div>
          </div>
        </header>

        {/* Pulse Bar */}
        <div className="bg-[#161c2a] border-b border-white/5 py-2 px-6 flex items-center gap-8 overflow-x-auto scrollbar-hide text-[10px] uppercase font-black tracking-widest shrink-0">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="text-[#5a6a85]">Активні рейси:</span>
            <span className="text-[#e8edf5]">{stats.activeTrips}</span>
          </div>
          <div className="w-px h-3 bg-white/5" />
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_#06b6d4]" />
            <span className="text-[#5a6a85]">Пасажирів сьогодні:</span>
            <span className="text-[#e8edf5]">{stats.passengersToday}</span>
          </div>
          <div className="w-px h-3 bg-white/5" />
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
            <span className="text-[#5a6a85]">Дохід сьогодні:</span>
            <span className="text-[#e8edf5] text-amber-400">€{stats.revenueToday.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
          </div>
          <div className="w-px h-3 bg-white/5" />
          <div className="flex items-center gap-2 whitespace-nowrap">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="text-[#5a6a85]">Рейтинг:</span>
            <span className="text-amber-400">⭐ 4.8</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
