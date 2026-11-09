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
  Bus, LogOut, MessageSquare, Bell, Building, ClipboardList, Settings,
  AlertCircle, Search
} from 'lucide-react';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';
import BusnetNexus from '../../components/common/BusnetNexus';
import { supabase } from '@busnet/shared/supabase/config';
import { useCarrierRating } from '@busnet/shared/hooks/useCarrierRating';
import { uploadCarrierLogo } from '@busnet/shared/lib/carrierLogo';

interface SubItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface MenuCategory {
  id: string;
  mobileLabel: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  color: string;
  activeBg: string;
  indicatorBg: string;
  glowClass: string;
  popoverShadow: string;
  path?: string;
  subItems: SubItem[];
}

const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'dashboard',
    mobileLabel: 'Головна',
    icon: LayoutGrid,
    color: 'text-[#00E5FF]',
    activeBg: 'bg-[#00E5FF]/10',
    indicatorBg: 'bg-[#00E5FF]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF]/50',
    popoverShadow: 'shadow-[0_0_20px_rgba(0,229,255,0.25)]',
    path: '/',
    subItems: []
  },
  {
    id: 'transport',
    mobileLabel: 'Рейси',
    icon: Bus,
    color: 'text-[#0EA5E9]',
    activeBg: 'bg-[#0EA5E9]/10',
    indicatorBg: 'bg-[#0EA5E9]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(14,165,233,0.6)] group-hover:border-[#0EA5E9]/50',
    popoverShadow: 'shadow-[0_0_20px_rgba(14,165,233,0.25)]',
    subItems: [
      { label: 'Розклад рейсів', path: '/trips', icon: Calendar },
      { label: 'Створити рейс', path: '/newtrip', icon: PlusCircle },
      { label: 'Перегляд квитків', path: '/ticket-preview', icon: Search },
      { label: 'Пасажири', path: '/passengers', icon: Users },
      { label: 'Бронювання', path: '/bookings', icon: Ticket },
      { label: 'Мій автопарк', path: '/buses', icon: Bus },
      { label: 'Водії', path: '/drivers', icon: Users },
    ]
  },
  {
    id: 'finance',
    mobileLabel: 'Фінанси',
    icon: Wallet,
    color: 'text-[#FBBF24]',
    activeBg: 'bg-[#FBBF24]/10',
    indicatorBg: 'bg-[#FBBF24]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(251,191,36,0.6)] group-hover:border-[#FBBF24]/50',
    popoverShadow: 'shadow-[0_0_20px_rgba(251,191,36,0.25)]',
    subItems: [
      { label: 'Доходи & Виплати', path: '/finance', icon: Wallet },
      { label: 'Повернення', path: '/refunds', icon: RotateCcw },
      { label: 'Інвойси', path: '/invoices', icon: FileText },
    ]
  },
  {
    id: 'analytics',
    mobileLabel: 'Звіти',
    icon: BarChart3,
    color: 'text-[#E879F9]',
    activeBg: 'bg-[#E879F9]/10',
    indicatorBg: 'bg-[#E879F9]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(232,121,249,0.6)] group-hover:border-[#E879F9]/50',
    popoverShadow: 'shadow-[0_0_20px_rgba(232,121,249,0.25)]',
    subItems: [
      { label: 'Аналітика маршрутів', path: '/analytics', icon: BarChart3 },
      { label: 'Відгуки & Рейтинг', path: '/reviews', icon: Star },
      { label: 'Агенти', path: '/agents', icon: Handshake },
    ]
  },
  {
    id: 'communication',
    mobileLabel: 'Чат',
    icon: MessageSquare,
    color: 'text-[#A855F7]',
    activeBg: 'bg-[#A855F7]/10',
    indicatorBg: 'bg-[#A855F7]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] group-hover:border-[#A855F7]/50',
    popoverShadow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]',
    subItems: [
      { label: 'Підтримка', path: '/support', icon: MessageSquare },
      { label: 'Сповіщення', path: '/notifications', icon: Bell },
    ]
  },
  {
    id: 'profile',
    mobileLabel: 'Профіль',
    icon: Settings,
    color: 'text-[#10B981]',
    activeBg: 'bg-[#10B981]/10',
    indicatorBg: 'bg-[#10B981]',
    glowClass: 'group-hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] group-hover:border-[#10B981]/50',
    popoverShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    subItems: [
      { label: 'Профіль компанії', path: '/profile', icon: Building },
      { label: 'Документи', path: '/docs', icon: ClipboardList },
      { label: 'Налаштування', path: '/settings', icon: Settings },
    ]
  }
];

const FloatingClock = () => {
  const [clock, setClock] = useState('');
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClock(`${now.toLocaleDateString('uk-UA')} ${now.toLocaleTimeString('uk-UA')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:block absolute bottom-6 right-8 z-10 text-[#8899B5] font-mono text-[11px] tracking-widest pointer-events-none">
      {clock}
    </div>
  );
};

export default function CarrierLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const rating = useCarrierRating(user?.uid);
  const userStatus = (user as any)?.status;

  useEffect(() => {
    if (!user) return;
    const fetchLogo = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('logoUrl')
        .eq('uid', user.uid)
        .single();
      if (!error && data?.logoUrl) {
        setLogoUrl(data.logoUrl);
      }
    };
    fetchLogo();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const loadUnread = () => {
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.uid)
        .eq('read', false)
        .then(({ count }) => setUnread(count ?? 0));
    };
    loadUnread();
    const ch = supabase.channel(`carrier_layout_notif_${user.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.uid}` }, loadUnread)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.uid]);

  const carrierName = user?.companyName || user?.firstName || 'Перевізник';
  const carrierInitials = carrierName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const sheetCat = MENU_CATEGORIES.find(c => c.id === sheet);

  const onAvatarFileSelected = async (file: File) => {
    if (!user) return;
    const toastId = toast.loading('Завантаження логотипу...');
    try {
      const newUrl = await uploadCarrierLogo(file, user.uid, logoUrl);
      setLogoUrl(newUrl);
      toast.success('Логотип успішно оновлено!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Помилка при завантаженні логотипу', { id: toastId });
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#050B14] text-[#e8edf5] overflow-hidden font-sans relative">
      {/* Background Starry/Space Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(232, 121, 249, 0.05) 0%, transparent 40%)'
      }} />

      {/* Floating Clock - Bottom right on desktop */}
      <FloatingClock />

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B1221]/90 backdrop-blur-xl border-b border-white/10 shrink-0 z-30">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg border border-[#00E5FF]/40 bg-black/40 flex items-center justify-center p-1 overflow-hidden shadow-[0_0_10px_rgba(0,229,255,0.2)]">
            <img src="/icon.png" alt="BUSNET UA" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[11px] font-black tracking-widest text-white leading-none">BUSNET UA</div>
            <div className="text-[8px] text-[#8899B5] uppercase font-bold tracking-widest mt-0.5 truncate max-w-[140px]">{carrierName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {rating && rating.count > 0 && (
            <div className="bg-[#1A2639] border border-[#FBBF24]/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
              <Star size={10} className="fill-[#FBBF24] text-[#FBBF24]" />
              <span className="text-[9px] font-black text-[#FBBF24]">{rating.avg.toFixed(1)}</span>
            </div>
          )}
          {/* Mobile Avatar with Upload */}
          <label className="cursor-pointer block relative">
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/webp" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAvatarFileSelected(file);
              }} 
            />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-[#E879F9]/20 border border-white/20 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-xs">{carrierInitials}</span>
              )}
            </div>
          </label>
        </div>
      </header>

      {/* Floating Sidebar (Desktop) */}
      <aside className="hidden md:flex relative z-50 w-[90px] h-[calc(100vh-48px)] my-6 ml-6 flex-col items-center py-6 rounded-[32px] bg-[#0B1221]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,229,255,0.05)] before:absolute before:inset-0 before:rounded-[32px] before:border before:border-transparent before:[background:linear-gradient(to_bottom,rgba(0,229,255,0.3),rgba(232,121,249,0.1),transparent) border-box] before:[mask-composite:exclude] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
        
        {/* Top Logo */}
        <div className="flex flex-col items-center gap-1 mb-6 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-12 h-10 border border-[#00E5FF]/40 rounded-xl flex items-center justify-center p-1 bg-black/40 shadow-[0_0_15px_rgba(0,229,255,0.2)] group-hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all overflow-hidden">
            <img src="/icon.png" alt="BUSNET UA" className="w-full h-full object-contain" />
          </div>
          <div className="text-center mt-1">
            <div className="text-[9px] font-black tracking-widest text-white">BUSNET UA</div>
            <div className="text-[8px] font-bold text-[#8899B5]">{new Date().getFullYear()}</div>
          </div>
        </div>

        {/* Avatar with Upload */}
        <div className="relative mb-8 group cursor-pointer">
          <label className="cursor-pointer block relative">
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/webp" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAvatarFileSelected(file);
              }} 
            />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00E5FF]/20 to-[#E879F9]/20 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all overflow-hidden relative">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover animate-in fade-in duration-300" />
              ) : (
                <span className="text-white font-black text-lg tracking-tighter">{carrierInitials}</span>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-center">
                <span className="text-[8px] text-white font-bold uppercase tracking-widest text-center leading-normal">Завантажити<br/>Логотип</span>
              </div>
            </div>
          </label>
          {rating && rating.count > 0 && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1A2639] border border-[#FBBF24]/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.2)] pointer-events-none">
              <Star size={8} className="fill-[#FBBF24] text-[#FBBF24]" />
              <span className="text-[8px] font-black text-[#FBBF24]">{rating.avg.toFixed(1)}</span>
            </div>
          )}
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
                  <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full ${cat.indicatorBg} shadow-[0_0_10px_currentColor]`} />
                )}

                <button
                  type="button"
                  aria-label={cat.mobileLabel}
                  onClick={() => {
                    if (cat.path) {
                      navigate(cat.path);
                      setHoveredMenu(null);
                    } else {
                      setHoveredMenu(hoveredMenu === cat.id ? null : cat.id);
                    }
                  }}
                  className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                    isActive 
                      ? `bg-white/10 border-white/20 shadow-inner` 
                      : `bg-transparent border-transparent ${cat.glowClass}`
                  }`}
                >
                  <cat.icon size={26} strokeWidth={1.5} className={`${cat.color} ${isActive ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`} />
                  
                  {/* Unread indicator */}
                  {cat.id === 'communication' && unread > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                  )}
                </button>

                {/* Glassmorphic Popover for sub-items */}
                <AnimatePresence>
                  {isHovered && cat.subItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute left-[70px] top-0 w-[210px] bg-[#0B1221]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 z-50 flex flex-col gap-1 ${cat.popoverShadow} before:absolute before:-left-[20px] before:top-0 before:w-[20px] before:h-full before:bg-transparent`}
                    >
                      {/* Arrow pointing left */}
                      <div className="absolute top-5 -left-[6px] w-3 h-3 bg-[#0B1221] border-l border-b border-white/10 rotate-45" />
                      
                      {cat.subItems.map((sub, i) => {
                        const isSubActive = location.pathname.startsWith(sub.path);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              navigate(sub.path);
                              setHoveredMenu(null);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                              isSubActive
                                ? `${cat.activeBg} ${cat.color} font-bold`
                                : 'text-[#8899B5] hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <sub.icon size={16} />
                              <span className="text-[11px] uppercase tracking-widest">{sub.label}</span>
                            </div>
                            {sub.path === '/notifications' && unread > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-black border border-rose-500/30">
                                {unread}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Simple Tooltip for items without sub-items (like Dashboard) */}
                  {isHovered && cat.subItems.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-[70px] top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0B1221]/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-xs font-bold tracking-widest text-white z-50 shadow-xl before:absolute before:-left-[20px] before:top-0 before:w-[20px] before:h-full before:bg-transparent"
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
            type="button"
            onClick={() => logout()}
            className="w-12 h-12 rounded-full border border-rose-500/30 bg-rose-500/5 flex items-center justify-center text-rose-500 transition-all group-hover:bg-rose-500/20 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] group-hover:border-rose-500/50"
            title="Вийти з акаунту"
          >
            <LogOut size={20} strokeWidth={1.5} className="ml-1" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10 p-4 pb-24 md:p-6 md:pb-6 scrollbar-hide">
        {/* Verification / Blocked status banners */}
        {userStatus === 'pending_verification' && (
          <div className="mb-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold uppercase tracking-widest flex items-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <AlertCircle size={18} className="shrink-0 text-amber-400" />
            <div className="leading-relaxed">
              Компанія на перевірці. Завантажте документи у розділі{' '}
              <button onClick={() => navigate('/docs')} className="underline hover:text-white transition-colors">
                «Документи»
              </button>{' '}
              — створення рейсів доступне після схвалення.
            </div>
          </div>
        )}

        {userStatus === 'blocked' && (
          <div className="mb-4 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-bold uppercase tracking-widest flex items-center gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
            <div className="leading-relaxed">
              Акаунт заблоковано. Зверніться до підтримки{' '}
              <button onClick={() => navigate('/support')} className="underline hover:text-white transition-colors">
                у розділі «Підтримка»
              </button>.
            </div>
          </div>
        )}

        <Outlet />
      </div>

      {/* Mobile Bottom Navigation Sheet */}
      <AnimatePresence>
        {sheetCat && (
          <>
            <motion.div 
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSheet(null)} 
            />
            <motion.div
              className="md:hidden fixed left-0 right-0 z-50 bg-[#0B1221] border-t border-white/10 rounded-t-3xl p-4 shadow-2xl"
              style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom))' }}
              initial={{ y: 40, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <sheetCat.icon size={18} className={sheetCat.color} />
                  <span className="text-xs font-black uppercase tracking-widest text-white">{sheetCat.mobileLabel}</span>
                </div>
                <span className="text-[9px] text-[#5A6A85] font-bold uppercase tracking-widest">
                  {sheetCat.subItems.length} розділів
                </span>
              </div>
              <div className="space-y-1">
                {sheetCat.subItems.map(sub => {
                  const isSubActive = location.pathname.startsWith(sub.path);
                  return (
                    <button 
                      key={sub.path}
                      type="button"
                      onClick={() => { navigate(sub.path); setSheet(null); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                        isSubActive 
                          ? `${sheetCat.color} ${sheetCat.activeBg} font-black border border-white/10` 
                          : 'text-[#8899B5] hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <sub.icon size={18} />
                        <span className="text-[12px] uppercase tracking-widest">{sub.label}</span>
                      </div>
                      {sub.path === '/notifications' && unread > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-black">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B1221]/95 backdrop-blur-xl border-t border-white/15 px-2 py-2 flex justify-between items-center"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        {MENU_CATEGORIES.map((cat) => {
          const isActive = cat.path === location.pathname || cat.subItems.some(sub => location.pathname.startsWith(sub.path));
          const isSheetOpen = sheet === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              aria-label={cat.mobileLabel}
              onClick={() => {
                if (cat.path) {
                  navigate(cat.path);
                  setSheet(null);
                } else {
                  setSheet(sheet === cat.id ? null : cat.id);
                }
              }}
              className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
                isActive || isSheetOpen ? cat.color : 'text-[#8899B5]'
              }`}
            >
              <cat.icon size={20} className={isActive || isSheetOpen ? `drop-shadow-[0_0_8px_currentColor]` : ''} />
              <span className="text-[8px] mt-1 font-black uppercase tracking-widest">
                {cat.mobileLabel}
              </span>

              {/* Unread dot on mobile */}
              {cat.id === 'communication' && unread > 0 && (
                <span className="absolute top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Global Interactive Command Center */}
      <BusnetNexus />
    </div>
  );
}
