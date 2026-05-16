/**
 * BusnetChat — Universal AI Support Chat
 * Works for: passenger, carrier, agent, admin
 * Connects to: support_tickets + ticket_messages tables
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, ShieldAlert, UserCircle,
  Loader2, RefreshCw, CheckCircle2, AlertCircle,
  Paperclip, Smile, Zap, X, ChevronDown, MessageSquare
} from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  ticket_id: string;
  role: 'user' | 'ai' | 'carrier' | 'admin' | 'system';
  text: string;
  sender_name: string | null;
  created_at: string;
}

interface Ticket {
  id: string;
  user_id: string;
  carrier_id: string | null;
  trip_id: string | null;
  assigned_to: 'ai' | 'carrier' | 'admin';
  status: 'open' | 'resolved' | 'escalated';
  created_at: string;
  last_updated: string;
}

interface BusnetChatProps {
  /** Portal role - affects header color and UI */
  portalRole?: 'passenger' | 'carrier' | 'agent' | 'admin';
  /** Optional fixed height class, defaults to h-[calc(100vh-180px)] */
  heightClass?: string;
}

// ─── Config by role ───────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  passenger: { accent: '#7c5cfc', accentDim: 'rgba(124,92,252,0.1)', accentBorder: 'rgba(124,92,252,0.3)', label: 'Пасажирський чат' },
  carrier:   { accent: '#00E5FF', accentDim: 'rgba(0,229,255,0.1)',  accentBorder: 'rgba(0,229,255,0.3)',  label: 'Підтримка перевізника' },
  agent:     { accent: '#10B981', accentDim: 'rgba(16,185,129,0.1)', accentBorder: 'rgba(16,185,129,0.3)', label: 'Підтримка агента' },
  admin:     { accent: '#f87171', accentDim: 'rgba(248,113,113,0.1)', accentBorder: 'rgba(248,113,113,0.3)', label: 'Адмін підтримка' },
};

function getHeaderInfo(assignedTo?: string, portalRole?: string) {
  if (assignedTo === 'carrier') return { title: 'Перевізник', subtitle: 'Диспетчер вашого рейсу', icon: UserCircle, color: '#4ade80', bg: '#0d2e18' };
  if (assignedTo === 'admin')   return { title: 'Адміністратор', subtitle: 'Служба підтримки BUSNET', icon: ShieldAlert, color: '#f87171', bg: '#2e0d0d' };
  return { title: 'AI Консьєрж', subtitle: 'Автоматична допомога 24/7', icon: Bot, color: '#00c8ff', bg: '#0d1a2e' };
}

function getBubbleStyle(role: string) {
  if (role === 'user')    return 'bg-gradient-to-br from-[#7c5cfc] to-[#5533dd] text-white rounded-br-none ml-auto';
  if (role === 'carrier') return 'bg-[#0d2e18] border border-[#4ade80]/25 text-white rounded-bl-none';
  if (role === 'admin')   return 'bg-[#2e0d0d] border border-[#f87171]/25 text-white rounded-bl-none';
  return 'bg-white/[0.06] border border-white/10 text-[#e8f4ff] rounded-bl-none';
}

function getRoleBadge(role: string) {
  if (role === 'carrier') return { label: 'Перевізник', color: 'text-[#4ade80]' };
  if (role === 'admin')   return { label: 'Адміністратор', color: 'text-[#f87171]' };
  return { label: 'AI Консьєрж', color: 'text-[#00c8ff]' };
}

const QUICK_REPLIES = [
  'Де мій автобус?',
  'Хочу повернути квиток',
  'Проблема з оплатою',
  'Потрібна людина',
];

const FALLBACK_RESPONSES: Record<string, string> = {
  квиток: "Ви можете переглянути свої квитки у вкладці 'Квитки'. Для змін чи скасування — скористайтесь кнопками там.",
  багаж: 'Стандарт: 1 валіза до 20кг + ручна поклажа до 5кг. Додатковий багаж — за тарифом.',
  бонус: 'Ваш баланс бонусів — на головній сторінці кабінету. 10 балів = 1 грн знижки.',
  привіт: 'Вітаю! Я ваш AI-помічник BUSNET. Чим можу допомогти?',
  людин: 'Переводжу вас на оператора. Зачекайте хвилину ⏳',
  оплат: 'Перевірте статус оплати у вкладці "Квитки". Якщо проблема — опишіть детальніше.',
  розклад: 'Актуальний розклад рейсів доступний на головній сторінці у пошуку.',
};

function getFallback(text: string): { reply: string; escalate: boolean } {
  const t = text.toLowerCase();
  for (const [key, reply] of Object.entries(FALLBACK_RESPONSES)) {
    if (t.includes(key)) {
      return { reply, escalate: key === 'людин' };
    }
  }
  return { reply: 'Дякую за запитання! Якщо хочете поговорити з людиною — натисніть "Покликати оператора".', escalate: false };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BusnetChat({ portalRole = 'passenger', heightClass }: BusnetChatProps) {
  const { user } = useAuthStore();
  const cfg = ROLE_CONFIG[portalRole];

  const [ticket, setTicket]     = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [showQuick, setShowQuick] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Init ticket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      setLoading(true);

      let { data: existing } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.uid)
        .neq('status', 'resolved')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existing) {
        const { data } = await supabase
          .from('support_tickets')
          .insert({ user_id: user.uid, carrier_id: null, trip_id: null, assigned_to: 'ai', status: 'open' })
          .select().single();
        existing = data;

        if (existing) {
          await supabase.from('ticket_messages').insert({
            ticket_id: existing.id,
            role: 'ai',
            text: `Привіт, ${user.firstName || 'друже'}! Я AI Консьєрж BUSNET 🤖\nЗапитайте про розклад, квитки, багаж або будь-що інше — я допоможу!`,
            sender_name: 'AI Консьєрж',
          });
        }
      }

      if (!existing) { setLoading(false); return; }

      setTicket(existing);

      const { data: msgs } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', existing.id)
        .order('created_at', { ascending: true });
      setMessages(msgs || []);
      setLoading(false);

      // Realtime
      const tId = existing.id;
      const msgCh = supabase.channel(`chat_msgs_${tId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${tId}` }, (p) => {
          const m = p.new as Message;
          setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
        }).subscribe();

      const tktCh = supabase.channel(`chat_ticket_${tId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `id=eq.${tId}` }, (p) => {
          const upd = p.new as Ticket;
          const old = p.old as Ticket;
          setTicket(upd);
          if (old.assigned_to !== upd.assigned_to) {
            const who = upd.assigned_to === 'carrier' ? '🟢 Перевізник підключився!' : upd.assigned_to === 'admin' ? '🔴 Адміністратор підключився!' : '🤖 AI повернувся';
            toast(who, { duration: 4000 });
          }
        }).subscribe();

      cleanup = () => { supabase.removeChannel(msgCh); supabase.removeChannel(tktCh); };
    };

    init();
    return () => cleanup?.();
  }, [user]);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const send = async (text?: string) => {
    const txt = (text || input).trim();
    if (!txt || isTyping || !ticket || ticket.status === 'resolved') return;
    setInput('');
    setShowQuick(false);

    const temp: Message = {
      id: `tmp_${Date.now()}`, ticket_id: ticket.id, role: 'user',
      text: txt, sender_name: user?.firstName || 'Ви', created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, temp]);

    await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, role: 'user', text: txt, sender_name: user?.firstName || 'Пасажир' });
    await supabase.from('support_tickets').update({ last_updated: new Date().toISOString() }).eq('id', ticket.id);

    if (ticket.assigned_to === 'ai') {
      setIsTyping(true);
      await generateAI(txt);
      setIsTyping(false);
    }
  };

  const generateAI = async (userText: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-support', {
        body: { message: userText, ticketId: ticket!.id, userId: ticket!.user_id },
      });

      let aiText: string;
      let escalate = false;

      if (error || !data?.reply) {
        const fb = getFallback(userText);
        aiText = fb.reply;
        escalate = fb.escalate;
      } else {
        aiText = data.reply;
        escalate = data.escalate === true;
      }

      await supabase.from('ticket_messages').insert({ ticket_id: ticket!.id, role: 'ai', text: aiText, sender_name: 'AI Консьєрж' });
      if (escalate) await escalateTicket('carrier');
    } catch {
      await supabase.from('ticket_messages').insert({ ticket_id: ticket!.id, role: 'ai', text: 'Виникла помилка. Переключаю на оператора...', sender_name: 'AI Консьєрж' });
      await escalateTicket('admin');
    }
  };

  const escalateTicket = async (to: 'carrier' | 'admin') => {
    if (!ticket) return;
    const label = to === 'carrier' ? 'Перевізника' : 'Адміністратора';
    await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, role: 'system', text: `Чат передано до ${label}. Зачекайте, оператор підключиться.`, sender_name: null });
    await supabase.from('support_tickets').update({ assigned_to: to, status: 'escalated', last_updated: new Date().toISOString() }).eq('id', ticket.id);
    setTicket(prev => prev ? { ...prev, assigned_to: to, status: 'escalated' } : prev);
  };

  const header = getHeaderInfo(ticket?.assigned_to, portalRole);
  const IconComp = header.icon;
  const h = heightClass || 'h-[calc(100vh-180px)]';

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`${h} flex items-center justify-center rounded-[32px] bg-[#080f1a] border border-white/5`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${cfg.accentDim}`, border: `1px solid ${cfg.accentBorder}` }}>
              <Bot size={28} style={{ color: cfg.accent }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-[#080f1a] border border-white/10">
              <Loader2 size={12} className="animate-spin" style={{ color: cfg.accent }} />
            </div>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: cfg.accent }}>Підключення до чату...</p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`${h} flex flex-col rounded-[32px] overflow-hidden border border-white/5 shadow-2xl`} style={{ background: '#080f1a' }}>

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 shrink-0" style={{ background: header.bg }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${header.color}15`, border: `1px solid ${header.color}30` }}>
              <IconComp size={22} style={{ color: header.color }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#080f1a] rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: header.color }} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">{header.title}</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: header.color }}>{header.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {ticket?.assigned_to === 'ai' && ticket?.status !== 'resolved' && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => escalateTicket('carrier')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/70 hover:border-[#4ade80]/40 hover:text-[#4ade80] hover:bg-[#4ade80]/5 transition-all"
            >
              <UserCircle size={13} /> Покликати оператора
            </motion.button>
          )}
          {ticket?.status === 'resolved' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20">
              <CheckCircle2 size={12} /> Вирішено
            </span>
          )}
          <div className="text-[10px] font-mono text-white/20 hidden md:block">
            {ticket?.id.substring(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-hide" style={{ background: 'linear-gradient(to bottom, #080f1a, #050c15)' }}>
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            if (m.role === 'system') {
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                  <span className="px-4 py-1.5 rounded-full bg-black/40 border border-white/5 text-[10px] font-bold tracking-widest text-white/40 flex items-center gap-2">
                    <RefreshCw size={9} /> {m.text}
                  </span>
                </motion.div>
              );
            }

            const isUser = m.role === 'user';
            const badge = !isUser ? getRoleBadge(m.role) : null;

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 24 }}
                className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[82%] ${isUser ? 'ml-auto' : ''}`}
              >
                {badge && (
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 ml-1 ${badge.color}`}>{badge.label}</span>
                )}
                <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-xl ${getBubbleStyle(m.role)}`}>
                  <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                  <div className={`text-[9px] mt-1.5 flex items-center gap-1 ${isUser ? 'justify-end text-white/40' : 'text-white/25'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isUser && <CheckCircle2 size={8} />}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#00c8ff]/10 border border-[#00c8ff]/20 shrink-0">
                <Bot size={15} className="text-[#00c8ff]" />
              </div>
              <div className="bg-white/[0.06] border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#00c8ff]" />
                <span className="text-[11px] text-white/40 font-bold">AI Консьєрж думає...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <AnimatePresence>
        {showQuick && messages.length <= 2 && ticket?.status !== 'resolved' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-6 py-3 border-t border-white/5 flex gap-2 flex-wrap"
            style={{ background: '#050c15' }}
          >
            {QUICK_REPLIES.map(q => (
              <motion.button
                key={q} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => send(q)}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 text-white/50 hover:border-white/30 hover:text-white transition-all"
              >
                {q}
              </motion.button>
            ))}
            <button onClick={() => setShowQuick(false)} className="ml-auto text-white/20 hover:text-white/40 transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/5 shrink-0" style={{ background: '#050c15' }}>
        {ticket?.status === 'resolved' ? (
          <div className="flex items-center justify-center py-3 text-[11px] text-white/30 font-bold uppercase tracking-widest gap-2">
            <CheckCircle2 size={14} className="text-[#4ade80]" /> Чат закрито · Зверніться повторно
          </div>
        ) : (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all"
            style={{ background: '#0d1525', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <button className="text-white/20 hover:text-white/50 transition-colors shrink-0">
              <Paperclip size={18} />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={isTyping}
              placeholder={
                ticket?.assigned_to === 'ai'
                  ? 'Запитайте AI Консьєржа...'
                  : `Пишіть ${ticket?.assigned_to === 'carrier' ? 'перевізнику' : 'адміністратору'}...`
              }
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20 font-medium disabled:opacity-40"
            />
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => send()}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
              style={{ background: input.trim() ? cfg.accent : cfg.accentDim, boxShadow: input.trim() ? `0 0 15px ${cfg.accent}50` : 'none' }}
            >
              <Send size={16} className={input.trim() ? 'text-black' : ''} style={{ color: input.trim() ? '#000' : cfg.accent }} />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
