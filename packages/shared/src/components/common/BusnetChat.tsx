/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, ShieldAlert, UserCircle, Loader2, RefreshCw, 
  CheckCircle2, X, Zap, ThumbsUp, ThumbsDown, Paperclip, Download, 
  BadgePercent, EyeOff, Eye
} from 'lucide-react';
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

function getBubble(role: string, text: string): string {
  if (text.includes('[ШЕПІТ]')) {
    return 'bg-[#1A0B2E] border border-[#A855F7]/30 text-[#E8F4FF] rounded-bl-none shadow-[0_0_15px_rgba(168,85,247,0.15)]';
  }
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
  const [isOnline, setIsOnline]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Whisper Mode (Шепіт) state for carrier
  const [whisperMode, setWhisperMode] = useState(false);

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

      // Presence tracking
      const presenceCh = supabase.channel(`presence_${tkt.id}`);
      presenceCh.on('presence', { event: 'sync' }, () => {
        const state = presenceCh.presenceState();
        const otherUsers = Object.keys(state).filter(k => k !== user?.uid);
        setIsOnline(otherUsers.length > 0);
      }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceCh.track({ user: user?.uid, role: portalRole, online_at: new Date().toISOString() });
        }
      });

      chans = [msgCh, tktCh, presenceCh];
    })();

    return () => { chans.forEach(ch => supabase.removeChannel(ch)); };
  }, [user, portalRole, bookingId]);

  // ── Send ────────────────────────────────────────────────────────────────────
  const send = async (text?: string) => {
    let txt = (text || input).trim();
    if (!txt || isTyping || !ticket || ticket.status === 'resolved') return;
    
    setInput('');
    setShowQuick(false);

    // Apply special visual tags in Whisper Mode
    if (whisperMode && portalRole === 'carrier') {
      txt = `🤫 [ШЕПІТ]: ${txt}`;
    }

    const tempId = `tmp_${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, ticket_id: ticket.id, role: 'user', text: txt, sender_name: user?.firstName || 'Ви', created_at: new Date().toISOString() }]);

    await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, role: 'user', text: txt, sender_name: user?.firstName || 'Пасажир' });
    await supabase.from('support_tickets').update({ last_updated: new Date().toISOString() }).eq('id', ticket.id);

    // Auto escalate to Admin in Whisper Mode
    if (whisperMode && portalRole === 'carrier' && ticket.assigned_to !== 'admin') {
      await escalate('admin');
      setWhisperMode(false);
      toast.success('Режим шепоту активовано! Запит ескальовано до Адміністратора.');
    }

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
    } catch (err) {
      console.error('AI Edge Function Error:', err);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ticket) return;
    
    const tempId = `tmp_file_${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, ticket_id: ticket.id, role: 'user', text: `📎 Відправляється файл: ${file.name}...`, sender_name: user?.firstName || 'Ви', created_at: new Date().toISOString() }]);
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', ticket.id);
      formData.append('senderName', user?.firstName || 'Користувач');
      
      const { data, error } = await supabase.functions.invoke('upload-chat-file', {
        body: formData,
      });
      
      if (error) throw error;

      // Update message visually to indicate successful upload
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, text: `📎 Файл надіслано успішно: ${file.name} ✅` } : m));
      toast.success('Файл успішно завантажено!');
    } catch (err: any) {
      console.error('Upload Error:', err);
      toast.error('Помилка завантаження файлу: ' + err.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const exportChatToPdf = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Попап заблоковано');
      
      const html = `
        <html>
          <head>
            <title>Експорт Чату BUSNET #${ticket?.id.slice(0,8)}</title>
            <style>
              body { font-family: sans-serif; color: #333; padding: 20px; max-width: 800px; margin: 0 auto; }
              .msg { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee; }
              .time { font-size: 11px; color: #888; }
              .role { font-weight: bold; margin-bottom: 4px; }
              .text { white-space: pre-wrap; font-size: 14px; }
            </style>
          </head>
          <body>
            <h2>Експорт Чату BUSNET - Запит #${ticket?.id.slice(0, 8).toUpperCase()}</h2>
            <hr />
            ${messages.map(m => {
              const time = new Date(m.created_at).toLocaleString('uk-UA');
              const roleStr = m.role === 'user' ? 'Пасажир' : m.role === 'carrier' ? 'Перевізник' : m.role === 'admin' ? 'Адміністратор' : m.role === 'ai' ? 'AI Консьєрж' : 'Система';
              const name = m.sender_name || roleStr;
              return `<div class="msg"><div class="role">${name} <span class="time">[${time}]</span></div><div class="text">${m.text}</div></div>`;
            }).join('')}
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      toast.error('Не вдалося експортувати чат. Перевірте блокувальник попапів.');
    }
  };

  // Immediate send action on quick discount
  const handleQuickDiscount = async () => {
    if (!ticket) return;
    const code = `PROMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const txt = `🎁 Дарую вам знижку 10% на наступну поїздку! Ваш промокод: ${code}. Використайте його при бронюванні.`;
    await send(txt);
  };

  const h = heightClass || 'h-[calc(100vh-180px)]';
  const isAI = ticket?.assigned_to === 'ai';
  const isResolved = ticket?.status === 'resolved';

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
    <motion.div 
      className={`${h} flex flex-col rounded-[32px] overflow-hidden border transition-all duration-500 bg-[#080f1a]`}
      animate={whisperMode && portalRole === 'carrier' ? {
        borderColor: '#A855F7',
        boxShadow: [
          '0 0 15px rgba(168,85,247,0.1)',
          '0 0 25px rgba(168,85,247,0.25)',
          '0 0 15px rgba(168,85,247,0.1)'
        ]
      } : {
        borderColor: 'rgba(255,255,255,0.07)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}
      transition={whisperMode && portalRole === 'carrier' ? {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut'
      } : {}}
    >

      {/* Glassmorphic Header with Blur Effect */}
      <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b backdrop-blur-md bg-[#080f1a]/70 sticky top-0 z-20" style={{ borderBottomColor: `${headerColor}20` }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${headerColor}15`, border: `1px solid ${headerColor}30` }}>
              {ticket?.assigned_to === 'carrier' ? <UserCircle size={20} style={{ color: headerColor }} /> : ticket?.assigned_to === 'admin' ? <ShieldAlert size={20} style={{ color: headerColor }} /> : <Bot size={20} style={{ color: headerColor }} />}
            </div>
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#080f1a] bg-green-500 shadow-[0_0_8px_#22c55e]" />
            )}
            {!isOnline && !isAI && (
               <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#080f1a] bg-gray-500" />
            )}
            {isAI && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080f1a] animate-pulse" style={{ background: headerColor }} />
            )}
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-wider leading-none flex items-center gap-2">
              {headerLabel}
              {isOnline && !isAI && <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-sm">Online</span>}
            </p>
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
          {portalRole === 'agent' && ticket && !isResolved && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleQuickDiscount}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-[#ff9d00]/20 text-[#ff9d00]/70 hover:text-[#ff9d00] hover:bg-[#ff9d00]/10 transition-all"
              title="Надіслати знижку"
            >
              <BadgePercent size={14} />
            </motion.button>
          )}
          {portalRole !== 'passenger' && ticket && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={exportChatToPdf}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all"
              title="Експорт в PDF"
            >
              <Download size={14} />
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

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-hide" style={{ background: 'linear-gradient(180deg, #080f1a 0%, #050c15 100%)' }}>
        <AnimatePresence initial={false}>
          {messages.map((m, idx) => {
            if (m.role === 'system') return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-2">
                <span className="px-4 py-1.5 rounded-full bg-black/40 border border-white/5 text-[10px] font-bold tracking-widest text-white/35 flex items-center gap-1.5">
                  <RefreshCw size={9} /> {m.text}
                </span>
              </motion.div>
            );

            const isUser = m.role === 'user';
            const isWhisper = m.text.includes('[ШЕПІТ]');

            // High-End Message Grouping Logic
            const prevMsg = messages[idx - 1];
            const isSameSender = prevMsg && 
              prevMsg.role === m.role && 
              ((prevMsg.sender_name === m.sender_name) || (!prevMsg.sender_name && !m.sender_name)) &&
              (prevMsg.role as string) !== 'system';

            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className={`flex flex-col gap-1 max-w-[82%] ${isUser ? 'ml-auto items-end' : 'items-start'} ${isSameSender ? 'mt-[-10px]' : 'mt-3'}`}
              >
                {!isUser && !isSameSender && (
                  <div className="flex items-center gap-2 px-1 ml-1 mb-0.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${getRoleColor(m.role)}`}>
                      {getRoleName(m.role)}
                    </span>
                    {isWhisper && (
                      <span className="text-[8px] font-black bg-[#A855F7]/20 text-[#D8B4FE] border border-[#A855F7]/30 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                        🔒 Адмін-Шепіт
                      </span>
                    )}
                  </div>
                )}
                {isUser && isWhisper && !isSameSender && (
                  <div className="flex items-center gap-2 px-1 mr-1 mb-0.5">
                    <span className="text-[8px] font-black bg-[#A855F7]/20 text-[#D8B4FE] border border-[#A855F7]/30 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                      🔒 Шепіт
                    </span>
                    <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Ви</span>
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${getBubble(m.role, m.text)}`}>
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

      {/* Whisper Mode Status Alert Banner */}
      <AnimatePresence>
        {whisperMode && portalRole === 'carrier' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-2.5 bg-[#A855F7]/10 border-t border-[#A855F7]/30 text-[#D8B4FE] text-[10px] font-black uppercase tracking-widest flex items-center justify-between shadow-[0_-5px_15px_rgba(168,85,247,0.05)] font-bold animate-pulse"
          >
            <span>🔒 РЕЖИМ ШЕПОТУ АКТИВОВАНО: Прямий шифрований зв'язок з Адміністрацією</span>
            <button onClick={() => setWhisperMode(false)} className="text-[#A855F7] hover:text-white font-black">ВИМКНУТИ X</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar with whisper trigger */}
      <div className="px-4 py-3 border-t border-white/5 shrink-0" style={{ background: '#050c15' }}>
        {isResolved ? (
          <div className="flex items-center justify-center py-2 text-[11px] text-white/30 font-bold uppercase tracking-widest gap-2">
            <CheckCircle2 size={13} className="text-[#4ade80]" /> Чат закрито · Зверніться повторно для нового запиту
          </div>
        ) : (
          <div className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 border transition-all duration-300 ${
            whisperMode ? 'border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-[#100720]' : 'border-white/8 focus-within:border-white/20 bg-[#0d1525]'
          }`}>
            <label className={`cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center shrink-0 hover:bg-white/5 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {isUploading ? <Loader2 size={16} className="text-white/40 animate-spin" /> : <Paperclip size={16} className="text-white/40" />}
              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isUploading} />
            </label>
            
            {/* Whisper Mode toggle button for Carrier dispatchers */}
            {portalRole === 'carrier' && (
              <button
                onClick={() => {
                  setWhisperMode(p => !p);
                  if(!whisperMode) {
                    toast.success('Режим шепоту увімкнено!');
                  }
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-95 ${
                  whisperMode ? 'bg-[#A855F7] text-white shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'text-[#8899B5] hover:bg-white/5 hover:text-white'
                }`}
                title={whisperMode ? "Вимкнути Режим Шепоту" : "Увімкнути Режим Шепоту (для зв'язку з адміном)"}
              >
                {whisperMode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}

            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={isTyping}
              placeholder={
                whisperMode 
                  ? '🔒 [ШЕПІТ] Введіть зашифроване повідомлення для Адміністратора...' 
                  : isAI 
                    ? 'Напишіть повідомлення AI Консьєржу...' 
                    : `Написати ${ticket?.assigned_to === 'carrier' ? 'перевізнику' : 'адміністратору'}...`
              }
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20 font-medium disabled:opacity-40"
            />
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => send()}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
              style={{ background: input.trim() ? (whisperMode ? '#A855F7' : accent) : accent + '20', boxShadow: input.trim() ? `0 0 14px ${whisperMode ? '#A855F7' : accent}50` : 'none' }}
            >
              <Send size={15} style={{ color: input.trim() ? '#000' : (whisperMode ? '#A855F7' : accent) }} />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
