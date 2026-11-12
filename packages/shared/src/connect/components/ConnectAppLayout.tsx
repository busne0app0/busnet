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
  Ticket,
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

  const isFeedActive = activeTab === 'community' || activeTab === 'home';
  const safeUnreadCount = Number.isFinite(unreadCount)
    ? Math.max(0, Math.floor(unreadCount))
    : 0;
  const unreadBadge = safeUnreadCount > 99 ? '99+' : safeUnreadCount > 9 ? '9+' : safeUnreadCount;
  const notificationLabel = safeUnreadCount > 0
    ? `Сповіщення, непрочитаних: ${safeUnreadCount}`
    : 'Сповіщення';

  const desktopNavClass = (isActive: boolean) =>
    `flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11] ${isActive
      ? 'bg-white/[0.09] text-white'
      : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
    }`;

  const mobileNavClass = (isActive: boolean) =>
    `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f16] ${isActive ? 'text-cyan-200' : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#080b11] font-sans text-slate-100 selection:bg-cyan-400/20">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080b11]/90 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label="Повернутися до кабінету квитків"
              title="Повернутися до кабінету квитків"
              className="group flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-2.5 text-slate-300 transition-colors hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11] sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-cyan-200" />
              <span className="hidden text-xs font-medium sm:inline">До квитків</span>
              <Ticket className="h-4 w-4 text-slate-400 sm:hidden" />
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('community')}
              aria-label="BUSNET Connect — стрічка"
              className="flex min-w-0 items-center gap-2.5 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
                <Sparkles className="h-4 w-4 fill-slate-950" />
              </span>
              <span className="flex min-w-0 flex-col leading-none">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-white sm:text-base">BUSNET</span>
                  <span className="rounded-full border border-white/[0.1] px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-slate-400">
                    CONNECT
                  </span>
                </span>
              </span>
            </button>
          </div>

          <nav
            aria-label="Основна навігація"
            className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.035] p-1 lg:flex"
          >
            <button
              type="button"
              onClick={() => onSelectTab('community')}
              aria-current={isFeedActive ? 'page' : undefined}
              className={desktopNavClass(isFeedActive)}
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Стрічка</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('discover')}
              aria-current={activeTab === 'discover' ? 'page' : undefined}
              className={desktopNavClass(activeTab === 'discover')}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Пошук</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('messages')}
              aria-current={activeTab === 'messages' ? 'page' : undefined}
              className={desktopNavClass(activeTab === 'messages')}
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              <span>Чат</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              aria-label="Створити допис"
              className="ml-1 flex h-9 items-center gap-1.5 rounded-full bg-cyan-300 px-3.5 text-[13px] font-semibold text-slate-950 transition-colors hover:bg-cyan-200 active:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Допис</span>
            </button>
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('notifications')}
              aria-label={notificationLabel}
              aria-current={activeTab === 'notifications' ? 'page' : undefined}
              title={notificationLabel}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11] ${activeTab === 'notifications'
                  ? 'bg-white/[0.09] text-cyan-200'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
              {safeUnreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-[#080b11] bg-rose-400 px-1 text-[9px] font-bold leading-none text-slate-950">
                  {unreadBadge}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              aria-label="Мій профіль"
              aria-current={activeTab === 'profile' ? 'page' : undefined}
              title="Мій профіль"
              className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11] ${activeTab === 'profile'
                  ? 'border-cyan-200 ring-2 ring-cyan-200/20'
                  : 'border-white/[0.12] hover:border-white/30'
                }`}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-white/[0.08] text-xs font-semibold text-slate-200">
                  {userInitials}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-7 lg:pb-10">
        {children}
      </main>

      <nav
        aria-label="Мобільна навігація"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0b0f16]/95 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => onSelectTab('community')}
            aria-current={isFeedActive ? 'page' : undefined}
            className={mobileNavClass(isFeedActive)}
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            <span>Стрічка</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('discover')}
            aria-current={activeTab === 'discover' ? 'page' : undefined}
            className={mobileNavClass(activeTab === 'discover')}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            <span>Пошук</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            aria-label="Створити допис"
            title="Створити допис"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 transition-colors hover:bg-cyan-200 active:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f16]"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('messages')}
            aria-current={activeTab === 'messages' ? 'page' : undefined}
            className={mobileNavClass(activeTab === 'messages')}
          >
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            <span>Чат</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            aria-current={activeTab === 'profile' ? 'page' : undefined}
            className={mobileNavClass(activeTab === 'profile')}
          >
            <UserIcon className="h-5 w-5" aria-hidden="true" />
            <span>Профіль</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
