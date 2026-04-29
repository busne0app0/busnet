import React, { useState } from 'react';
import { Clock, Star, Zap, Bell, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

interface Notification {
  id: string;
  type: string;
  text: string;
  time: string;
  unread: boolean;
}

interface NotificationsTabProps {
  notifications: Notification[];
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ notifications }) => {
  const { user } = useAuthStore();
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAllRead = async () => {
    if (!user || notifications.filter(n => n.unread).length === 0) return;
    
    setIsMarking(true);
    try {
      const unreadIds = notifications.filter(n => n.unread).map(n => n.id);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
      
      if (error) throw error;
      
      toast.success('Всі сповіщення прочитано');
    } catch (e) {
      console.error(e);
      toast.error('Помилка оновлення');
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Сповіщення</h2>
          <p className="text-sm text-[#7a9ab5]">Дізнавайтесь про зміни рейсу та спеціальні пропозиції</p>
        </div>
        <button 
          disabled={isMarking || notifications.filter(n => n.unread).length === 0}
          onClick={handleMarkAllRead}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00c8ff] hover:text-white transition-colors disabled:opacity-30"
        >
          {isMarking ? 'Оновлення...' : 'Прочитати всі'}
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => (
          <motion.div 
            key={n.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`
              p-6 rounded-2xl border transition-all flex gap-4 group cursor-pointer
              ${n.unread ? 'bg-[#00c8ff]/5 border-[#00c8ff]/20 border-l-4 border-l-[#00c8ff] shadow-[0_0_30px_rgba(0,200,255,0.05)]' : 'bg-[#141c2e] border-[#1e3a5f] hover:border-[#7a9ab5]/40'}
            `}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg
              ${n.type === 'bus' ? 'bg-[#00c8ff]/10 text-[#00c8ff]' : n.type === 'gift' ? 'bg-[#ffd600]/10 text-[#ffd600]' : 'bg-[#7c4dff]/10 text-[#7c4dff]'}
            `}>
               {n.type === 'bus' ? <Clock size={22} /> : n.type === 'gift' ? <Star size={22} /> : <Zap size={22} />}
            </div>
            <div className="flex-1">
               <div className="flex justify-between items-start">
                  <p className={`text-sm font-bold leading-relaxed ${n.unread ? 'text-white' : 'text-[#7a9ab5]'}`}>{n.text}</p>
                  {n.unread && <div className="w-2 h-2 rounded-full bg-[#00c8ff] shadow-[0_0_10px_cyan] shrink-0 ml-4 mt-1" />}
               </div>
               <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-[#4a6a85] font-black uppercase tracking-widest">{n.time}</p>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] font-bold uppercase text-[#00c8ff]">
                    Деталі <CheckCircle2 size={10} />
                  </button>
               </div>
            </div>
          </motion.div>
        ))}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 select-none">
            <Bell size={64} strokeWidth={1} className="mb-4" />
            <h3 className="text-xl font-black uppercase italic">Немає сповіщень</h3>
            <p className="text-sm">Тут з’являтимуться важливі повідомлення</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
