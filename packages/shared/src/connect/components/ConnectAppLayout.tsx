import React from 'react';
import { 
  Home, 
  Search, 
  Plus, 
  MessageSquare, 
  User as UserIcon,
  ArrowLeft,
  Bell,
  Sparkles,
  Ticket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ConnectTabType } from '../types/connect.types';

interface ConnectAppLayoutProps {
  children: React.ReactNode;
  activeTab: ConnectTabType;
  onSelectTab: (tab: ConnectTabType) => void;
  onOpenCreateModal: () => void;
  unreadCount?: number;
}

export const ConnectAppLayout: React.FC<ConnectAppLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  onOpenCreateModal,
  unreadCount = 0,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const userInitials = (
    (user?.firstName?.[0] || user?.email?.[0] || 'U') +
    (user?.lastName?.[0] || '')
  ).toUpperCase();

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* ── TOP APP HEADER (Instagram/Threads style) ── */}
      <header className="sticky top-0 z-40 bg-[#080e1b]/95 backdrop-blur-xl border-b border-cyan-500/15 h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between shadow-lg">
        {/* Left: Quick Back to Passenger Cabinet */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all text-xs font-bold"
            title="Повернутися до кабінету квитків"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">До квитків</span>
            <Ticket className="w-3.5 h-3.5 text-cyan-400 sm:hidden" />
          </button>
        </div>

        {/* Center: BUSNET CONNECT Brand Badge */}
        <div 
          onClick={() => onSelectTab('community')}
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.4)] group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className="font-black text-sm sm:text-base tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                BUSNET
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 tracking-wider">
                CONNECT
              </span>
            </div>
            <span className="text-[9px] text-slate-400 hidden sm:block -mt-0.5">
              Соціальна мережа мандрівників
            </span>
          </div>
        </div>

        {/* Right: Notifications + User Avatar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => onSelectTab('notifications')}
            className={`p-2 rounded-xl transition-all relative ${
              activeTab === 'notifications'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Сповіщення"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('profile')}
            className={`rounded-full transition-transform hover:scale-105 p-0.5 border-2 ${
              activeTab === 'profile' ? 'border-cyan-400 shadow-[0_0_12px_rgba(0,212,255,0.4)]' : 'border-transparent'
            }`}
            title="Мій профіль"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.firstName || 'Аватар'}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-cyan-950 to-slate-800 border border-cyan-500/30 flex items-center justify-center font-bold text-[11px] text-cyan-300">
                {userInitials}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT (Pure Feed Screen) ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 pb-24 sm:pb-8">
        {children}
      </main>

      {/* ── INSTAGRAM-STYLE BOTTOM NAVIGATION BAR (Mobile & Tablet) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080e1b]/95 backdrop-blur-xl border-t border-cyan-500/15 sm:hidden px-3 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
        {/* 1. Feed / Community */}
        <button
          onClick={() => onSelectTab('community')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'community' || activeTab === 'home'
              ? 'text-cyan-400 scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'community' || activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-semibold mt-0.5">Стрічка</span>
        </button>

        {/* 2. Discover / Search */}
        <button
          onClick={() => onSelectTab('discover')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'discover'
              ? 'text-cyan-400 scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className={`w-5 h-5 ${activeTab === 'discover' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-semibold mt-0.5">Пошук</span>
        </button>

        {/* 3. Center Create Post Button (+) */}
        <div className="relative -top-3">
          <button
            onClick={onOpenCreateModal}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.45)] active:scale-95 transition-transform"
            title="Створити допис"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Messages / Chat */}
        <button
          onClick={() => onSelectTab('messages')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'messages'
              ? 'text-cyan-400 scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-semibold mt-0.5">Чат</span>
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'text-cyan-400 scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-semibold mt-0.5">Профіль</span>
        </button>
      </nav>
    </div>
  );
};

