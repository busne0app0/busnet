import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

export const SEOFooterSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 relative overflow-hidden w-full border-t border-white/5 bg-black/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="prose prose-invert max-w-none"
        >
          <h2 className="text-xl font-black text-white/50 uppercase tracking-[0.2em] mb-6 border-l-4 border-neon-cyan pl-6">
            {t.seo.title}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed italic font-medium pr-4">
            {t.seo.desc}
          </p>
        </motion.div>
      </div>
    </section>
  );
};
