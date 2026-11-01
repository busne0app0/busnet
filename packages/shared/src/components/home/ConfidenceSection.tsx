import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Headphones, RotateCcw } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

const ICON_MAP: Record<string, any> = {
  shield: ShieldCheck,
  support: Headphones,
  refund: RotateCcw
};

export const ConfidenceSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-8 sm:py-24 relative overflow-hidden w-full bg-[#0a0f1a]/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight italic text-white pr-4"
          >
            {t.confidence.title} <span className="neon-gradient-text not-italic inline-block pr-6 uppercase">{t.confidence.titleAccent}</span>
          </motion.h2>
        </div>

        {/* Телефон: компактні горизонтальні рядки. Від md: три великі картки як раніше */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8">
          {t.confidence.items.map((item: any, idx: number) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 p-4 text-left rounded-2xl md:block md:p-8 md:rounded-[2rem] md:text-center bg-white/5 border border-white/10 hover:border-neon-cyan/30 transition-all group cursor-default"
              >
                <div className="w-12 h-12 shrink-0 rounded-xl md:w-16 md:h-16 md:rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center md:mx-auto md:mb-6 group-hover:scale-110 group-hover:border-neon-cyan/50 transition-all shadow-xl">
                  <Icon className="text-neon-cyan w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-xl font-black text-white mb-1 md:mb-3 uppercase tracking-normal italic pr-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};