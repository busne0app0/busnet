import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import Step1Confirmation from './steps/Step1Confirmation';
import Step2Details from './steps/Step2Details';
import Step3Success from './steps/Step3Success';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const stepsMeta = [
  { id: 1, label: 'Підтвердження' },
  { id: 2, label: 'Пасажири' },
  { id: 3, label: 'Готово' }
];

export default function BookingStepper() {
  const { currentStep, setStep, selectedTrip } = useBookingStore();
  const navigate = useNavigate();

  // If no trip selected, redirect back home
  React.useEffect(() => {
    if (!selectedTrip && currentStep < 3) {
      navigate('/');
    }
  }, [selectedTrip, currentStep, navigate]);

  if (!selectedTrip && currentStep < 3) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-10">
        <button 
          onClick={() => currentStep > 1 && currentStep < 3 ? setStep(currentStep - 1) : navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors group px-3 py-2 rounded-full border border-white/5 hover:border-cyan-500/30"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{currentStep === 3 ? 'На головну' : 'Назад'}</span>
        </button>

        <div className="flex items-center gap-4 sm:gap-10">
          {stepsMeta.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${currentStep >= step.id ? 'bg-cyan-400 shadow-[0_0_15px_#00D4FF]' : 'bg-white/10'}`} />
              <span className={`absolute -bottom-5 text-[8px] font-black uppercase tracking-tighter whitespace-nowrap transition-colors hidden sm:block ${currentStep === step.id ? 'text-cyan-400' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="hidden md:block w-24" />
      </div>

      {/* Main Content Area */}
      <div className="relative">
         <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {currentStep === 1 && <Step1Confirmation />}
              {currentStep === 2 && <Step2Details />}
              {currentStep === 3 && <Step3Success />}
            </motion.div>
         </AnimatePresence>
      </div>

      {/* Footer support notice */}
      <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
             <span className="text-[10px] font-bold">24/7</span>
           </div>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Підтримка готова допомогти вам</p>
        </div>
        <p className="text-[10px] text-slate-600 font-bold italic tracking-tighter">Powered by Busnet Neural Engine 2026</p>
      </div>
    </div>
  );
}
