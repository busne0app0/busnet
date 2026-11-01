import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

export const SEOFooterSection = () => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  // Тексти кнопки беруться з перекладів (seo.readMore / seo.readLess). Без них видно лише стрілку.
  const readMore: string | undefined = (t.seo as any).readMore;
  const readLess: string | undefined = (t.seo as any).readLess;
  const label = expanded ? readLess : readMore;

  return (
    <section className="pt-8 pb-0 sm:py-20 relative sm:overflow-hidden w-full border-t border-white/5 bg-black/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="prose prose-invert max-w-none"
        >
          <h2 className="text-sm sm:text-xl font-black text-white/50 uppercase tracking-[0.12em] sm:tracking-[0.2em] mb-4 sm:mb-6 border-l-2 sm:border-l-4 border-neon-cyan pl-4 sm:pl-6">
            {t.seo.title}
          </h2>

          {/* На телефоні текст згорнутий до 3 рядків, але весь лишається в коді сторінки для пошуковиків.
              Від sm: показується повністю, як раніше. */}
          <div
            id="seo-text"
            className={`overflow-hidden transition-[max-height] duration-500 sm:max-h-none ${expanded
                ? 'max-h-[40rem]'
                : 'max-h-[4.4rem] [mask-image:linear-gradient(to_bottom,black_45%,transparent)] sm:[mask-image:none]'
              }`}
          >
            <p className="text-slate-400 sm:text-slate-500 text-sm leading-relaxed not-italic sm:italic font-medium pr-0 sm:pr-4">
              {t.seo.desc}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="seo-text"
            aria-label={label || 'Toggle'}
            className="sm:hidden mt-1 -mb-3 w-full min-h-11 flex items-center gap-3 text-sm font-bold text-neon-cyan/80 [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:text-neon-cyan"
          >
            <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-neon-cyan/25" />
            <span className="inline-flex items-center gap-1.5">
              {label}
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              />
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-neon-cyan/25" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};