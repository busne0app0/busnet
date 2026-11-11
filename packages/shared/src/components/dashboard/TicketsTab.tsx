import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  QrCode,
  Trash2,
  X,
  Star as StarIcon,
  Send,
  Calendar,
  Clock,
  MapPin,
  Printer,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface Ticket {
  id: string;
  route: string;
  status: string;
  date: string;
  time: string;
  duration?: string;
  seats: string;
  price: number;
  currency?: string;
  carrier?: string;
  fromStation?: string;
  toStation?: string;
}

interface TicketsTabProps {
  tickets: Ticket[];
  onCancelTicket: (ticketId: string) => Promise<void>;
  setActiveTab?: (tab: string) => void;
}

export const TicketsTab: React.FC<TicketsTabProps> = ({ tickets, onCancelTicket, setActiveTab }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const currentLang = (language || 'UK').toUpperCase();

  const [activeSubTab, setActiveSubTab] = useState<'active' | 'past' | 'cancelled'>('active');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<Ticket | null>(null);
  const [selectedTicketForReview, setSelectedTicketForReview] = useState<Ticket | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Локалізовані тексти для вкладки квитків
  const l = {
    title: currentLang === 'EN' ? 'My Tickets' : currentLang === 'IT' ? 'I Miei Biglietti' : 'Мої квитки',
    subtitle: currentLang === 'EN'
      ? 'Manage your bookings and show the ticket to the driver'
      : currentLang === 'IT'
        ? 'Gestisci le tue prenotazioni e mostra il biglietto all\'autista'
        : 'Керуйте бронюваннями та показуйте квиток водію',
    tabActive: currentLang === 'EN' ? 'Active' : currentLang === 'IT' ? 'Attivi' : 'Активні',
    tabPast: currentLang === 'EN' ? 'Archive' : currentLang === 'IT' ? 'Archivio' : 'Архів',
    tabCancelled: currentLang === 'EN' ? 'Cancelled' : currentLang === 'IT' ? 'Cancellati' : 'Скасовані',
    statusConfirmed: currentLang === 'EN' ? 'Confirmed' : currentLang === 'IT' ? 'Confermato' : 'Підтверджено',
    statusCompleted: currentLang === 'EN' ? 'Trip Completed' : currentLang === 'IT' ? 'Completato' : 'Поїздка завершена',
    statusCancelled: currentLang === 'EN' ? 'Cancelled' : currentLang === 'IT' ? 'Cancellato' : 'Скасовано',
    colDate: currentLang === 'EN' ? 'Date' : currentLang === 'IT' ? 'Data' : 'Дата',
    colTime: currentLang === 'EN' ? 'Time' : currentLang === 'IT' ? 'Ora' : 'Час',
    colSeats: currentLang === 'EN' ? 'Seats' : currentLang === 'IT' ? 'Posti' : 'Місця',
    colPrice: currentLang === 'EN' ? 'To Pay' : currentLang === 'IT' ? 'Da Pagare' : 'До сплати',
    ticketNum: currentLang === 'EN' ? 'Ticket #' : currentLang === 'IT' ? 'N. biglietto:' : '№ квитка:',
    cancelTooltip: currentLang === 'EN' ? 'Cancel booking' : currentLang === 'IT' ? 'Cancella prenotazione' : 'Скасувати бронь',
    carrier: currentLang === 'EN' ? 'Carrier:' : currentLang === 'IT' ? 'Vettore:' : 'Перевізник:',
    boardingPass: currentLang === 'EN' ? 'Boarding Pass' : currentLang === 'IT' ? 'Carta d\'imbarco' : 'Посадковий талон',
    print: currentLang === 'EN' ? 'Print' : currentLang === 'IT' ? 'Stampa' : 'Друк',
    leaveReview: currentLang === 'EN' ? 'Leave a Review' : currentLang === 'IT' ? 'Lascia una recensione' : 'Залишити відгук',
    cancelConfirmPrompt: (route: string) =>
      currentLang === 'EN'
        ? `Cancel booking for trip ${route}? Your seat will be released.`
        : currentLang === 'IT'
          ? `Cancellare la prenotazione per ${route}? Il posto sarà rilasciato.`
          : `Скасувати бронювання на рейс ${route}? Місце буде звільнено.`,
    cancelYes: currentLang === 'EN' ? 'Yes, cancel' : currentLang === 'IT' ? 'Sì, cancella' : 'Так, скасувати',
    cancelling: currentLang === 'EN' ? 'Cancelling...' : currentLang === 'IT' ? 'Cancellazione...' : 'Скасування...',
    back: currentLang === 'EN' ? 'Back' : currentLang === 'IT' ? 'Indietro' : 'Назад',
    emptyTitle: currentLang === 'EN' ? 'No tickets in this category' : currentLang === 'IT' ? 'Nessun biglietto in questa categoria' : 'Квитків у цій категорії немає',
    emptyDesc: currentLang === 'EN'
      ? 'Book a trip online without prepayment and pay cash to the driver upon departure.'
      : currentLang === 'IT'
        ? 'Prenota online senza anticipo e paga in contanti all\'autista alla partenza.'
        : 'Забронюйте рейс онлайн без передоплати та розрахуйтеся з водієм перед виїздом.',
    findTicket: currentLang === 'EN' ? 'Find a ticket' : currentLang === 'IT' ? 'Cerca biglietto' : 'Знайти квиток',
    modalRoute: currentLang === 'EN' ? 'Route:' : currentLang === 'IT' ? 'Tratta:' : 'Маршрут:',
    modalDateTime: currentLang === 'EN' ? 'Date / Time:' : currentLang === 'IT' ? 'Data / Ora:' : 'Дата / Час:',
    modalSeatsPrice: currentLang === 'EN' ? 'Seats / Amount:' : currentLang === 'IT' ? 'Posti / Importo:' : 'Місця / Сума:',
    modalHint: currentLang === 'EN'
      ? 'Show this screen to the crew upon boarding. Cash payment directly to the driver.'
      : currentLang === 'IT'
        ? 'Mostra questo schermo al personale di bordo. Pagamento in contanti all\'autista.'
        : 'Покажіть цей екран екіпажу при посадці. Розрахунок готівкою водію.',
    modalPrintBtn: currentLang === 'EN' ? 'Print or Save PDF' : currentLang === 'IT' ? 'Stampa o Salva PDF' : 'Друкувати або зберегти',
    reviewTitle: currentLang === 'EN' ? 'How was your trip?' : currentLang === 'IT' ? 'Com\'è andato il tuo viaggio?' : 'Як пройшла ваша поїздка?',
    reviewPlaceholder: currentLang === 'EN' ? 'Was the bus comfortable? Did Wi-Fi and AC work?' : currentLang === 'IT' ? 'Il bus era confortevole? Wi-Fi e aria condizionata funzionavano?' : 'Чи був комфортним автобус? Чи працював Wi-Fi та кондиціонер?',
    reviewSubmit: currentLang === 'EN' ? 'Submit Review' : currentLang === 'IT' ? 'Invia Recensione' : 'Надіслати відгук',
    cancelSuccess: currentLang === 'EN' ? 'Booking successfully cancelled' : currentLang === 'IT' ? 'Prenotazione cancellata' : 'Бронювання успішно скасовано',
    cancelError: currentLang === 'EN' ? 'Failed to cancel ticket. Please contact support' : currentLang === 'IT' ? 'Impossibile cancellare. Contatta il supporto' : 'Не вдалося скасувати квиток. Зверніться до підтримки',
    reviewEmptyError: currentLang === 'EN' ? 'Please write a short comment' : currentLang === 'IT' ? 'Scrivi un breve commento' : 'Будь ласка, напишіть короткий коментар',
    reviewSuccess: currentLang === 'EN' ? 'Thank you! Your review was sent to the carrier' : currentLang === 'IT' ? 'Grazie! La tua recensione è stata inviata' : 'Дякуємо! Ваш відгук передано перевізнику'
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const s = (t.status || '').toLowerCase();
      if (activeSubTab === 'active') return s === 'active' || s === 'pending' || s === 'confirmed';
      if (activeSubTab === 'past') return s === 'completed' || s === 'finished';
      if (activeSubTab === 'cancelled') return s === 'cancelled';
      return false;
    });
  }, [activeSubTab, tickets]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await onCancelTicket(id);
      toast.success(l.cancelSuccess);
      setConfirmCancelId(null);
    } catch (error) {
      toast.error(l.cancelError);
    } finally {
      setCancellingId(null);
    }
  };

  const handlePrintTicket = (ticket: Ticket) => {
    setSelectedTicketForQR(ticket);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const submitReview = () => {
    if (!reviewText.trim()) {
      toast.error(l.reviewEmptyError);
      return;
    }
    toast.success(l.reviewSuccess);
    setSelectedTicketForReview(null);
    setReviewText('');
    setRating(5);
  };

  return (
    <div className="space-y-6 max-w-5xl w-full mx-auto pb-12 min-w-0 overflow-hidden">
      {/* Заголовок та фільтр */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md w-full min-w-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            {l.title}
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
              {filteredTickets.length}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {l.subtitle}
          </p>
        </div>

        {/* Перемикач табів */}
        <div className="flex w-full sm:w-auto p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          {(['active', 'past', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-lg min-h-[38px] cursor-pointer ${activeSubTab === tab
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              {tab === 'active' ? l.tabActive : tab === 'past' ? l.tabPast : l.tabCancelled}
            </button>
          ))}
        </div>
      </div>

      {/* Список квитків */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => {
          const isActive = ticket.status === 'active' || ticket.status === 'pending' || ticket.status === 'confirmed';
          const isCompleted = ticket.status === 'completed' || ticket.status === 'finished';

          return (
            <div
              key={ticket.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 sm:p-6 relative overflow-hidden transition-all shadow-xl shadow-black/40"
            >
              {/* Бічна кольорова смужка статусу */}
              <div
                className={`absolute top-0 left-0 w-1.5 h-full ${isActive ? 'bg-cyan-400' : isCompleted ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
              />

              <div className="flex flex-col lg:flex-row justify-between gap-6 pl-2">
                {/* Інформація про рейс */}
                <div className="flex-1 space-y-4 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2 min-w-0 flex-1 break-words">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
                      <span className="break-words">{ticket.route}</span>
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${isActive
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        : isCompleted
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                    >
                      {isActive ? l.statusConfirmed : isCompleted ? l.statusCompleted : l.statusCancelled}
                    </span>
                  </div>

                  {/* Деталі рейсу */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/60">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" /> {l.colDate}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-white mt-0.5">{ticket.date}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> {l.colTime}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-white mt-0.5">{ticket.time}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{l.colSeats}</p>
                      <p className="text-xs sm:text-sm font-black text-cyan-400 mt-0.5">{ticket.seats}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{l.colPrice}</p>
                      <p className="text-xs sm:text-sm font-black text-white mt-0.5">
                        {ticket.price} {ticket.currency || '€'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 min-w-0">
                    <span className="font-semibold text-slate-300 shrink-0">{l.ticketNum}</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300 text-[11px] truncate max-w-[140px] sm:max-w-none">
                      {ticket.id}
                    </span>
                    {ticket.carrier && (
                      <span className="ml-auto text-[11px] text-slate-400 truncate">{l.carrier} {ticket.carrier}</span>
                    )}
                  </div>
                </div>

                {/* Блок дій */}
                <div className="flex flex-col sm:flex-row lg:flex-col justify-end gap-2.5 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800 w-full sm:w-auto min-w-0">
                  {isActive && (
                    <>
                      <button
                        onClick={() => setConfirmCancelId(ticket.id)}
                        title={l.cancelTooltip}
                        className="flex items-center justify-center p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all active:scale-95 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePrintTicket(ticket)}
                          title={l.print}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border border-slate-700 active:scale-95 cursor-pointer"
                        >
                          <Printer size={15} />
                          <span className="hidden sm:inline">{l.print}</span>
                        </button>

                        <button
                          onClick={() => setConfirmCancelId(ticket.id)}
                          title="Скасувати бронь"
                          className="flex items-center justify-center p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}

                  {isCompleted && (
                    <button
                      onClick={() => setSelectedTicketForReview(ticket)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 px-4 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer active:scale-95"
                    >
                      <StarIcon size={14} /> {l.leaveReview}
                    </button>
                  )}
                </div>
              </div>

              {/* Діалог підтвердження скасування */}
              {confirmCancelId === ticket.id && (
                <div className="mt-4 p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-rose-300 text-xs text-center sm:text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{l.cancelConfirmPrompt(ticket.route)}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleCancel(ticket.id)}
                      disabled={cancellingId === ticket.id}
                      className="flex-1 sm:flex-none px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {cancellingId === ticket.id ? l.cancelling : l.cancelYes}
                    </button>
                    <button
                      onClick={() => setConfirmCancelId(null)}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      {l.back}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Порожній стан */}
        {filteredTickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <QrCode size={28} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">{l.emptyTitle}</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1 mb-6">
              {l.emptyDesc}
            </p>
            <button
              onClick={() => {
                if (setActiveTab) setActiveTab('overview');
                navigate('/');
              }}
              className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
            >
              {l.findTicket}
            </button>
          </div>
        )}
      </div>

      {/* Модальне вікно QR-коду */}
      <AnimatePresence>
        {selectedTicketForQR && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicketForQR(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl z-10 my-auto"
            >
              <button
                onClick={() => setSelectedTicketForQR(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mb-3">
                <QrCode size={24} />
              </div>

              <h2 className="text-lg font-black text-white uppercase tracking-tight">{l.boardingPass}</h2>
              <p className="text-cyan-400 font-mono text-xs font-bold mt-0.5 mb-5">ID: {selectedTicketForQR.id}</p>

              {/* Стабільне значення QR: суворо ID квитка */}
              <div className="bg-white p-4 rounded-2xl mb-5 shadow-lg shadow-cyan-500/10">
                <QRCodeSVG
                  value={`BUSNET:${selectedTicketForQR.id}`}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="w-full space-y-2.5 text-left text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800 mb-5">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">{l.modalRoute}</span>
                  <span className="text-white font-bold">{selectedTicketForQR.route}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">{l.modalDateTime}</span>
                  <span className="text-white font-bold">
                    {selectedTicketForQR.date} {selectedTicketForQR.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">{l.modalSeatsPrice}</span>
                  <span className="text-cyan-300 font-bold">
                    {selectedTicketForQR.seats} ({selectedTicketForQR.price} {selectedTicketForQR.currency || '€'})
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal mb-4">
                {l.modalHint}
              </p>

              <button
                onClick={() => handlePrintTicket(selectedTicketForQR)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <Printer size={15} /> {l.modalPrintBtn}
              </button>
            </motion.div>
          </div>
        )}

        {/* Модалка відгуку */}
        {selectedTicketForReview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicketForReview(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 z-10"
            >
              <button
                onClick={() => setSelectedTicketForReview(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>

              <h2 className="text-lg font-bold text-white mb-1">{l.reviewTitle}</h2>
              <p className="text-xs text-slate-400 mb-4">{selectedTicketForReview.route}</p>

              {/* Зірочки */}
              <div className="flex justify-center gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform hover:scale-125 cursor-pointer"
                  >
                    <StarIcon
                      size={28}
                      className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={l.reviewPlaceholder}
                className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition-all resize-none mb-4"
              />

              <button
                onClick={submitReview}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {l.reviewSubmit} <Send size={14} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketsTab;