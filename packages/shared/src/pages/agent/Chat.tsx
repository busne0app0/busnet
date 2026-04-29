/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Send, Paperclip, 
  Ticket, Info, User, ExternalLink,
  ChevronLeft, MoreVertical, X, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CHAT_CONTACTS, CHAT_MESSAGES as INITIAL_MESSAGES } from './constants';
import { BOOKINGS_DATA } from './constants';

export default function Chat() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>(INITIAL_MESSAGES);
  const [showTickets, setShowTickets] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeChat = CHAT_CONTACTS.find(c => c.id === activeChatId);
  const messages = activeChatId ? chatMessages[activeChatId] || [] : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !activeChatId) return;
    
    const newMessage = {
      type: 'out',
      text: message,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMessage]
    }));

    setMessage('');
    
    // Auto-reply mock
    setTimeout(() => {
      const reply = {
        type: 'in',
        text: 'Дякуємо за інформацію. Ми опрацюємо ваш запит найближчим часом.',
        time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), reply]
      }));
    }, 2000);
  };

  const handleSendTicket = (booking: any) => {
    if (!activeChatId) return;
    const ticketMsg = {
      type: 'out',
      text: `🎫 Квиток ${booking.id}: ${booking.route} (${booking.date}). Місце: 12A. Скачати: https://busnet.ua/t/${booking.id}`,
      time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), ticketMsg]
    }));
    setShowTickets(false);
    toast.success('Квиток надіслано');
  };

  return (
    <div className="flex h-full bg-[#151c28] border border-white/5 rounded-3xl overflow-hidden animate-in fade-in duration-700">
      {/* Ticket Selection Overlay */}
      <AnimatePresence>
        {showTickets && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-[#0d1119] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-['Syne'] font-black text-xs uppercase italic tracking-tight">Вибрати квиток</h3>
                <button onClick={() => setShowTickets(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#4a5c72]"><X size={16} /></button>
              </div>
              <div className="p-4 bg-white/[0.01]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5c72]" size={12} />
                  <input type="text" placeholder="Пошук квитка..." className="w-full bg-[#121824] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                {BOOKINGS_DATA.map((b, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSendTicket(b)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#7c5cfc11] transition-all text-left group border border-transparent hover:border-[#7c5cfc22]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#a28afd] shrink-0 group-hover:bg-[#7c5cfc] group-hover:text-white transition-all"><Ticket size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{b.pax}</div>
                      <div className="text-[9px] text-[#4a5c72] font-black uppercase tracking-widest mt-0.5">{b.id} · {b.route}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        w-full lg:w-[320px] bg-[#0d1119] border-r border-white/5 flex flex-col shrink-0
        ${activeChatId ? 'hidden lg:flex' : 'flex'}
      `}>
        <div className="p-4 border-b border-white/5 space-y-4 shadow-xl shadow-black/20 relative z-10">
          <div className="flex justify-between items-center">
            <h2 className="font-['Syne'] font-black text-xs uppercase tracking-tight">Чати</h2>
            <button className="text-[#a28afd] hover:text-white transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5c72] group-focus-within:text-[#7c5cfc] transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Пошук..." 
              className="w-full bg-[#121824] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {['passengers', 'carriers', 'admin'].map(section => {
            const contacts = CHAT_CONTACTS.filter(c => c.section === section);
            if (!contacts.length) return null;
            return (
              <div key={section} className="mb-4">
                <div className="px-4 py-2 text-[8px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">{
                  section === 'passengers' ? 'Пасажири' : section === 'carriers' ? 'Перевізники' : 'Підтримка BUSNET UA'
                }</div>
                {contacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setActiveChatId(contact.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 transition-all relative border-l-2
                      ${activeChatId === contact.id ? 'bg-[#7c5cfc0c] border-[#7c5cfc]' : 'border-transparent hover:bg-white/[0.02]'}
                    `}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs relative shrink-0" style={{ backgroundColor: contact.av }}>
                      {contact.initials}
                      <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-2 border-[#0d1119] rounded-full ${contact.online ? 'bg-[#00d97e]' : 'bg-[#4a5c72]'}`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-center mb-0.5">
                        <div className="text-xs font-bold text-white truncate pr-2">{contact.name}</div>
                        <span className="text-[8px] text-[#4a5c72] font-black uppercase tracking-tight shrink-0">{contact.time}</span>
                      </div>
                      <div className="text-[10px] text-[#7a8fa8] truncate leading-tight italic">{contact.last}</div>
                    </div>
                    {contact.unread > 0 && (
                      <div className="absolute top-3 right-4 bg-[#ff3d5a] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-red-900/40">
                        {contact.unread}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main View */}
      <div className={`
        flex-1 flex flex-col bg-[#0d1119]/50
        ${!activeChatId ? 'hidden lg:flex' : 'flex'}
      `}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-[#a28afd]" />
            </div>
            <h3 className="font-['Syne'] font-black text-lg uppercase tracking-tight text-white">Оберіть чат</h3>
            <p className="text-xs text-[#7a8fa8] mt-2 font-medium">Всі комунікації захищені · Телефони приховані</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-4 bg-[#0d1119] relative z-10 transition-all">
              <button 
                onClick={() => setActiveChatId(null)}
                className="lg:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#7a8fa8]"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: activeChat.av }}>
                {activeChat.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">{activeChat.name}</div>
                <div className="text-[10px] text-[#4a5c72] font-bold uppercase tracking-widest mt-0.5">{activeChat.sub}</div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowTickets(true)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#7a8fa8] hover:text-white hover:bg-[#7c5cfc] transition-all" 
                  title="Бронювання"
                >
                  <Ticket size={16} />
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#7a8fa8] hover:text-white hover:bg-white/10 transition-all" 
                  title="Профіль"
                >
                  <User size={16} />
                </button>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
            >
              {messages.map((m, i) => {
                if (m.type === 'system') {
                  return (
                    <div key={i} className="flex justify-center my-6">
                      <span className="bg-white/5 px-4 py-1.5 rounded-full text-[9px] font-black text-[#5a6a85] uppercase tracking-widest italic border border-white/5 shadow-inner">
                        {m.text}
                      </span>
                    </div>
                  );
                }
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${m.type === 'out' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`
                      max-w-[75%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-lg
                      ${m.type === 'out' 
                        ? 'bg-gradient-to-br from-[#7c5cfc] to-[#5533dd] text-white rounded-br-sm' 
                        : 'bg-[#1a2234] text-[#dde8f5] border border-white/5 rounded-bl-sm'}
                    `}>
                      {m.text}
                    </div>
                    <span className="text-[9px] text-[#4a5c72] font-bold mt-1.5 px-1 uppercase tracking-tighter italic">{m.time}</span>
                  </motion.div>
                );
              })}
            </div>

            <div className="p-4 bg-[#0d1119] border-t border-white/5 transition-all">
              <div className="bg-[#121824] border border-white/5 rounded-2xl p-3 flex items-end gap-3 transition-all focus-within:border-[#7c5cfc44] shadow-inner">
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Повідомлення..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-xs font-medium py-2 px-1 text-white scrollbar-hide min-h-[36px] max-h-[120px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="flex items-center gap-1.5 pb-1">
                  <button onClick={() => toast.success('Прикріпити файл')} className="w-8 h-8 rounded-lg text-[#4a5c72] hover:text-white hover:bg-white/5 transition-all flex items-center justify-center">
                    <Paperclip size={18} />
                  </button>
                  <button 
                    onClick={() => setShowTickets(true)}
                    className="w-8 h-8 rounded-lg text-[#4a5c72] hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
                  >
                    <Ticket size={18} />
                  </button>
                  <button 
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c5cfc] to-[#5533dd] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-purple-900/40"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
