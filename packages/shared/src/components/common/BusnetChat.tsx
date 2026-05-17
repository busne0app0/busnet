import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, ShieldAlert, UserCircle, Loader2, RefreshCw, CheckCircle2, X, Zap, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import toast from 'react-hot-toast';

interface Message { id: string; ticket_id: string; role: 'user'|'ai'|'carrier'|'admin'|'system'; text: string; sender_name: string|null; created_at: string; }
interface Ticket { id: string; user_id: string; assigned_to: 'ai'|'carrier'|'admin'; status: 'open'|'resolved'|'escalated'; booking_id?: string|null; }

interface Props { portalRole?: 'passenger'|'carrier'|'agent'|'admin'|'driver'; heightClass?: string; bookingId?: string; }

const ACCENT: Record<string, string> = { passenger: '#7c5cfc', carrier: '#00E5FF', agent: '#10B981', admin: '#f87171', driver: '#F59E0B' };

const QUICK: Record<string, string[]> = {
  passenger: ['Де мій автобус?', 'Хочу повернути квиток', 'Проблема з оплатою', 'Потрібен оператор'],
  carrier: ['Статус рейсу', 'Питання по агентам', 'Фінансова звітність', 'Зв\'язатися з адміном'],
  agent: ['Комісія по квитках', 'Додати клієнта', 'Статус бронювання', 'Питання до адміна'],
  driver: ['Маршрут рейсу', 'Список пасажирів', 'Технічна проблема', 'Виклик диспетчера'],
  admin: ['Черга ескалацій', 'Активні тікети', 'Статистика AI', 'Критичні скарги'],
};

const FALLBACK: [string, string, boolean][] = [
  ['людин', 'Переключаю вас на живого оператора. Зачекайте хвилину ⏳', true],
  ['оператор', 'Зараз підключаю оператора. Будь ласка, зачекайте.', true],
  ['поверн', 'Для повернення квитка перейдіть у розділ «Мої квитки» та натисніть «Скасувати».', false],
  ['багаж', 'Стандарт: 1 валіза до 20 кг + ручна поклажа до 5 кг. Понад норму — за тарифом перевізника.', false],
  ['оплат', 'Статус оплати доступний у вкладці «Квитки». Якщо кошти списано, але квиток не з\'явився — опишіть деталі.', false],
  ['розклад', 'Актуальний розклад знаходиться на головній сторінці BUSNET у блоці пошуку.', false],
  ['бонус', 'Ваші бонуси відображаються на головній сторінці кабінету. 10 балів = 1 грн знижки.', false],
];

function getFallback(text: string): { reply: string; escalate: boolean } {
  const t = text.toLowerCase();
  for (const [key, reply, escalate] of FALLBACK) {
    if (t.includes(key)) return { reply, escalate };
  }
  return { reply: 'Дякую за запит! Для швидшої допомоги — натисніть "Потрібен оператор" або опишіть проблему детальніше.', escalate: false };
}

function getBubble(role: string): string {
  if (role === 'user')    return 'bg-gradient-to-br from-[#7c5cfc] to-[#5533dd] text-white rounded-br-none ml-auto shadow-lg shadow-purple-900/30';
  if (role === 'carrier') return 'bg-[#0d2e18] border border-[#4ade80]/25 text-white rounded-bl-none';
  if (role === 'admin')   return 'bg-[#2e0d0d] border border-[#f87171]/25 text-white rounded-bl-none';
  return 'bg-white/[0.06] border border-white/10 text-[#e8f4ff] rounded-bl-none';
}

function getRoleName(role: string): string {
  if (role === 'carrier') return 'Перевізник';
  if (role === 'admin')   return 'Адміністратор BUSNET';
  return 'AI Консьєрж';
}

function getRoleColor(role: string): string {
  if (role === 'carrier') return 'text-[#4ade80]';
  if (role === 'admin')   return 'text-[#f87171]';
  return 'text-[#00c8ff]';
}

export default function BusnetChat({ portalRole = 'passenger', heightClass, bookingId }: Props) {
  const { user } = useAuthStore();
  const accent = ACCENT[portalRole] || '#7c5cfc';
  const quickReplies = QUICK[portalRole] || QUICK.passenger;

  const [ticket, setTicket]       = useState<Ticket | null>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [showQuick, setShowQuick] = useState(true);
  const [rated, setRated]         = useState<Set<string>>(new Set());
  const endRef    = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const scroll = useCallback(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), []);
  useEffect(() => { scroll(); }, [messages, isTyping]);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let chans: any[] = [];

    (async () => {
      setLoading(true);

      let { data: tkt } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.uid)
        .neq('status', 'resolved')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tkt) {
        const { data } = await supabase
          .from('support_tickets')
          .insert({ user_id: user.uid, assigned_to: 'ai', status: 'open', booking_id: bookingId || null })
          .select().single();
        tkt = data;
        if (tkt) {
          const greeting = portalRole === 'passenger'
            ? `Вітаю, ${user.firstName || 'друже'}! 👋 Я AI Консьєрж BUSNET.\nЗапитайте про квитки, розклад, багаж або поверненнях — я тут 24/7!`
            : portalRole === 'carrier'
            ? `Вітаю! Я AI-асистент для перевізників BUSNET. Чим можу допомогти?`
            : `Вітаю! AI Консьєрж BUSNET до ваших послуг. Чим можу бути корисним?`;
          await supabase.from('ticket_messages').insert({ ticket_id: tkt.id, role: 'ai', text: greeting, sender_name: 'AI Консьєрж' });
        }
      }

      if (!tkt) { setLoading(false); return; }
      setTicket(tkt);

      const { data: msgs } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', tkt.id)
        .order('created_at', { ascending: true });
      setMessages(msgs || []);
      setLoading(false);

      // Realtime subscriptions
      const msgCh = supabase.channel(`msgs_${tkt.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${tkt.id}` }, (p) => {
          const m = p.new as Message;
          setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
        }).subscribe();

      const tktCh = supabase.channel(`tkt_${tkt.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `id=eq.${tkt.id}` }, (p) => {
          const upd = p.new as Ticket;
          const old = p.old as Ticket;
          setTicket(upd);
          if (old.assigned_to !== upd.assigned_to) {
            const who = upd.assigned_to === 'carrier' ? '🟢 Перевізник підключився до чату!' : upd.assigned_to === 'admin' ? '🔴 Адміністратор підключився!' : '🤖 AI Консьєрж повернувся';
            toast(who, { duration: 5000 });
          }
        }).subscribe();

      chans = [msgCh, tktCh];
    })();

    return () => { chans.forEach(ch => supabase.removeChannel(ch)); };
  }, [user, portalRole, bookingId]);

  // ── Send ────────────────────────────────────────────────────────────────────
  const send = async (text?: string) => {
    const txt = (text || input).trim();
    if (!txt || isTyping || !ticket || ticket.status === 'resolved') return;
    setInput('');
    setShowQuick(false);

    const tempId = `tmp_${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, ticket_id: ticket.id, role: 'user', text: txt, sender_name: user?.firstName || 'Ви', created_at: new Date().toISOString() }]);

    await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, role: 'user', text: txt, sender_name: user?.firstName || 'Пасажир' });
    await supabase.from('support_tickets').update({ last_updated: new Date().toISOString() }).eq('id', ticket.id);

    if (ticket.assigned_to === 'ai') {
      setIsTyping(true);
      await callAI(txt);
      setIsTyping(false);
    }
  };

  const callAI = async (txt: string) => {
    try {
      const history = messages.slice(-8).filter(m => m.role !== 'system');
      const { data, error } = await supabase.functions.invoke('chat-support', {
        body: { message: txt, ticketId: ticket!.id, userId: ticket!.user_id, userRole: portalRole, history },
      });
      if (error || !data?.reply) throw new Error('no reply');
      await supabase.from('ticket_messages').insert({ ticket_id: ticket!.id, role: 'ai', text: data.reply, sender_name: 'AI Консьєрж' });
      if (data.escalate) await escalate(portalRole === 'passenger' ? 'carrier' : 'admin');
    } catch {
      const fb = getFallback(txt);
      await supabase.from('ticket_messages').insert({ ticket_id: ticket!.id, role: 'ai', text: fb.reply, sender_name: 'AI Консьєрж' });
      if (fb.escalate) await escalate('carrier');
    }
  };

  const escalate = async (to: 'carrier'|'admin') => {
    if (!ticket) return;
    const who = to === 'carrier' ? 'перевізника' : 'адміністратора BUSNET';
    await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, role: 'system', text: `Чат передано до ${who}. Середній час відповіді: 3–7 хв. Зачекайте, будь ласка.`, sender_name: null });
    await supabase.from('support_tickets').update({ assigned_to: to, status: 'escalated', last_updated: new Date().toISOString() }).eq('id', ticket.id);
    setTicket(prev => prev ? { ...prev, assigned_to: to, status: 'escalated' } : prev);
  };

  const h = heightClass || 'h-[calc(100vh-180px)]';
  const isAI = ticket?.assigned_to === 'ai';
  const isResolved = ticket?.status === 'resolved';

  // Header label
  const headerLabel = ticket?.assigned_to === 'carrier' ? 'Перевізник' : ticket?.assigned_to === 'admin' ? 'Адміністратор BUSNET' : 'AI Консьєрж';
  const headerSub   = ticket?.assigned_to === 'carrier' ? 'Диспетчер підключений' : ticket?.assigned_to === 'admin' ? 'Служба підтримки BUSNET' : 'Автоматична допомога 24/7';
  const headerColor = ticket?.assigned_to === 'carrier' ? '#4ade80' : ticket?.assigned_to === 'admin' ? '#f87171' : accent;

  if (loading) return (
    <div className={`${h} flex items-center justify-center rounded-[32px] bg-[#080f1a] border border-white/5`}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl border border-white/10 animate-ping opacity-30" style={{ borderColor: accent }} />
          <div className="w-full h-full rounded-2xl flex items-center justify-center" style={{ background: accent + '15', border: `1px solid ${accent}30` }}>
            <Zap size={28} style={{ color: accent }} />
          </div>
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>Підключення до чату...</p>
      </div>
    </div>
  );

  return (
    <div className={`${h} flex flex-col rounded-[32px] overflow-hidden border border-white/[0.07] shadow-2xl bg-[#080f1a]`}>

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-white/5" style={{ background: `${headerColor}08` }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${headerColor}15`, border: `1px solid ${headerColor}30` }}>
              {ticket?.assigned_to === 'carrier' ? <UserCircle size={20} style={{ color: headerColor }} /> : ticket?.assigned_to === 'admin' ? <ShieldAlert size={20} style={{ color: headerColor }} /> : <Bot size={20} style={{ color: headerColor }} />}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080f1a] animate-pulse" style={{ background: headerColor }} />
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-wider leading-none">{headerLabel}</p>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: headerColor }}>{headerSub}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAI && !isResolved && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => escalate('carrier')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/50 hover:border-[#4ade80]/40 hover:text-[#4ade80] hover:bg-[#4ade80]/5 transition-all"
            >
              <User size={12} /> Оператор
            </motion.button>
          )}
          {isResolved && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20">
              <CheckCircle2 size={12} /> Вирішено
            </span>
          )}
          {ticket && (
            <span className="text-[9px] font-mono text-white/20 hidden md:block">{ticket.id.slice(0, 8).toUpperCase()}</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-hide" style={{ background: 'linear-gradient(180deg, #080f1a 0%, #050c15 100%)' }}>
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            if (m.role === 'system') return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-2">
                <span className="px-4 py-1.5 rounded-full bg-black/40 border border-white/5 text-[10px] font-bold tracking-widest text-white/35 flex items-center gap-1.5">
                  <RefreshCw size={9} /> {m.text}
                </span>
              </motion.div>
            );

            const isUser = m.role === 'user';
            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className={`flex flex-col gap-1 max-w-[82%] ${isUser ? 'ml-auto items-end' : 'items-start'}`}
              >
                {!isUser && (
                  <span className={`text-[9px] font-black uppercase tracking-widest px-1 ml-1 ${getRoleColor(m.role)}`}>
                    {getRoleName(m.role)}
                  </span>
                )}
                <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${getBubble(m.role)}`}>
                  <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                  <div className={`flex items-center gap-2 mt-1.5 ${isUser ? 'justify-end' : 'justify-between'}`}>
                    <span className="text-[9px] opacity-40">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isUser && m.role === 'ai' && !rated.has(m.id) && (
                      <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100">
                        <button onClick={() => { setRated(prev => new Set([...prev, m.id])); toast.success('Дякуємо за оцінку!'); }}
                          className="text-white/20 hover:text-[#4ade80] transition-colors"><ThumbsUp size={10} /></button>
                        <button onClick={() => { setRated(prev => new Set([...prev, m.id])); toast('Ми врахуємо це!'); }}
                          className="text-white/20 hover:text-[#f87171] transition-colors"><ThumbsDown size={10} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div key="typing" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: accent + '15', border: `1px solid ${accent}30` }}>
                <Bot size={14} style={{ color: accent }} />
              </div>
              <div className="bg-white/[0.06] border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: accent }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Quick replies */}
      <AnimatePresence>
        {showQuick && messages.length <= 2 && !isResolved && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 border-t border-white/5 flex items-center gap-2 flex-wrap" style={{ background: '#050c15' }}
          >
            {quickReplies.map(q => (
              <motion.button key={q} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => send(q)}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
              >{q}</motion.button>
            ))}
            <button onClick={() => setShowQuick(false)} className="ml-auto text-white/20 hover:text-white/40 transition-colors shrink-0"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/5 shrink-0" style={{ background: '#050c15' }}>
        {isResolved ? (
          <div className="flex items-center justify-center py-2 text-[11px] text-white/30 font-bold uppercase tracking-widest gap-2">
            <CheckCircle2 size={13} className="text-[#4ade80]" /> Чат закрито · Зверніться повторно для нового запиту
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5 border border-white/8 transition-all focus-within:border-white/20" style={{ background: '#0d1525' }}>
            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={isTyping}
              placeholder={isAI ? 'Напишіть повідомлення AI Консьєржу...' : `Написати ${ticket?.assigned_to === 'carrier' ? 'перевізнику' : 'адміністратору'}...`}
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20 font-medium disabled:opacity-40"
            />
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => send()}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
              style={{ background: input.trim() ? accent : accent + '20', boxShadow: input.trim() ? `0 0 14px ${accent}50` : 'none' }}
            >
              <Send size={15} style={{ color: input.trim() ? (portalRole === 'passenger' ? '#fff' : '#000') : accent }} />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
