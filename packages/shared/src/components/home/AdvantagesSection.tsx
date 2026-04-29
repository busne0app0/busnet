import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Rocket, Wallet, ShieldCheck, Smartphone, TicketPercent, BotMessageSquare } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

const ICON_MAP = [Rocket, Wallet, ShieldCheck, Smartphone, TicketPercent, BotMessageSquare];
const COL_SPANS = [
  "md:col-span-2 lg:col-span-1",
  "col-span-1",
  "col-span-1",
  "col-span-1",
  "col-span-1",
  "md:col-span-2 lg:col-span-1"
];

export const AdvantagesSection = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 20 }
    }
  };

  return (
    <section className="relative pt-6 pb-24 px-4 max-w-7xl mx-auto z-10 overflow-hidden -mt-12">
      {/* Заголовок */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-neon-cyan text-sm font-medium mb-4"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
          </span>
          {t.advantages.badge}
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-black uppercase tracking-tight italic pr-4"
        >
          {t.advantages.title} <span className="neon-gradient-text not-italic inline-block pr-6">{t.advantages.titleAccent}</span>
        </motion.h2>
      </div>

      {/* Сітка карток */}
      <motion.div 
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {t.advantages.items.map((item: any, index: number) => {
          const Icon = ICON_MAP[index];
          return (
            <motion.div key={index} variants={itemVariants} className={COL_SPANS[index]}>
              <SpotlightCard className="h-full group cursor-default">
                
                {/* Іконка з неоновим світінням */}
                <div className="mb-6 relative inline-block">
                  <div className="absolute inset-0 bg-neon-cyan blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                  <div className="relative bg-black/50 p-4 rounded-2xl border border-white/10 group-hover:border-neon-cyan/50 transition-colors">
                    <Icon className="w-8 h-8 text-neon-cyan" />
                  </div>
                </div>

                {/* Текст */}
                <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-normal pr-2">
                  {item.title}
                </h3>
                <p className="text-neon-cyan font-black text-[10px] mb-4 uppercase tracking-[0.2em]">
                  {item.subtitle}
                </p>
                <p className="text-slate-400 leading-relaxed text-sm group-hover:text-slate-200 transition-colors">
                  {item.desc}
                </p>

              </SpotlightCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
