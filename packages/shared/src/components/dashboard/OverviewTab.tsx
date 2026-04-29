import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { 
  QrCode, Download, MessageSquare, Search, 
  TrendingUp, Star, Gift, Clock, ArrowRight, 
  ShieldCheck, X, Ticket, Users, MapPin, LayoutDashboard
} from 'lucide-react';

import { useLanguage } from '@busnet/shared/context/LanguageContext';

interface OverviewTabProps {
  setActiveTab: (tab: string) => void;
  tickets: any[];
  passengersCount: number;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ setActiveTab, tickets, passengersCount }) => {
  const { user } = useAuthStore();
  const { selectedTrip, passengers: bookingPassengers } = useBookingStore();
  const { language } = useLanguage();
  const [showQR, setShowQR] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const userName = user?.firstName || 'Гість';
  const loyaltyPoints = user?.loyaltyPoints || 0;

  const userBookings = tickets;

  const activeTicketsCount = userBookings.filter(b => b.status === 'active' || b.status === 'pending').length;
  const historyTicketsCount = userBookings.filter(b => b.status !== 'active' && b.status !== 'pending').length;

  const nextBooking = userBookings.find(b => b.status === 'active');
  
  // Локалізації (базові для кабінету)
  const translations = {
    UA: {
      nextTrip: "Наступна подорож",
      activeTrip: "Активний рейс",
      departure: "Відправлення",
      arrival: "Прибуття",
      bus: "Автобус",
      seats: "Місця",
      qrBtn: "QR-код посадки",
      pdfBtn: "Квиток (.txt)",
      statsTrips: "Подорожей",
      statsBonuses: "Бонусів",
      statsLevel: "Ваш статус",
      quickActions: "Швидкі дії",
      findTicket: "Знайти рейс",
      support: "Підтримка AI",
      downloading: "Завантаження...",
      welcome: `Привіт, ${userName}! 👋`
    },
    EN: {
      nextTrip: "Next Trip",
      activeTrip: "Active Route",
      departure: "Departure",
      arrival: "Arrival",
      bus: "Bus",
      seats: "Seats",
      qrBtn: "Boarding QR",
      pdfBtn: "Ticket (.txt)",
      statsTrips: "Trips",
      statsBonuses: "Bonuses",
      statsLevel: "Your Level",
      quickActions: "Quick Actions",
      findTicket: "Find Ticket",
      support: "AI Support",
      downloading: "Downloading...",
      welcome: `Hello, ${userName}! 👋`
    },
    IT: {
      nextTrip: "Prossimo Viaggio",
      activeTrip: "Percorso Attivo",
      departure: "Partenza",
      arrival: "Arrivo",
      bus: "Autobus",
      seats: "Posti",
      qrBtn: "QR Imbarco",
      pdfBtn: "Biglietto (.txt)",
      statsTrips: "Viaggi",
      statsBonuses: "Bonus",
      statsLevel: "Tuo Livello",
      quickActions: "Azioni Rapide",
      findTicket: "Trova Biglietto",
      support: "Supporto AI",
      downloading: "Scaricamento...",
      welcome: `Ciao, ${userName}! 👋`
    }
  };

  const t = translations[language] || translations.UA;

  const currentTrip = nextBooking ? {
    from: nextBooking.route.split('→')[0].trim(),
    to: nextBooking.route.split('→')[1].trim(),
    date: nextBooking.date,
    depTime: nextBooking.time || "08:00",
    arrTime: nextBooking.duration || "20:00",
    busId: nextBooking.id,
    seats: `${nextBooking.seats}`,
    status: nextBooking.status
  } : selectedTrip ? {
    from: selectedTrip.departureCity,
    to: selectedTrip.arrivalCity,
    date: selectedTrip.departureDate,
    depTime: selectedTrip.departureTime,
    arrTime: selectedTrip.arrivalTime,
    busId: "BN-" + (selectedTrip.price % 1000),
    seats: bookingPassengers.map((p, i) => i + 1).join(', '),
    status: "Confirmed"
  } : null;

  const handleDownload = () => {
    // Навігуємо до вкладки квитків де є реальне завантаження
    setActiveTab('tickets');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20 md:pb-0"
    >
      <div className="section-title">Привіт, {userName}! 👋</div>
      <div className="section-sub">Ваш пасажирський кабінет BUSNET UA</div>

      <div className="bg-gradient-to-br from-[#141c2e] to-[#0d1425] border border-[#1e3a5f] rounded-3xl p-8 relative overflow-hidden group shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 flex-1">
          <div className="px-3 py-1 bg-[#ffd600] text-black text-[10px] font-black uppercase rounded-md w-fit mb-4 shadow-[0_0_15px_rgba(255,214,0,0.3)]">АКЦІЯ</div>
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">-20% на рейси до Варшави</h3>
          <p className="text-[#7a9ab5] text-sm mb-6 max-w-sm">Дійсно для всіх бронювань до 30 квітня 2026 р. Подорожуйте з комфортом за кращою ціною.</p>
          <button 
            onClick={() => setActiveTab('search')}
            className="px-8 py-3 bg-[#00c8ff] text-black text-[12px] font-black uppercase rounded-xl hover:bg-white transition-all shadow-[0_10px_20px_rgba(0,200,255,0.2)] active:scale-95"
          >
            Забронювати зараз
          </button>
        </div>
        <div className="text-8xl opacity-30 group-hover:scale-110 transition-transform duration-700 pointer-events-none select-none">
          🚌
        </div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#00c8ff] blur-[120px] opacity-10" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Активні квитки", val: activeTicketsCount.toString(), icon: Ticket, sub: nextBooking ? `Найближчий: ${nextBooking.date}` : "Немає рейсів", color: "text-[#00c8ff]", bg: "bg-[#00c8ff]/10" },
          { label: "Всього поїздок", val: (activeTicketsCount + historyTicketsCount).toString(), icon: TrendingUp, sub: "З 2024 року", color: "text-[#00e676]", bg: "bg-[#00e676]/10" },
          { label: "Бонусні бали", val: loyaltyPoints.toLocaleString(), icon: Star, sub: loyaltyPoints > 2000 ? "Gold рівень" : "Silver рівень", color: "text-[#ffd600]", bg: "bg-[#ffd600]/10" },
          { label: "Пасажири", val: passengersCount.toString(), icon: Users, sub: "Збережені профілі", color: "text-[#7c4dff]", bg: "bg-[#7c4dff]/10" }
        ].map((stat, i) => (
          <div key={i} className="bg-[#141c2e] border border-[#1e3a5f] rounded-2xl p-6 hover:bg-[#1a2235] transition-all group overflow-hidden relative">
            <stat.icon size={48} className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform ${stat.color}`} />
            <p className="text-[10px] text-[#7a9ab5] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
            <p className="text-[10px] text-[#4a6a85] font-medium mt-1 uppercase tracking-wider">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Trip Info */}
        <div className="space-y-6">
          {currentTrip ? (
            <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-[11px] font-black text-[#7a9ab5] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Ticket size={16} className="text-[#00c8ff]" /> Найближчий рейс
                </h4>
                <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border ${currentTrip.status === 'Confirmed' || currentTrip.status === 'confirmed' || currentTrip.status === 'active' ? 'bg-[#00c8ff]/10 text-[#00c8ff] border-[#00c8ff]/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                  {currentTrip.status}
                </span>
              </div>
              
              <h2 className="text-3xl font-black text-white italic uppercase mb-6">{currentTrip.from} → {currentTrip.to}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { l: "Дата", v: currentTrip.date, i: "📅" },
                  { l: "Час", v: currentTrip.depTime, i: "🕗" },
                  { l: "Місця", v: currentTrip.seats, i: "💺" },
                  { l: "В дорозі", v: currentTrip.arrTime, i: "⏱" }
                ].map((d, i) => (
                  <div key={i} className="bg-black/20 p-4 rounded-2xl border border-white/5">
                     <p className="text-[9px] text-[#4a6a85] font-black uppercase tracking-widest mb-1">{d.i} {d.l}</p>
                     <p className="text-sm font-bold text-white uppercase italic">{d.v}</p>
                  </div>
                ))}
              </div>

              <div className="route-map mb-8 h-24 bg-black/30 rounded-2xl relative flex items-center px-10 border border-white/5">
                <div className="flex-1 text-center">
                  <p className="text-xs font-bold text-white uppercase italic tracking-tighter">{currentTrip.from}</p>
                  <p className="text-[10px] text-[#7a9ab5] font-black">{currentTrip.depTime}</p>
                </div>
                <div className="flex-[3] h-[2px] bg-[#1e3a5f] relative mx-4">
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#00c8ff] rounded-full shadow-[0_0_10px_#00c8ff]" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00c8ff] rounded-full shadow-[0_0_10px_#00c8ff]" />
                  <div className="absolute -top-3 left-0 text-lg animate-bus-move-fast">🚌</div>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs font-bold text-white uppercase italic tracking-tighter">{currentTrip.to}</p>
                  <p className="text-[10px] text-[#7a9ab5] font-black">{currentTrip.arrTime}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowQR(true)}
                  className="flex-1 py-4 bg-[#00c8ff] text-black text-[12px] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-[0_10px_20px_rgba(0,200,255,0.2)]"
                >
                  QR-квиток
                </button>
                <button 
                  onClick={handleDownload}
                  className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all"
                >
                  {isDownloading ? <Clock className="animate-spin text-[#00c8ff]" size={20} /> : <Download size={20} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#141c2e] border border-[#1e3a5f] border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-[#7a9ab5]">
                 <Ticket size={32} strokeWidth={1} />
              </div>
              <h3 className="text-lg font-bold text-white uppercase italic tracking-tighter">Немає активних рейсів</h3>
              <p className="text-sm text-[#7a9ab5] max-w-[200px] mx-auto">Час планувати нову подорож! Оберіть маршрут та отримайте бонуси.</p>
              <button 
                onClick={() => setActiveTab('search')}
                className="px-8 py-3 bg-[#00c8ff] text-black text-[10px] font-black uppercase rounded-xl hover:bg-white transition-all"
              >
                Знайти квиток
              </button>
            </div>
          )}

          {/* QUICK ACTIONS */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold px-2 text-white italic tracking-tighter uppercase">Швидкі дії</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('search')}
                className="p-6 rounded-3xl bg-gradient-to-br from-blue-600/10 to-transparent border border-white/5 hover:border-[#00c8ff]/30 transition-all flex flex-col items-center gap-3 group text-white"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#00c8ff]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="text-[#00c8ff]" size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Знайти рейс</span>
              </button>
              <button 
                onClick={() => setActiveTab('support')}
                className="p-6 rounded-3xl bg-gradient-to-br from-purple-600/10 to-transparent border border-white/5 hover:border-purple-500/30 transition-all flex flex-col items-center gap-3 group text-white"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="text-purple-400" size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Підтримка AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Activity & Loyalty */}
        <div className="space-y-6">
          {/* LOYALTY CARD MINI */}
          <div className="bg-gradient-to-br from-[#141c2e] to-[#0a1628] border border-[#1e3a6a] rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:scale-110 transition-transform duration-700">
               <Star size={160} className="text-[#ffd600]" />
            </div>
            <h4 className="text-[11px] font-black text-[#7a9ab5] uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative z-10">
               <Star size={14} className="text-[#ffd600]" /> Програма лояльності
            </h4>
            <div className="relative z-10">
               <p className="text-[10px] text-[#00c8ff] font-black uppercase tracking-[0.2em]">{loyaltyPoints > 2000 ? 'Gold' : 'Silver'} Member</p>
               <p className="text-5xl font-black mt-2 text-white tracking-tighter">{loyaltyPoints.toLocaleString()} <span className="text-sm font-medium text-[#4a6a85] uppercase italic">pts</span></p>
               
               <div className="mt-8">
                  <div className="flex justify-between text-[9px] font-black uppercase text-[#4a6a85] mb-2">
                     <span>Silver (500)</span>
                     <span className="text-[#ffd600]">Gold (2 000)</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((loyaltyPoints / 2000) * 100, 100)}%` }} className="h-full bg-gradient-to-r from-[#00c8ff] to-[#0099cc] shadow-[0_0_15px_rgba(0,200,255,0.5)]" />
                  </div>
                  <p className="text-[9px] text-[#4a6a85] font-black uppercase italic text-right mt-3">
                    {loyaltyPoints < 2000 ? `До Gold рівня: ${2000 - loyaltyPoints} балів` : 'Максимальний рівень досягнуто!'}
                  </p>
               </div>
            </div>
          </div>

          {/* ACTIVITY TIMELINE MAP */}
          <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-3xl p-8 shadow-2xl">
             <h3 className="text-[11px] font-black text-[#7a9ab5] uppercase tracking-[0.2em] mb-8">📊 Активність</h3>
             <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[#1e3a5f]">
                {[
                  tickets.length > 0 ? { title: "Останнє бронювання", time: tickets[0]?.date, done: true } : null,
                  user?.createdAt ? { title: "Реєстрація профілю", time: new Date(user.createdAt).toLocaleDateString('uk-UA'), done: true } : null,
                  nextBooking ? { title: "Очікуємо на поїздку", time: nextBooking.date, current: true } : { title: "Готовність до нових подорожей", time: "Зараз", current: true }
                ].filter(Boolean).map((item: any, i) => (
                  <div key={i} className="relative pl-8 group">
                    <div className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 bg-[#0a0e1a] z-10 transition-all 
                      ${item.done ? 'border-[#00c8ff] bg-[#00c8ff] shadow-[0_0_8px_#00c8ff]' : item.current ? 'border-[#00e676] bg-[#00e676] animate-pulse' : 'border-[#1e3a5f]'}`} 
                    />
                    <div>
                      <p className={`text-sm font-bold uppercase italic tracking-tight ${item.ghost ? 'text-[#4a6a85]' : 'text-white'}`}>{item.title}</p>
                      <p className="text-[10px] text-[#7a9ab5] font-black uppercase tracking-widest mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* MODAL QR CODE */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative p-8 rounded-[2.5rem] bg-[#111827] border border-white/10 max-w-sm w-full text-center"
            >
              <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                <X size={24} />
              </button>
              <h3 className="text-xl font-bold mb-6 italic text-white">{t.qrBtn}</h3>
              <div className="aspect-square bg-white rounded-3xl p-4 mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BUSNET-${currentTrip.busId}-${currentTrip.seats}`} 
                  alt="QR" 
                  className="w-full h-full"
                />
              </div>
              <p className="text-slate-400 text-sm">Покажіть цей код водію при посадці у {currentTrip.from}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OverviewTab;
