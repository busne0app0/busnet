import React, { useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const { t } = useLanguage();
  const [active, setActive] = useState(0);

  // Визначаємо, яка картка зараз найближча до центру стрічки (для крапок)
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement;
      const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActive(closest);
  };

  const scrollToCard = (index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - 12, behavior: 'smooth' });
  };

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
    <section className="relative pt-4 sm:pt-6 pb-12 sm:pb-24 px-3 sm:px-4 max-w-7xl mx-auto z-10 overflow-hidden -mt-4 sm:-mt-12">
      {/* Заголовок */}
      <div className="text-center mb-8 sm:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 border border-white/10 text-neon-cyan text-xs sm:text-sm font-medium mb-3 sm:mb-4"
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
          className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight italic"
        >
          {t.advantages.title} <span className="neon-gradient-text not-italic inline-block">{t.advantages.titleAccent}</span>
        </motion.h2>
      </div>

      {/* Телефон: свайп-стрічка з прив'язкою. Від md: звичайна сітка */}
      <motion.div
        ref={containerRef}
        onScroll={handleScroll}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="relative flex overflow-x-auto snap-x snap-mandatory scroll-pl-3 gap-3.5 -mx-3 px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible md:snap-none"
      >
        {t.advantages.items.map((item: any, index: number) => {
          const Icon = ICON_MAP[index];
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`shrink-0 w-[80vw] max-w-[320px] snap-start md:w-auto md:max-w-none md:shrink ${COL_SPANS[index]}`}
            >
              <SpotlightCard className="h-full group cursor-default">

                {/* Іконка з неоновим світінням */}
                <div className="mb-4 sm:mb-6 relative inline-block">
                  <div className="absolute inset-0 bg-neon-cyan blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                  <div className="relative bg-white/5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/10 group-hover:border-neon-cyan/50 transition-colors">
                    <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-neon-cyan" />
                  </div>
                </div>

                {/* Текст */}
                <h3 className="text-lg sm:text-2xl font-black text-white mb-1 uppercase tracking-tight">
                  {item.title}
                </h3>
                <p className="text-neon-cyan font-black text-[10px] mb-2 sm:mb-3 uppercase tracking-[0.15em]">
                  {item.subtitle}
                </p>
                <p className="text-slate-300 leading-relaxed text-xs sm:text-sm group-hover:text-white transition-colors">
                  {item.desc}
                </p>

              </SpotlightCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Крапки-індикатор (тільки телефон) */}
      <div className="md:hidden flex justify-center items-center gap-2 mt-4">
        {t.advantages.items.map((_: any, index: number) => (
          <button
            key={index}
            type="button"
            aria-label={`${index + 1} / ${t.advantages.items.length}`}
            onClick={() => scrollToCard(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${active === index ? 'w-6 bg-neon-cyan' : 'w-1.5 bg-white/20'
              }`}
          />
        ))}
      </div>
    </section>
  );
};