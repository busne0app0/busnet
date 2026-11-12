import React from 'react';
import { 
  Home, 
  Globe, 
  MessageSquare, 
  Users, 
  Search, 
  Bell, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { ConnectTabType } from '../types/connect.types';
import { useLanguage } from '../../context/LanguageContext';

interface ConnectNavbarProps {
  activeTab: ConnectTabType;
  onSelectTab: (tab: ConnectTabType) => void;
  unreadCount?: number;
}

export const ConnectNavbar: React.FC<ConnectNavbarProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 0,
}) => {
  const { language } = useLanguage();
  const lang = (language || 'UK').toUpperCase();

  const labels: Record<string, Record<ConnectTabType, string>> = {
    UK: {
      home: 'Головна',
      community: 'Спільнота',
      messages: 'Повідомлення',
      groups: 'Групи',
      discover: 'Відкриття',
      notifications: 'Сповіщення',
      profile: 'Профіль',
    },
    EN: {
      home: 'Home',
      community: 'Community',
      messages: 'Messages',
      groups: 'Groups',
      discover: 'Discover',
      notifications: 'Alerts',
      profile: 'Profile',
    },
    IT: {
      home: 'Home',
      community: 'Comunità',
      messages: 'Messaggi',
      groups: 'Gruppi',
      discover: 'Scopri',
      notifications: 'Notifiche',
      profile: 'Profilo',
    },
  };

  const t = labels[lang] || labels.UK;

  const navItems: { id: ConnectTabType; label: string; icon: any; badge?: string }[] = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'community', label: t.community, icon: Globe },
    { id: 'messages', label: t.messages, icon: MessageSquare, badge: 'Soon' },
    { id: 'groups', label: t.groups, icon: Users, badge: 'Soon' },
    { id: 'discover', label: t.discover, icon: Search },
    { id: 'notifications', label: t.notifications, icon: Bell, badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { id: 'profile', label: t.profile, icon: UserIcon },
  ];

  return (
    <div className="w-full bg-[#0a0f1d]/90 backdrop-blur-xl border-b border-cyan-500/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tag */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl font-black tracking-wider text-white">
                BUSNET <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">CONNECT</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-3 h-3 mr-1" /> HUB
              </span>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`
                    relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,212,255,0.15)]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.badge === 'Soon' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-cyan-500 text-slate-950 font-black'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Horizontal Scrollable TabBar */}
      <div className="md:hidden overflow-x-auto no-scrollbar border-t border-slate-800/50 bg-[#0d1322]/80 px-2 py-1.5 flex items-center space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all
                ${isActive 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

