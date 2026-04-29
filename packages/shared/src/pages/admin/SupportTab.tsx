import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Search, Filter, Clock, 
  CheckCircle2, AlertCircle, Phone, 
  Send, User, MoreVertical, MessageCircle
} from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';

const SupportTab: React.FC = () => {
  const { addLog } = useAdminStore();
  const [realTickets, setRealTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('lastUpdated', { ascending: false });
      
      if (!error && data) {
        const results = data.map(d => ({
          id: d.id,
          user: d.userEmail || 'Анонім',
          subject: d.messages?.[d.messages.length - 1]?.text || 'Без теми',
          priority: d.priority || 'medium',
          status: d.status || 'open',
          time: d.lastUpdated ? new Date(d.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Зараз',
          ...d
        }));
        setRealTickets(results);
      }
      setLoading(false);
    };

    fetchTickets();

    const channel = supabase.channel(`support_tickets_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleResolveTicket = async (id: string) => {
    try {
      if (id.startsWith('TKT-')) {
         alert('Cannot resolve simulated demo ticket. Create a real ticket to test.');
         return;
      }
      
      const { error } = await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', id);
      if (error) throw error;
      
      addLog({
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Admin',
        role: 'owner',
        action: 'SUPPORT',
        obj: `Тікет ${id} вирішено`,
        icon: '✅'
      });
    } catch (err) {
      console.error("Error resolving ticket:", err);
    }
  };

  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const baseTickets = (realTickets.length > 0 ? realTickets : [
    { id: 'TKT-1045', user: 'Ігор Шевчук', subject: 'Помилка при оплаті Apple Pay', priority: 'high', status: 'open', time: '12 хв тому' },
    { id: 'TKT-1044', user: 'Марія К.', subject: 'Запит на повернення квитка BN-1202', priority: 'medium', status: 'open', time: '45 хв тому' },
  ]);

  const tickets = baseTickets.filter(t => 
    (t.subject.toLowerCase().includes(search.toLowerCase()) || 
    t.user.toLowerCase().includes(search.toLowerCase()) || 
    t.id.toLowerCase().includes(search.toLowerCase())) &&
    (filterType === 'all' || 
     (filterType === 'pay' && (t.subject.toLowerCase().includes('оплат') || t.subject.toLowerCase().includes('pay'))) ||
     (filterType === 'refund' && t.subject.toLowerCase().includes('повернен')) ||
     (filterType === 'tech' && t.subject.toLowerCase().includes('помилк')))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-6 bg-[#00c8ff] rounded-full shadow-[0_0_10px_#00c8ff]" />
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-sans">Центр Підтримки</h2>
           </div>
           <p className="text-[#7a9ab5] text-sm font-medium tracking-wide ml-5">Керування запитами пасажирів та партнерів</p>
        </div>
        <div className="flex gap-3">
           <div className="px-4 py-2 bg-[#00c8ff]/10 border border-[#00c8ff]/20 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00c8ff] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00c8ff]">{baseTickets.filter(t => t.status === 'open').length} активних діалоги</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-[#0f1520] border border-[#1c2e48] rounded-3xl p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#3d5670] mb-6">Категорії</h3>
              <div className="space-y-2">
                 {[
                   { id: 'all', label: 'Всі тікети', count: baseTickets.length },
                   { id: 'pay', label: 'Оплати', count: baseTickets.filter(t => t.subject.toLowerCase().includes('оплат') || t.subject.toLowerCase().includes('pay')).length },
                   { id: 'refund', label: 'Повернення', count: baseTickets.filter(t => t.subject.toLowerCase().includes('повернен')).length },
                   { id: 'tech', label: 'Тех. підтримка', count: baseTickets.filter(t => t.subject.toLowerCase().includes('помилк')).length },
                 ].map((cat) => (
                   <button 
                     key={cat.id} 
                     onClick={() => setFilterType(cat.id)}
                     className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all ${filterType === cat.id ? 'bg-[#00c8ff] text-black font-black' : 'text-[#7a9ab5] hover:bg-white/5'}`}
                   >
                      <span className="text-xs uppercase tracking-tight">{cat.label}</span>
                      <span className="text-[10px]">{cat.count}</span>
                   </button>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-[#1c2e48] to-[#0f1520] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
              <div className="relative z-10">
                 <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2 italic">SOS Лінія</h4>
                 <p className="text-[10px] text-[#7a9ab5] leading-relaxed mb-4">Для термінових питань по рейсах в русі</p>
                 <button className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#00e676] transition-colors flex items-center justify-center gap-2">
                    <Phone size={14} /> +380 800 500 400
                 </button>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                 <Phone size={100} className="text-white" />
              </div>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="bg-[#0f1520] border border-[#1c2e48] rounded-3xl p-6 flex gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d5670]" size={16} />
                 <input 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   placeholder="Пошук за ID, ПІБ або темою..." 
                   className="w-full bg-[#070912] border border-[#1c2e48] rounded-xl pl-12 pr-4 py-3 text-xs text-white outline-none focus:border-[#00c8ff] transition-all" 
                 />
              </div>
              <button className="px-6 rounded-xl border border-[#1c2e48] text-[#7a9ab5] hover:text-white transition-colors">
                 <Filter size={16} />
              </button>
           </div>

           <div className="space-y-4">
              {tickets.map((t, i) => (
                <motion.div 
                  key={t.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-[#151e2e]/50 border rounded-[2rem] p-6 flex items-center justify-between group hover:border-white/20 transition-all ${t.priority === 'high' ? 'border-[#f44336]/20' : 'border-[#1c2e48]'}`}
                >
                  <div className="flex gap-5 items-start">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.priority === 'high' ? 'bg-[#f44336]/10 text-[#f44336]' : 'bg-[#00c8ff]/10 text-[#00c8ff]'}`}>
                        <MessageCircle size={24} />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h4 className="text-sm font-bold text-white tracking-tight">{t.subject}</h4>
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${t.priority === 'high' ? 'bg-[#f44336] text-white' : 'bg-[#1c2e48] text-[#7a9ab5]'}`}>{t.priority}</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#7a9ab5] uppercase tracking-widest">{t.id} · {t.user} · <span className="text-[#3d5670] italic">{t.time}</span></p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     {t.status === 'open' ? (
                       <button 
                         onClick={() => handleResolveTicket(t.id)}
                         className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#00e676] hover:bg-[#00e676] hover:text-black transition-all"
                       >
                         Вирішено
                       </button>
                     ) : (
                       <div className="flex items-center gap-2 text-[#00e676] px-6">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-black uppercase">Закрито</span>
                       </div>
                     )}
                     <button className="w-10 h-10 rounded-xl bg-[#070912] border border-[#1c2e48] flex items-center justify-center text-[#7a9ab5] hover:text-white transition-all">
                        <MoreVertical size={16} />
                     </button>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTab;
