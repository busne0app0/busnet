/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@busnet/shared/supabase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, LayoutDashboard, Ticket, Users, 
  MessageSquare, PieChart, Map, Building2, 
  Bell, User, Settings, LogOut, Plus,
  Wallet, RefreshCcw, Search, ExternalLink,
  Menu, X, Clock, HelpCircle, Briefcase,
  History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BOOKINGS_DATA, PASSENGERS_DATA, NOTIFICATIONS_DATA, CHAT_CONTACTS } from './constants';

export default function AgentLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const NAV_ITEMS = [
    { group: 'Головне', items: [
      { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, path: '/', badge: 'Live', badgeType: 'green' },
      { id: 'book', label: 'Нове бронювання', icon: Plus, path: '/book' },
      { id: 'mybookings', label: 'Мої бронювання', icon: History, path: '/mybookings', badge: BOOKINGS_DATA.filter(b => b.status !== 'cancelled').length.toString(), badgeType: 'purple' },
    ]},
    { group: 'Клієнти', items: [
      { id: 'passengers', label: 'База пасажирів', icon: Users, path: '/passengers', badge: PASSENGERS_DATA.length.toString(), badgeType: 'green' },
      { id: 'crm', label: 'CRM / Угоди', icon: Briefcase, path: '/crm', badge: '3', badgeType: 'orange' },
      { id: 'chat', label: 'Повідомлення', icon: MessageSquare, path: '/chat', badge: CHAT_CONTACTS.reduce((acc, c) => acc + (c.unread || 0), 0).toString(), badgeType: 'red' },
    ]},
    { group: 'Фінанси', items: [
      { id: 'finance', label: 'Доходи та виплати', icon: Wallet, path: '/finance' },
      { id: 'refunds', label: 'Повернення', icon: RefreshCcw, path: '/refunds', badge: BOOKINGS_DATA.filter(b => b.status === 'cancelled').length.toString(), badgeType: 'orange' },
    ]},
    { group: 'Аналітика', items: [
      { id: 'analytics', label: 'Статистика', icon: BarChart3, path: '/analytics' },
      { id: 'routes', label: 'Маршрути', icon: Map, path: '/routes' },
      { id: 'carriers', label: 'Перевізники', icon: Building2, path: '/carriers' },
    ]},
    { group: 'Акаунт', items: [
      { id: 'notifications', label: 'Сповіщення', icon: Bell, path: '/notifications', badge: NOTIFICATIONS_DATA.filter(n => n.unread).length.toString(), badgeType: 'red' },
      { id: 'profile', label: 'Мій профіль', icon: User, path: '/profile' },
      { id: 'settings', label: 'Налаштування', icon: Settings, path: '/settings' },
    ]},
  ];

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return false;
    try { return localStorage.getItem('agent_sidebar') !== 'false'; } catch { return true; }
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState(new Date().toLocaleTimeString('uk-UA'));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearchOverlay(true);
      }
      if (e.key === 'Escape') {
        setShowSearchOverlay(false);
        setShowNotifPanel(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('uk-UA'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    toast.loading('Вихід з системи...', { duration: 1000 });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.error('Logout error:', e);
    }
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const activePage = NAV_ITEMS.flatMap(g => g.items).find(i => i.path === location.pathname) || NAV_ITEMS[0].items[0];

  return (
    <div className="flex h-screen bg-[#080b12] text-[#dde8f5] overflow-hidden font-['DM_Sans']">
      {/* Search Overlay */}
      <AnimatePresence>
        {showSearchOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-[#0d1119] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden"
            >
              <div className="p-4 flex items-center gap-3 border-b border-white/5">
                <Search className="text-[#a28afd]" size={20} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Шукати пасажира, номер квитка, рейс..." 
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-[#4a5c72]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={() => setShowSearchOverlay(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#4a5c72]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                {searchQuery ? (
                  <div className="p-8 text-center text-[#4a5c72]">
                    <div className="text-xs font-black uppercase tracking-widest mb-1">Пошук: {searchQuery}</div>
                    <div className="text-[10px] font-bold">Натисніть Enter для пошуку в базі</div>
                  </div>
                ) : (
                  <div className="space-y-4 p-2">
                    <div className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em] px-2">Нещодавні</div>
                    {['Юлія Петренко (BK-4799)', 'Київ → Варшава (12.04)', 'Марія Ковалець (Профіль)'].map((rec, i) => (
                      <button key={i} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all text-xs font-bold text-white/60 hover:text-white">
                        <History size={14} className="text-[#a28afd]" /> {rec}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 bg-black/20 border-t border-white/5 flex justify-between items-center px-4">
                <div className="hidden sm:flex gap-4">
                  <span className="text-[8px] font-black uppercase text-[#4a5c72] tracking-widest flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded border border-white/10">ESC</kbd> Закрити</span>
                  <span className="text-[8px] font-black uppercase text-[#4a5c72] tracking-widest flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded border border-white/10">⏎</kbd> Вибрати</span>
                </div>
                <div className="text-[8px] font-black uppercase text-[#a28afd] tracking-[0.2em]">Пошук BUSNET UA</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 w-[236px]' : '-translate-x-full md:w-0'} 
        bg-[#0d1119] border-r border-white/5 flex flex-col h-full transition-all duration-300 overflow-hidden shrink-0
      `}>
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c5cfc] to-[#5533dd] flex items-center justify-center font-black text-white text-sm">
            BN
          </div>
          <div>
            <div className="font-['Syne'] font-extrabold text-sm tracking-tight">
              BUSNET <span className="text-[#7c5cfc]">UA</span>
            </div>
            <div className="text-[8px] text-[#4a5c72] uppercase tracking-[0.2em] -mt-0.5">Agent Workspace</div>
          </div>
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c5cfc] to-[#5533dd] flex items-center justify-center font-bold text-white relative">
              МК
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00d97e] border-2 border-[#0d1119] rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Марія Ковалець</div>
              <div className="text-[9px] text-[#a28afd] font-bold uppercase tracking-widest mt-0.5">Агент · Київ</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {[
              { val: '347', label: 'продажів' },
              { val: '€2,076', label: 'зароблено' },
              { val: 'TOP', label: 'статус' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#121824] border border-white/5 rounded-md p-1.5 text-center">
                <div className="text-[10px] font-bold text-white leading-none mb-0.5">{stat.val}</div>
                <div className="text-[8px] text-[#7a8fa8] leading-none uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((group, idx) => (
            <div key={idx} className="mb-4">
              <div className="px-4 text-[8px] font-bold text-[#4a5c72] uppercase tracking-[0.2em] mb-2">{group.group}</div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/');
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-all border-l-2
                      ${isActive 
                        ? 'bg-[#7c5cfc1c] text-[#a28afd] border-[#7c5cfc] font-semibold' 
                        : 'text-[#7a8fa8] border-transparent hover:bg-white/5 hover:text-white hover:border-white/10'}
                    `}
                  >
                    <item.icon size={14} className={isActive ? 'opacity-100' : 'opacity-70'} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`
                        text-[8px] font-black px-1.5 py-0.5 rounded-full
                        ${item.badgeType === 'green' ? 'bg-[#00d97e] text-black' : ''}
                        ${item.badgeType === 'purple' ? 'bg-[#7c5cfc] text-white' : ''}
                        ${item.badgeType === 'orange' ? 'bg-[#ff9d00] text-black' : ''}
                        ${item.badgeType === 'red' ? 'bg-[#ff3d5a] text-white' : ''}
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-[#7c5cfc14] border border-[#7c5cfc33] rounded-lg p-2.5 mb-3">
            <div className="flex justify-between items-center text-[9px] mb-1.5">
              <span className="text-[#4a5c72]">Прогрес до нового рівня</span>
              <span className="text-[#a28afd] font-bold">347 / 400</span>
            </div>
            <div className="h-1 bg-[#121824] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#7c5cfc] to-[#a28afd]" style={{ width: '86%' }} />
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#ff3d5a12] border border-[#ff3d5a2e] text-[#ff3d5a] text-xs font-bold transition-all hover:bg-[#ff3d5a24]"
          >
            <LogOut size={14} /> Вийти з кабінету
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <header className="h-[52px] bg-[#0d1119] border-b border-white/5 flex items-center px-4 gap-4 shrink-0 transition-all">
          <button 
            onClick={() => { const next = !isSidebarOpen; setIsSidebarOpen(next); try { localStorage.setItem('agent_sidebar', String(next)); } catch {} }}
            className="w-8 h-8 rounded-lg bg-[#121824] border border-white/5 flex items-center justify-center text-[#7a8fa8] hover:text-white transition-all"
          >
            {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          
          <div className="flex items-center gap-2">
            {activePage.icon && <activePage.icon size={16} className="text-[#7a8fa8]" />}
            <h2 className="font-['Syne'] font-bold text-sm">{activePage.label}</h2>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearchOverlay(true)}
              className="w-8 h-8 rounded-lg bg-[#121824] border border-white/5 flex items-center justify-center text-[#7a8fa8] hover:text-white transition-all relative"
            >
              <Search size={14} />
            </button>
            <button 
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="w-8 h-8 rounded-lg bg-[#121824] border border-white/5 flex items-center justify-center text-[#7a8fa8] hover:text-white transition-all relative"
            >
              <Bell size={14} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff3d5a] text-white text-[8px] font-bold rounded-full flex items-center justify-center">7</span>
            </button>
            <button onClick={() => window.open('https://busnet.ua', '_blank')} title="Відкрити BUSNET UA" className="w-8 h-8 rounded-lg bg-[#121824] border border-white/5 flex items-center justify-center text-[#7a8fa8] hover:text-white transition-all">
              <ExternalLink size={14} />
            </button>
            <button 
              onClick={() => navigate('/book')}
              className="bg-gradient-to-br from-[#7c5cfc] to-[#5533dd] px-3.5 py-1.5 rounded-lg text-white text-xs font-bold shadow-lg shadow-purple-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus size={14} /> Нове бронювання
            </button>
            <div className="font-['Syne'] text-[11px] text-[#4a5c72] bg-[#121824] border border-white/5 px-2.5 py-1.5 rounded-lg tracking-wider">
              {time}
            </div>
          </div>
        </header>

        {/* Pulse Bar */}
        <div className="bg-[#121824] border-b border-white/5 px-4 h-9 flex items-center gap-4 overflow-x-auto scrollbar-hide shrink-0">
          {[
            { color: 'text-[#00d97e]', label: 'Активних брон.', val: '12' },
            { color: 'text-[#7c5cfc]', label: 'Продажів сьогодні', val: '3' },
            { color: 'text-[#00d97e]', label: 'Комісія сьогодні', val: '€42' },
            { color: 'text-[#ff9d00]', label: 'Черга повернень', val: '2' },
            { color: 'text-[#00d97e]', label: 'Пасажирів у базі', val: '54' },
            { color: 'text-[#7c5cfc]', label: 'Моя комісія', val: '8%' },
            { color: 'text-[#ff3d5a]', label: 'Нові повідомлення', val: '7' },
          ].map((pulse, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-1.5 h-1.5 rounded-full ${pulse.color.replace('text-', 'bg-')} shadow-[0_0_5px_currentColor] animate-pulse`} />
                <span className="text-[9px] text-[#4a5c72] font-medium">{pulse.label}</span>
                <span className="text-xs font-bold text-white">{pulse.val}</span>
              </div>
              {i < 6 && <div className="text-white/5 text-xs">|</div>}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <Outlet />
        </div>

        {/* Notification Panel Overlay */}
        <AnimatePresence>
          {showNotifPanel && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotifPanel(false)}
                className="fixed inset-0 z-40"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
                className="absolute top-[56px] right-4 w-[310px] bg-[#1a2234] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 bg-[#121824] border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-['Syne'] font-bold text-xs">Сповіщення</h3>
                  <button onClick={() => toast.success('Всі сповіщення позначено як прочитані')} className="text-[10px] text-[#7a8fa8] hover:text-white transition-all">Всі прочитані</button>
                </div>
                <div className="p-1">
                  {[
                    { ico: '▣', text: 'Нове повідомлення від пасажира: Олена Самойленко', time: '2 хв тому', unread: true },
                    { ico: '+', text: 'Нове бронювання BK-4905 підтверджено системою', time: '45 хв тому', unread: true },
                    { ico: '◑', text: 'Виплата €1,076 зарахована на рахунок', time: '5 квітня', unread: false },
                  ].map((notif, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setShowNotifPanel(false);
                        navigate('/notifications');
                      }}
                      className={`p-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${notif.unread ? 'bg-[#7c5cfc14] border-l-2 border-[#7c5cfc]' : 'hover:bg-white/5'}`}
                    >
                      <div className="text-sm">{notif.ico}</div>
                      <div className="min-w-0">
                        <div className="text-[11px] leading-relaxed text-white">{notif.text}</div>
                        <div className="text-[9px] text-[#4a5c72] mt-1">{notif.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
