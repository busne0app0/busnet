import React from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

const ICON_MAP = [Users, Globe, ShieldCheck, Zap];
const COLORS = ['text-blue-400', 'text-violet-400', 'text-fuchsia-400', 'text-cyan-400'];

export const AboutSection = () => {
  const { t } = useLanguage();

  return (
    <section className="pt-2 pb-24 relative overflow-hidden w-full -mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Візуал: Фото з градієнтом */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative w-full lg:w-1/2"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
              {/* Основне зображення: Нічний футуристичний автобус */}
              <img 
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2000" 
                alt="Busnet Futuristic Journey" 
                referrerPolicy="no-referrer"
                className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
              />
              {/* Накладений градієнт для розчинення у фоні */}
              <div className="absolute inset-0 bg-gradient-to-t from-busnet-bg via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-busnet-bg/50 via-transparent to-transparent"></div>
              
              {/* Плашка поверх фото */}
              <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 p-4 sm:p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl max-w-xs transition-transform group-hover:scale-[1.02]">
                <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed">
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
              className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 leading-tight uppercase tracking-tight italic pr-4"
            >
              {t.about.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-fuchsia-400 not-italic inline-block pr-6 uppercase">{t.about.titleAccent}</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-base sm:text-lg mb-10 leading-relaxed"
            >
              {t.about.desc}
            </motion.p>

            {/* Сітка статистики */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
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
                    className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-neon-cyan/30 transition-all group"
                  >
                    <Icon className={`${color} mb-3 group-hover:scale-110 transition-transform`} size={28} />
                    <div className="text-xl sm:text-2xl font-black text-white mb-1 uppercase tracking-tight">{item.value}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">{item.label}</div>
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
