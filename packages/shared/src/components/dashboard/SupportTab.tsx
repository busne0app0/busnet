/**
 * SupportTab.tsx — Full Support Chat Widget
 * Supports: Passenger ↔ AI ↔ Carrier ↔ Admin
 * Architecture: Separate ticket_messages table (no race conditions)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, Send, Paperclip, Loader2, Bot,
  UserCircle, ShieldAlert, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Header config ─────────────────────────────────────────────────────────
function getHeaderConfig(assignedTo?: string) {
  switch (assignedTo) {
    case 'carrier':
      return {
        bg: 'bg-[#0d2e18]',
        title: 'Перевізник',
        subtitle: 'Диспетчер вашого рейсу',
        icon: <UserCircle size={24} className="text-[#4ade80]" />,
        pulse: 'bg-green-400',
        color: 'text-[#4ade80]',
      };
    case 'admin':
      return {
        bg: 'bg-[#2e0d0d]',
        title: 'Адміністратор',
        subtitle: 'Служба підтримки BUSNET',
        icon: <ShieldAlert size={24} className="text-[#f87171]" />,
        pulse: 'bg-red-500',
        color: 'text-[#f87171]',
      };
    default:
      return {
        bg: 'bg-[#1a253a]',
        title: 'AI Консьєрж',
        subtitle: 'Автоматична допомога 24/7',
        icon: <Bot size={24} className="text-[#00c8ff]" />,
        pulse: 'bg-green-500',
        color: 'text-[#00c8ff]',
      };
  }
}

// ─── Bubble style ──────────────────────────────────────────────────────────
function getBubbleStyle(role: string) {
  if (role === 'user') return 'bg-gradient-to-br from-[#00c8ff] to-[#0099cc] text-black rounded-tr-none';
  if (role === 'carrier') return 'bg-[#0d2e18] border border-[#4ade80]/30 text-white rounded-tl-none';
  if (role === 'admin') return 'bg-[#2e0d0d] border border-[#f87171]/30 text-white rounded-tl-none';
  return 'bg-white/5 border border-white/10 text-[#e8f4ff] rounded-tl-none'; // ai
}

function getRoleColor(role: string) {
  if (role === 'carrier') return 'text-[#4ade80]';
  if (role === 'admin') return 'text-[#f87171]';
  return 'text-[#00c8ff]';
}

// ─── Main Component ────────────────────────────────────────────────────────
const SupportTab: React.FC = () => {
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => scrollToBottom(), [messages]);

  // ── Init ticket & subscribe ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let resolvedTicketId: string | null = null;

    const initTicket = async () => {
      setLoading(true);

      // 1. Find existing open ticket for this user (by user_id, not by custom ID)
      let { data: existingTicket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.uid)
        .neq('status', 'resolved')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingTicket) {
        // 2. Create new ticket — let DB generate the uuid automatically
        const { data } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user.uid,
            carrier_id: null,
            trip_id: null,
            assigned_to: 'ai',
            status: 'open',
          })
          .select()
          .single();
        existingTicket = data;

        if (existingTicket) {
          // 3. Insert welcome message using the generated uuid
          await supabase.from('ticket_messages').insert({
            ticket_id: existingTicket.id,
            role: 'ai',
            text: `Привіт, ${user.firstName || 'пасажире'}! Я AI Консьєрж BUSNET. Чим можу допомогти? Запитайте про розклад, багаж або стан квитка.`,
            sender_name: 'AI Консьєрж',
          });
        }
      }

      if (!existingTicket) { setLoading(false); return; }

      resolvedTicketId = existingTicket.id;
      setTicket(existingTicket);

      // 4. Load messages
      const { data: msgs } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', existingTicket.id)
        .order('created_at', { ascending: true });
      setMessages(msgs || []);
      setLoading(false);

      // ── Realtime subscriptions ──────────────────────────────────────────
      const tId = existingTicket.id;

      const msgChannel = supabase
        .channel(`msgs_${tId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${tId}`,
        }, (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        })
        .subscribe();

      const ticketChannel = supabase
        .channel(`ticket_${tId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${tId}`,
        }, (payload) => {
          const updated = payload.new as Ticket;
          const old = payload.old as Ticket;
          setTicket(updated);
          if (old.assigned_to !== updated.assigned_to) {
            const who =
              updated.assigned_to === 'carrier' ? '🟢 Перевізник підключився!'
              : updated.assigned_to === 'admin' ? '🔴 Адміністратор підключився!'
              : '🤖 Чат повернуто до AI';
            toast(who, { duration: 4000 });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(msgChannel);
        supabase.removeChannel(ticketChannel);
      };
    };

    initTicket();
  }, [user]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!input.trim() || isTyping || !user || !ticket) return;
    if (ticket.status === 'resolved') return;

    const text = input.trim();
    setInput('');

    // Optimistic UI — add user message immediately
    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      ticket_id: ticket.id,
      role: 'user',
      text,
      sender_name: user.firstName || 'Пасажир',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    // Persist to DB (INSERT — no race condition)
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      role: 'user',
      text,
      sender_name: user.firstName || 'Пасажир',
    });

    // Update last_updated on ticket
    await supabase
      .from('support_tickets')
      .update({ last_updated: new Date().toISOString() })
      .eq('id', ticket.id);

    // Only generate AI response if ticket is assigned to AI
    if (ticket.assigned_to === 'ai') {
      setIsTyping(true);
      await generateAIResponse(text, ticket);
      setIsTyping(false);
    }
  };

  // ── AI Response ───────────────────────────────────────────────────────────
  const generateAIResponse = async (userText: string, currentTicket: Ticket) => {
    try {
      // ── Call AI Gateway Edge Function ──────────────────────────────────────
      // This calls the Supabase Edge Function we provide SQL for below.
      // Replace with your actual Edge Function URL when deployed.
      const { data: aiData, error: aiError } = await supabase.functions.invoke('chat-support', {
        body: {
          message: userText,
          ticketId: currentTicket.id,
          tripId: currentTicket.trip_id,
          userId: currentTicket.user_id,
        },
      });

      let aiText: string;
      let shouldEscalate = false;

      if (aiError || !aiData?.reply) {
        // Fallback if Edge Function not yet deployed
        aiText = getFallbackResponse(userText);
        shouldEscalate = userText.toLowerCase().includes('людин') ||
          userText.toLowerCase().includes('оператор') ||
          userText.toLowerCase().includes('адмін');
      } else {
        aiText = aiData.reply;
        shouldEscalate = aiData.escalate === true;
      }

      // Save AI response
      await supabase.from('ticket_messages').insert({
        ticket_id: currentTicket.id,
        role: 'ai',
        text: aiText,
        sender_name: 'AI Консьєрж',
      });

      // Auto-escalate if needed
      if (shouldEscalate) {
        await escalateTicket('carrier', currentTicket);
      }
    } catch (err) {
      console.error('AI Error:', err);
      await supabase.from('ticket_messages').insert({
        ticket_id: currentTicket.id,
        role: 'ai',
        text: 'Виникла технічна помилка. Переключаю вас на оператора...',
        sender_name: 'AI Консьєрж',
      });
      await escalateTicket('admin', currentTicket);
    }
  };

  // Fallback keyword responses (used when Edge Function not deployed yet)
  const getFallbackResponse = (text: string): string => {
    const t = text.toLowerCase();
    if (t.includes('квиток') || t.includes('бронювання'))
      return "Ви можете переглянути свої квитки у вкладці 'Квитки'. Для скасування або зміни — скористайтесь кнопками там.";
    if (t.includes('багаж'))
      return 'Стандартна норма: 1 сумка до 20кг у відсіку + 1 ручна поклажа до 5кг. Додатковий багаж — оплата на місці або бонусами.';
    if (t.includes('бонус') || t.includes('бал'))
      return 'Ваш баланс бонусів — на головному екрані кабінету. 10 балів = 1 грн знижки при наступному бронюванні.';
    if (t.includes('привіт') || t.includes('добри'))
      return 'Вітаю! Я ваш персональний AI-помічник BUSNET. Чим можу бути корисний?';
    if (t.includes('людин') || t.includes('оператор') || t.includes('адмін'))
      return 'Зрозуміло! Переводжу вас на живого спеціаліста. Зачекайте хвилину ⏳';
    return 'Дякую за ваше запитання! Шукаю відповідь... Якщо ви хочете поговорити з людиною — натисніть "Покликати людину".';
  };

  // ── Escalate ticket ────────────────────────────────────────────────────────
  const escalateTicket = async (to: 'carrier' | 'admin', currentTicket?: Ticket) => {
    const t = currentTicket || ticket;
    if (!t) return;

    const label = to === 'carrier' ? 'Перевізника' : 'Адміністратора';

    await supabase.from('ticket_messages').insert({
      ticket_id: t.id,
      role: 'system',
      text: `Чат передано до ${label}. Зачекайте, оператор скоро підключиться.`,
      sender_name: null,
    });

    await supabase
      .from('support_tickets')
      .update({ assigned_to: to, status: 'escalated', last_updated: new Date().toISOString() })
      .eq('id', t.id);

    setTicket(prev => prev ? { ...prev, assigned_to: to, status: 'escalated' } : prev);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  const header = getHeaderConfig(ticket?.assigned_to);

  if (loading) {
    return (
      <div className="h-[calc(100vh-160px)] flex items-center justify-center bg-[#141c2e] rounded-3xl border border-[#1e3a5f]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#00c8ff]" size={40} />
          <p className="text-[#4a6a85] text-xs font-bold uppercase tracking-widest">Завантаження чату...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-[#141c2e] border border-[#1e3a5f] rounded-3xl overflow-hidden shadow-2xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`p-5 border-b border-[#1e3a5f] flex items-center justify-between transition-colors duration-500 ${header.bg}`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center border border-white/10">
              {header.icon}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#141c2e] rounded-full flex items-center justify-center">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${header.pulse}`} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">{header.title}</h4>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${header.color}`}>{header.subtitle}</p>
          </div>
        </div>

        {/* Escalate button — only show when AI is handling */}
        {ticket?.assigned_to === 'ai' && ticket?.status !== 'resolved' && (
          <button
            onClick={() => escalateTicket('carrier')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white rounded-xl transition-colors border border-white/10"
          >
            <AlertCircle size={13} /> Покликати людину
          </button>
        )}

        {/* Resolved badge */}
        {ticket?.status === 'resolved' && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full">
            <CheckCircle2 size={12} /> Вирішено
          </span>
        )}
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-transparent to-black/10">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            // System notification
            if (m.role === 'system') {
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <span className="px-4 py-1.5 bg-black/40 text-[#7a9ab5] text-[10px] uppercase font-bold tracking-widest rounded-full border border-white/5">
                    <RefreshCw size={9} className="inline mr-1.5 mb-0.5" />
                    {m.text}
                  </span>
                </motion.div>
              );
            }

            const isUser = m.role === 'user';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-3xl text-sm shadow-xl ${getBubbleStyle(m.role)}`}>
                  {/* Sender name for non-user messages */}
                  {!isUser && m.sender_name && (
                    <div className={`text-[10px] mb-1.5 font-black tracking-wider uppercase ${getRoleColor(m.role)}`}>
                      {m.sender_name}
                    </div>
                  )}
                  <p className={`leading-relaxed whitespace-pre-wrap ${isUser ? 'font-bold' : 'font-medium'}`}>
                    {m.text}
                  </p>
                  <div className={`text-[9px] mt-2 flex items-center gap-1 ${isUser ? 'text-black/50 justify-end font-black' : 'text-white/30 justify-start uppercase'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isUser && <CheckCircle2 size={9} />}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="animate-spin text-[#00c8ff]" size={14} />
                <span className="text-[11px] text-[#4a6a85] font-bold">AI Консьєрж друкує...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-[#0d1425] border-t border-[#1e3a5f] flex items-center gap-3">
        <button className="p-2 text-[#4a6a85] hover:text-[#00c8ff] transition-colors">
          <Paperclip size={18} />
        </button>
        <div className="flex-1">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isTyping || ticket?.status === 'resolved'}
            placeholder={
              ticket?.status === 'resolved'
                ? 'Чат закрито. Зверніться повторно для нового тікета.'
                : ticket?.assigned_to === 'ai'
                ? 'Запитайте AI Консьєржа...'
                : `Пишіть ${ticket?.assigned_to === 'carrier' ? 'перевізнику' : 'адміністратору'}...`
            }
            className="w-full bg-[#141c2e] border border-[#1e3a5f] rounded-2xl px-4 py-3 text-sm text-white focus:border-[#00c8ff] outline-none transition-all placeholder:text-[#3a5a75] disabled:opacity-40"
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={isTyping || !input.trim() || ticket?.status === 'resolved'}
          className="p-3 bg-gradient-to-r from-[#00c8ff] to-[#0099cc] text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,200,255,0.2)] disabled:opacity-40 disabled:hover:scale-100"
        >
          <Send size={17} className="translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

export default SupportTab;
