import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import './HeroSection.css';

/**
 * BUSNET UA — premium European mobility hero (Earth at night).
 *
 * Header and SearchWidget are rendered by the parent layout/page.
 * Responsive images are served from /images/busnet-europe-*.
 * Image and route network live in ONE stage (HeroSection.css), so the
 * routes always stay locked to the photo across all screen sizes.
 */

/* ───────────────────────── Responsive image set ───────────────────────── */

const BASE = '/images/busnet-europe';
const MEDIA_MOBILE = '(max-width: 767px)';
const LANDSCAPE_WIDTHS = [800, 1400, 2400];
const PORTRAIT_WIDTHS = [600, 900, 1200];

const SIZES_LANDSCAPE = 'max(100vw, 1020px)';
const SIZES_PORTRAIT = 'max(100vw, 480px)';

const srcSet = (ext: 'avif' | 'webp' | 'jpg', widths: number[], variant = '') =>
  widths.map((w) => `${BASE}-${variant}${w}.${ext} ${w}w`).join(', ');

/* ───────────────────────── Route network (decorative) ─────────────────────
 * Coordinates are PERCENT of the photo (0–100), not of the screen.
 * Open the page with ?herogrid in the URL to see a 10% grid.
 */

const VB_W = 2400;
const VB_H = 1200;

const HUBS: Record<string, readonly [number, number]> = {
  a: [54, 65],
  b: [75, 33],
  c: [93, 20],
  d: [83, 58],
  e: [98, 49],
  f: [61, 85],
};

const SOLID_ROUTE = ['a', 'b', 'c'];
const DASHED_ROUTE = ['f', 'd', 'e'];

function buildPath(ids: string[]): string {
  const pts = ids.map((id) => {
    const [x, y] = HUBS[id];
    return [(x / 100) * VB_W, (y / 100) * VB_H] as const;
  });
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

const SOLID_PATH = buildPath(SOLID_ROUTE);
const DASHED_PATH = buildPath(DASHED_ROUTE);
const GRID_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

/* ───────────────────────── Helpers ───────────────────────── */

function getLocalISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ───────────────────────── Component ───────────────────────── */

export default function HeroSection() {
  const { setSearchParams, setTriggerSearch } = useSearch();
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  // Dev helper: add ?herogrid to the URL to read photo coordinates.
  const [showGrid] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('herogrid'),
  );

  const titleLine1 = t.hero.titleLine1 || 'Європа ближче,';
  const titleLine2 = t.hero.titleLine2 || 'ніж здається.';

  const suggestions = [
    {
      text: `${t.hero.cityKyiv} → ${t.hero.cityWarsaw}`,
      from: t.hero.cityKyiv,
      to: t.hero.cityWarsaw,
      detail: '1200₴',
      label: t.hero.suggestCheapest,
    },
    {
      text: `${t.hero.cityLviv} → ${t.hero.cityBerlin}`,
      from: t.hero.cityLviv,
      to: t.hero.cityBerlin,
      detail: t.hero.suggestAiChoice,
      label: t.hero.suggestToday,
    },
    {
      text: `${t.hero.cityOdesa} → ${t.hero.cityPrague}`,
      from: t.hero.cityOdesa,
      to: t.hero.cityPrague,
      detail: '1500₴',
      label: t.hero.suggestFastest,
    },
  ];

  const handleSuggestionClick = (from: string, to: string) => {
    setSearchParams({ from, to, date: getLocalISODate() });
    setTriggerSearch(true);
  };

  const fade = (duration: number, delay = 0) => ({
    duration: shouldReduceMotion ? 0 : duration,
    delay: shouldReduceMotion ? 0 : delay,
  });

  return (
    <section className="busnet-hero relative isolate w-full overflow-hidden text-white">
      {/* Photo + routes share one stage so they never drift apart */}
      <div className="busnet-hero__media" aria-hidden="true">
        <div className="busnet-hero__stage">
          <div className="busnet-hero__drift">
            <picture className="busnet-hero__picture">
              {/* Mobile: portrait crop */}
              <source media={MEDIA_MOBILE} type="image/avif" srcSet={srcSet('avif', PORTRAIT_WIDTHS, 'portrait-')} sizes={SIZES_PORTRAIT} />
              <source media={MEDIA_MOBILE} type="image/webp" srcSet={srcSet('webp', PORTRAIT_WIDTHS, 'portrait-')} sizes={SIZES_PORTRAIT} />
              <source media={MEDIA_MOBILE} type="image/jpeg" srcSet={srcSet('jpg', PORTRAIT_WIDTHS, 'portrait-')} sizes={SIZES_PORTRAIT} />
              {/* Desktop: 2:1 landscape */}
              <source type="image/avif" srcSet={srcSet('avif', LANDSCAPE_WIDTHS)} sizes={SIZES_LANDSCAPE} />
              <source type="image/webp" srcSet={srcSet('webp', LANDSCAPE_WIDTHS)} sizes={SIZES_LANDSCAPE} />
              <img
                className="busnet-hero__image"
                src={`${BASE}-1400.jpg`}
                srcSet={srcSet('jpg', LANDSCAPE_WIDTHS)}
                sizes={SIZES_LANDSCAPE}
                alt=""
                width={2400}
                height={1200}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
              />
            </picture>

            {/* Glowing route network */}
            <div className="busnet-hero__routes">
              <motion.svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                preserveAspectRatio="none"
                className="block h-full w-full"
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={fade(1.2, 0.2)}
              >
                <defs>
                  <linearGradient id="busnet-hero-route-line" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#E8BC70" stopOpacity="0.1" />
                    <stop offset="55%" stopColor="#E8BC70" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.4" />
                  </linearGradient>
                  <filter id="busnet-hero-route-glow" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Solid route: draws itself in */}
                <motion.path
                  d={SOLID_PATH}
                  fill="none"
                  stroke="url(#busnet-hero-route-line)"
                  strokeWidth="2.5"
                  filter="url(#busnet-hero-route-glow)"
                  initial={shouldReduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ ...fade(1.8, 0.25), ease: 'easeOut' }}
                />

                {/* Dashed route: fades in */}
                <motion.path
                  d={DASHED_PATH}
                  fill="none"
                  stroke="#00D4FF"
                  strokeWidth="2"
                  strokeDasharray="6 14"
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 0.65 }}
                  transition={fade(1.6, 0.5)}
                />

                {Object.entries(HUBS).map(([id, [x, y]], index) => {
                  const cx = (x / 100) * VB_W;
                  const cy = (y / 100) * VB_H;
                  return (
                    <g key={id}>
                      <circle cx={cx} cy={cy} r="11" fill="#E9C17A" opacity="0.18" />
                      <circle cx={cx} cy={cy} r="3.8" fill={index % 2 ? '#00D4FF' : '#F3D39A'} />
                    </g>
                  );
                })}

                {showGrid && (
                  <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1" fill="#ffffff" fontSize="22">
                    {GRID_STEPS.map((p) => (
                      <g key={p}>
                        <line x1={(p / 100) * VB_W} y1="0" x2={(p / 100) * VB_W} y2={VB_H} />
                        <text x={(p / 100) * VB_W + 6} y="28" stroke="none">{p}</text>
                        <line x1="0" y1={(p / 100) * VB_H} x2={VB_W} y2={(p / 100) * VB_H} />
                        <text x="8" y={(p / 100) * VB_H - 6} stroke="none">{p}</text>
                      </g>
                    ))}
                  </g>
                )}
              </motion.svg>
            </div>
          </div>
        </div>
      </div>

      {/* Contrast overlays, tuned for dark #030712 theme integration */}
      <div className="busnet-hero__shade busnet-hero__shade--horizontal" aria-hidden="true" />
      <div className="busnet-hero__shade busnet-hero__shade--vertical" aria-hidden="true" />
      <div className="busnet-hero__glow" aria-hidden="true" />
      <div className="busnet-hero__bottom-fade" aria-hidden="true" />

      {/* Hero content */}
      <div className="busnet-hero__content mx-auto flex min-h-[440px] w-full max-w-[1440px] flex-col justify-center px-5 pb-10 pt-12 sm:min-h-[475px] sm:px-8 sm:pb-12 sm:pt-14 lg:min-h-[510px] lg:px-12 lg:pb-14">
        <div className="relative z-10 max-w-[680px]">
          {/* Badge */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-neon-cyan/25 bg-[#030712]/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-100 backdrop-blur-md shadow-[0_0_15px_rgba(0,212,255,0.15)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
            </span>
            <span>{t.header.bookingBadge}</span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="max-w-[650px] text-left text-[clamp(2.55rem,5.7vw,5.15rem)] font-extrabold leading-[0.99] tracking-[-0.045em] text-white [text-wrap:balance]">
              <span className="sr-only">BUSNET UA — </span>
              <span className="block drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{titleLine1}</span>
              <span className="mt-1 block text-transparent bg-clip-text bg-gradient-to-r from-[#F3D39A] via-[#E8C17A] to-[#FFDA8A] drop-shadow-[0_0_25px_rgba(232,188,112,0.25)]">
                {titleLine2}
              </span>
            </h1>
            <p className="mt-5 max-w-[520px] text-left text-base font-normal leading-relaxed text-slate-300 sm:text-lg lg:text-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {t.hero.subtitle}
            </p>
          </motion.div>

          {/* Suggestions */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 sm:mt-8"
          >
            <div className="flex max-w-[750px] flex-wrap gap-2.5">
              {suggestions.map((item, index) => (
                <motion.button
                  key={`${item.from}-${item.to}`}
                  type="button"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.22 + index * 0.06 }}
                  whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                  onClick={() => handleSuggestionClick(item.from, item.to)}
                  className="group flex min-h-[58px] max-w-full items-center gap-3 rounded-2xl border border-white/[0.12] bg-[#030712]/60 px-4 py-2.5 text-left backdrop-blur-md transition-all duration-200 hover:border-[#E8C17A]/60 hover:bg-[#071322]/80 hover:shadow-[0_0_20px_rgba(232,193,122,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] sm:min-w-[190px]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#D5E5F2] transition-colors group-hover:border-[#E8C17A]/30 group-hover:text-[#E8C17A] group-hover:bg-[#E8C17A]/10">
                    <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[13px] font-bold leading-snug tracking-[-0.01em] text-slate-100">
                      {item.text}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      <span>{item.detail}</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="text-[#E8C17A] font-semibold">{item.label}</span>
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
