import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cookie, X } from 'lucide-react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('busnet_cookie_consent');
      if (!consent) {
        // Показуємо банер через невелику затримку для кращого UX
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // LocalStorage недоступний (incognito тощо)
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('busnet_cookie_consent', 'granted');
    } catch (e) {}

    // Оновлення статусів у Google Consent Mode v2
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      });
    }

    setIsVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('busnet_cookie_consent', 'denied');
    } catch (e) {}

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      });
    }

    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto"
        >
          <div className="bg-[#0b1323]/95 backdrop-blur-xl border border-neon-cyan/30 rounded-2xl p-5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] shadow-cyan-950/40 relative">
            {/* Кнопка закриття (відхилення) */}
            <button
              type="button"
              onClick={handleDecline}
              aria-label="Закрити"
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              <div className="p-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan shrink-0">
                <Cookie className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white text-sm font-bold flex items-center gap-2">
                  Файли cookie та приватність
                  <ShieldCheck className="w-4 h-4 text-neon-cyan inline" />
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Ми використовуємо файли cookie відповідно до норм ePrivacy та GDPR ЄС для аналітики та покращення роботи сервісу квитків Україна — Італія.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 py-2 px-3 rounded-xl bg-neon-cyan hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,229,255,0.25)] text-center cursor-pointer"
              >
                Прийняти всі
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors border border-white/5 text-center cursor-pointer"
              >
                Тільки необхідні
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;

