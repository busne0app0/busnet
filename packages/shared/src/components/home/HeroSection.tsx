import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import NeuralGlobe from '../ui/NeuralGlobe';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

export default function HeroSection() {
  const { setSearchParams, setTriggerSearch } = useSearch();
  const { t } = useLanguage();

  const suggestions = [
    { text: `${t.hero.cityKyiv} → ${t.hero.cityWarsaw}`, from: t.hero.cityKyiv, to: t.hero.cityWarsaw, detail: '1200₴', label: t.hero.suggestCheapest },
    { text: `${t.hero.cityLviv} → ${t.hero.cityBerlin}`, from: t.hero.cityLviv, to: t.hero.cityBerlin, detail: t.hero.suggestAiChoice, label: t.hero.suggestToday },
    { text: `${t.hero.cityOdesa} → ${t.hero.cityPrague}`, from: t.hero.cityOdesa, to: t.hero.cityPrague, detail: '1500₴', label: t.hero.suggestFastest }
  ];

  const handleSuggestionClick = (from: string, to: string) => {
    const today = new Date().toISOString().split('T')[0];
    setSearchParams({ from, to, date: today });
    setTriggerSearch(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.6
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="w-full relative min-h-[500px] flex flex-col items-center justify-center pt-12 pb-8 px-4 overflow-hidden">
      <NeuralGlobe />
      
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          {/* Нейронний бейдж */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neural-badge flex items-center gap-2 px-4 py-2 rounded-full bg-[#0d5978]/60 border border-blue-500/20 backdrop-blur-md"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00d4ff]"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-[0.1em]">
              {t.header.bookingBadge}
            </span>
          </motion.div>
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0, 0.71, 0.2, 1.01] }}
          className="text-[10vw] xs:text-[12vw] sm:text-8xl md:text-[110px] font-black leading-[0.9] text-center mb-6 tracking-tight px-2 holographic-depth-effect"
        >
          <span className="holographic-text pr-8">
            BUSNET UA
          </span>
        </motion.h1>
        
        {/* Анімований підзаголовок */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="flex flex-col items-center gap-2 mb-8"
        >
          <p className="text-slate-300 text-lg md:text-2xl font-light italic text-center max-w-2xl px-4">
            {t.hero.subtitle}
          </p>
        </motion.div>

        {/* AI Smart Suggest (Staggered Children) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4"
        >
          {suggestions.map((item, idx) => (
            <motion.button 
              key={idx}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleSuggestionClick(item.from, item.to)}
              className="group text-[10px] sm:text-xs px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-neon-cyan/50 transition-all flex flex-col items-center sm:items-start gap-0.5 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-neon-cyan group-hover:animate-pulse" />
                <span className="font-bold">{item.text}</span>
              </div>
              <div className="flex items-center gap-2 opacity-50 text-[9px] sm:text-[10px]">
                <span>{item.detail}</span>
                <span className="px-1 py-0.2 rounded bg-neon-cyan/20 text-neon-cyan font-black uppercase text-[8px] sm:text-[9px]">
                  {item.label}
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
