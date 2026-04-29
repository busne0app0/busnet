import React from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { CheckCircle2, Clock, MapPin, CreditCard } from 'lucide-react';

export default function Step1Confirmation() {
  const { selectedTrip, setStep } = useBookingStore();
  const { t } = useLanguage();

  if (!selectedTrip) return null;

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4"
        >
          <CheckCircle2 size={32} />
        </motion.div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
          Підтвердження <span className="text-cyan-400 not-italic inline-block pr-4">Вибору</span>
        </h3>
        <p className="text-slate-400 text-sm mt-2">Перевірте деталі рейсу перед заповненням даних пасажирів</p>
      </div>

      <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
           <MapPin size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Маршрут</p>
                <p className="text-xl font-bold text-white leading-none">{selectedTrip.departureCity} → {selectedTrip.arrivalCity}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Час відправлення</p>
                <p className="text-xl font-bold text-white leading-none">{selectedTrip.departureDate}, {selectedTrip.departureTime}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between items-end text-right border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-12">
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Вартість за 1 квиток</p>
              <p className="text-4xl font-black text-white holographic-text">
                {selectedTrip.price} <span className="text-lg font-normal text-cyan-400 italic">{selectedTrip.currency}</span>
              </p>
            </div>
            
            <button 
              onClick={() => setStep(2)}
              className="mt-6 px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Продовжити <CreditCard size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {((selectedTrip.amenities && selectedTrip.amenities.length > 0) 
            ? selectedTrip.amenities 
            : ['Комфортні крісла', 'Wi-Fi', 'Кондиціонер']
        ).map((item, i) => (
          <div key={i} className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
