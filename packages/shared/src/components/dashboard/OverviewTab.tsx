import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import {
  QrCode, Search, TrendingUp, Star, ArrowRight,
  X, Ticket, Users, Sparkles, Calendar, Clock,
  MessageSquare
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

interface OverviewTabProps {
  setActiveTab: (tab: string) => void;
  tickets: any[];
  passengersCount: number;
}

const parseRoute = (routeStr?: string) => {
  if (!routeStr) return { from: 'Київ', to: 'Рим' };
  const delimiter = routeStr.includes('→') ? '→' : routeStr.includes('—') ? '—' : routeStr.includes('-') ? '-' : null;
  if (delimiter) {
    const parts = routeStr.split(delimiter);
    return {
      from: parts[0]?.trim() || 'Київ',
      to: parts[1]?.trim() || 'Рим'
    };
  }
  return { from: routeStr, to: 'Рейс' };
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ setActiveTab, tickets, passengersCount }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedTrip, passengers: bookingPassengers } = useBookingStore();
  const { t, language } = useLanguage();
  const currentLang = (language || 'UK').toUpperCase();
  const dateLocale = currentLang === 'EN' ? 'en-GB' : currentLang === 'IT' ? 'it-IT' : 'uk-UA';

  const [showQR, setShowQR] = useState(false);

  const userName = user?.firstName || (currentLang === 'EN' ? 'Passenger' : currentLang === 'IT' ? 'Passeggero' : 'Пасажир');
  const loyaltyPoints = user?.loyaltyPoints || 0;

  const userBookings = tickets || [];
  const activeTicketsCount = userBookings.filter(b => b.status === 'active' || b.status === 'pending' || b.status === 'confirmed').length;
  const historyTicketsCount = userBookings.filter(b => b.status === 'completed' || b.status === 'finished').length;

  const nextBooking = userBookings.find(b => b.status === 'active' || b.status === 'confirmed' || b.status === 'pending');

  const routeDetails = parseRoute(nextBooking?.route);
  const fromCity = nextBooking?.fromCity || routeDetails.from;
  const toCity = nextBooking?.toCity || routeDetails.to;

  const currentTrip = nextBooking ? {
    id: nextBooking.id,
    from: fromCity,
    to: toCity,
    date: nextBooking.date,
    depTime: nextBooking.time || "08:00",
    arrTime: nextBooking.duration,
    seats: nextBooking.seats || '1',
    status: nextBooking.status || 'confirmed'
  } : selectedTrip ? {
    id: "NEW",
    from: selectedTrip.departureCity,
    to: selectedTrip.arrivalCity,
    date: selectedTrip.departureDate,
    depTime: selectedTrip.departureTime,
    arrTime: selectedTrip.arrivalTime,
    seats: bookingPassengers.map((_, i) => i + 1).join(', ') || '1',
    status: "confirmed"
  } : null;

  const l = {
    goldStatus: currentLang === 'EN' ? 'Gold Status' : currentLang === 'IT' ? 'Stato Gold' : 'Gold статус',
    silverStatus: currentLang === 'EN' ? 'Silver Status' : currentLang === 'IT' ? 'Stato Silver' : 'Silver статус',
    points: currentLang === 'EN' ? 'points' : currentLang === 'IT' ? 'punti' : 'балів',
    loyaltyRate: currentLang === 'EN' ? '1 point = 1 UAH discount on future trips' : currentLang === 'IT' ? '1 punto = 1 UAH di sconto sui prossimi viaggi' : '1 бал = 1 гривня знижки на наступні поїздки',
    loyaltyTitle: currentLang === 'EN' ? 'Loyalty Program' : currentLang === 'IT' ? 'Programma Fedeltà' : 'Програма лояльності',
    toGold: currentLang === 'EN' ? `To Gold level: ${2000 - loyaltyPoints} pts` : currentLang === 'IT' ? `Al livello Gold: ${2000 - loyaltyPoints} punti` : `До Gold рівня: ${2000 - loyaltyPoints} балів`,
    maxDiscount: currentLang === 'EN' ? 'Maximum discount level!' : currentLang === 'IT' ? 'Livello massimo di sconto!' : 'Максимальний рівень знижок!',
    searchTrips: currentLang === 'EN' ? 'Search Trips' : currentLang === 'IT' ? 'Cerca Corse' : 'Пошук рейсів',
    allRoutes: currentLang === 'EN' ? 'All routes' : currentLang === 'IT' ? 'Tutte le tratte' : 'Всі маршрути',
    support247: currentLang === 'EN' ? 'Support 24/7' : currentLang === 'IT' ? 'Assistenza 24/7' : 'Підтримка 24/7',
    dispatcher: currentLang === 'EN' ? 'Dispatcher' : currentLang === 'IT' ? 'Operatore' : 'Диспетчер',
    boardingPass: currentLang === 'EN' ? 'Boarding Pass' : currentLang === 'IT' ? 'Carta d\'imbarco' : 'Посадковий талон',
    seatsLabel: currentLang === 'EN' ? 'Seats' : currentLang === 'IT' ? 'Posti' : 'Місця',
    boardingHint: currentLang === 'EN'
      ? 'Show to the driver upon boarding. Payment is made in cash on site.'
      : currentLang === 'IT'
        ? 'Mostra all\'autista alla salita. Pagamento in contanti a bordo.'
        : 'Покажіть водію при посадці. Оплата здійснюється готівкою на місці.',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl w-full mx-auto pb-12 min-w-0 overflow-hidden"
    >
      {/* Привітання */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.dashboard?.welcome ? t.dashboard.welcome(userName) : `Привіт, ${userName}! 👋`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t.dashboard?.subtitle || 'Ваш персональний кабінет рейсів Україна — Італія (BUSNET)'}
          </p>
        </div>
      </div>

      {/* Банер спеціальної пропозиції */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-lg space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Sparkles size={12} /> {t.dashboard?.offerBadge || 'Спеціальна пропозиція'}
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            {t.dashboard?.offerTitle || 'Прямі рейси до Риму, Мілана та Болоньї'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {t.dashboard?.offerDesc || 'Бронюйте місця заздалегідь без передоплати. Оплата готівкою водієві при посадці в автобус.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
            >
              {t.dashboard?.bookNow || 'Забронювати квиток'}
            </button>
          </div>
        </div>

        <div className="absolute right-4 -bottom-6 text-7xl sm:text-9xl opacity-15 select-none pointer-events-none">
          🚌
        </div>
      </div>

      {/* Статистичні плашки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: t.dashboard?.activeTickets || "Активні квитки", val: activeTicketsCount, icon: Ticket, sub: nextBooking ? `${currentLang === 'EN' ? 'Trip' : currentLang === 'IT' ? 'Corsa' : 'Рейс'}: ${nextBooking.date}` : (t.dashboard?.noActiveTrips || "Немає рейсів"), color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
          { label: t.dashboard?.totalTrips || "Всього поїздок", val: activeTicketsCount + historyTicketsCount, icon: TrendingUp, sub: t.dashboard?.allTickets || "Архів рейсів", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: t.dashboard?.bonusPoints || "Бонусні бали", val: loyaltyPoints, icon: Star, sub: loyaltyPoints >= 2000 ? l.goldStatus : l.silverStatus, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: t.dashboard?.passengers || "Пасажири", val: passengersCount, icon: Users, sub: t.dashboard?.savedProfiles || "Збережені профілі", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md">
            <stat.icon className={`absolute -right-2 -bottom-2 w-16 h-16 opacity-5 ${stat.color}`} />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl sm:text-3xl font-black ${stat.color}`}>{stat.val}</p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Основна сітка */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Картка найближчого рейсу */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
            <Ticket size={16} className="text-cyan-400" /> {t.dashboard?.nearestTrip || 'Найближчий запланований рейс'}
          </h3>

          {currentTrip ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xl shadow-black/50">
              <div className="flex justify-between items-center mb-5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full">
                  {t.dashboard?.ticketConfirmed || 'Квиток підтверджено'}
                </span>
                <span className="text-xs font-mono text-slate-400">ID: {currentTrip.id}</span>
              </div>

              {/* Міста */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400 uppercase font-bold">{t.dashboard?.from || 'Звідки'}</p>
                  <p className="text-lg sm:text-2xl font-black text-white truncate">{currentTrip.from}</p>
                </div>
                <div className="flex items-center text-cyan-400 px-1 sm:px-2 shrink-0">
                  <ArrowRight size={20} className="sm:w-5 sm:h-5" />
                </div>
                <div className="text-right min-w-0 flex-1">
                  <p className="text-xs text-slate-400 uppercase font-bold">{t.dashboard?.to || 'Куди'}</p>
                  <p className="text-lg sm:text-2xl font-black text-white truncate">{currentTrip.to}</p>
                </div>
              </div>

              {/* Деталі поїздки */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Calendar size={12} className="text-cyan-400" /> {t.dashboard?.date || 'Дата'}
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">{currentTrip.date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Clock size={12} className="text-cyan-400" /> {t.dashboard?.departure || 'Відправлення'}
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">{currentTrip.depTime}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{l.seatsLabel}</p>
                  <p className="text-xs font-black text-cyan-300 mt-0.5">{currentTrip.seats}</p>
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQR(true)}
                  className="flex-1 py-3 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode size={16} /> {l.boardingPass}
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  {t.dashboard?.allTickets || 'Всі квитки'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-1">
                <Ticket size={28} />
              </div>
              <h4 className="text-base font-bold text-white">{t.dashboard?.noActiveTrips || 'Активних поїздок не заплановано'}</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                {t.dashboard?.noActiveTripsSub || 'Оберіть потрібний рейс онлайн — розрахунок готівкою з водієм перед виїздом.'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
              >
                {t.dashboard?.findTicket || 'Знайти квиток'}
              </button>
            </div>
          )}

          {/* Швидкі дії */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center gap-3 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Search className="text-cyan-400" size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{l.searchTrips}</p>
                <p className="text-[10px] text-slate-400">{l.allRoutes}</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all flex items-center gap-3 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <MessageSquare className="text-purple-400" size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{l.support247}</p>
                <p className="text-[10px] text-slate-400">{l.dispatcher}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Програма лояльності */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> {l.loyaltyTitle}
          </h3>

          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {loyaltyPoints >= 2000 ? l.goldStatus : l.silverStatus}
            </p>
            <p className="text-4xl sm:text-5xl font-black mt-2 text-white tracking-tight">
              {loyaltyPoints.toLocaleString(dateLocale)}{' '}
              <span className="text-sm font-bold text-slate-400 uppercase">{l.points}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">{l.loyaltyRate}</p>

            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-2">
                <span>Silver (500)</span>
                <span className="text-amber-400">Gold (2 000)</span>
              </div>
              <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((loyaltyPoints / 2000) * 100, 100)}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-3 text-right">
                {loyaltyPoints < 2000 ? l.toGold : l.maxDiscount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ОФЛАЙН МОДАЛКА QR-КОДУ (СТАБІЛЬНИЙ КЛЮЧ ЗА ID КВИТКА) */}
      <AnimatePresence>
        {showQR && currentTrip && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-700 max-w-sm w-full text-center shadow-2xl"
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-3">
                <QrCode size={24} />
              </div>

              <h3 className="text-lg font-black text-white uppercase">{l.boardingPass}</h3>
              <p className="text-cyan-400 text-xs font-mono font-bold mb-4">{currentTrip.from} → {currentTrip.to}</p>

              <div className="bg-white p-4 rounded-2xl mb-4 inline-block shadow-lg">
                <QRCodeSVG
                  value={`BUSNET:${nextBooking?.id || currentTrip.id}`}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                {l.boardingHint}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OverviewTab;