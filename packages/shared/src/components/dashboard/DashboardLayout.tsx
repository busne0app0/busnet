import React, { useState } from 'react';
import { Menu, Bell, LayoutDashboard, Ticket, Search, User } from 'lucide-react';
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

  React.useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  // Derive title from activeTab
  const getPageTitle = () => {
    // This is a simple mapper, ideally t contains labels or we pass them in
    const titles: Record<string, string> = {
      overview: t.overview || 'Огляд',
      tickets: t.tickets || 'Мої квитки',
      passengers: t.passengers || 'Пасажири',
      bonuses: t.bonuses || 'Бонуси',
      search: t.search || 'Пошук',
      notifications: t.notifications || 'Сповіщення',
      support: t.support || 'Підтримка',
      forum: t.forum || 'Форум',
      profile: t.profile || 'Профіль',
      settings: t.settings || 'Налаштування',
      history: t.history || 'Історія',
    };
    return titles[activeTab] || 'Кабінет';
  };

  return (
    <div className="flex min-h-screen bg-[#0a0e1a] text-[#e8f4ff] font-sans overflow-hidden">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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

      {/* --- MAIN AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-14 bg-[#111827] border-b border-[#1e3a5f] px-6 flex items-center justify-between z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[#00c8ff]" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="text-base font-medium text-white tracking-wide">
              {getPageTitle()}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <button
             onClick={() => setActiveTab('notifications')}
             className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-white/5 transition-all text-[#e8f4ff] active:scale-95"
             aria-label="Сповіщення"
          >
             <Bell size={18} />
             {unreadCount > 0 && (
               <span className="absolute top-1 right-1 bg-[#f44336] text-white text-[8px] font-black px-1 rounded-full border border-[#111827]">
                 {unreadCount}
               </span>
             )}
          </button>
             <button 
               onClick={() => setActiveTab('search')}
               className="hidden md:block bg-[#1a2235] border border-[#1e3a5f] rounded-lg px-3 py-1.5 text-[10px] font-black text-[#00c8ff] uppercase tracking-wider hover:bg-[#00c8ff] hover:text-black transition-all"
             >
                + Знайти квиток
             </button>
          </div>
        </header>

        {/* Page Content Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Bottom Navigation for Mobile */}
        <nav
          className="md:hidden flex items-center justify-around bg-[#111827] border-t border-[#1e3a5f] pt-2"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        >
          <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center justify-center w-full ${activeTab === 'overview' ? 'text-[#00c8ff]' : 'text-[#7a9ab5]'}`}>
            <LayoutDashboard size={20} />
            <span className="text-[10px] mt-1 font-medium">{t.overview || 'Огляд'}</span>
          </button>
          <button onClick={() => setActiveTab('tickets')} className={`relative flex flex-col items-center justify-center w-full ${activeTab === 'tickets' ? 'text-[#00c8ff]' : 'text-[#7a9ab5]'}`}>
            <Ticket size={20} />
            <span className="text-[10px] mt-1 font-medium">{t.tickets || 'Квитки'}</span>
            {activeTicketsCount > 0 && <span className="absolute top-0 right-4 bg-[#00c8ff] w-2 h-2 rounded-full shadow-[0_0_8px_#00c8ff]"></span>}
          </button>
          <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center justify-center w-full ${activeTab === 'search' ? 'text-[#00c8ff]' : 'text-[#7a9ab5]'}`}>
            <Search size={20} />
            <span className="text-[10px] mt-1 font-medium">{t.search || 'Пошук'}</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center w-full ${activeTab === 'profile' ? 'text-[#00c8ff]' : 'text-[#7a9ab5]'}`}>
            <User size={20} />
            <span className="text-[10px] mt-1 font-medium">{t.profile || 'Профіль'}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
