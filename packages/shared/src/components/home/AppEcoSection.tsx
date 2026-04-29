import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Play, Ticket, ShieldCheck, MapPin, Zap, X, User, Briefcase, Building2, Download, Share, PlusSquare } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { usePwaInstall } from '@busnet/shared/hooks/usePwaInstall';

export const AppEcoSection = () => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const { isInstallable, isIOS, isInstalled, promptInstall } = usePwaInstall();

  const ticketDetails = [
    { text: t.appEco.ticketName, icon: Ticket, color: 'text-cyan-400' },
    { text: t.appEco.ticketBus, icon: ShieldCheck, color: 'text-violet-400' },
    { text: t.appEco.ticketRoute, icon: MapPin, color: 'text-fuchsia-400' },
    { text: t.appEco.ticketTime, icon: Zap, color: 'text-blue-400' },
  ];

  const handleInstallClick = () => {
    if (isInstallable) {
      // Android / Chrome - Show native prompt via our custom button
      promptInstall();
    } else if (isIOS) {
      // Show Apple-specific instruction overlay
      setShowIosHint(true);
    } else if (!isInstalled && window.innerWidth > 1024) {
      alert('Для встановлення додатка на комп\'ютері, знайдіть та натисніть іконку встановлення (дисплей зі стрілочкою) в адресному рядку браузера праворуч.');
    } else {
      // If neither is true (e.g. desktop non-chrome or already installed), open the modules modal
      setIsModalOpen(true);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden w-full selection:bg-cyan-500/20">
      
      {/* Глибокий фоновий декор 2026 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] rounded-full bg-gradient-to-r from-cyan-600/10 via-violet-600/10 to-fuchsia-600/10 blur-[180px] -z-10 animate-pulse"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Контентна частина (зліва на десктопі) */}
          <div className="w-full lg:w-3/5">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight tracking-tight uppercase italic pr-6">
                {t.appEco.title} <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 shadow-cyan-500/50 not-italic inline-block pr-6">
                  {t.appEco.titleAccent}
                </span>
              </h2>
              
              <p className="text-slate-400 text-lg md:text-xl mb-12 leading-relaxed max-w-2xl">
                {t.appEco.desc}
              </p>

              <div className="flex flex-col sm:flex-row gap-6 items-center lg:items-start lg:justify-start">
                
                {/* Кнопки завантаження */}
                <div className="flex flex-col gap-5 w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInstallClick}
                    className="group flex items-center justify-center sm:justify-start gap-4 py-4 px-8 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300 w-full text-center"
                  >
                    {isIOS ? (
                      <Apple className="text-white group-hover:text-cyan-400" size={36} strokeWidth={1} />
                    ) : (
                      <Download className="text-white group-hover:text-cyan-400" size={36} strokeWidth={1} />
                    )}
                    <div className="text-left">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest group-hover:text-cyan-200">
                        {isInstalled ? t.appEco.btnInstalled : t.appEco.btnInstallPwa}
                      </div>
                      <div className="text-lg font-black text-white tracking-tight group-hover:text-cyan-50 pr-4">
                        {t.appEco.btnInstallMain}
                      </div>
                    </div>
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                    className="group flex items-center justify-center sm:justify-start gap-4 py-4 px-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 hover:border-violet-400/30 transition-all duration-300 w-full text-center"
                  >
                    <Building2 className="text-slate-400 group-hover:text-violet-400 cursor-pointer" size={24} strokeWidth={1.5} />
                    <div className="text-left">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">{t.appEco.btnEcoSys}</div>
                      <div className="text-sm font-bold text-slate-300 tracking-tighter">{t.appEco.btnEcoModules}</div>
                    </div>
                  </motion.button>
                </div>

                {/* QR-код блок */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.03 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group hover:border-cyan-400/50 hover:shadow-[0_0_60px_rgba(6,182,212,0.1)] transition-all flex flex-col items-center justify-center gap-4 text-center sm:ml-6 hidden lg:flex"
                >
                  <div className="relative w-24 h-24 p-2 bg-black rounded-2xl border-2 border-neon-cyan group-hover:animate-pulse">
                     <div className="absolute inset-0 bg-neon-cyan/20 blur-lg animate-pulse" />
                     <QRCodeSVG value={window.location.origin} size={76} bgColor="#000000" fgColor="#00d4ff" className="relative z-10" />
                  </div>
                  <p className="text-[10px] text-neon-cyan font-black max-w-[120px] uppercase tracking-widest">
                    {t.appEco.scanText}
                  </p>
                </motion.div>

              </div>
            </motion.div>
          </div>

          {/* Візуальна частина: Смартфон Мокап */}
          <motion.div 
            initial={{ opacity: 0, x: 50, rotate: 5 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            whileHover={{ rotate: -2, y: -10 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, type: "spring", stiffness: 70 }}
            className="w-full lg:w-2/5 flex items-center justify-center"
          >
            <div className="relative p-2 rounded-[3.5rem] bg-black border-[12px] border-black shadow-[0_0_120px_rgba(6,182,212,0.15)] aspect-[9/19.5] w-[300px] sm:w-[320px] lg:w-full max-w-[360px] overflow-hidden group">
              
              {/* Ефект Glassmorphism на екрані квитка */}
              <div className="absolute top-0 left-0 w-full h-full bg-[#020617]/90 backdrop-blur-3xl z-0"></div>
              
              {/* Контент Квитка у Смартфоні */}
              <div className="relative z-10 p-8 flex flex-col h-full">
                
                {/* Лого + Заголовок */}
                <div className="flex items-center gap-3 mb-10 border-b border-cyan-400/20 pb-6">
                  <div className="w-12 h-12 bg-black/50 border border-neon-cyan rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <Ticket className="text-neon-cyan" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-[9px] text-neon-cyan font-black uppercase tracking-widest">{t.appEco.phoneTitle}</div>
                    <div className="text-2xl font-black text-white italic tracking-tighter">{t.appEco.phoneLogo}</div>
                  </div>
                </div>

                {/* Деталі Квитка */}
                <div className="flex flex-col gap-6 mb-12">
                  {ticketDetails.map((item, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <item.icon className={`${item.color}`} size={16} />
                      <span className="text-slate-300 text-sm font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* QR Посадки */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.1, type: "spring" }}
                  className="flex-1 flex flex-col items-center justify-center gap-5 p-6 rounded-3xl bg-black/40 border border-white/5 group-hover:border-neon-cyan transition-all shadow-[inset_0_0_30px_rgba(6,182,212,0.05)]"
                >
                  <div className="relative w-28 h-28 p-3 bg-black rounded-2xl border-2 border-neon-cyan">
                    <div className="absolute inset-0 bg-neon-cyan/10 blur-md animate-pulse" />
                    <QRCodeSVG value={window.location.origin + '/ticket/demo-123'} size={84} bgColor="#000000" fgColor="#00d4ff" className="relative z-10" />
                  </div>
                  <div className="text-[10px] text-neon-cyan uppercase tracking-widest font-black text-center">
                    {t.appEco.qrTitle}
                  </div>
                </motion.div>
                
                {/* Ціна */}
                <div className="mt-8 pt-6 border-t border-cyan-400/20 text-center">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{t.appEco.priceTitle}</span>
                  <p className="text-3xl font-black neon-gradient-text tracking-tighter">
                    {t.appEco.price}
                  </p>
                </div>
              </div>

              {/* Декоративне свічення вгорі телефону */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-transparent to-fuchsia-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] z-20"></div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* iOS Special Instruction Overlay */}
      <AnimatePresence>
        {showIosHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIosHint(false)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex flex-col items-center justify-end pb-12 px-6"
          >
            <div className="max-w-sm w-full bg-white/10 border border-white/20 rounded-3xl p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 blur-[50px] -z-10" />
               <Apple size={48} className="mx-auto text-white mb-6" />
               <h3 className="text-2xl font-black text-white mb-4 tracking-tighter">{t.appEco.iosHintTitle}</h3>
               <p className="text-slate-300 mb-8 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.appEco.iosHintText }} />
               
               <div className="flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                     <Share className="text-cyan-400 shrink-0" size={24} />
                     <span className="text-sm text-slate-200" dangerouslySetInnerHTML={{ __html: t.appEco.iosHintStep1 }} />
                  </div>
                  <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                     <PlusSquare className="text-cyan-400 shrink-0" size={24} />
                     <span className="text-sm text-slate-200" dangerouslySetInnerHTML={{ __html: t.appEco.iosHintStep2 }} />
                  </div>
               </div>

               <button 
                 onClick={() => setShowIosHint(false)}
                 className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
               >
                 {t.appEco.iosHintGotIt}
               </button>
            </div>
            
            {/* Анімована стрілка вниз для iOS */}
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mt-8"
            >
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M12 5v14M19 12l-7 7-7-7"/>
               </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0f172a]/95 border border-white/10 rounded-3xl p-8 shadow-2xl glassmorphism"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                title="Закрити"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter text-white">{t.appEco.modulesModalTitle}</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {t.appEco.modulesModalText}
              </p>

              <div className="flex flex-col gap-3">
                <a href="/" className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all">
                  <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tighter">Passenger App</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">/</div>
                  </div>
                </a>

                <a href="/carrier" className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all">
                  <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center shrink-0">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors tracking-tighter">Carrier CRM</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">/carrier</div>
                  </div>
                </a>

                <a href="/driver" className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-green-500/50 hover:bg-green-500/10 transition-all">
                  <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center shrink-0">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white group-hover:text-green-400 transition-colors tracking-tighter">Driver App</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">/driver</div>
                  </div>
                </a>

                <a href="/agent" className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all">
                  <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors tracking-tighter">Agent Portal</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">/agent</div>
                  </div>
                </a>
                
                <a href="/admin" className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-teal-500/50 hover:bg-teal-500/10 transition-all">
                  <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors tracking-tighter">Admin Control</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">/admin</div>
                  </div>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
