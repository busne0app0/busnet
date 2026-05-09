/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Calendar, PlusCircle, Users, Ticket, 
  Wallet, RotateCcw, FileText, BarChart3, Star, Handshake, 
  Bus, LogOut, MessageSquare, Bell, Building, ClipboardList, Settings
} from 'lucide-react';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';

const MENU_CATEGORIES = [
  {
    id: 'dashboard',
    icon: LayoutGrid,
    color: 'text-[#00E5FF]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF]/50',
    path: '/',
    subItems: []
  },
  {
    id: 'transport',
    icon: Bus,
    color: 'text-[#0EA5E9]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(14,165,233,0.6)] group-hover:border-[#0EA5E9]/50',
    subItems: [
      { label: 'Розклад рейсів', path: '/trips', icon: Calendar },
      { label: 'Створити рейс', path: '/newtrip', icon: PlusCircle },
      { label: 'Пасажири', path: '/passengers', icon: Users },
      { label: 'Бронювання', path: '/bookings', icon: Ticket },
      { label: 'Мій автопарк', path: '/buses', icon: Bus },
      { label: 'Водії', path: '/drivers', icon: Users },
    ]
  },
  {
    id: 'finance',
    icon: Wallet,
    color: 'text-[#FBBF24]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(251,191,36,0.6)] group-hover:border-[#FBBF24]/50',
    subItems: [
      { label: 'Доходи & Виплати', path: '/finance', icon: Wallet },
      { label: 'Повернення', path: '/refunds', icon: RotateCcw },
      { label: 'Інвойси', path: '/invoices', icon: FileText },
    ]
  },
  {
    id: 'analytics',
    icon: BarChart3,
    color: 'text-[#E879F9]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(232,121,249,0.6)] group-hover:border-[#E879F9]/50',
    subItems: [
      { label: 'Аналітика маршрутів', path: '/analytics', icon: BarChart3 },
      { label: 'Відгуки & Рейтинг', path: '/reviews', icon: Star },
      { label: 'Агенти', path: '/agents', icon: Handshake },
    ]
  },
  {
    id: 'communication',
    icon: MessageSquare,
    color: 'text-[#A855F7]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] group-hover:border-[#A855F7]/50',
    subItems: [
      { label: 'Підтримка', path: '/support', icon: MessageSquare },
      { label: 'Сповіщення', path: '/notifications', icon: Bell },
    ]
  },
  {
    id: 'profile',
    icon: Settings,
    color: 'text-[#10B981]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] group-hover:border-[#10B981]/50',
    subItems: [
      { label: 'Профіль компанії', path: '/profile', icon: Building },
      { label: 'Документи', path: '/docs', icon: ClipboardList },
      { label: 'Налаштування', path: '/settings', icon: Settings },
    ]
  }
];

export default function CarrierLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [clock, setClock] = useState('');
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClock(`${now.toLocaleDateString('uk-UA')} ${now.toLocaleTimeString('uk-UA')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const carrierName = user?.companyName || user?.firstName || 'Перевізник';
  const carrierInitials = carrierName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex h-screen bg-[#050B14] text-[#e8edf5] overflow-hidden font-sans relative">
      {/* Background Starry/Space Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(232, 121, 249, 0.05) 0%, transparent 40%)'
      }} />

      {/* Floating Clock - Moved to bottom right to avoid overlapping top buttons */}
      <div className="hidden md:block absolute bottom-6 right-8 z-10 text-[#8899B5] font-mono text-[11px] tracking-widest pointer-events-none">
        {clock}
      </div>

      {/* Floating Sidebar (Desktop) */}
      <aside className="hidden md:flex relative z-50 w-[90px] h-[calc(100vh-48px)] my-6 ml-6 flex-col items-center py-6 rounded-[32px] bg-[#0B1221]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,229,255,0.05)] before:absolute before:inset-0 before:rounded-[32px] before:border before:border-transparent before:[background:linear-gradient(to_bottom,rgba(0,229,255,0.3),rgba(232,121,249,0.1),transparent) border-box] before:[mask-composite:exclude] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
        
        {/* Top Logo */}
        <div className="flex flex-col items-center gap-1 mb-6 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-12 h-10 border border-[#00E5FF]/40 rounded-xl flex items-center justify-center text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)] group-hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all">
            <Bus size={20} />
          </div>
          <div className="text-center mt-1">
            <div className="text-[9px] font-black tracking-widest text-white">BUSNET UA</div>
            <div className="text-[8px] font-bold text-[#8899B5]">2026</div>
          </div>
        </div>

        {/* Avatar with Upload */}
        <div className="relative mb-8 group cursor-pointer">
          <label className="cursor-pointer block relative">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) {
                const toastId = toast.loading('Завантаження логотипу...');
                setTimeout(() => toast.success('Логотип успішно оновлено (Демо)', { id: toastId }), 1500);
              }
            }} />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-[#E879F9]/20 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all overflow-hidden relative">
              <span className="text-white font-black text-lg tracking-tighter">{carrierInitials}</span>
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[8px] text-white font-bold uppercase tracking-widest text-center">Завантажити<br/>Логотип</span>
              </div>
            </div>
          </label>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1A2639] border border-[#FBBF24]/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.2)] pointer-events-none">
            <Star size={8} className="fill-[#FBBF24] text-[#FBBF24]" />
            <span className="text-[8px] font-black text-[#FBBF24]">4.8</span>
          </div>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col gap-4 w-full px-3 relative z-50">
          {MENU_CATEGORIES.map((cat) => {
            const isActive = cat.path === location.pathname || cat.subItems.some(sub => location.pathname.startsWith(sub.path));
            const isHovered = hoveredMenu === cat.id;
            
            return (
              <div 
                key={cat.id} 
                className="relative flex justify-center group"
                onMouseEnter={() => setHoveredMenu(cat.id)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                {/* Neon Thread (Active Indicator) */}
                {isActive && (
                  <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full ${cat.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor]`} />
                )}

                <button
                  onClick={() => cat.path && navigate(cat.path)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                    isActive 
                      ? `bg-white/10 border-white/20 shadow-inner` 
                      : `bg-transparent border-transparent ${cat.glowClass}`
                  }`}
                >
                  <cat.icon size={26} strokeWidth={1.5} className={`${cat.color} ${isActive ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`} />
                </button>

                {/* Glassmorphic Popover for sub-items */}
                <AnimatePresence>
                  {isHovered && cat.subItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute left-[70px] top-0 w-[200px] bg-[#0B1221]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 z-50 flex flex-col gap-1 shadow-[0_0_20px_${cat.color.replace('text-[', '').replace(']', '')}40]`}
                    >
                      {/* Arrow pointing left */}
                      <div className={`absolute top-5 -left-[6px] w-3 h-3 bg-[#0B1221] border-l border-b border-white/10 rotate-45`} />
                      
                      {cat.subItems.map((sub, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            navigate(sub.path);
                            setHoveredMenu(null);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                            location.pathname.startsWith(sub.path)
                              ? `${cat.color.replace('text-', 'bg-')}/10 ${cat.color} font-bold`
                              : 'text-[#8899B5] hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <sub.icon size={16} />
                          <span className="text-[11px] uppercase tracking-widest">{sub.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Simple Tooltip for items without sub-items (like Dashboard) */}
                  {isHovered && cat.subItems.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-[70px] top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0B1221]/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-xs font-bold tracking-widest text-white z-50 shadow-xl"
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-2.5 h-2.5 bg-[#0B1221] border-l border-b border-white/10 rotate-45" />
                      ДАШБОРД
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Logout Bottom */}
        <div className="mt-auto pt-4 group">
          <button 
            onClick={() => logout()}
            className="w-12 h-12 rounded-full border border-rose-500/30 bg-rose-500/5 flex items-center justify-center text-rose-500 transition-all group-hover:bg-rose-500/20 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] group-hover:border-rose-500/50"
          >
            <LogOut size={20} strokeWidth={1.5} className="ml-1" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10 p-4 pb-24 md:p-6 md:pb-6 scrollbar-hide">
        <Outlet />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B1221]/90 backdrop-blur-xl border-t border-white/15 px-2 py-3 flex justify-between items-center pb-safe">
        {MENU_CATEGORIES.map((cat) => {
          const isActive = cat.path === location.pathname || cat.subItems.some(sub => location.pathname.startsWith(sub.path));
          return (
            <button
              key={cat.id}
              onClick={() => {
                if (cat.path) navigate(cat.path);
                else if (cat.subItems.length > 0) navigate(cat.subItems[0].path);
              }}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                isActive ? cat.color : 'text-[#8899B5]'
              }`}
            >
              <cat.icon size={20} className={isActive ? `drop-shadow-[0_0_8px_currentColor]` : ''} />
              <span className="text-[8px] mt-1 font-black uppercase tracking-widest">
                {cat.id === 'dashboard' ? 'Головна' : cat.id === 'transport' ? 'Рейси' : cat.id === 'finance' ? 'Фінанси' : cat.id === 'analytics' ? 'Звіти' : cat.id === 'communication' ? 'Чат' : 'Профіль'}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
