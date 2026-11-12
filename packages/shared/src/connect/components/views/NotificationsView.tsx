import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Heart,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

type NotificationType = 'like' | 'comment' | 'system';

type NotificationItem = {
  id: string;
  type: NotificationType;
  author: string;
  text: string;
  time: string;
  isUnread: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'like',
    author: 'Олена (Рим)',
    text: 'вподобала ваш допис «Поради щодо нічного рейсу через Альпи»',
    time: '15 хв тому',
    isUnread: true,
  },
  {
    id: 'n2',
    type: 'comment',
    author: 'Максим_Express',
    text: 'залишив коментар: «Чи є ще вільне місце для невеликої посилки?»',
    time: '1 год тому',
    isUnread: true,
  },
  {
    id: 'n3',
    type: 'system',
    author: 'BUSNET CONNECT',
    text: 'Ваш профіль верифіковано як надійного попутника',
    time: 'Вчора',
    isUnread: false,
  },
];

const getUnreadCountLabel = (count: number) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  const label =
    lastTwoDigits >= 11 && lastTwoDigits <= 14
      ? 'непрочитаних'
      : lastDigit === 1
        ? 'непрочитане'
        : lastDigit >= 2 && lastDigit <= 4
          ? 'непрочитані'
          : 'непрочитаних';

  return `${count} ${label}`;
};

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
  if (type === 'like') {
    return <Heart className="h-4 w-4 fill-rose-400/15 text-rose-300" aria-hidden="true" />;
  }

  if (type === 'comment') {
    return <MessageSquare className="h-4 w-4 text-cyan-200" aria-hidden="true" />;
  }

  return <Sparkles className="h-4 w-4 text-amber-200" aria-hidden="true" />;
};

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((notification) => notification.isUnread).length;

  const handleMarkAllRead = () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isUnread: false,
      })),
    );
    toast.success('Всі сповіщення позначено як прочитані');
  };

  return (
    <section
      aria-labelledby="notifications-heading"
      className="mx-auto w-full max-w-3xl"
    >
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c1420] shadow-[0_20px_70px_rgba(0,0,0,0.18)]">
        <header className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.07] text-cyan-200">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1
                id="notifications-heading"
                className="text-lg font-semibold tracking-tight text-white sm:text-xl"
              >
                Центр сповіщень
              </h1>
              <p className="mt-1 text-xs text-slate-500">Останні події у вашій спільноті</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <span
              aria-live="polite"
              className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-slate-400"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${unreadCount > 0 ? 'bg-cyan-300' : 'bg-slate-600'}`}
                aria-hidden="true"
              />
              {unreadCount > 0 ? getUnreadCountLabel(unreadCount) : 'Усе прочитано'}
            </span>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                aria-label="Позначити всі сповіщення як прочитані"
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-200/[0.07] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                <span>Прочитати всі</span>
              </button>
            )}
          </div>
        </header>

        {notifications.length > 0 ? (
          <ul className="flex flex-col gap-2.5 p-3 sm:gap-3 sm:p-5">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <article
                  className={`flex items-start gap-3.5 rounded-2xl border p-4 transition-colors sm:gap-4 sm:p-5 ${notification.isUnread
                      ? 'border-cyan-200/15 bg-cyan-200/[0.035]'
                      : 'border-white/[0.06] bg-white/[0.018]'
                    }`}
                >
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${notification.isUnread
                        ? 'border-white/[0.09] bg-[#080d15]/80'
                        : 'border-white/[0.06] bg-white/[0.025]'
                      }`}
                  >
                    <NotificationIcon type={notification.type} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-slate-300">
                      {notification.isUnread && <span className="sr-only">Непрочитане. </span>}
                      <span
                        className={`mr-1.5 font-semibold ${notification.isUnread ? 'text-white' : 'text-slate-200'
                          }`}
                      >
                        {notification.author}
                      </span>
                      {notification.text}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-500">{notification.time}</p>
                  </div>

                  {notification.isUnread && (
                    <span
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.5)]"
                      aria-hidden="true"
                    />
                  )}
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-slate-400">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-white">Поки немає сповіщень</h2>
            <p className="mt-1.5 text-xs text-slate-500">Нові події з’являться тут.</p>
          </div>
        )}
      </div>
    </section>
  );
};
