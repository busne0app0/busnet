import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Ticket, ShieldCheck, MapPin, Zap, Download, Share, PlusSquare } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { usePwaInstall } from '@busnet/shared/hooks/usePwaInstall';

export const AppEcoSection = () => {
  const { t } = useLanguage();
  const { isInstallable, isIOS, isInstalled, promptInstall } = usePwaInstall();

  const [hint, setHint] = useState<null | 'ios' | 'manual' | 'inapp'>(null);

  const isInApp = typeof navigator !== 'undefined' &&
    /FBAN|FBAV|Instagram|Line\/|MicroMessenger/i.test(navigator.userAgent);

  // Close modal on Escape
  useEffect(() => {
    if (!hint) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHint(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hint]);

  const handleInstallClick = async () => {
    if (isInstalled) return;
    if (isInApp) {
      setHint('inapp');
      return;
    }
    if (isInstallable) {
      await promptInstall();
      return;
    }
    setHint(isIOS ? 'ios' : 'manual');
  };

  const ticketDetails = [
    { text: t.appEco.ticketName, icon: Ticket, color: 'text-cyan-400' },
    { text: t.appEco.ticketBus, icon: ShieldCheck, color: 'text-violet-400' },
    { text: t.appEco.ticketRoute, icon: MapPin, color: 'text-fuchsia-400' },
    { text: t.appEco.ticketTime, icon: Zap, color: 'text-blue-400' },
  ];

  return (
    <section className="py-12 sm:py-24 relative isolate overflow-hidden w-full selection:bg-cyan-500/20">
      {/* Static background radial glow (eliminates 1400px continuous blur repaints) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(60% 50% at 50% 50%, rgba(6,182,212,.10), rgba(139,92,246,.06) 50%, transparent 75%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-14 lg:gap-20">

          {/* Left Content Area */}
          <div className="w-full lg:w-3/5 text-center lg:text-left">
            <div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 leading-tight tracking-tight uppercase">
                {t.appEco.title} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 pb-[0.12em] inline-block">
                  {t.appEco.titleAccent}
                </span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base md:text-lg mb-6 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t.appEco.desc}
              </p>

              <div className="flex flex-col sm:flex-row gap-5 items-center justify-center lg:justify-start">
                {/* Install Button */}
                <div className="w-full sm:w-auto min-w-[240px]">
                  <motion.button
                    type="button"
                    disabled={isInstalled}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleInstallClick}
                    className="group flex items-center justify-center sm:justify-start gap-4 min-h-14 py-4 px-6 sm:px-8 bg-black/70 rounded-2xl border border-white/10 hover:border-cyan-400/50 transition-colors w-full disabled:opacity-60 disabled:cursor-default"
                  >
                    {isIOS ? (
                      <Apple size={30} strokeWidth={1.5} className="text-white group-hover:text-cyan-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <Download size={30} strokeWidth={1.5} className="text-white group-hover:text-cyan-400 shrink-0" aria-hidden="true" />
                    )}
                    <div className="text-left">
                      <div className="text-[11px] text-slate-400 uppercase tracking-widest">
                        {t.appEco.btnInstallPwa}
                      </div>
                      <div className="text-base sm:text-lg font-black text-white">
                        {isInstalled ? t.appEco.btnInstalled : t.appEco.btnInstallMain}
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* QR code block on desktop */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hidden lg:flex flex-col items-center gap-2 text-center shrink-0">
                  <div className="p-1.5 bg-black rounded-xl border border-neon-cyan/40">
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? window.location.origin : 'https://busnet.ua'}
                      size={68}
                      bgColor="#000000"
                      fgColor="#00d4ff"
                    />
                  </div>
                  <p className="text-[11px] text-neon-cyan font-bold uppercase tracking-wider max-w-[100px]">
                    {t.appEco.scanText}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Area: Mobile Phone Mockup (aria-hidden for screenreaders as it is decorative demo) */}
          <div className="w-full lg:w-2/5 flex items-center justify-center">
            <div
              aria-hidden="true"
              className="relative rounded-[2.5rem] sm:rounded-[3.25rem] bg-black border-[10px] sm:border-[12px] border-black shadow-[0_0_80px_rgba(6,182,212,0.12)] w-full max-w-[260px] sm:max-w-[300px] overflow-hidden group"
            >
              {/* Screen background */}
              <div className="absolute inset-0 bg-[#020617]" />

              {/* Screen content */}
              <div className="relative z-10 p-5 sm:p-6 flex flex-col h-full">
                {/* Header inside phone */}
                <div className="flex items-center gap-3 mb-6 sm:mb-8 border-b border-cyan-400/20 pb-4">
                  <div className="w-10 h-10 bg-black/60 border border-neon-cyan rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                    <Ticket className="text-neon-cyan" size={20} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-[10px] text-neon-cyan font-black uppercase tracking-wider">{t.appEco.phoneTitle}</div>
                    <div className="text-xl font-black text-white italic tracking-tighter truncate">{t.appEco.phoneLogo}</div>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="flex flex-col gap-3.5 mb-6 sm:mb-8 text-left">
                  {ticketDetails.map((item, index) => (
                    <div key={index} className="flex items-center gap-2.5">
                      <item.icon className={`${item.color} shrink-0`} size={15} />
                      <span className="text-slate-300 text-xs sm:text-sm font-medium truncate">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Boarding QR */}
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-black/50 border border-white/5">
                  <div className="p-2 bg-black rounded-xl border border-neon-cyan/50">
                    <QRCodeSVG
                      value={typeof window !== 'undefined' ? `${window.location.origin}/ticket/demo` : 'https://busnet.ua'}
                      size={80}
                      bgColor="#000000"
                      fgColor="#00d4ff"
                    />
                  </div>
                  <div className="text-[11px] text-neon-cyan uppercase tracking-wider font-bold text-center">
                    {t.appEco.qrTitle}
                  </div>
                </div>

                {/* Price */}
                <div className="mt-5 pt-4 border-t border-cyan-400/20 text-center">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">{t.appEco.priceTitle}</span>
                  <p className="text-2xl font-black text-neon-cyan tracking-tight mt-0.5">
                    {t.appEco.price}
                  </p>
                </div>
              </div>

              {/* Decorative top phone bezel line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-transparent to-fuchsia-500 shadow-[0_0_12px_rgba(6,182,212,0.5)] z-20" />
            </div>
          </div>

        </div>
      </div>

      {/* Accessible Install Instruction Modal (replaces native alert and unstyled overlay) */}
      <AnimatePresence>
        {hint && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHint(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="install-hint-title"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-3xl bg-[#0f172a] border border-white/15 p-6 text-center shadow-2xl"
            >
              <h3 id="install-hint-title" className="text-xl font-black text-white mb-3">
                {hint === 'ios'
                  ? t.appEco.iosHintTitle
                  : hint === 'inapp'
                    ? t.appEco.inAppTitle
                    : t.appEco.manualTitle}
              </h3>

              {hint === 'ios' && (
                <ul className="flex flex-col gap-3 text-left text-sm text-slate-200 my-4">
                  <li className="flex items-center gap-3 bg-black/40 p-3.5 rounded-2xl border border-white/5">
                    <Share className="text-cyan-400 shrink-0" size={20} aria-hidden="true" />
                    <span>{t.appEco.iosHintStep1}</span>
                  </li>
                  <li className="flex items-center gap-3 bg-black/40 p-3.5 rounded-2xl border border-white/5">
                    <PlusSquare className="text-cyan-400 shrink-0" size={20} aria-hidden="true" />
                    <span>{t.appEco.iosHintStep2}</span>
                  </li>
                </ul>
              )}

              {hint === 'inapp' && (
                <p className="text-sm text-slate-300 my-4 leading-relaxed">
                  {t.appEco.inAppText}
                </p>
              )}

              {hint === 'manual' && (
                <p className="text-sm text-slate-300 my-4 leading-relaxed">
                  {t.appEco.manualText}
                </p>
              )}

              <button
                type="button"
                onClick={() => setHint(null)}
                className="mt-4 w-full min-h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
              >
                {t.appEco.iosHintGotIt}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
