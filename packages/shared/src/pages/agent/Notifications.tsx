/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, Mail, Ticket, Wallet, RefreshCcw, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { NOTIFICATIONS_DATA } from './constants';

export default function Notifications() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DATA);
  const navigate = useNavigate();

  const markAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success('Всі сповіщення прочитані');
  };

  const deleteNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
    toast.error('Сповіщення видалено');
  };

  const handleAction = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('повідомлення')) navigate('/chat');
    else if (lowerText.includes('bk-')) navigate('/mybookings');
    else if (lowerText.includes('виплата')) navigate('/finance');
    else if (lowerText.includes('повернення')) navigate('/refunds');
    else if (lowerText.includes('рейтинг')) navigate('/analytics');
    else toast.success(`Дія: ${text}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
            Сповіщення
          </h1>
          <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
            Всі системні та ділові повідомлення
          </p>
        </div>
        <button 
          onClick={markAsRead}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#7a8fa8] hover:text-white transition-all flex items-center gap-2"
        >
          <Check size={14} /> Всі прочитані
        </button>
      </div>

      <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="divide-y divide-white/[0.02]">
          {notifications.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleAction(n.text)}
              className={`p-6 flex items-start gap-5 transition-all cursor-pointer relative group ${n.unread ? 'bg-[#7c5cfc05] border-l-4 border-[#7c5cfc]' : 'hover:bg-white/[0.01]'}`}
            >
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-lg shadow-black/20
                ${n.unread ? 'bg-[#7c5cfc1a] text-[#7c5cfc] border border-[#7c5cfc33]' : 'bg-white/5 text-[#4a5c72] border border-white/10'}
              `}>
                {n.ico}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1.5">
                  <div className={`text-sm tracking-tight leading-relaxed ${n.unread ? 'font-bold text-white' : 'font-medium text-[#7a8fa8]'}`}>
                    {n.text}
                  </div>
                  {n.unread && (
                    <span className="bg-[#ff3d5a] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ml-4 shadow-lg shadow-red-900/40">Нове</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#4a5c72] font-black uppercase tracking-widest">
                  <span>{n.time}</span>
                  <span className="w-1 h-1 rounded-full bg-white/5" />
                  <span>Системне</span>
                </div>
              </div>
              <div className="absolute right-6 bottom-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); toast.success('Надіслано на пошту'); }}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#4a5c72] hover:text-[#7c5cfc] hover:bg-[#7c5cfc1a] transition-all"
                >
                  <Mail size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNotification(i); }}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#4a5c72] hover:text-[#ff3d5a] hover:bg-[#ff3d5a1a] transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Empty State Mock */}
      <div className="py-12 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center opacity-20 hover:opacity-30 transition-opacity">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[#4a5c72] mb-4">
          <Bell size={32} />
        </div>
        <div className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Минулі сповіщення відсутні</div>
      </div>
    </div>
  );
}
