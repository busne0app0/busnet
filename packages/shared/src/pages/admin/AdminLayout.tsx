import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Map, CheckCircle2, AlertTriangle, 
  Bus, Handshake, Route, CreditCard, Undo2, 
  ClipboardList, FileText, Users, MessageSquare, 
  Megaphone, Search, Bell, Settings, FileCode, 
  Shield, LogOut, RefreshCw, Clock, Menu, X,
  Cpu, Zap, Globe, Activity
} from 'lucide-react';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';
import { ErrorBoundary } from '@busnet/shared/components/common/ErrorBoundary';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString('uk-UA'));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('userId', user.uid)
          .order('created_at', { ascending: false })
          .limit(20);
        if (!error && data) setNotifications(data);
      } catch (e) {}
    };
    fetchNotifications();
    const channelName = 'admin_notif_' + user.uid + '_' + Date.now().toString(36);
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `userId=eq.${user.uid}` }, fetchNotifications)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    (window as any).setAdminTab = (tab: string) => {
       setActiveTab(tab);
    };
    return () => { delete (window as any).setAdminTab; };
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('uk-UA'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { conflicts, metrics, statsExtra, fetchStats } = useAdminStore();
  const activeConflictsCount = conflicts.filter(c => c.status === 'pending').length;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      window.location.href = '/';
    }
  };

  // Навігаційні групи для Доку та Сайдбару
  const mainNav = [
    { id: 'dashboard', label: 'Головна', icon: LayoutDashboard, path: '/' },
    { id: 'livetrips', label: 'Лайв', icon: Map, path: '/livetrips' },
    { id: 'approvals', label: 'Схвалення', icon: CheckCircle2, path: '/approvals' },
    { id: 'conflicts', label: 'ШІ', icon: AlertTriangle, path: '/conflicts' },
  ];

  const secondaryNav = [
    { id: 'carriers', label: 'Партнери', icon: Handshake, path: '/carriers' },
    { id: 'finance', label: 'Фінанси', icon: CreditCard, path: '/finance' },
    { id: 'crm', label: 'Клієнти', icon: Users, path: '/crm' },
  ];
  
  const isOwner = user?.adminRole === 'owner' || user?.email === 'tania.nyshuta@gmail.com' || user?.email?.includes('root');
  
  if (isOwner) {
    secondaryNav.push({ id: 'settings', label: 'Налаштування', icon: Settings, path: '/settings' });
  }

  return (
    <div className="min-h-screen bg-[#030712] text-[#ddeeff] font-sans selection:bg-[#00D4FF]/30 overflow-hidden relative">
      {/* 🌌 Nebula Background */}
      <div className="nebula-bg" />
      
      {/* 🛰️ Slim Sidebar (Vertical Navigation) - Hidden on Mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 bg-[#0d121e]/40 backdrop-blur-3xl border-r border-white/5 flex-col items-center py-6 z-50">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.4)] mb-8 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Zap size={20} className="text-white fill-white" />
        </motion.div>

        <div className="flex-1 flex flex-col gap-6">
          {[...mainNav, ...secondaryNav].map((item) => {
            const isActive = location.pathname === item.path || (item.id === 'dashboard' && location.pathname === '/');
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onMouseEnter={() => setHoveredIcon(item.id)}
                onMouseLeave={() => setHoveredIcon(null)}
                className="relative group p-3 rounded-xl transition-all"
              >
                <item.icon 
                  size={22} 
                  className={`transition-all duration-300 ${
                    isActive ? 'text-[#00D4FF] drop-shadow-[0_0_8px_#00D4FF]' : 'text-slate-500 group-hover:text-slate-200'
                  }`} 
                />
                <AnimatePresence>
                  {hoveredIcon === item.id && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 20 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="absolute left-10 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-black uppercase tracking-widest whitespace-nowrap z-50 pointer-events-none"
                    >
                      {item.label}
                    </motion.div>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-[#00D4FF]/5 border-l-2 border-[#00D4FF] rounded-xl -z-10"
                  />
                )}
              </NavLink>
            );
          })}
        </div>

        <button 
          onClick={handleLogout}
          className="p-3 text-slate-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={22} />
        </button>
      </aside>

      {/* 🖥️ Main Dashboard Content Area */}
      <main className="md:pl-16 flex flex-col h-screen overflow-hidden pb-20 md:pb-0">
        {/* 🛰️ Top Header (Status Bar) */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#030712]/40 backdrop-blur-md relative z-40">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-2">
                <span className="text-[#00D4FF]">BUSNET</span> 
                <span className="opacity-40">SYSTEM 4.0</span>
              </div>
              <div className="text-[9px] text-[#8B5CF6] font-black uppercase tracking-[0.3em] mt-1">
                Центр Керування
              </div>
            </div>

            <div className="hidden md:block h-8 w-[1px] bg-white/5" />

            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-full">
                <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse shadow-[0_0_8px_#10B981]" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Система Онлайн</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-full">
                <Activity size={12} className="text-[#00D4FF]" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{statsExtra.activeTrips} Активні Операції</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden xl:flex px-4 py-2 bg-black/40 border border-white/5 rounded-xl items-center gap-3">
              <Calendar size={14} className="text-[#8B5CF6]" />
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black text-white outline-none border-none uppercase cursor-pointer"
                onChange={(e) => {
                  const val = e.target.value;
                  const current = useAdminStore.getState().globalDateRange;
                  useAdminStore.getState().setGlobalDateRange(val ? { start: val + 'T00:00:00', end: (current?.end || new Date().toISOString()) } : null);
                }}
              />
              <span className="text-slate-600 text-[10px]">→</span>
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black text-white outline-none border-none uppercase cursor-pointer"
                onChange={(e) => {
                  const val = e.target.value;
                  const current = useAdminStore.getState().globalDateRange;
                  useAdminStore.getState().setGlobalDateRange(val ? { start: (current?.start || new Date().toISOString()), end: val + 'T23:59:59' } : null);
                }}
              />
            </div>

            <div className="hidden sm:flex px-4 py-2 bg-black/40 border border-white/5 rounded-xl items-center gap-3">
              <Clock size={14} className="text-[#00D4FF]" />
              <span className="text-[11px] font-black text-white tracking-widest">{time}</span>
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-10 h-10 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all relative group"
              >
                <Bell size={18} className="group-hover:animate-bounce" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[#030712]">
                    {notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-12 right-0 w-[320px] glass-mission-control rounded-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Системні Сповіщення</span>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-[#00D4FF]/20 text-[#00D4FF] rounded-full">Пріоритет: Дельта</span>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Немає нових сповіщень</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className="p-4 border-b border-white/5 flex gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg">{n.icon || '🛸'}</div>
                            <div>
                              <div className="text-[11px] leading-relaxed text-slate-200">{n.text || n.message}</div>
                              <div className="text-[9px] text-slate-500 mt-1 uppercase font-black tracking-widest">{n.created_at ? new Date(n.created_at).toLocaleTimeString() : 'now'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-white/10">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                  {user?.firstName || 'Admin'}
                </span>
                <span className="text-[8px] font-black text-[#8B5CF6] uppercase tracking-[0.2em] mt-1">
                  {isOwner ? 'Кореневий доступ' : 'Менеджер'}
                </span>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center font-black text-white text-[10px] md:text-xs overflow-hidden cursor-pointer" onClick={handleLogout}>
                {user?.email?.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* 📈 Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 md:p-8 pb-32 md:pb-32">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>

        {/* 🛸 Floating Glass Dock (Bottom Navigation) */}
        <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-auto max-w-lg">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="floating-dock px-3 md:px-6 py-2 md:py-3 flex justify-between md:justify-center items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar"
          >
            {[...mainNav, ...secondaryNav].map((item) => {
              const isActive = location.pathname === item.path || (item.id === 'dashboard' && location.pathname === '/');
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 md:px-4 md:py-1.5 rounded-xl transition-all duration-300 relative group shrink-0`}
                >
                  <motion.div
                    whileHover={{ y: -5, scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`${isActive ? 'text-[#00D4FF]' : 'text-slate-400 group-hover:text-slate-100'}`}
                  >
                    <item.icon size={18} className="md:w-5 md:h-5" />
                  </motion.div>
                  <span className={`hidden md:block text-[9px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-[#00D4FF] opacity-100' : 'opacity-0 group-hover:opacity-60'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="dock-dot"
                      className="absolute -top-1 md:-top-1 w-1 h-1 bg-[#00D4FF] rounded-full shadow-[0_0_10px_#00D4FF]"
                    />
                  )}
                </NavLink>
              );
            })}
          </motion.div>
        </div>
      </main>

      {/* 🌌 Global Glow Effect */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00D4FF]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </div>
  );
};

export default AdminLayout;