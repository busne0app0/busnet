import React, { useState, useEffect } from 'react';
import { Menu, Bell, LayoutDashboard, Ticket, Search, User, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (id: string) => void;
  t: any;
  handleLogout: () => void;
  unreadCount?: number;
  activeTicketsCount?: number;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  t, 
  handleLogout,
  unreadCount = 0,
  activeTicketsCount = 0
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Блокуємо скрол фону при відкритому меню
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      overview: t.overview || 'Огляд кабінету',
      tickets: t.tickets || 'Мої квитки',
      passengers: t.passengers || 'Пасажири',
      bonuses: t.bonuses || 'Бонусна програма',
      search: t.search || 'Пошук рейсів',
      notifications: t.notifications || 'Сповіщення',
      support: t.support || 'Підтримка 24/7',
      forum: t.forum || 'Форум попутників',
      profile: t.profile || 'Мій профіль',
      settings: t.settings || 'Налаштування',
      history: t.history || 'Історія поїздок',
    };
    return titles[activeTab] || 'Кабінет пасажира';
  };

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] bg-[#030712] text-slate-100 font-sans overflow-hidden">
      
      {/* Затемнення фону при відкритому сайдбарі */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden animate-fadeIn"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Сайдбар */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        t={t}
        unreadCount={unreadCount}
        activeTicketsCount={activeTicketsCount}
      />

      {/* Основна робоча область */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Верхній бар (Header) */}
        <header className="h-16 bg-[#0b1323]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-3">
            {/* Збільшена сенсорна кнопка меню (легко натискати пальцем на ходу) */}
            <button 
              className="md:hidden flex items-center justify-center w-10 h-10 -ml-1 text-cyan-400 bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all active:scale-95 cursor-pointer" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Відкрити меню"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                {getPageTitle()}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Кнопка сповіщень */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 transition-all text-slate-300 hover:text-white active:scale-95 cursor-pointer"
              aria-label="Сповіщення"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Кнопка нового пошуку на десктопі */}
            <button 
              onClick={() => {
                if (setActiveTab) setActiveTab('search');
                window.location.href = '/';
              }}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Купити квиток</span>
            </button>
          </div>
        </header>

        {/* Скроліруєма область контенту */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 relative custom-scrollbar overscroll-contain">
          <div className="max-w-6xl mx-auto pb-6">
            {children}
          </div>
        </main>

        {/* Нижня навігація для смартфонів (Bottom Navigation) */}
        <nav
          className="md:hidden flex items-center justify-around bg-[#0b1323]/95 backdrop-blur-xl border-t border-slate-800/90 shrink-0 z-40 px-2 pt-1.5"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
        >
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all min-h-[48px] active:scale-95 cursor-pointer ${
              activeTab === 'overview' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-cyan-500/15' : ''}`}>
              <LayoutDashboard size={20} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{t.overview || 'Головна'}</span>
          </button>

          <button 
            onClick={() => setActiveTab('tickets')} 
            className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all min-h-[48px] active:scale-95 cursor-pointer ${
              activeTab === 'tickets' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all relative ${activeTab === 'tickets' ? 'bg-cyan-500/15' : ''}`}>
              <Ticket size={20} />
              {activeTicketsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-cyan-400 w-2 h-2 rounded-full shadow-[0_0_8px_#22d3ee]" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{t.tickets || 'Квитки'}</span>
          </button>

          <button 
            onClick={() => {
              if (setActiveTab) setActiveTab('search');
              window.location.href = '/';
            }} 
            className="flex flex-col items-center justify-center flex-1 py-1 transition-all min-h-[48px] active:scale-95 text-slate-400 hover:text-cyan-400 cursor-pointer"
          >
            <div className="p-1 rounded-xl">
              <Search size={20} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{t.search || 'Пошук'}</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all min-h-[48px] active:scale-95 cursor-pointer ${
              activeTab === 'profile' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-cyan-500/15' : ''}`}>
              <User size={20} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{t.profile || 'Профіль'}</span>
          </button>
        </nav>

      </div>
    </div>
  );
};

export default DashboardLayout;
