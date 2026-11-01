import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Star } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

const ROTATIONS = ["-2deg", "1deg", "-1.5deg", "2deg"];
// Нахили для колоди на телефоні (у градусах)
const DECK_TOP_TILTS = [-2, 1, -1.5, 2];
const DECK_BEHIND_TILTS = [0, 4, -4];

/* ---------- Вміст картки (спільний для колоди і для сітки) ---------- */
const ReviewCardBody = ({ rev }: { rev: any }) => (
  <div className="h-full flex flex-col">
    {/* Аватарка з неоновим колом */}
    <div className="mb-5 relative w-16 h-16 sm:w-20 sm:h-20 sm:mb-6">
      <div className="absolute inset-0 bg-neon-cyan/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-neon-cyan p-1 bg-busnet-bg overflow-hidden">
        <img
          src={rev.img}
          alt={rev.name}
          referrerPolicy="no-referrer"
          draggable={false}
          className="w-full h-full object-cover rounded-full select-none"
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

    <div className="pt-4 border-t border-white/10 mt-auto">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan/60">
        {rev.route}
      </span>
    </div>
  </div>
);

/* ---------- Картка колоди (телефон) ---------- */
interface DeckCardProps {
  rev: any;
  offset: number; // 0 = верхня, 1 і 2 = виглядають знизу
  topTilt: number;
  dir: number; // куди відлітає верхня картка: -1 вліво, 1 вправо
  isPrev: boolean; // true, якщо повернулись на попередню
  onSwipe: (dir: number) => void;
}

const DeckCard = ({ rev, offset, topTilt, dir, isPrev, onSwipe }: DeckCardProps) => {
  const x = useMotionValue(0);
  const tilt = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const isTop = offset === 0;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500) {
      const d = info.offset.x !== 0 ? Math.sign(info.offset.x) : Math.sign(info.velocity.x);
      onSwipe(d || -1);
    }
  };

  const variants = {
    initial: isTop && isPrev
      ? { opacity: 0, scale: 1.05, y: -24 }
      : { opacity: 0, scale: 0.85, y: offset * 14 + 12 },
    animate: {
      opacity: 1,
      scale: 1 - offset * 0.05,
      y: offset * 14,
      transition: { type: "spring" as const, stiffness: 260, damping: 26 }
    },
    exit: (d: number) =>
      isTop
        ? { x: d * 340, opacity: 0, transition: { duration: 0.3 } }
        : { opacity: 0, transition: { duration: 0.15 } }
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={isTop ? handleDragEnd : undefined}
      style={{ x, rotate: tilt, zIndex: 30 - offset * 10 }}
      className={`absolute inset-0 ${isTop ? 'cursor-grab active:cursor-grabbing touch-pan-y' : 'pointer-events-none'}`}
    >
      <motion.div
        initial={{ rotate: isTop ? topTilt : DECK_BEHIND_TILTS[offset] }}
        animate={{ rotate: isTop ? topTilt : DECK_BEHIND_TILTS[offset] }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="group relative h-full rounded-2xl border border-white/10 bg-busnet-bg shadow-2xl overflow-hidden p-5 select-none"
      >
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />
        <div className="relative h-full">
          <ReviewCardBody rev={rev} />
        </div>
        {/* Затемнення нижніх карток замість прозорості, щоб текст не просвічував */}
        <motion.div
          initial={{ opacity: isTop ? 0 : 0.35 * offset }}
          animate={{ opacity: isTop ? 0 : 0.35 * offset }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 bg-busnet-bg pointer-events-none z-20"
        />
      </motion.div>
    </motion.div>
  );
};

/* ---------- Секція ---------- */
export const ReviewsSection = () => {
  const { t } = useLanguage();
  const items: any[] = t.reviews.items;
  const n = items.length;

  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(-1);
  const [isPrev, setIsPrev] = useState(false);
  const [touched, setTouched] = useState(false);

  const goNext = (d: number = -1) => {
    setDir(d);
    setIsPrev(false);
    setCurrent((c) => (c + 1) % n);
    setTouched(true);
  };

  const swipeHint: string | undefined = (t.reviews as any).swipeHint;
  const offsets = [2, 1, 0].filter((o) => o < n);

  return (
    <section className="pt-8 pb-2 sm:py-24 relative overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* Заголовок */}
        <div className="text-center mb-6 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight italic"
          >
            {t.reviews.title}{" "}
            <span className="neon-gradient-text not-italic inline-block ml-1.5 sm:ml-2">{t.reviews.titleAccent}</span>
          </motion.h2>
        </div>

        {/* ТЕЛЕФОН: колода карток зі свайпом */}
        <div className="sm:hidden max-w-[360px] mx-auto">
          {/* Колода: невидимий шар задає висоту найвищої картки, щоб нічого не стрибало */}
          <div className="relative pb-8">
            <div className="grid" aria-hidden="true">
              {items.map((rev, i) => (
                <div
                  key={i}
                  className="col-start-1 row-start-1 invisible p-5 border border-transparent rounded-2xl"
                >
                  <ReviewCardBody rev={rev} />
                </div>
              ))}
            </div>

            <div className="absolute inset-x-0 top-0 bottom-8">
              <AnimatePresence initial={false} custom={dir}>
                {offsets.map((o) => {
                  const idx = (current + o) % n;
                  return (
                    <DeckCard
                      key={idx}
                      rev={items[idx]}
                      offset={o}
                      topTilt={DECK_TOP_TILTS[idx % DECK_TOP_TILTS.length]}
                      dir={dir}
                      isPrev={isPrev}
                      onSwipe={goNext}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Підказка зникає після першого гортання */}
          {!touched && (
            <motion.p
              animate={{ x: [0, -8, 0, 8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="text-center text-xs font-bold text-neon-cyan/70 tracking-wider"
            >
              ‹ {swipeHint} ›
            </motion.p>
          )}
        </div>

        {/* ПЛАНШЕТ І КОМП'ЮТЕР: хмара відгуків як раніше */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {items.map((rev: any, index: number) => {
            const rotation = ROTATIONS[index % ROTATIONS.length];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, rotate: rotation }}
                whileInView={{ opacity: 1, y: 0, rotate: rotation }}
                whileHover={{ rotate: "0deg", scale: 1.05, y: -10 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 sm:p-8 rounded-2xl sm:rounded-[30px] shadow-2xl relative group transition-all duration-300"
              >
                <ReviewCardBody rev={rev} />
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