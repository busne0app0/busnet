import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Zap, Send, Paperclip, Smile, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';

interface Message {
  role: 'user' | 'support';
  text: string;
  time: string;
}

const SupportTab: React.FC = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const uid = user.uid;
    const tId = `TKT-${uid.slice(0, 5).toUpperCase()}`;
    setTicketId(tId);

    const fetchTicket = async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', tId)
        .single();
      
      if (!error && data) {
        setMessages(data.messages || []);
      } else {
        const welcome = [{ 
          role: 'support' as const, 
          text: 'Привіт! Я AI Консьєрж BUSNET. Як я можу допомогти вам сьогодні? Ви можете запитати про розклад, багаж або нарахування бонусів.', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }];
        setMessages(welcome);
      }
    };

    fetchTicket();

    const channel = supabase.channel('support_chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `id=eq.${tId}` }, fetchTicket)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping || !user || !ticketId) return;

    const userMsg: Message = {
      role: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const userText = input.toLowerCase();
    setInput('');
    setIsTyping(true);

    try {
      await supabase.from('support_tickets').upsert({
        id: ticketId,
        userId: user.uid,
        userEmail: user.email,
        messages: newMessages,
        status: 'open',
        lastUpdated: new Date().toISOString(),
        priority: 'medium'
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let aiText = "Дякую за звернення! Ваше запитання передано спеціалісту. Я можу також спробувати допомогти, якщо ви надасте більше деталей.";
      
      if (userText.includes('квиток') || userText.includes('бронювання')) {
        aiText = "Ви можете переглянути свої квитки у вкладці 'Квитки'. Якщо вам потрібно змінити дату або скасувати рейс, скористайтесь відповідними кнопками там.";
      } else if (userText.includes('багаж')) {
        aiText = "Стандартна норма багажу: 1 сумка до 20кг у відсіку та 1 ручна поклажа до 5кг. Додатковий багаж можна оплатити на місці або бонусами заздалегідь.";
      } else if (userText.includes('бонус') || userText.includes('бал')) {
        aiText = "Ваш поточний баланс бонусів можна побачити на головному екрані. 10 балів = 1 грн знижки при наступному бронюванні.";
      } else if (userText.includes('привіт') || userText.includes('добрий день')) {
        aiText = "Вітаю! Я ваш персональний помічник BUSNET. Чим я можу бути корисний?";
      }
      
      const aiMsg: Message = {
        role: 'support',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      await supabase.from('support_tickets').update({
        messages: finalMessages,
        lastUpdated: new Date().toISOString()
      }).eq('id', ticketId);

    } catch (error) {
       console.error("Support Chat Error:", error);
       toast.error("Сервіс тимчасово недоступний. Спробуйте пізніше.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col bg-[#141c2e] border border-[#1e3a5f] rounded-3xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="p-5 border-b border-[#1e3a5f] bg-[#1a253a] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-[#00c8ff]/10 flex items-center justify-center text-[#00c8ff] border border-[#00c8ff]/20">
              <Bot size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#141c2e] rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            </div>
          </div>
          <div>
            <h4 className="text-md font-black text-white uppercase italic tracking-tight">AI Консьєрж</h4>
            <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">Онлайн · AI Асистент BUSNET</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="p-2 text-[#7a9ab5] hover:text-white transition-colors">
              <Paperclip size={18} />
           </button>
           <button className="p-2 text-[#7a9ab5] hover:text-white transition-colors">
              <Smile size={18} />
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[75%] p-4 rounded-3xl text-sm shadow-xl relative
                ${m.role === 'user' 
                  ? 'bg-gradient-to-br from-[#00c8ff] to-[#0099cc] text-black font-bold rounded-tr-none' 
                  : 'bg-white/5 border border-white/10 text-[#e8f4ff] backdrop-blur-md rounded-tl-none'}
              `}>
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                <div className={`
                  text-[9px] mt-2 flex items-center gap-2
                  ${m.role === 'user' ? 'text-black/50 justify-end font-black' : 'text-slate-500 justify-start font-bold uppercase'}
                `}>
                  {m.time} {m.role === 'support' && '· AI Відповідь'}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-white/10 p-4 rounded-3xl rounded-tl-none">
                <Loader2 className="animate-spin text-[#00c8ff]" size={16} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 bg-[#0d1425] border-t border-[#1e3a5f] flex items-center gap-4">
        <div className="flex-1 relative">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isTyping}
            placeholder="Опишіть ваше запитання або проблему..." 
            className="w-full bg-[#141c2e] border border-[#1e3a5f] rounded-2xl px-5 py-4 text-sm text-white focus:border-[#00c8ff] outline-none transition-all placeholder:text-[#4a6a85] disabled:opacity-50" 
          />
        </div>
        <button 
          onClick={handleSendMessage} 
          disabled={isTyping || !input.trim()}
          className="p-4 bg-gradient-to-r from-[#00c8ff] to-[#0099cc] text-black rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-[0_5px_20px_rgba(0,200,255,0.3)] group disabled:opacity-50 disabled:hover:scale-100"
        >
          <Zap size={20} className={isTyping ? "animate-pulse" : "group-hover:animate-pulse"} />
        </button>
      </div>
    </div>
  );
};

export default SupportTab;
