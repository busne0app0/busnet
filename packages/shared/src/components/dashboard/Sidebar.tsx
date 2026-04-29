import React, { useRef } from 'react';
import { 
  X, LogOut, LayoutDashboard, Ticket, Users, Star, 
  Search, Bell, MessageSquare, ClipboardList, User, 
  Settings, History 
} from 'lucide-react';

import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  isSidebarOpen: boolean;
  closeSidebar: () => void;
  activeTab: string;
  setActiveTab: (id: string) => void;
  handleLogout: () => void;
  t: any;
  unreadCount?: number;
  activeTicketsCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isSidebarOpen, 
  closeSidebar, 
  activeTab, 
  setActiveTab, 
  handleLogout,
  t,
  unreadCount = 0,
  activeTicketsCount = 0
}) => {
  const { user } = useAuthStore();
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -50) closeSidebar();
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Головне',
      items: [
        { id: 'overview', label: t.overview || 'Огляд', icon: LayoutDashboard },
        { id: 'tickets', label: t.tickets || 'Мої квитки', icon: Ticket, badge: activeTicketsCount || undefined },
        { id: 'passengers', label: t.passengers || 'Пасажири', icon: Users },
        { id: 'bonuses', label: t.bonuses || 'Бонуси', icon: Star },
      ]
    },
    {
      title: 'Сервіс',
      items: [
        { id: 'search', label: t.search || 'Пошук', icon: Search },
        { id: 'notifications', label: t.notifications || 'Сповіщення', icon: Bell, badge: unreadCount || undefined },
        { id: 'support', label: t.support || 'Підтримка', icon: MessageSquare },
      ]
    },
    {
      title: 'Спільнота',
      items: [
        { id: 'forum', label: t.forum || 'Форум', icon: ClipboardList },
      ]
    },
    {
      title: 'Акаунт',
      items: [
        { id: 'profile', label: t.profile || 'Профіль', icon: User },
        { id: 'settings', label: t.settings || 'Налаштування', icon: Settings },
        { id: 'history', label: t.history || 'Історія', icon: History },
      ]
    }
  ];

  const userAvatar = user ? (user.firstName[0] + (user.lastName?.[0] || '')).toUpperCase() : '??';

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-[#1e3a5f] flex flex-col transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Logo */}
      <div className="p-6 border-b border-[#1e3a5f] flex items-center gap-3">
        <div className="w-8 h-8 bg-[#00c8ff] rounded-md flex items-center justify-center font-black text-[#0a0e1a]">BN</div>
        <span className="text-sm font-bold tracking-widest text-[#00c8ff]">BUSNET UA</span>
        <button className="md:hidden ml-auto text-[#7a9ab5]" onClick={closeSidebar}>
          <X size={20} />
        </button>
      </div>

      {/* User Profile Info */}
      <div className="p-4 border-b border-[#1e3a5f] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0099cc] to-[#005f8a] flex items-center justify-center font-black text-white">
          {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : userAvatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate leading-tight text-white">{user?.firstName} {user?.lastName?.[0]}.</p>
          <p className="text-[10px] text-[#7a9ab5] truncate">{user?.email}</p>
        </div>
        <div className="w-2 h-2 bg-[#00e676] rounded-full shadow-[0_0_8px_#00e676]" />
      </div>

      {/* Navigation Scrollable */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="mb-6">
            <p className="px-6 text-[10px] font-bold text-[#4a6a85] uppercase tracking-widest mb-2">{group.title}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); closeSidebar(); }}
                className={`
                  w-full flex items-center gap-4 px-6 py-3 text-xs font-medium transition-all relative border-l-2
                  ${activeTab === item.id 
                    ? 'bg-[#00c8ff]/10 text-[#00c8ff] border-[#00c8ff]' 
                    : 'text-[#7a9ab5] hover:bg-[#1a2235] hover:text-[#e8f4ff] border-transparent'}
                `}
              >
                <item.icon size={16} strokeWidth={2} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-black ${item.id === 'tickets' ? 'bg-[#00c8ff] text-black' : 'bg-[#f44336] text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout Bottom */}
      <div
        className="p-4 border-t border-[#1e3a5f]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <button 
          onClick={handleLogout}
          className="w-full py-2.5 rounded-lg border border-[#1e3a5f] text-[11px] font-bold text-[#7a9ab5] hover:text-[#f44336] hover:border-[#f44336] transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={14} />
          {t.logout || 'Вийти'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
