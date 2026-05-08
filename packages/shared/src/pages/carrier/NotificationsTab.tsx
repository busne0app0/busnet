import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Info, AlertTriangle, CheckCircle2, Star, Clock, Trash2, Filter, MailOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

const NotificationsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setNotifications(data.map(d => ({
          id: d.id,
          title: d.title || 'Нове сповіщення',
          text: d.message || '',
          type: d.type || 'info', 
          read: d.read || false,
          time: d.createdAt ? new Date(d.createdAt).toLocaleString('uk-UA') : 'Недавно'
        })));
      }
    };

    fetchNotifications();

    const channel = supabase.channel(`user_notifications_${user.uid}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `userId=eq.${user.uid}` }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <div className="w-12 h-1 bg-[#A855F7] mb-4 shadow-[0_0_10px_rgba(168,85,247,0.5)] rounded-full" />
          <h2 className="text-3xl font-black uppercase tracking-widest text-white">СПОВІЩЕННЯ</h2>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest mt-2">Центр системних та клієнтських повідомлень</p>
        </div>
        <div className="flex gap-3">
           <button className="p-3 rounded-full bg-white/5 border border-white/5 text-[#8899B5] hover:text-white hover:bg-white/10 transition-all shadow-lg">
              <MailOpen size={16} />
           </button>
           <button className="p-3 rounded-full bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:text-white hover:bg-rose-500 transition-all shadow-lg">
              <Trash2 size={16} />
           </button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((n, i) => (
          <motion.div 
            key={n.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-[32px] border transition-all relative overflow-hidden group ${n.read ? 'bg-[#1A2639]/30 border-white/5 opacity-70' : 'bg-[#1A2639]/60 border-[#A855F7]/30 shadow-[0_10px_30px_rgba(168,85,247,0.05)] hover:border-[#A855F7]/50'}`}
          >
            {!n.read && <div className="absolute top-0 left-0 w-1 h-full bg-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.8)]" />}
            
            <div className="flex gap-6">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                 n.type === 'alert' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                 n.type === 'success' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                 n.type === 'warning' ? 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20' : 'bg-[#0EA5E9]/10 text-[#0EA5E9] border-[#0EA5E9]/20'
               }`}>
                  {n.type === 'alert' ? <AlertTriangle size={18} /> : 
                   n.type === 'success' ? <CheckCircle2 size={18} /> :
                   n.type === 'warning' ? <Clock size={18} /> : <Info size={18} />}
               </div>
               
               <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                     <h4 className={`text-sm font-bold uppercase tracking-widest ${n.read ? 'text-[#8899B5]' : 'text-white'}`}>{n.title}</h4>
                     <span className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">{n.time}</span>
                  </div>
                  <p className="text-xs font-medium text-[#8899B5] leading-relaxed mb-4">{n.text}</p>
                  <div className="flex gap-3">
                     <button className="px-5 py-2 rounded-full bg-white/5 text-[9px] font-black uppercase tracking-widest text-[#8899B5] border border-white/5 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">
                        ПРОЧИТАНО
                     </button>
                     <button className="px-5 py-2 rounded-full bg-[#A855F7]/10 text-[9px] font-black uppercase tracking-widest text-[#A855F7] border border-[#A855F7]/20 hover:bg-[#A855F7] hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">
                        ВІДКРИТИ →
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsTab;
