import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Brain, Plus, Clock, HelpCircle, X, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

interface Ticket {
  id: string;
  displayId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  lastUpdate: string;
  message: string;
}

const CATEGORIES = [
  'Технічна проблема',
  'Питання з оплатою',
  'Скарга пасажира',
  'Модерація рейсу',
  'Питання з документами',
  'Інше',
];

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
  urgent: 'Терміново',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  closed: 'text-[#5a6a85] bg-white/5 border-white/10',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Відкрито',
  in_progress: 'В роботі',
  resolved: 'Вирішено',
  closed: 'Закрито',
};

const SupportTab: React.FC = () => {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: CATEGORIES[0],
    priority: 'medium',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('support')
        .select('*')
        .eq('userId', user.uid)
        .order('createdAt', { ascending: false });
      
      if (!error && data) {
        setTickets(data.map(d => ({
          id: d.id,
          displayId: `SUP-${d.id.slice(0, 6).toUpperCase()}`,
          subject: d.subject || 'Без теми',
          status: d.status || 'open',
          priority: d.priority || 'medium',
          category: d.category || 'Інше',
          message: d.message || '',
          createdAt: new Date(d.created_at).toLocaleDateString('uk-UA'),
          lastUpdate: d.updated_at ? new Date(d.updated_at).toLocaleDateString('uk-UA') : new Date(d.created_at).toLocaleDateString('uk-UA'),
        })));
      }
    };

    fetchTickets();

    const channel = supabase.channel('support_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support', filter: `userId=eq.${user.uid}` }, fetchTickets)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newTicket.subject.trim()) errors.subject = 'Введіть тему запиту';
    if (newTicket.subject.length < 5) errors.subject = 'Тема занадто коротка (мін. 5 символів)';
    if (!newTicket.message.trim()) errors.message = 'Опишіть проблему';
    if (newTicket.message.length < 20) errors.message = 'Опис занадто короткий (мін. 20 символів)';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTicket = async () => {
    if (!user || !validateForm()) return;
    setSubmitting(true);
    const toastId = toast.loading('Створення тікета...');
    try {
      const { error } = await supabase
        .from('support')
        .insert({
          id: crypto.randomUUID(),
          userId: user.uid,
          subject: newTicket.subject.trim(),
          category: newTicket.category,
          priority: newTicket.priority,
          message: newTicket.message.trim(),
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast.success('Тікет успішно створено! Відповідь протягом 24 год.', { id: toastId });
      setShowNewModal(false);
      setNewTicket({ subject: '', category: CATEGORIES[0], priority: 'medium', message: '' });
      setFormErrors({});
    } catch (e) {
      console.error(e);
      toast.error('Помилка створення тікета', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!confirm('Закрити цей тікет?')) return;
    try {
      const { error } = await supabase
        .from('support')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      toast.success('Тікет закрито');
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
    } catch (e) {
      toast.error('Помилка при закритті тікета');
    }
  };

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const closedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">ПІДТРИМКА</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">Центр допомоги та технічні запити</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-8 py-3 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-lg flex items-center gap-2"
        >
          <Plus size={14} /> Створити тікет
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Всього тікетів', val: tickets.length, color: '#00c8ff' },
          { label: 'Відкриті', val: openTickets.length, color: '#ff6b35' },
          { label: 'Вирішені', val: closedTickets.length, color: '#00e676' },
          { label: 'Сер. відповідь', val: '< 24 год', color: '#9c6fff' },
        ].map((s, i) => (
          <div key={i} className="bg-[#111520] border border-white/5 rounded-3xl p-5">
            <p className="text-[9px] font-black text-[#5a6a85] uppercase tracking-widest mb-1">{s.label}</p>
            <h4 className="text-xl font-black text-white italic tracking-tighter" style={{ color: s.color }}>{s.val}</h4>
          </div>
        ))}
      </div>

      {/* Tickets list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-black uppercase text-[#5a6a85] tracking-widest px-4">
            Активні тікети ({openTickets.length})
          </h3>

          {openTickets.length === 0 ? (
            <div className="bg-[#111520] border border-white/5 rounded-3xl p-8 text-center">
              <HelpCircle className="mx-auto mb-3 text-[#3d5670]" size={32} />
              <p className="text-[#5a6a85] text-sm font-bold uppercase tracking-widest">Немає активних тікетів</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`w-full text-left p-5 rounded-3xl border transition-all group ${selectedTicket?.id === t.id
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-[#111520] border-white/5 hover:border-cyan-500/20'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black uppercase text-[#3d5670]">{t.displayId}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${t.priority === 'high' || t.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-white/5 text-[#8899b5] border-white/10'}`}>
                      {PRIORITY_LABELS[t.priority]}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">{t.subject}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                    <span className="text-[9px] text-[#3d5670]">{t.category}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {closedTickets.length > 0 && (
            <>
              <h3 className="text-[10px] font-black uppercase text-[#5a6a85] tracking-widest px-4 pt-4">
                Архів ({closedTickets.length})
              </h3>
              <div className="space-y-2 opacity-60">
                {closedTickets.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="w-full text-left p-4 rounded-3xl border bg-white/[0.02] border-white/5 hover:border-white/10 transition-all"
                  >
                    <p className="text-xs font-bold text-[#8899b5] truncate">{t.subject}</p>
                    <span className="text-[8px] text-[#3d5670] uppercase">{t.createdAt}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Ticket detail */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-[#111520] border border-white/5 rounded-[40px] p-8 h-full flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[9px] font-black text-[#3d5670] uppercase tracking-widest">{selectedTicket.displayId}</span>
                  <h3 className="text-xl font-bold text-white mt-1 italic tracking-tight">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${STATUS_COLORS[selectedTicket.status]}`}>
                      {STATUS_LABELS[selectedTicket.status]}
                    </span>
                    <span className="text-[9px] text-[#5a6a85] uppercase font-bold">{selectedTicket.category}</span>
                  </div>
                </div>
                {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                  <button
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                  >
                    Закрити тікет
                  </button>
                )}
              </div>

              <div className="flex-1 bg-black/20 rounded-3xl p-6 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#ff6b35]/10 border border-[#ff6b35]/20 flex items-center justify-center text-[#ff6b35] shrink-0">
                    <User size={16} />
                  </div>
                  <div className="bg-[#1a2235] rounded-2xl rounded-tl-none p-4 flex-1">
                    <p className="text-[9px] font-black text-[#5a6a85] uppercase tracking-widest mb-2">
                      Ваш запит · {selectedTicket.createdAt}
                    </p>
                    <p className="text-sm text-[#c8d4e8] leading-relaxed">{selectedTicket.message || 'Зміст не вказано'}</p>
                  </div>
                </div>

                {selectedTicket.status === 'in_progress' && (
                  <div className="flex gap-3 justify-end">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl rounded-tr-none p-4 max-w-[80%]">
                      <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Brain size={10} /> Команда підтримки BUSNET
                      </p>
                      <p className="text-sm text-[#c8d4e8] leading-relaxed">
                        Ваш запит прийнято в роботу. Очікуйте відповіді протягом 24 годин.
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                      <Brain size={16} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-[9px] text-[#3d5670] uppercase font-bold">
                <Clock size={12} />
                Останнє оновлення: {selectedTicket.lastUpdate}
              </div>
            </div>
          ) : (
            <div className="bg-[#111520] border border-white/5 rounded-[40px] p-8 h-full flex flex-col items-center justify-center text-center gap-4">
              <MessageSquare className="text-[#3d5670]" size={48} />
              <p className="text-[#5a6a85] text-sm font-bold uppercase tracking-widest">Виберіть тікет для перегляду</p>
              <p className="text-[#3d5670] text-xs">або створіть новий запит до служби підтримки</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
              >
                + Новий запит
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowNewModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111520] border border-white/10 rounded-[40px] p-10 w-full max-w-lg space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Новий запит</h3>
                <button onClick={() => setShowNewModal(false)} className="w-8 h-8 rounded-xl bg-white/5 text-[#5a6a85] hover:text-white transition-colors flex items-center justify-center">
                  <X size={18} />
                </button>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Категорія</label>
                <div className="relative">
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-sm font-medium text-white outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a6a85] pointer-events-none" />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Пріоритет</label>
                <div className="grid grid-cols-4 gap-2">
                  {['low', 'medium', 'high', 'urgent'].map(p => (
                    <button
                      key={p}
                      onClick={() => setNewTicket(prev => ({ ...prev, priority: p }))}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${newTicket.priority === p
                        ? (p === 'high' || p === 'urgent' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30')
                        : 'bg-white/5 text-[#5a6a85] border-white/5 hover:border-white/20'}`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Тема запиту *</label>
                <input
                  value={newTicket.subject}
                  onChange={(e) => { setNewTicket(p => ({ ...p, subject: e.target.value })); setFormErrors(p => ({ ...p, subject: '' })); }}
                  placeholder="Коротко опишіть проблему..."
                  className={`w-full bg-black/20 border rounded-2xl py-3 px-5 text-sm font-medium text-white outline-none focus:border-cyan-500 transition-all ${formErrors.subject ? 'border-rose-500' : 'border-white/5'}`}
                />
                {formErrors.subject && <p className="text-rose-400 text-[10px] font-bold flex items-center gap-1"><AlertCircle size={10} />{formErrors.subject}</p>}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Детальний опис *</label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => { setNewTicket(p => ({ ...p, message: e.target.value })); setFormErrors(p => ({ ...p, message: '' })); }}
                  placeholder="Опишіть проблему детально. Вкажіть ID рейсу, бронювання чи інші деталі..."
                  rows={4}
                  className={`w-full bg-black/20 border rounded-2xl py-3 px-5 text-sm font-medium text-white outline-none focus:border-cyan-500 transition-all resize-none ${formErrors.message ? 'border-rose-500' : 'border-white/5'}`}
                />
                {formErrors.message && <p className="text-rose-400 text-[10px] font-bold flex items-center gap-1"><AlertCircle size={10} />{formErrors.message}</p>}
                <p className="text-[9px] text-[#3d5670] text-right">{newTicket.message.length} / 1000</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-[#8899b5] hover:text-white transition-all"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={submitting}
                  className="flex-1 py-3 bg-cyan-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  Відправити
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportTab;
