import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, CheckCircle2, Clock, RefreshCw, ShieldAlert, Send, Loader2, X, EyeOff, Bot, Power } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@busnet/shared/supabase/config';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  user_id: string;
  assigned_to: 'ai' | 'carrier' | 'admin';
  status: 'open' | 'resolved' | 'escalated';
  chat_type?: string;
  last_updated: string;
  created_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai' | 'carrier' | 'admin' | 'system' | 'admin_whisper';
  text: string;
  sender_name: string | null;
  created_at: string;
  ticket_id: string;
}

export default function SupportTab() {
  const { addLog } = useAdminStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply]       = useState('');
  const [sending, setSending]   = useState(false);
  const [whisperMode, setWhisperMode] = useState(false);
  const [aiEnabled, setAiEnabled]     = useState(true);
  const [aiToggling, setAiToggling]   = useState(false);
  const [search, setSearch]     = useState(searchParams.get('q') || '');
  const [filter, setFilter]     = useState<'all' | 'open' | 'escalated' | 'resolved'>(
    (searchParams.get('status') as any) || 'all'
  );
  const [chatTypeFilter, setChatTypeFilter] = useState<'all' | 'support' | 'b2b'>(
    (searchParams.get('type') as any) || 'all'
  );

  // Sync filters to URL
  const updateFilter = (key: string, value: string) => {
    setSearchParams(prev => { prev.set(key, value); return prev; }, { replace: true });
  };

  // Load AI autopilot global state
  useEffect(() => {
    supabase.from('system_settings').select('value').eq('key', 'ai_autopilot').maybeSingle()
      .then(({ data }) => {
        if (data) setAiEnabled(data.value !== 'false' && data.value !== false);
      });
  }, []);

  const toggleAI = async () => {
    setAiToggling(true);
    const newVal = !aiEnabled;
    await supabase.from('system_settings').upsert({ key: 'ai_autopilot', value: String(newVal) }, { onConflict: 'key' });
    setAiEnabled(newVal);
    setAiToggling(false);
    toast(newVal ? '🤖 AI Автопілот увімкнено' : '🔴 AI вимкнено — всі нові чати йдуть до операторів', { duration: 4000 });
    addLog({ id: Date.now().toString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), actor: 'Admin', role: 'owner', action: newVal ? 'AI_ON' : 'AI_OFF', obj: `Глобальний AI Автопілот ${newVal ? 'увімкнено' : 'вимкнено'}`, icon: newVal ? '🤖' : '🔴' });
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .order('last_updated', { ascending: false });
      setTickets(data || []);
    };
    load();

    const ch = supabase.channel('admin_support_tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const load = async () => {
      const { data } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', selected.id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };
    load();

    const ch = supabase.channel(`admin_msgs_${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${selected.id}` }, (p) => {
        const m = p.new as Message;
        setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selected]);

  const handleReply = async () => {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    const msgRole = whisperMode ? 'admin_whisper' : 'admin';
    const senderLabel = whisperMode ? '🔇 Адмін (тільки для перевізника)' : 'Адміністратор BUSNET';
    await supabase.from('ticket_messages').insert({
      ticket_id: selected.id,
      role: msgRole,
      text: whisperMode ? `[ШЕПІТ] ${reply.trim()}` : reply.trim(),
      sender_name: senderLabel,
    });
    if (!whisperMode) {
      await supabase.from('support_tickets').update({
        assigned_to: 'admin', last_updated: new Date().toISOString(),
      }).eq('id', selected.id);
    }
    setReply('');
    setSending(false);
    addLog({ id: Date.now().toString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), actor: 'Admin', role: 'owner', action: whisperMode ? 'WHISPER' : 'REPLY', obj: `${whisperMode ? '🔇 Шепіт' : '💬 Відповідь'} на тікет ${selected.id.slice(0,8)}`, icon: whisperMode ? '🔇' : '💬' });
    if (whisperMode) toast.success('Шепіт надіслано перевізнику');
  };

  const handleResolve = async (t: Ticket) => {
    await supabase.from('ticket_messages').insert({ ticket_id: t.id, role: 'system', text: 'Тікет вирішено адміністратором. Дякуємо за звернення!', sender_name: null });
    await supabase.from('support_tickets').update({ status: 'resolved', last_updated: new Date().toISOString() }).eq('id', t.id);
    toast.success('Тікет закрито');
    setSelected(null);
  };

  const filtered = tickets.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchSearch = t.id.toLowerCase().includes(search.toLowerCase());
    const isB2B = t.chat_type?.startsWith('b2b');
    const matchType = chatTypeFilter === 'all' || (chatTypeFilter === 'b2b' && isB2B) || (chatTypeFilter === 'support' && !isB2B);
    return matchStatus && matchSearch && matchType;
  });

  const statusColor = (s: string) => {
    if (s === 'open')      return 'text-[#00c8ff] bg-[#00c8ff]/10 border-[#00c8ff]/20';
    if (s === 'escalated') return 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20';
    return 'text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20';
  };
  const statusLabel = (s: string) => ({ open: 'Відкрито', escalated: 'Ескалація', resolved: 'Вирішено' }[s] || s);
  const assignedLabel = (a: string) => ({ ai: '🤖 AI', carrier: '🚌 Перевізник', admin: '🛡 Адмін' }[a] || a);

  const getBubble = (role: string, isUser: boolean) => {
    if (isUser) return 'bg-[#1a2d4a] border border-white/5 text-white ml-auto rounded-br-none';
    if (role === 'admin') return 'bg-[#2e0d0d] border border-[#f87171]/20 text-white rounded-bl-none';
    if (role === 'admin_whisper') return 'bg-[#1a0d2e] border border-[#8B5CF6]/30 text-[#c4b5fd] rounded-bl-none italic';
    if (role === 'system') return '';
    if (role === 'carrier') return 'bg-[#0d2e18] border border-[#4ade80]/20 text-white rounded-bl-none';
    return 'bg-white/5 border border-white/10 text-[#e8f4ff] rounded-bl-none';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 rounded-full bg-[#00c8ff] shadow-[0_0_10px_#00c8ff]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Центр Підтримки</h2>
          </div>
          <p className="text-[#8899B5] text-[10px] font-black uppercase tracking-widest ml-5">Управління всіма зверненнями</p>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Autopilot Toggle */}
          <button
            onClick={toggleAI}
            disabled={aiToggling}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              aiEnabled
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20'
                : 'bg-[#f87171]/10 border-[#f87171]/30 text-[#f87171] hover:bg-[#f87171]/20'
            }`}
          >
            {aiToggling ? <Loader2 size={11} className="animate-spin" /> : <Bot size={11} />}
            <span className="hidden md:inline">AI {aiEnabled ? 'Увімкнено' : 'Вимкнено'}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${aiEnabled ? 'bg-[#10B981]' : 'bg-white/20'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${aiEnabled ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </button>
          <div className="px-4 py-2 bg-[#00c8ff]/10 border border-[#00c8ff]/20 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00c8ff] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00c8ff]">{tickets.filter(t => t.status !== 'resolved').length} активних</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left: Ticket list */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B85A1]" size={14} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..." className="w-full bg-[#0f1520] border border-[#1c2e48] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#00c8ff] transition-all" />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-[#0f1520] border border-[#1c2e48] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#00c8ff] cursor-pointer">
              <option value="all">Всі Статуси</option>
              <option value="open">Відкриті</option>
              <option value="escalated">Ескалація</option>
              <option value="resolved">Вирішені</option>
            </select>
            <select value={chatTypeFilter} onChange={e => setChatTypeFilter(e.target.value as any)} className="bg-[#0f1520] border border-[#1c2e48] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#00c8ff] cursor-pointer">
              <option value="all">Всі Типи</option>
              <option value="support">B2C Підтримка</option>
              <option value="b2b">B2B Чати</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
            {filtered.map((t, i) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => {
                  setSelected(t);
                  // 🔒 GDPR: log snooping access to B2B private chats
                  if (t.chat_type?.startsWith('b2b')) {
                    addLog({ id: Date.now().toString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), actor: 'Admin', role: 'owner', action: 'SNOOP', obj: `🔍 Перегляд B2B чату ${t.id.slice(0,8).toUpperCase()} (автолог GDPR)`, icon: '🔍' });
                  }
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selected?.id === t.id ? 'border-[#00c8ff]/40 bg-[#00c8ff]/5' : 'border-[#1c2e48] bg-[#0f1520] hover:border-[#00c8ff]/20'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-black text-[#6B85A1] uppercase tracking-widest font-mono">{t.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${statusColor(t.status)}`}>{statusLabel(t.status)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/50">{assignedLabel(t.assigned_to)}</span>
                  <span className="text-[9px] text-[#6B85A1] flex items-center gap-1"><Clock size={9} /> {new Date(t.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </motion.button>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-[#6B85A1]">
                <MessageSquare size={32} className="mb-3 opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-widest">Тікетів не знайдено</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Chat view */}
        <div className="lg:col-span-2 flex flex-col rounded-[24px] overflow-hidden bg-[#080f1a] border border-white/5 min-h-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/20">
              <ShieldAlert size={48} className="opacity-30" />
              <p className="text-[11px] font-black uppercase tracking-widest">Оберіть тікет для перегляду</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-[#0d1525] shrink-0">
                <div>
                  <p className="text-[10px] font-black text-[#00c8ff] uppercase tracking-widest font-mono">#{selected.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-[11px] text-white/50">{assignedLabel(selected.assigned_to)} · {statusLabel(selected.status)}</p>
                </div>
                <div className="flex gap-4 items-center">
                  {selected.chat_type?.startsWith('b2b') && selected.assigned_to !== 'admin' && (
                    <div className="text-[9px] text-[#f87171] uppercase tracking-widest bg-[#f87171]/10 border border-[#f87171]/20 px-2 py-1.5 rounded animate-pulse">
                      Режим Перехоплення (Snooping)
                    </div>
                  )}
                  <div className="flex gap-2">
                  {selected.status !== 'resolved' && (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleResolve(selected)}
                      className="px-4 py-1.5 rounded-xl bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 text-[9px] font-black uppercase tracking-widest hover:bg-[#4ade80]/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={11} /> Закрити
                    </motion.button>
                  )}
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-colors"><X size={14} /></button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-hide">
                {messages.map(m => {
                  if (m.role === 'system') return (
                    <div key={m.id} className="flex justify-center">
                      <span className="px-3 py-1 rounded-full bg-black/30 border border-white/5 text-[9px] text-white/30 font-bold tracking-widest flex items-center gap-1"><RefreshCw size={8} /> {m.text}</span>
                    </div>
                  );
                  const isUser = m.role === 'user';
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col gap-0.5 max-w-[80%] ${isUser ? 'ml-auto items-end' : 'items-start'}`}>
                      {!isUser && <span className="text-[9px] font-black uppercase tracking-widest px-1" style={{ color: m.role === 'admin' ? '#f87171' : m.role === 'carrier' ? '#4ade80' : '#00c8ff' }}>{m.sender_name || m.role}</span>}
                      <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg ${getBubble(m.role, isUser)}`}>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        <p className="text-[8px] mt-1 opacity-40">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Reply input */}
              {selected.status !== 'resolved' && (
                <div className="px-4 py-3 border-t border-white/5 bg-[#050c15] shrink-0 space-y-2">
                  {/* Whisper toggle */}
                  <button
                    onClick={() => setWhisperMode(p => !p)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      whisperMode
                        ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#8B5CF6]'
                        : 'bg-white/5 border-white/10 text-white/30 hover:text-white/50'
                    }`}
                  >
                    <EyeOff size={11} />
                    {whisperMode ? 'Режим Шепоту активний (тільки перевізник бачить)' : 'Шепіт для перевізника'}
                  </button>
                  <div className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 border transition-all ${
                    whisperMode ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/25' : 'bg-[#0d1525] border-white/8'
                  }`}>
                    <input
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                      placeholder={whisperMode ? '🔇 Шепіт для перевізника (пасажир не бачить)...' : 'Відповісти від імені адміністратора...'}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
                    />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleReply} disabled={!reply.trim() || sending}
                      className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all"
                      style={{ background: reply.trim() ? (whisperMode ? '#8B5CF6' : '#f87171') : (whisperMode ? '#8B5CF620' : '#f8717120') }}
                    >
                      {sending ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white translate-x-0.5" />}
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
