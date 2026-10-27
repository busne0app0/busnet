import React from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

const ICON_MAP = [Users, Globe, ShieldCheck, Zap];
const COLORS = ['text-blue-400', 'text-violet-400', 'text-fuchsia-400', 'text-cyan-400'];

export const AboutSection = () => {
  const { t } = useLanguage();

  return (
    <section className="pt-2 pb-14 sm:pb-24 relative overflow-hidden w-full -mt-4 sm:-mt-12 lg:-mt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
          
          {/* Візуал: Фото з градієнтом */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative w-full lg:w-1/2"
          >
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
              {/* Основне зображення: Нічний футуристичний автобус */}
              <img 
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2000" 
                alt="Busnet Futuristic Journey" 
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-[240px] sm:h-[400px] lg:h-[500px] object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
              />
              {/* Накладений градієнт для розчинення у фоні */}
              <div className="absolute inset-0 bg-gradient-to-t from-busnet-bg via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-busnet-bg/50 via-transparent to-transparent"></div>
              
              {/* Плашка поверх фото */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-8 sm:left-8 p-3.5 sm:p-6 bg-slate-950/85 backdrop-blur-xl border border-white/15 rounded-xl sm:rounded-2xl max-w-sm transition-transform group-hover:scale-[1.02]">
                <p className="text-xs sm:text-sm text-slate-200 not-italic sm:italic font-medium leading-relaxed">
                  {t.about.quote}
                </p>
              </div>
            </div>
            
            {/* Декоративне свічення на фоні фото */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
          </motion.div>

          {/* Контентна частина */}
          <div className="w-full lg:w-1/2">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 leading-tight uppercase tracking-tight italic"
            >
              {t.about.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-fuchsia-400 not-italic inline-block uppercase">{t.about.titleAccent}</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-sm sm:text-lg mb-6 sm:mb-10 leading-relaxed"
            >
              {t.about.desc}
            </motion.p>

            {/* Сітка статистики */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {t.about.stats.map((item: any, index: number) => {
                const Icon = ICON_MAP[index];
                const color = COLORS[index];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/30 transition-all group"
                  >
                    <Icon className={`${color} mb-2 sm:mb-3 group-hover:scale-110 transition-transform w-5 h-5 sm:w-7 sm:h-7`} />
                    <div className="text-lg sm:text-2xl font-black text-white mb-0.5 sm:mb-1 uppercase tracking-tight">{item.value}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-bold">{item.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
