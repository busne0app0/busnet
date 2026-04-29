/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Ticket, ShieldCheck, 
  BrainCircuit, ChevronRight, Zap 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OnboardingWidget() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: 'Створіть маршрут',
      desc: 'Вкажіть міста, виберіть комфортабельний автобус та призначте досвідченого водія.',
      icon: Search,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      id: 2,
      title: 'AI Smart Suggest',
      desc: 'Наша система автоматично запропонує оптимальну ціну та підбере пасажирів за інтересами.',
      icon: BrainCircuit,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10'
    },
    {
      id: 3,
      title: 'Passkey Безпека',
      desc: 'Авторизуйте посадку пасажирів через біометрію за лічені секунди. Без паперових квитків.',
      icon: ShieldCheck,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10'
    }
  ];

  return (
    <div className="bg-[#1a2235] border border-white/5 rounded-[40px] p-10 relative overflow-hidden group shadow-2xl">
      <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 group-hover:scale-110 transition-transform duration-1000">
         <BrainCircuit size={200} className="text-orange-500" />
      </div>

      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="px-3 py-1 bg-[#ff6b35] text-white text-[10px] font-black uppercase rounded-lg shadow-[0_0_15px_rgba(255,107,53,0.3)]">
            Нова функція
          </div>
          <h3 className="font-syne font-black text-xl italic uppercase tracking-tighter text-white">Як працює BUSNET UA</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: step.id * 0.1 }}
              className={`
                p-6 rounded-[32px] border transition-all cursor-pointer relative group/item
                ${activeStep === step.id 
                  ? 'bg-white/[0.04] border-[#ff6b35]/30' 
                  : 'bg-black/20 border-white/5 hover:border-white/10'}
              `}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#111520] border border-white/10 flex items-center justify-center font-syne font-black text-[10px] italic text-[#ff6b35]">
                0{step.id}
              </div>
              
              <div className={`w-12 h-12 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mb-4 group-hover/item:scale-110 transition-transform`}>
                <step.icon size={24} />
              </div>
              
              <h4 className="text-white font-bold text-sm mb-2 tracking-tight">{step.title}</h4>
              <p className="text-[#5a6a85] text-[11px] leading-relaxed font-medium">
                {step.desc}
              </p>

              {activeStep === step.id && (
                <motion.div 
                  layoutId="step-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-[#ff6b35] rounded-t-full" 
                />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1a2235] bg-gradient-to-br from-slate-700 to-slate-900" />
                 ))}
                 <div className="w-8 h-8 rounded-full border-2 border-[#1a2235] bg-[#ff6b35] flex items-center justify-center text-[10px] font-black text-white">
                    +42
                 </div>
              </div>
              <p className="text-[10px] font-black uppercase text-[#5a6a85] tracking-widest">
                 Вже підключились сьогодні
              </p>
           </div>

           <button 
             onClick={() => toast.success('Система готова до роботи. Розпочнемо!')}
             className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ff6b35] hover:text-white transition-all shadow-xl active:scale-95"
           >
              Почати роботу <Zap size={14} />
           </button>
        </div>
      </div>
    </div>
  );
}
