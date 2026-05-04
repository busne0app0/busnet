import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

const ROTATIONS = ["-2deg", "1deg", "-1.5deg", "2deg"];

export const ReviewsSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 relative overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Заголовок */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight italic pr-4"
          >
            {t.reviews.title} <span className="neon-gradient-text not-italic inline-block pr-6">{t.reviews.titleAccent}</span>
          </motion.h2>
        </div>

        {/* Хмара відгуків */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {t.reviews.items.map((rev: any, index: number) => {
            const rotation = ROTATIONS[index % ROTATIONS.length];
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, rotate: rotation }}
                whileInView={{ opacity: 1, y: 0, rotate: rotation }}
                whileHover={{ rotate: "0deg", scale: 1.05, y: -10 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[30px] shadow-2xl relative group transition-all duration-300"
              >
                {/* Аватарка з неоновим колом */}
                <div className="mb-6 relative w-20 h-20">
                  <div className="absolute inset-0 bg-neon-cyan/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full border-2 border-neon-cyan p-1 bg-busnet-bg overflow-hidden">
                    <img 
                      src={rev.img} 
                      alt={rev.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  {/* Статус "Verified" */}
                  <div className="absolute -bottom-1 -right-1 bg-neon-cyan text-black p-1 rounded-full border-2 border-busnet-bg">
                    <ShieldCheckIcon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-neon-cyan mb-1 uppercase tracking-tight">
                  {rev.name}
                </h3>
                
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                  ))}
                </div>

                <p className="text-slate-300 italic text-sm leading-relaxed mb-6 group-hover:text-white transition-colors">
                  "{rev.text}"
                </p>

                <div className="pt-4 border-t border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan/60">
                    {rev.route}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Фоновий декор */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-neon-cyan/5 blur-[120px] rounded-full -z-10 animate-pulse" />
    </section>
  );
};

// Helper internal icon to keep everything self-contained
const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
