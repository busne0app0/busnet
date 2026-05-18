/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Info, AlertTriangle, CheckCircle2, Clock, Trash2, 
  Filter, MailOpen, DollarSign, Users, ShieldAlert, Volume2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

interface NotificationItem {
  id: string;
  title: string;
  text: string;
  type: 'info' | 'alert' | 'success' | 'warning';
  read: boolean;
  time: string;
  category: 'urgent' | 'finance' | 'drivers' | 'system';
}

const NotificationsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'urgent' | 'finance' | 'drivers' | 'system'>('all');
  const [muteSound, setMuteSound] = useState(false);

  // Pure Web Audio API Synthesizer for Digital Cyber Sound Effects
  const playCyberSound = (soundType: 'alert' | 'success' | 'click' | 'chime') => {
    if (muteSound) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (soundType === 'alert') {
        // High frequency warning alarm siren
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (soundType === 'success') {
        // Clean double electronic chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (soundType === 'chime') {
        // Sweet high-end hover sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        // Soft digital UI click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch (e) {
      console.warn('Web Audio block:', e);
    }
  };

  // Determine alert category
  const determineCategory = (title: string, type: string): 'urgent' | 'finance' | 'drivers' | 'system' => {
    const t = title.toLowerCase();
    if (type === 'alert' || t.includes('термін') || t.includes('увага')) return 'urgent';
    if (t.includes('фінанс') || t.includes('оплат') || t.includes('виплат') || t.includes('кошт') || t.includes('рахун')) return 'finance';
    if (t.includes('водій') || t.includes('рейс') || t.includes('автобус') || t.includes('маршрут')) return 'drivers';
    return 'system';
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        let hasNewUnread = false;
        const mapped: NotificationItem[] = data.map(d => {
          if (!d.read) hasNewUnread = true;
          const title = d.title || 'Нове сповіщення';
          const type = d.type || 'info';
          return {
            id: d.id,
            title,
            text: d.message || '',
            type,
            read: d.read || false,
            category: determineCategory(title, type),
            time: d.created_at || d.createdAt 
              ? new Date(d.created_at || d.createdAt).toLocaleString('uk-UA') 
              : 'Нещодавно'
          };
        });
        
        setNotifications(mapped);
        
        // Play notification alert chime if there are fresh unread notifications
        if (hasNewUnread && mapped.length > 0) {
          const topAlert = mapped[0];
          playCyberSound(topAlert.type === 'alert' ? 'alert' : 'success');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();

    const channel = supabase.channel(`user_notifications_${user.uid}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.uid}` }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    playCyberSound('click');
    const toastId = toast.loading('Оновлення...');
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.uid);
      if (error) throw error;
      toast.success('Усі сповіщення прочитано', { id: toastId });
      fetchNotifications();
    } catch (e) {
      toast.error('Помилка оновлення', { id: toastId });
    }
  };

  const handleClearAll = async () => {
    if (!user || !confirm('Видалити всі сповіщення?')) return;
    playCyberSound('alert');
    const toastId = toast.loading('Видалення...');
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.uid);
      if (error) throw error;
      toast.success('Сповіщення видалено', { id: toastId });
      fetchNotifications();
    } catch (e) {
      toast.error('Помилка видалення', { id: toastId });
    }
  };

  const handleMarkAsRead = async (id: string, type: string) => {
    playCyberSound('chime');
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      fetchNotifications();
    } catch (e) {}
  };

  const handleMarkSingleDelete = async (id: string) => {
    playCyberSound('click');
    try {
      await supabase.from('notifications').delete().eq('id', id);
      toast.success('Сповіщення видалено');
      fetchNotifications();
    } catch (e) {}
  };

  // Filtered lists
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter(n => n.category === activeCategory);
  }, [notifications, activeCategory]);

  // Counts for pills
  const countAll = notifications.length;
  const countUrgent = notifications.filter(n => n.category === 'urgent').length;
  const countFinance = notifications.filter(n => n.category === 'finance').length;
  const countDrivers = notifications.filter(n => n.category === 'drivers').length;
  const countSystem = notifications.filter(n => n.category === 'system').length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-top-4 duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-6 bg-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">СПОВІЩЕННЯ</h2>
          </div>
          <p className="text-[#5A6A85] text-[11px] font-black uppercase tracking-[0.12em] ml-4 font-bold">Центр системних, водійських та фінансових попереджень</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Mute audio settings */}
          <button
            onClick={() => setMuteSound(p => !p)}
            className={`p-3 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${
              muteSound ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-[#8899B5] border-white/5 hover:text-white'
            }`}
            title={muteSound ? "Увімкнути звуки" : "Вимкнути звуки"}
          >
            <Volume2 size={16} />
          </button>
          
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-[#8899B5] hover:text-white hover:bg-white/10 hover:border-white/10 transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 font-bold"
          >
            <MailOpen size={14} /> <span>Усі як прочитані</span>
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:text-white hover:bg-rose-500 transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 font-bold"
          >
            <Trash2 size={14} /> <span>Очистити все</span>
          </button>
        </div>
      </div>

      {/* CATEGORIES PILLS FILTER */}
      <div className="flex flex-wrap gap-2.5 bg-black/20 p-2 rounded-[24px] border border-white/5">
        {[
          { key: 'all', label: 'Всі сповіщення', count: countAll, color: 'border-white/5 hover:border-white/20' },
          { key: 'urgent', label: '🚨 Терміново', count: countUrgent, color: 'border-rose-500/20 hover:border-rose-500/40 text-rose-400' },
          { key: 'finance', label: '💰 Фінанси', count: countFinance, color: 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400' },
          { key: 'drivers', label: '🚌 Водії / Рейси', count: countDrivers, color: 'border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400' },
          { key: 'system', label: '⚙️ Системні', count: countSystem, color: 'border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400' }
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => {
              playCyberSound('click');
              setActiveCategory(cat.key as any);
            }}
            className={`px-5 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2.5 font-bold ${
              activeCategory === cat.key 
                ? 'bg-white text-black border-white shadow-md' 
                : `bg-transparent text-[#8899B5] ${cat.color}`
            }`}
          >
            <span>{cat.label}</span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] ${activeCategory === cat.key ? 'bg-black text-white' : 'bg-white/5 text-[#5A6A85]'}`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-[#1A2639]/30 border border-white/5 rounded-[40px] shadow-xl">
            <Bell className="mx-auto mb-4 text-[#5A6A85] opacity-20 animate-pulse" size={64} />
            <p className="text-[#8899B5] font-black uppercase tracking-widest text-[12px] mb-2 font-bold">СПОВІЩЕНЬ НЕ ЗНАЙДЕНО</p>
            <p className="text-[#5A6A85] text-[10px] font-bold uppercase tracking-widest">Ви переглянули всі попередження у цій категорії</p>
          </div>
        ) : (
          filteredNotifications.map((n, i) => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-6 rounded-[32px] border transition-all relative overflow-hidden group shadow-lg ${
                n.read 
                  ? 'bg-[#1A2639]/30 border-white/5 opacity-60' 
                  : 'bg-[#1A2639]/60 border-[#A855F7]/30 shadow-[0_10px_30px_rgba(168,85,247,0.05)] hover:border-[#A855F7]/50'
              }`}
            >
              {!n.read && (
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  n.category === 'urgent' ? 'bg-rose-500 shadow-[0_0_15px_#F43F5E]' : 
                  n.category === 'finance' ? 'bg-emerald-500 shadow-[0_0_15px_#10B981]' : 'bg-[#A855F7] shadow-[0_0_15px_#A855F7]'
                }`} />
              )}
              
              <div className="flex flex-col md:flex-row gap-6 items-start">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                   n.type === 'alert' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                   n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                   n.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                 }`}>
                    {n.type === 'alert' ? <ShieldAlert size={20} /> : 
                     n.type === 'success' ? <CheckCircle2 size={20} /> :
                     n.type === 'warning' ? <Clock size={20} /> : <Info size={20} />}
                 </div>
                 
                 <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                       <div className="flex items-center gap-2">
                         <h4 className={`text-sm font-bold uppercase tracking-wide ${n.read ? 'text-[#8899B5]' : 'text-white'}`}>{n.title}</h4>
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono ${
                           n.category === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                           n.category === 'finance' ? 'bg-emerald-500/20 text-emerald-400' :
                           n.category === 'drivers' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-[#5A6A85]'
                         }`}>
                           {n.category}
                         </span>
                       </div>
                       <span className="text-[10px] font-black text-[#5A6A85] uppercase tracking-widest font-mono tabular-nums">{n.time}</span>
                    </div>
                    <p className="text-xs text-[#8899B5] leading-relaxed mb-4">{n.text}</p>
                    <div className="flex gap-2">
                       {!n.read && (
                         <button 
                           onClick={() => handleMarkAsRead(n.id, n.type)}
                           className="px-5 py-2.5 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-white border border-white/5 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 shadow-lg active:scale-95 font-bold"
                         >
                            Ознайомлений
                         </button>
                       )}
                       <button 
                         onClick={() => handleMarkSingleDelete(n.id)}
                         className="px-5 py-2.5 rounded-xl bg-rose-500/10 text-[9px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg active:scale-95 font-bold"
                       >
                          Видалити
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
