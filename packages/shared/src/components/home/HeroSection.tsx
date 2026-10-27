import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import SearchWidget from './SearchWidget';
import './HeroSection.css';

/**
 * BUSNET UA — premium European mobility hero (Earth at night).
 *
 * Full redesign:
 *  - Centred layout: badge → title → subtitle → SearchWidget → suggestions
 *  - Cyan (#00D4FF) accent instead of gold on heading line 2
 *  - SVG route network removed (added noise, mismatched geography)
 *  - Photo opacity reduced for readability (CSS: opacity 0.38 / 0.22 mobile)
 *  - SearchWidget embedded inside hero so it's always above the fold
 *  - Suggestions: horizontal scroll strip on mobile
 *
 * Header and parent layout remain unchanged.
 * Responsive images are served from /images/busnet-europe-*.
 */

/* ──────────────────── Responsive image set ──────────────────── */

const BASE = '/images/busnet-europe';
const MEDIA_MOBILE = '(max-width: 767px)';
const LANDSCAPE_WIDTHS = [800, 1400, 2400];
const PORTRAIT_WIDTHS  = [600, 900, 1200];

const SIZES_LANDSCAPE = 'max(100vw, 1020px)';
const SIZES_PORTRAIT  = 'max(100vw, 480px)';

const srcSet = (ext: 'avif' | 'webp' | 'jpg', widths: number[], variant = '') =>
  widths.map((w) => `${BASE}-${variant}${w}.${ext} ${w}w`).join(', ');

/* ──────────────────── Helpers ──────────────────── */

function getLocalISODate() {
  const now = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ──────────────────── Component ──────────────────── */

interface HeroSectionProps {
  onSearch: () => void;
  isLoading?: boolean;
}

export default function HeroSection({ onSearch, isLoading = false }: HeroSectionProps) {
  const { setSearchParams, setTriggerSearch } = useSearch();
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const titleLine1 = t.hero.titleLine1 || 'Європа ближче';
  const titleLine2 = t.hero.titleLine2 || 'ніж здається';

  const suggestions = [
    {
      text:   `${t.hero.cityKyiv} → ${t.hero.cityWarsaw}`,
      from:   'Київ',
      to:     'Варшава',
      detail: '1200₴',
      label:  t.hero.suggestCheapest,
    },
    {
      text:   `${t.hero.cityLviv} → ${t.hero.cityBerlin}`,
      from:   'Львів',
      to:     'Берлін',
      detail: t.hero.suggestAiChoice,
      label:  t.hero.suggestToday,
    },
    {
      text:   `${t.hero.cityOdesa} → ${t.hero.cityPrague}`,
      from:   'Одеса',
      to:     'Прага',
      detail: '1500₴',
      label:  t.hero.suggestFastest,
    },
  ];

  const handleSuggestionClick = (from: string, to: string) => {
    if (isLoading) return;
    setSearchParams({ from, to, date: getLocalISODate() });
    setTriggerSearch(true);
  };

  return (
    <section aria-labelledby="hero-title" className="busnet-hero relative isolate w-full text-white">

      {/* ── Photo (cinematic backdrop, deep-dimmed via CSS opacity) ── */}
      <div className="busnet-hero__media" aria-hidden="true">
        <div className="busnet-hero__stage">
          <div className="busnet-hero__drift">
            <picture className="busnet-hero__picture">
              {/* Mobile: portrait crop */}
              <source media={MEDIA_MOBILE} type="image/avif" srcSet={srcSet('avif', PORTRAIT_WIDTHS, 'portrait-')} sizes={SIZES_PORTRAIT} />
              <source media={MEDIA_MOBILE} type="image/webp" srcSet={srcSet('webp', PORTRAIT_WIDTHS, 'portrait-')} sizes={SIZES_PORTRAIT} />
              <source media={MEDIA_MOBILE} type="image/jpeg" srcSet={srcSet('jpg',  PORTRAIT_WIDTHS, 'portrait-')} sizes={SIZES_PORTRAIT} />
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
                decoding="async"
                draggable={false}
              />
            </picture>
          </div>
        </div>
      </div>

      {/* ── Overlays ── */}
      <div className="busnet-hero__shade busnet-hero__shade--horizontal" aria-hidden="true" />
      <div className="busnet-hero__shade busnet-hero__shade--vertical"   aria-hidden="true" />
      <div className="busnet-hero__glow"         aria-hidden="true" />
      <div className="busnet-hero__bottom-fade"  aria-hidden="true" />

      {/* ── Centred text block ── */}
      <div className="busnet-hero__content">
        <div className="w-full max-w-[720px] flex flex-col items-center text-center">

          {/* Badge */}
          <div
            className="mb-2 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-neon-cyan/25 bg-[#030712]/80 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-100 shadow-[0_0_15px_rgba(0,212,255,0.15)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan" />
            </span>
            <span>{t.header.bookingBadge}</span>
          </div>

          {/* Heading — rendered directly without animation for instant LCP & SEO */}
          <div className="w-full">
            <h1 id="hero-title" className="leading-[1.05] text-white [text-wrap:balance]">
              <span className="sr-only">BUSNET UA — </span>
              <span className="block text-[clamp(1.75rem,6.8vw,4.5rem)] font-black tracking-[-0.03em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                {titleLine1}
              </span>{' '}
              {/* Cyan accent line with pb-[0.12em] to protect descending characters from clip-path clipping */}
              <span className="block pb-[0.12em] text-[clamp(1.15rem,3.6vw,2.5rem)] font-extrabold tracking-[-0.02em] text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-[#38E8FF] to-[#00BFEA] drop-shadow-[0_0_28px_rgba(0,212,255,0.45)] mt-1 sm:mt-1.5">
                {titleLine2}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-2 sm:mt-4 max-w-[480px] mx-auto text-sm sm:text-base font-normal leading-relaxed text-slate-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {t.hero.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ── SearchWidget — always visible above the fold ── */}
      <div className="busnet-hero__search-wrap">
        <div className="max-w-[1120px] mx-auto">
          <SearchWidget onSearch={onSearch} isLoading={isLoading} />

          {/* ── Quick Suggestions (below form) ── */}
          <div className="mt-3">
            <div className="busnet-hero__suggestions">
              {suggestions.map((item) => (
                <button
                  key={`${item.from}-${item.to}`}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSuggestionClick(item.from, item.to)}
                  className="group flex shrink-0 min-w-[210px] max-w-[85vw] sm:min-w-0 items-center gap-2.5 rounded-2xl border border-white/[0.11] bg-[#071322]/90 px-3.5 py-2 text-left transition-all duration-200 hover:border-neon-cyan/50 hover:bg-[#0c1b30] hover:shadow-[0_0_18px_rgba(0,212,255,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Arrow icon — cyan */}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-neon-cyan/20 bg-neon-cyan/[0.07] text-neon-cyan/70 transition-colors group-hover:border-neon-cyan/45 group-hover:text-neon-cyan group-hover:bg-neon-cyan/12">
                    <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold leading-snug tracking-[-0.01em] text-slate-100">
                      {item.text}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-400 whitespace-nowrap">
                      <span>{item.detail}</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="text-neon-cyan/80 font-semibold">{item.label}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
