import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { Check, Copy, LayoutDashboard, Ticket, Mail, Sparkles, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

export default function Step3Success() {
  const { mainContact, confirmedBooking } = useBookingStore();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const bookingId = confirmedBooking?.bookingId || 'ОФОРМЛЕНО';

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 sm:space-y-10 py-6 sm:py-10 px-2 sm:px-0 w-full max-w-full overflow-hidden">
      <div className="text-center relative overflow-hidden px-2">
        <motion.div
           initial={{ scale: 0, rotate: -45 }}
           animate={{ scale: 1, rotate: 0 }}
           transition={{ type: 'spring', damping: 10 }}
           className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-5 sm:mb-6"
        >
           <Check size={40} className="sm:w-12 sm:h-12" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-2 italic break-words">
            {t.booking?.step3Welcome || 'Вітаємо в '}<span className="text-cyan-400 not-italic inline-block holographic-text">Busnet!</span>
          </h3>
          <p className="text-slate-400 font-medium text-xs sm:text-sm max-w-sm mx-auto">{t.booking?.step3WelcomeSub || 'Ваше бронювання успішно оформлено та збережено в кабінеті.'}</p>
        </motion.div>
        
        {/* Decorative particles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-50 overflow-hidden">
           <Sparkles className="absolute left-[20%] top-0 text-cyan-400/30 animate-pulse" size={32} />
           <Sparkles className="absolute right-[20%] bottom-0 text-violet-400/30 animate-pulse" size={26} />
        </div>
      </div>

      <div className="max-w-md w-full mx-auto p-1 bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 rounded-[28px] sm:rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        <div className="p-5 sm:p-8 bg-[#0D111C]/90 backdrop-blur-3xl rounded-[26px] sm:rounded-[30px] border border-white/5 space-y-5 sm:space-y-6">
           <div className="space-y-3">
              <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 group relative overflow-hidden">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                  <Ticket size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5 sm:mb-1">{t.booking?.step3BookingNumber || 'Номер бронювання'}</p>
                  <p className="text-sm sm:text-base font-mono font-bold text-white tracking-wider truncate">{bookingId}</p>
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-cyan-400 shrink-0"
                  title={t.booking?.step3CopyNumber || 'Скопіювати номер'}
                >
                  {copied ? <Check size={16} className="text-emerald-400 sm:w-4 sm:h-4" /> : <Copy size={16} className="sm:w-4 sm:h-4" />}
                </button>
              </div>

              {confirmedBooking && (
                <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <CreditCard size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5 sm:mb-1">{t.booking?.step3TotalToPay || 'Сума до сплати / сплачено'}</p>
                    <p className="text-base sm:text-lg font-bold text-emerald-400 truncate">
                      {confirmedBooking.totalPrice} <span className="text-xs uppercase">{confirmedBooking.currency}</span>
                    </p>
                  </div>
                </div>
              )}

              {mainContact.email && (
                <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
                    <Mail size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5 sm:mb-1">{t.booking?.step3EmailContact || 'Контактний Email'}</p>
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{mainContact.email}</p>
                  </div>
                </div>
              )}
           </div>

           <button 
             onClick={() => navigate('/dashboard')}
             className="w-full py-4 sm:py-5 neon-gradient-btn rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2.5 sm:gap-3 active:scale-95 shadow-[0_20px_40px_rgba(0,192,255,0.3)] group cursor-pointer"
           >
             <LayoutDashboard size={18} className="group-hover:rotate-12 transition-transform" />
             {t.booking?.step3GoToDashboard || 'Перейти до кабінету'}
           </button>
        </div>
      </div>
    </div>
  );
}
