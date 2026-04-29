import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Bus, ArrowRight, Clock, Wallet, Sparkles } from 'lucide-react';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { slowMotionScroll } from '@busnet/shared/lib/scrollUtils';

// Визначаємо типи для рейсів
interface Destination {
  id: number;
  from: string;
  to: string;
  price: string;
  time: string;
  color: 'cyan' | 'magenta' | 'blue' | 'purple';
  accentColor: string;
}

const DESTINATIONS: Destination[] = [
  { id: 1, from: 'Київ', to: 'Варшава', price: '1200₴', time: '4 год 12 хв', color: 'cyan', accentColor: '#00D4FF' },
  { id: 2, from: 'Львів', to: 'Берлін', price: '1200₴', time: '4 год 12 хв', color: 'magenta', accentColor: '#e879f9' },
  { id: 3, from: 'Одеса', to: 'Прага', price: '1200₴', time: '4 год 12 хв', color: 'blue', accentColor: '#3b82f6' },
  { id: 4, from: 'Дніпро', to: 'Відень', price: '1500₴', time: '4 год 12 хв', color: 'purple', accentColor: '#8b5cf6' },
  { id: 5, from: 'Вінниця', to: 'Париж', price: '2100₴', time: '12 год 30 хв', color: 'cyan', accentColor: '#00D4FF' },
];

const DestinationCard = ({ item, onClick }: { item: Destination; onClick: (from: string, to: string) => void }) => {
  const { t } = useLanguage();
  // Налаштування 3D-нахилу (Tilt effect)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(item.from, item.to)}
      className="relative w-[85vw] min-w-[280px] max-w-[340px] h-[220px] sm:w-auto sm:min-w-[340px] cursor-pointer group shrink-0 snap-center"
    >
      {/* Скляний фон (Glassmorphism) */}
      <div className="absolute inset-0 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transition-all group-hover:bg-white/10 group-hover:border-white/20" />

      {/* Нейронне свічення */}
      <div 
        className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500" 
        style={{ background: `radial-gradient(circle at center, ${item.accentColor}, transparent)` }}
      />

      <div className="relative p-6 h-full flex flex-col justify-between z-10" style={{ transform: 'translateZ(50px)' }}>
        {/* Хедер карточки */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-neon-cyan opacity-50" />
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{t.popular.premium}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
              {item.from} <ArrowRight size={18} className="text-neon-cyan opacity-40 group-hover:translate-x-1 transition-transform" /> {item.to}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:border-neon-cyan/30 transition-colors">
            <Bus className="text-neon-cyan" size={24} />
          </div>
        </div>

        {/* Голографічна лінія маршруту */}
        <div className="relative h-14 my-2">
          <svg className="w-full h-full overflow-visible">
            <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
            <motion.path
              d="M 20 30 Q 160 -10 300 30"
              fill="none"
              stroke={item.accentColor}
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              whileHover={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]"
            />
            <circle cx="5%" cy="50%" r="3" className="fill-white/20" />
            <motion.circle 
              cx="95%" cy="50%" r="4" 
              className="fill-neon-cyan" 
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        </div>

        {/* Футер карточки */}
        <div className="flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{t.popular.priceFrom}</span>
            <div className="flex items-center gap-2 text-white font-black text-xl italic pr-2">
              <Wallet size={16} className="text-neon-cyan" />
              <span>{item.price}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            <Clock size={14} className="text-neon-cyan" />
            <span className="text-xs font-bold">{item.time}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function PopularDestinations() {
  const { setSearchParams, setHighlightDate } = useSearch();
  const { t } = useLanguage();

  const handleCardClick = (from: string, to: string) => {
    // 1. Slow Motion Scroll up to the form
    slowMotionScroll(0, 1000);
    
    // 2. Update search params (default date to today if empty)
    const today = new Date().toISOString().split('T')[0];
    setSearchParams({ from, to, date: today });
    
    // 3. Highlight date field after scroll starts
    setTimeout(() => {
      setHighlightDate(true);
      
      // We skip manual dateInput?.focus() because it causes unwanted selection of 'dd' format
      // The neon pulse glow is sufficient to guide the user's attention.

      // Reset highlight after duration
      setTimeout(() => setHighlightDate(false), 2000);
    }, 600);
  };

  return (
    <section className="pt-24 pb-12 relative overflow-hidden w-full text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
        {/* Заголовок секції */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-14 pr-4"
        >
          <div className="flex items-center gap-3 mb-4">
             <div className="h-[2px] w-12 bg-neon-cyan shadow-[0_0_10px_#00D4FF]" />
             <span className="text-neon-cyan font-black text-[10px] uppercase tracking-[0.4em]">{t.popular.badge}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase italic leading-[1.1] pr-10">
            {t.popular.title} <span className="neon-gradient-text uppercase not-italic inline-block pr-6">{t.popular.titleAccent}</span>
          </h2>
        </motion.div>

        {/* Контейнер зі скроллом */}
        <div className="flex gap-4 sm:gap-6 md:gap-10 overflow-x-auto pb-16 scrollbar-hide perspective-1000 px-4 sm:px-8 md:px-12 mask-linear-fade snap-x snap-mandatory">
          {DESTINATIONS.map((item) => (
            <DestinationCard key={item.id} item={item} onClick={handleCardClick} />
          ))}
        </div>
      </div>

      {/* Фоновий декор */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
    </section>
  );
}
