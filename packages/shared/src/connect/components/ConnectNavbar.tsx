"use client";

import React from 'react';
import {
  Bell,
  Globe,
  Home,
  MessageSquare,
  Search,
  Sparkles,
  User as UserIcon,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ConnectTabType } from '../types/connect.types';
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
  const lang = (language || 'UK').slice(0, 2).toUpperCase();

  const labels: Record<string, Record<ConnectTabType, string> & { navigation: string; soon: string; unread: string }> = {
    UK: {
      navigation: 'Основна навігація',
      soon: 'Скоро',
      unread: 'непрочитаних сповіщень',
      home: 'Головна',
      community: 'Спільнота',
      messages: 'Повідомлення',
      groups: 'Групи',
      discover: 'Відкриття',
      notifications: 'Сповіщення',
      profile: 'Профіль',
    },
    EN: {
      navigation: 'Main navigation',
      soon: 'Soon',
      unread: 'unread notifications',
      home: 'Home',
      community: 'Community',
      messages: 'Messages',
      groups: 'Groups',
      discover: 'Discover',
      notifications: 'Alerts',
      profile: 'Profile',
    },
    IT: {
      navigation: 'Navigazione principale',
      soon: 'Presto',
      unread: 'notifiche non lette',
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
  const safeUnreadCount = Number.isFinite(unreadCount) && unreadCount > 0 ? Math.floor(unreadCount) : 0;

  type NavigationItem = {
    id: ConnectTabType;
    label: string;
    icon: LucideIcon;
    badge?: { type: 'soon' } | { type: 'unread'; count: number };
  };

  const navItems: NavigationItem[] = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'community', label: t.community, icon: Globe },
    { id: 'messages', label: t.messages, icon: MessageSquare, badge: { type: 'soon' } },
    { id: 'groups', label: t.groups, icon: Users, badge: { type: 'soon' } },
    { id: 'discover', label: t.discover, icon: Search },
    { id: 'notifications', label: t.notifications, icon: Bell, badge: safeUnreadCount > 0 ? { type: 'unread', count: safeUnreadCount } : undefined },
    { id: 'profile', label: t.profile, icon: UserIcon },
  ];

  const renderNavItem = (item: NavigationItem, compact = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const badgeLabel = item.badge?.type === 'soon'
      ? t.soon
      : item.badge?.type === 'unread'
        ? `${item.badge.count} ${t.unread}`
        : undefined;
    const badgeText = item.badge?.type === 'soon'
      ? t.soon
      : item.badge?.type === 'unread'
        ? item.badge.count > 99 ? '99+' : String(item.badge.count)
        : undefined;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectTab(item.id)}
        aria-current={isActive ? 'page' : undefined}
        aria-label={badgeLabel ? `${item.label}, ${badgeLabel}` : item.label}
        className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:text-sm ${compact ? 'rounded-lg px-3 text-xs' : ''} ${isActive
          ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100 shadow-[0_0_18px_rgba(0,212,255,0.08)]'
          : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
      >
        <Icon className={`${compact ? 'size-3.5' : 'size-4'} shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} aria-hidden="true" />
        <span className="whitespace-nowrap">{item.label}</span>
        {badgeText && (
          <span
            aria-hidden="true"
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none ${item.badge?.type === 'soon'
              ? 'border border-slate-700 bg-slate-800 text-slate-400'
              : 'bg-cyan-300 text-slate-950'
              }`}
          >
            {badgeText}
          </span>
        )}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/10 bg-[#0a0f1d]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-lg font-semibold tracking-wide text-white sm:text-xl">
            BUSNET <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400 bg-clip-text text-transparent">CONNECT</span>
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-md border border-cyan-500/20 bg-cyan-500/[0.08] px-2 py-1 text-[10px] font-semibold text-cyan-200 sm:inline-flex">
            <Sparkles className="size-3" aria-hidden="true" />
            HUB
          </span>
        </div>

        <nav aria-label={t.navigation} className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => renderNavItem(item))}
        </nav>
      </div>

      <nav
        aria-label={t.navigation}
        className="no-scrollbar flex items-center gap-1 overflow-x-auto overscroll-x-contain border-t border-slate-800/60 bg-[#0d1322]/80 px-2 py-1.5 lg:hidden"
      >
        {navItems.map((item) => renderNavItem(item, true))}
      </nav>
    </header>
  );
};
