import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { Check, Copy, LayoutDashboard, Key, Mail, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Step3Success() {
  const { mainContact, tempPassword } = useBookingStore();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 py-10">
      <div className="text-center relative">
        <motion.div
           initial={{ scale: 0, rotate: -45 }}
           animate={{ scale: 1, rotate: 0 }}
           transition={{ type: 'spring', damping: 10 }}
           className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6"
        >
           <Check size={48} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">
            Вітаємо в <span className="text-cyan-400 not-italic inline-block pr-4 holographic-text">Busnet!</span>
          </h3>
          <p className="text-slate-400 font-medium">Ваше бронювання підтверджено. Ми створили для вас кабінет.</p>
        </motion.div>
        
        {/* Decorative particles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-50">
           <Sparkles className="absolute left-[30%] top-0 text-cyan-400/30 animate-pulse" size={40} />
           <Sparkles className="absolute right-[30%] bottom-0 text-violet-400/30 animate-pulse" size={30} />
        </div>
      </div>

      <div className="max-w-md mx-auto p-1 bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        <div className="p-8 bg-[#0D111C]/90 backdrop-blur-3xl rounded-[30px] border border-white/5 space-y-8">
           <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                  <Mail size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Ваш Логін</p>
                  <p className="text-lg font-bold text-white tracking-tight">{mainContact.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
                  <Key size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Тимчасовий Пароль</p>
                  <p className="text-lg font-mono font-bold text-white tracking-[0.2em]">{tempPassword}</p>
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-cyan-400"
                >
                  {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                </button>
              </div>
           </div>

           <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-center">
              <p className="text-[10px] text-rose-300 font-black uppercase tracking-widest">⚠️ Порада безпеки</p>
              <p className="text-[11px] text-rose-200/60 mt-1">Змініть цей пароль в особистому кабінеті після входу.</p>
           </div>

           <button 
             onClick={() => navigate('/dashboard')}
             className="w-full py-5 neon-gradient-btn rounded-2xl text-base font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-[0_20px_40px_rgba(0,192,255,0.3)] group"
           >
             <LayoutDashboard size={20} className="group-hover:rotate-12 transition-transform" />
             Перейти до кабінету
           </button>
        </div>
      </div>


    </div>
  );
}
