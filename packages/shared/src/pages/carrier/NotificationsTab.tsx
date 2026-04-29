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
        .eq('userId', user.uid)
        .order('createdAt', { ascending: false });
      
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
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">СПОВІЩЕННЯ</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">Центр системних та клієнтських системних повідомлень</p>
        </div>
        <div className="flex gap-3">
           <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[#8899b5] hover:text-white transition-all">
              <MailOpen size={18} />
           </button>
           <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[#8899b5] hover:text-rose-500 transition-all">
              <Trash2 size={18} />
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
            className={`p-6 rounded-[32px] border transition-all relative overflow-hidden group ${n.read ? 'bg-[#111520] border-white/5 opacity-70' : 'bg-white/5 border-amber-500/30 shadow-[0_10px_30px_rgba(245,158,11,0.05)]'}`}
          >
            {!n.read && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
            
            <div className="flex gap-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                 n.type === 'alert' ? 'bg-rose-500/10 text-rose-500' : 
                 n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                 n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-500'
               }`}>
                  {n.type === 'alert' ? <AlertTriangle size={20} /> : 
                   n.type === 'success' ? <CheckCircle2 size={20} /> :
                   n.type === 'warning' ? <Clock size={20} /> : <Info size={20} />}
               </div>
               
               <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                     <h4 className={`text-base font-bold tracking-tight ${n.read ? 'text-[#8899b5]' : 'text-white'}`}>{n.title}</h4>
                     <span className="text-[10px] font-black text-[#3d5670] uppercase tracking-widest">{n.time}</span>
                  </div>
                  <p className="text-sm text-[#5a6a85] leading-relaxed mb-4">{n.text}</p>
                  <div className="flex gap-3">
                     <button className="px-4 py-1.5 rounded-lg bg-white/5 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                        Позначити як прочитане
                     </button>
                     <button className="px-4 py-1.5 rounded-lg bg-amber-500/10 text-[9px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500 hover:text-black transition-all opacity-0 group-hover:opacity-100">
                        Відкрити →
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
