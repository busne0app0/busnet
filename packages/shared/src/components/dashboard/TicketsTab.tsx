import React from 'react';
import toast from 'react-hot-toast';
import { QrCode, Download, Trash2, X, Star as StarIcon, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface Ticket {
  id: string;
  route: string;
  status: string;
  date: string;
  time: string;
  duration: string;
  seats: string;
  price: number;
  carrier: string;
}

interface TicketsTabProps {
  tickets: Ticket[];
  onCancelTicket: (ticketId: string) => Promise<void>;
  setActiveTab?: (tab: string) => void;
}

const TicketsTab: React.FC<TicketsTabProps> = ({ tickets, onCancelTicket, setActiveTab }) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'active' | 'past' | 'cancelled'>('active');
  const [isCancelling, setIsCancelling] = React.useState<string | null>(null);
  const [selectedTicketForQR, setSelectedTicketForQR] = React.useState<Ticket | null>(null);
  const [selectedTicketForReview, setSelectedTicketForReview] = React.useState<Ticket | null>(null);
  const [rating, setRating] = React.useState(5);
  const [reviewText, setReviewText] = React.useState('');

  const filteredTickets = React.useMemo(() => {
    if (activeSubTab === 'active') return tickets.filter(t => t.status === 'active' || t.status === 'pending');
    if (activeSubTab === 'past') return tickets.filter(t => t.status === 'completed' || t.status === 'finished');
    if (activeSubTab === 'cancelled') return tickets.filter(t => t.status === 'cancelled');
    return [];
  }, [activeSubTab, tickets]);

  const handleCancelClick = async (id: string) => {
    if(!confirm('Ви впевнені, що хочете скасувати цей квиток?')) return;
    
    setIsCancelling(id);
    try {
      await onCancelTicket(id);
      toast.success('Квиток успішно скасовано');
    } catch (error) {
      toast.error('Помилка при скасуванні квитка');
    } finally {
      setIsCancelling(null);
    }
  };

  const handleDownload = (ticket: Ticket) => {
    const content = `BUSNET UA TICKET\nID: ${ticket.id}\nROUTE: ${ticket.route}\nDATE: ${ticket.date}\nTIME: ${ticket.time}\nSEATS: ${ticket.seats}\nPRICE: ${ticket.price} UAH`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `busnet-ticket-${ticket.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Квиток завантажено (.txt)');
  };

  const submitReview = () => {
    toast.success('Дякуємо за ваш відгук!');
    setSelectedTicketForReview(null);
    setReviewText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Мої квитки</h2>
          <p className="text-sm text-[#7a9ab5]">Керуйте своїми активними та минулими поїздками</p>
        </div>
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {(['active', 'past', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg
                ${activeSubTab === tab ? 'bg-[#00c8ff] text-black shadow-lg' : 'text-[#7a9ab5] hover:text-white'}
              `}
            >
              {tab === 'active' ? 'Активні' : tab === 'past' ? 'Минулі' : 'Скасовані'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <div 
            key={ticket.id} 
            className="bg-[#141c2e] border border-[#1e3a5f] rounded-2xl p-6 relative overflow-hidden group hover:border-[#00c8ff]/40 transition-all shadow-xl shadow-black/20"
          >
            <div className={`absolute top-0 left-0 w-1 h-full opacity-80 
              ${ticket.status === 'active' ? 'bg-[#00c8ff]' : ticket.status === 'completed' ? 'bg-[#00e676]' : 'bg-[#f44336]'}`} 
            />
            
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4 min-w-0">
                  <h3 className="text-xl font-bold italic tracking-tight uppercase text-white truncate">{ticket.route}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border shrink-0
                    ${ticket.status === 'active' ? 'bg-[#00c8ff]/10 text-[#00c8ff] border-[#00c8ff]/20' : 
                      ticket.status === 'completed' ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 
                      'bg-[#f44336]/10 text-[#f44336] border-[#f44336]/20'}
                  `}>
                    {ticket.status === 'active' ? 'Активний' : ticket.status === 'completed' ? 'Завершено' : 'Скасовано'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[9px] text-[#4a6a85] font-black uppercase tracking-widest mb-1">Дата та час</p>
                    <p className="text-xs font-bold text-white/90">{ticket.date} · {ticket.time}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#4a6a85] font-black uppercase tracking-widest mb-1">Місця</p>
                    <p className="text-xs font-bold text-[#00c8ff]">{ticket.seats}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#4a6a85] font-black uppercase tracking-widest mb-1">Ціна</p>
                    <p className="text-xs font-bold text-white/90">{ticket.price} ₴</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#4a6a85] font-black uppercase tracking-widest mb-1">ID</p>
                    <p className="text-xs font-black italic text-[#7a9ab5]">{ticket.id}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col justify-end gap-3 min-w-[140px]">
                {ticket.status === 'active' && (
                  <>
                    <button 
                      onClick={() => setSelectedTicketForQR(ticket)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#00c8ff] text-black py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-white transition-all shadow-[0_10px_20px_rgba(0,200,255,0.2)] active:scale-95"
                    >
                      <QrCode size={14} /> Квиток
                    </button>
                    <div className="flex flex-1 gap-2">
                      <button 
                        onClick={() => handleDownload(ticket)}
                        className="flex-1 flex items-center justify-center gap-2 border border-[#1e3a5f] text-white py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-white/5 transition-all active:scale-95"
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        onClick={() => handleCancelClick(ticket.id)}
                        disabled={isCancelling === ticket.id}
                        className="px-3 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isCancelling === ticket.id ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </>
                )}
                {ticket.status === 'completed' && (
                  <>
                    <button onClick={() => handleDownload(ticket)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-white/5">Квиток (.txt)</button>
                    <button onClick={() => setSelectedTicketForReview(ticket)} className="flex-1 bg-[#00e676] text-black py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-white transition-all">Відгук</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-[#7a9ab5]">
              <QrCode size={32} strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Квитків не знайдено</h3>
              <p className="text-sm text-[#7a9ab5]">У вас поки немає активних поїздок</p>
            </div>
            <button 
              onClick={() => setActiveTab?.('search')}
              className="px-6 py-2 bg-[#00c8ff] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              Забронювати рейс
            </button>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedTicketForQR && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicketForQR(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#141c2e] border border-[#1e3a5f] rounded-[40px] p-10 flex flex-col items-center text-center shadow-2xl"
            >
              <button 
                onClick={() => setSelectedTicketForQR(null)}
                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="w-16 h-16 bg-[#00c8ff]/10 rounded-2xl flex items-center justify-center text-[#00c8ff] mb-8">
                <QrCode size={32} />
              </div>

              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">ВАШ КВИТОК</h2>
              <p className="text-[#00c8ff] text-[10px] font-black uppercase tracking-[0.3em] mb-10">{selectedTicketForQR.id}</p>

              <div className="bg-white p-6 rounded-3xl mb-10 shadow-[0_0_40px_rgba(0,200,255,0.15)]">
                 <QRCodeSVG 
                    value={`TICKET_ID:${selectedTicketForQR.id}|ROUTE:${selectedTicketForQR.route}|DATE:${selectedTicketForQR.date}`}
                    size={180}
                    level="H"
                    includeMargin={true}
                 />
              </div>

              <div className="w-full space-y-4 text-left">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">МАРШРУТ</span>
                  <span className="text-xs font-bold text-white">{selectedTicketForQR.route}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">ДАТА ТА ЧАС</span>
                  <span className="text-xs font-bold text-white">{selectedTicketForQR.date} {selectedTicketForQR.time}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">МІСЦЯ</span>
                  <span className="text-xs font-bold text-white">{selectedTicketForQR.seats}</span>
                </div>
              </div>

              <p className="mt-10 text-[9px] text-[#7a9ab5] font-black uppercase tracking-[0.2em] leading-relaxed italic">
                 Пред'явіть цей код водію <br /> під час посадки
              </p>
            </motion.div>
          </div>
        )}
        {/* Review Modal */}
        {selectedTicketForReview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicketForReview(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#141c2e] border border-[#1e3a5f] rounded-[40px] p-8 flex flex-col items-center shadow-2xl"
            >
              <button 
                onClick={() => setSelectedTicketForReview(null)}
                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="w-16 h-16 bg-[#00e676]/10 rounded-2xl flex items-center justify-center text-[#00e676] mb-6">
                <MessageSquare size={32} />
              </div>

              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">ВАШ ВІДГУК</h2>
              <p className="text-[#7a9ab5] text-[10px] font-black uppercase tracking-[0.2em] mb-8">Рейс: {selectedTicketForReview.route}</p>

              <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    className={`p-2 transition-all hover:scale-110 ${s <= rating ? 'text-[#ffd600]' : 'text-[#1e3a5f]'}`}
                  >
                    <StarIcon size={24} fill={s <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>

              <textarea 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Поділіться вашими враженнями від поїздки..."
                className="w-full h-32 bg-black/40 border border-[#1e3a5f] rounded-2xl p-4 text-sm text-white focus:border-[#00c8ff] outline-none transition-all resize-none mb-6"
              />

              <button 
                onClick={submitReview}
                className="w-full py-4 bg-[#00e676] text-black text-[12px] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                Надіслати відгук <Send size={16} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketsTab;
