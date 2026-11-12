import React, { useState } from 'react';
import { Bell, Heart, MessageSquare, Sparkles, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState([
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
  ]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
    toast.success('Всі сповіщення позначено як прочитані');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Центр сповіщень</h2>
        </div>
        {notifications.some(n => n.isUnread) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Прочитати всі</span>
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
              n.isUnread 
                ? 'bg-[#0e172a] border-cyan-500/30' 
                : 'bg-[#0a101d] border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              {getIcon(n.type)}
            </div>

            <div className="flex-1 text-xs">
              <div className="leading-relaxed">
                <span className="font-bold text-white mr-1.5">{n.author}</span>
                <span className="text-slate-300">{n.text}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{n.time}</div>
            </div>

            {n.isUnread && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

