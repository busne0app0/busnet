import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Sparkles, Bus, CreditCard, Luggage, Dog, MapPin } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'baggage-allowance': return <Luggage className="w-5 h-5 text-neon-cyan" />;
    case 'pay-to-driver': return <CreditCard className="w-5 h-5 text-neon-cyan" />;
    case 'departure-stations': return <MapPin className="w-5 h-5 text-neon-cyan" />;
    case 'travel-with-pets': return <Dog className="w-5 h-5 text-neon-cyan" />;
    case 'bus-amenities': return <Bus className="w-5 h-5 text-neon-cyan" />;
    default: return <HelpCircle className="w-5 h-5 text-neon-cyan" />;
  }
};

export const FAQSection: React.FC = () => {
  const { t } = useLanguage();
  const faqItems = t.faq?.items || [];
  const [openId, setOpenId] = useState<string | null>(faqItems[0]?.id || null);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map((item) => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer.replace(/\n/g, '<br/>')
      }
    }))
  };

  return (
    <section id="faq" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-20 relative scroll-mt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-mono uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FAQ & Knowledge Base</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight uppercase">
          {t.faq?.title || 'Часті запитання'}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-blue-500">
            {t.faq?.titleAccent || '(FAQ)'}
          </span>
        </h2>
      </div>

      <div className="space-y-4">
        {faqItems.map((item) => {
          const isOpen = openId === item.id;
          return (
            <motion.div
              key={item.id}
              initial={false}
              className="rounded-2xl border border-white/5 bg-[#080d19]/80 backdrop-blur-md overflow-hidden transition-colors duration-200 hover:border-neon-cyan/30"
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 shrink-0">
                    {getCategoryIcon(item.id)}
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neon-cyan block mb-1">
                      {item.category}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white block leading-snug">
                      {item.question}
                    </span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg bg-white/5 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-neon-cyan bg-neon-cyan/10' : ''}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 pt-2 border-t border-white/5">
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
