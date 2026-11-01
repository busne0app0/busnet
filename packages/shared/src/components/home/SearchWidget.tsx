import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, MapPin, Calendar, ChevronDown, ArrowLeftRight, ArrowUpDown, AlertCircle, X, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { useCities, ExtendedCity } from '@busnet/shared/hooks/useCities';
import { useMediaQuery } from '@busnet/shared/hooks/useMediaQuery';
import { useTypingPlaceholder } from '@busnet/shared/hooks/useTypingPlaceholder';
import CityAutocomplete from './CityAutocomplete';
import BusnetCalendar from '../common/BusnetCalendar';
import { normalizeCityName } from '@busnet/shared/lib/cityUtils';
import { formatLocalizedDate, isPastDate } from '@busnet/shared/lib/dateUtils';

export interface ResolvedSearchCities {
  from: ExtendedCity;
  to: ExtendedCity;
}

export interface SearchWidgetProps {
  onSearch: (cities: ResolvedSearchCities) => void;
  isLoading?: boolean;
}

const HEADER_OFFSET = 70;

// Приклади міст для анімованого плейсхолдера: підказують, що в поле треба вводити назву міста
const EXAMPLE_FROM: Record<string, string> = { uk: 'Київ', en: 'Kyiv', it: 'Kiev' };
const EXAMPLE_TO: Record<string, string> = { uk: 'Мілан', en: 'Milan', it: 'Milano' };
const EXAMPLE_PREFIX: Record<string, string> = { uk: 'Наприклад, ', en: 'e.g. ', it: 'Es. ' };

export default function SearchWidget({ onSearch, isLoading = false }: SearchWidgetProps) {
  const { searchParams, updateParam, swapCities, highlightDate } = useSearch();
  const { language, langKey, t } = useLanguage();
  const { dbCities } = useCities();

  // Sheet mode: small screen OR any touch/coarse pointer device
  const isSheet = useMediaQuery('(max-width: 1023px), (pointer: coarse)');

  const alertId = useId();
  const calendarId = useId();

  const [fromCity, setFromCity] = useState<ExtendedCity | null>(null);
  const [toCity, setToCity] = useState<ExtendedCity | null>(null);

  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ from?: boolean; to?: boolean; date?: boolean }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarOpensUp, setCalendarOpensUp] = useState(false);
  const [swapTurns, setSwapTurns] = useState(0);

  // Expanded form: starts open when any required field is empty; collapses after a successful search on mobile
  const [isExpanded, setIsExpanded] = useState(
    () => !searchParams.from || !searchParams.to || !searchParams.date
  );

  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const calendarTriggerRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Який із двох інпутів міст зараз у фокусі (анімований плейсхолдер у ньому зупиняється)
  const [focusedField, setFocusedField] = useState<'from' | 'to' | null>(null);
  useEffect(() => {
    const onIn = (e: FocusEvent) => {
      const target = e.target;
      setFocusedField(
        target === fromInputRef.current ? 'from' : target === toInputRef.current ? 'to' : null
      );
    };
    const onOut = () => setFocusedField(null);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);

  // Анімований плейсхолдер: «Київ» у полі «Звідки» і «Мілан» у полі «Куди».
  // Крутиться лише коли поле порожнє і не у фокусі; інакше показуємо звичайну підказку з перекладів.
  const exampleKey = (langKey as string) in EXAMPLE_FROM ? (langKey as string) : 'uk';
  const examplePrefix = EXAMPLE_PREFIX[exampleKey];
  const fromPlaceholder = useTypingPlaceholder([EXAMPLE_FROM[exampleKey]], {
    active: !searchParams.from && focusedField !== 'from',
    staticText: t.search.placeholderFrom,
    reducedText: `${examplePrefix}${EXAMPLE_FROM[exampleKey]}`,
  });
  const toPlaceholder = useTypingPlaceholder([EXAMPLE_TO[exampleKey]], {
    active: !searchParams.to && focusedField !== 'to',
    staticText: t.search.placeholderTo,
    reducedText: `${examplePrefix}${EXAMPLE_TO[exampleKey]}`,
  });

  // Pre-computed normalized lookup index for O(1) city resolution across all localized names
  const cityIndex = useMemo(() => {
    const m = new Map<string, ExtendedCity>();
    for (const c of dbCities) {
      for (const n of Object.values(c.names)) {
        if (n) {
          const norm = normalizeCityName(n);
          if (norm && !m.has(norm)) {
            m.set(norm, c);
          }
        }
      }
    }
    return m;
  }, [dbCities]);

  const findCity = useCallback(
    (text: string): ExtendedCity | null => {
      const norm = normalizeCityName(text);
      if (!norm) return null;
      return cityIndex.get(norm) ?? null;
    },
    [cityIndex]
  );

  // Robust resolver that prioritizes existing city object if text still matches its names
  const resolve = useCallback(
    (city: ExtendedCity | null, text: string): ExtendedCity | null => {
      const norm = normalizeCityName(text);
      if (!norm) return null;
      if (city && Object.values(city.names).some((n) => n && normalizeCityName(n) === norm)) {
        return city;
      }
      return findCity(text);
    },
    [findCity]
  );

  const resolvedFrom = useMemo(() => resolve(fromCity, searchParams.from), [resolve, fromCity, searchParams.from]);
  const resolvedTo = useMemo(() => resolve(toCity, searchParams.to), [resolve, toCity, searchParams.to]);

  // Synchronize city name strings when language changes
  const prevLangRef = useRef(langKey);
  useEffect(() => {
    if (prevLangRef.current !== langKey) {
      prevLangRef.current = langKey;
      if (resolvedFrom) {
        const localizedFrom = resolvedFrom.names[langKey] || resolvedFrom.names.uk || '';
        updateParam('from', localizedFrom);
      }
      if (resolvedTo) {
        const localizedTo = resolvedTo.names[langKey] || resolvedTo.names.uk || '';
        updateParam('to', localizedTo);
      }
    }
  }, [langKey, resolvedFrom, resolvedTo, updateParam]);

  // Clear validation without redundant re-renders
  const clearValidation = useCallback(() => {
    setValidationMessage(null);
    setErrorFields((prev) => (Object.keys(prev).length > 0 ? {} : prev));
  }, []);

  // Reset errors when user edits inputs
  useEffect(() => {
    clearValidation();
  }, [searchParams.from, searchParams.to, searchParams.date, clearValidation]);

  // Re-open form if user clears any required field (preserves values in context)
  useEffect(() => {
    if (!searchParams.from || !searchParams.to || !searchParams.date) {
      setIsExpanded(true);
    }
  }, [searchParams.from, searchParams.to, searchParams.date]);

  // Close calendar if search is launched
  useEffect(() => {
    if (isLoading && isCalendarOpen) {
      setIsCalendarOpen(false);
    }
  }, [isLoading, isCalendarOpen]);

  // Stable close callback — always returns focus to the trigger button
  const closeCalendar = useCallback(() => {
    setIsCalendarOpen(false);
    dateButtonRef.current?.focus();
  }, []);

  // Measure calendar height and decide flip direction (popover / desktop only)
  useLayoutEffect(() => {
    if (!isCalendarOpen || isSheet) return;
    const trigger = calendarTriggerRef.current;
    const cal = calendarContainerRef.current;
    if (!trigger || !cal) return;

    const rect = trigger.getBoundingClientRect();
    const needed = cal.offsetHeight + 12;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top - HEADER_OFFSET;

    setCalendarOpensUp(below < needed && above > below);
  }, [isCalendarOpen, isSheet]);

  // Sheet: lock body scroll. Popover: close on outside pointerdown.
  useEffect(() => {
    if (!isCalendarOpen) return;

    if (isSheet) {
      // Lock body scroll while sheet is open
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }

    // Desktop popover — close on click outside the trigger+calendar area
    const onDown = (e: PointerEvent) => {
      if (!calendarTriggerRef.current?.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isCalendarOpen, isSheet]);

  const triggerValidationError = (message: string, fields: { from?: boolean; to?: boolean; date?: boolean }) => {
    setValidationMessage(message);
    setErrorFields(fields);

    // Autofocus first erroneous field — but only expand form first on mobile
    if (isSheet) setIsExpanded(true);

    if (fields.from) {
      fromInputRef.current?.focus();
    } else if (fields.to) {
      toInputRef.current?.focus();
    } else if (fields.date) {
      dateButtonRef.current?.focus();
    }
  };

  const handleSearchClick = () => {
    if (isLoading) return;

    const fromMissing = !searchParams.from?.trim();
    const toMissing = !searchParams.to?.trim();
    const dateMissing = !searchParams.date?.trim();

    if (fromMissing || toMissing || dateMissing) {
      triggerValidationError(t.validation.fillAll, { from: fromMissing, to: toMissing, date: dateMissing });
      return;
    }

    if (searchParams.date && isPastDate(searchParams.date)) {
      triggerValidationError(t.validation.pastDate, { date: true });
      return;
    }

    if (!resolvedFrom || !resolvedTo) {
      triggerValidationError(t.validation.unknownCity, {
        from: !resolvedFrom,
        to: !resolvedTo,
      });
      return;
    }

    if (resolvedFrom.id === resolvedTo.id) {
      triggerValidationError(t.validation.sameCities, { from: true, to: true });
      return;
    }

    clearValidation();
    onSearch({ from: resolvedFrom, to: resolvedTo });
    if (isSheet) setIsExpanded(false); // collapse form on mobile after search is triggered
  };

  // Atomic swap: synchronizes turn animation, local objects, and context strings
  const handleSwapCities = useCallback(() => {
    if (!searchParams.from && !searchParams.to) return;
    setSwapTurns((n) => n + 1);
    setFromCity(toCity);
    setToCity(fromCity);
    swapCities();
  }, [swapCities, fromCity, toCity, searchParams.from, searchParams.to]);

  const displayDate = formatLocalizedDate(searchParams.date, language);

  // Shared BusnetCalendar node reused in both popover and sheet portals
  const calendarNode = (
    <BusnetCalendar
      variant={isSheet ? 'sheet' : 'popover'}
      selectedDate={searchParams.date}
      onSelect={(val) => {
        updateParam('date', val);
        closeCalendar();
      }}
      tripContext={
        resolvedFrom && resolvedTo
          ? {
            from: resolvedFrom.names[langKey] ?? resolvedFrom.names.uk,
            to: resolvedTo.names[langKey] ?? resolvedTo.names.uk,
          }
          : undefined
      }
      onClose={closeCalendar}
    />
  );

  return (
    <div className="w-full relative z-20">

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP (isSheet=false): horizontal pill — unchanged layout
      ══════════════════════════════════════════════════════════ */}
      {!isSheet && (
        <div className="relative bg-[#141928] border border-white/10 rounded-[32px] p-3 shadow-[0_35px_60px_rgba(0,0,0,0.6)] flex items-center gap-0">

          {/* Validation Alert — floats below the pill */}
          <div className="absolute left-0 right-0 top-full mt-2 flex justify-center z-50 pointer-events-none">
            <AnimatePresence>
              {validationMessage && (
                <motion.div
                  id={alertId}
                  role="alert"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  className="pointer-events-auto w-[90%] max-w-[440px] p-3.5 bg-rose-950/95 border border-rose-500/80 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.35)] text-left flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/80 flex items-center justify-center shrink-0">
                      <AlertCircle size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-black text-xs uppercase tracking-tight leading-none mb-1">
                        {t.validation.header}
                      </p>
                      <p className="text-rose-200 text-xs font-semibold leading-tight">
                        {validationMessage}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearValidation}
                    aria-label={t.validation.close}
                    className="text-rose-300 hover:text-white p-2 rounded-lg transition-colors active:scale-95"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* From */}
          <CityAutocomplete
            label={t.search.from}
            value={searchParams.from}
            onChange={(val) => { updateParam('from', val); setFromCity(null); }}
            placeholder={fromPlaceholder}
            icon={<MapPin size={12} />}
            hasError={errorFields.from}
            errorId={alertId}
            enterKeyHint="next"
            availableCities={dbCities}
            isLoading={isLoading}
            inputRef={fromInputRef}
            onSelectCity={(city) => { setFromCity(city); if (!searchParams.to) toInputRef.current?.focus(); }}
            onEnter={() => toInputRef.current?.focus()}
          />

          {/* Swap Button */}
          <div className="relative flex items-center justify-center shrink-0 mx-1 z-30">
            <button
              type="button"
              onClick={handleSwapCities}
              disabled={isLoading || (!searchParams.from && !searchParams.to)}
              aria-label={t.search.swap}
              title={t.search.swap}
              className="w-10 h-10 rounded-full bg-[#1b2236] border border-white/15 hover:border-neon-cyan/50 text-slate-300 hover:text-neon-cyan flex items-center justify-center transition-all shadow-md active:scale-90 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              <ArrowLeftRight
                size={15}
                className="transition-transform duration-300"
                style={{ transform: `rotate(${swapTurns * 180}deg)` }}
              />
            </button>
          </div>

          {/* To */}
          <CityAutocomplete
            label={t.search.to}
            value={searchParams.to}
            onChange={(val) => { updateParam('to', val); setToCity(null); }}
            placeholder={toPlaceholder}
            icon={<MapPin size={12} />}
            hasError={errorFields.to}
            errorId={alertId}
            enterKeyHint="search"
            availableCities={dbCities}
            isLoading={isLoading}
            inputRef={toInputRef}
            onSelectCity={(city) => { setToCity(city); }}
            onEnter={handleSearchClick}
          />

          {/* Desktop divider */}
          <div className="w-[1px] h-10 bg-white/10 mx-1 shrink-0" />

          {/* Date Picker Trigger */}
          <div
            ref={calendarTriggerRef}
            className={`flex-1 relative px-6 py-3 transition-all duration-300 rounded-xl group/date focus-within:ring-1 focus-within:ring-neon-cyan/50 focus-within:shadow-[0_0_15px_rgba(0,212,255,0.2)] ${errorFields.date ? 'ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''
              } ${highlightDate ? 'neon-pulse-glow z-20' : ''}`}
          >
            <button
              ref={dateButtonRef}
              type="button"
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              disabled={isLoading}
              aria-haspopup="dialog"
              aria-expanded={isCalendarOpen}
              aria-controls={isCalendarOpen ? calendarId : undefined}
              aria-invalid={errorFields.date ? true : undefined}
              aria-describedby={errorFields.date ? alertId : undefined}
              className="w-full text-left cursor-pointer outline-none"
            >
              <span className="text-xs text-slate-300 font-bold uppercase mb-1 tracking-wider flex items-center gap-1.5 group-hover/date:text-neon-cyan transition-colors">
                <Calendar size={12} /> {t.search.date}
              </span>
              <div className="flex items-center justify-between">
                <span className={`text-base font-bold tracking-tight pr-4 ${searchParams.date ? 'text-white' : 'text-slate-400'}`}>
                  {displayDate || t.search.selectDate}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-slate-400 group-hover/date:text-neon-cyan transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Desktop popover calendar */}
            <AnimatePresence>
              {isCalendarOpen && (
                <motion.div
                  id={calendarId}
                  ref={calendarContainerRef}
                  role="dialog"
                  aria-label={t.search.date}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute left-auto right-0 z-[100] w-auto flex justify-center ${calendarOpensUp
                    ? 'bottom-full mb-2 origin-bottom-right'
                    : 'top-full mt-2 origin-top-right'
                    }`}
                >
                  {calendarNode}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={isLoading}
            aria-busy={isLoading}
            className="ml-3 min-h-[48px] neon-gradient-btn px-10 py-5 rounded-[24px] text-base font-black uppercase tracking-wider shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <Search size={18} className="text-white shrink-0" aria-hidden="true" />
            )}
            <span className="whitespace-nowrap">
              {isLoading ? `${t.search.search}...` : t.search.search}
            </span>
          </button>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MOBILE (isSheet=true): compact collapsible layout
      ══════════════════════════════════════════════════════════ */}
      {isSheet && (
        <div className="flex flex-col gap-2">

          {/* Validation alert */}
          <AnimatePresence>
            {validationMessage && (
              <motion.div
                id={alertId}
                role="alert"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="w-full p-3 bg-rose-950/95 border border-rose-500/80 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.25)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rose-500/80 flex items-center justify-center shrink-0">
                    <AlertCircle size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-black text-[10px] uppercase tracking-tight leading-none mb-0.5">
                      {t.validation.header}
                    </p>
                    <p className="text-rose-200 text-xs font-semibold leading-tight">
                      {validationMessage}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearValidation}
                  aria-label={t.validation.close}
                  className="text-rose-300 hover:text-white p-2 rounded-lg transition-colors active:scale-95"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Collapsed summary: shown when all fields are filled and user collapsed the form ── */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.button
                key="collapsed-summary"
                type="button"
                onClick={() => setIsExpanded(true)}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-4 py-3 text-left active:bg-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-neon-cyan"
                aria-label={`${t.search.from}: ${searchParams.from}, ${t.search.to}: ${searchParams.to}. ${t.search.date}: ${displayDate}`}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-neon-cyan shrink-0" />
                  <span className="flex-1 text-sm font-bold text-white truncate min-w-0">
                    {searchParams.from}
                    <span className="text-slate-400 font-normal mx-1.5">→</span>
                    {searchParams.to}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Calendar size={11} className="text-slate-400" />
                    <span className="text-xs text-slate-300 whitespace-nowrap">{displayDate}</span>
                    <div className="ml-1.5 w-6 h-6 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center">
                      <Pencil size={10} className="text-slate-300" />
                    </div>
                  </span>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── Expanded: full search form ── */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                key="expanded-form"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-2"
              >
                {/* ── Unified From + To card ──
                    Справа (pr-12) зарезервировано место под кнопку обмена: она не налезает на крестики очистки.
                    Линия между полями упирается прямо в кнопку. */}
                <div
                  className={`relative bg-[#1a2235] border rounded-xl pr-12 focus-within:shadow-[0_0_0_1px_rgba(0,212,255,0.35)] transition-shadow ${errorFields.from || errorFields.to
                    ? 'border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.18)]'
                    : 'border-white/10'
                    }`}
                >
                  {/* From field — embedded mode: no own card border / ring */}
                  <CityAutocomplete
                    embedded
                    label={t.search.from}
                    value={searchParams.from}
                    onChange={(val) => { updateParam('from', val); setFromCity(null); }}
                    placeholder={fromPlaceholder}
                    icon={<MapPin size={11} />}
                    hasError={errorFields.from}
                    errorId={alertId}
                    enterKeyHint="next"
                    availableCities={dbCities}
                    isLoading={isLoading}
                    inputRef={fromInputRef}
                    onSelectCity={(city) => {
                      setFromCity(city);
                      if (!searchParams.to) toInputRef.current?.focus();
                    }}
                    onEnter={() => toInputRef.current?.focus()}
                  />

                  {/* Divider между полями: идёт слева направо и заканчивается у кнопки обмена */}
                  <div className="h-px bg-white/[0.08] ml-3" />

                  {/* To field — embedded mode */}
                  <CityAutocomplete
                    embedded
                    label={t.search.to}
                    value={searchParams.to}
                    onChange={(val) => { updateParam('to', val); setToCity(null); }}
                    placeholder={toPlaceholder}
                    icon={<MapPin size={11} />}
                    hasError={errorFields.to}
                    errorId={alertId}
                    enterKeyHint="search"
                    availableCities={dbCities}
                    isLoading={isLoading}
                    inputRef={toInputRef}
                    onSelectCity={(city) => { setToCity(city); }}
                    onEnter={handleSearchClick}
                  />

                  {/* Swap button: по центру высоты карточки, на уровне линии между полями */}
                  <button
                    type="button"
                    onClick={handleSwapCities}
                    disabled={isLoading || (!searchParams.from && !searchParams.to)}
                    aria-label={t.search.swap}
                    title={t.search.swap}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#141928] border border-white/10 text-neon-cyan flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.5)] active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-neon-cyan transition-transform"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <ArrowUpDown
                      size={15}
                      className="transition-transform duration-300"
                      style={{ transform: `rotate(${swapTurns * 180}deg)` }}
                    />
                  </button>
                </div>

                {/* ── Date field: compact separate row ── */}
                <div
                  ref={calendarTriggerRef}
                  className={`relative bg-[#1a2235] border rounded-xl px-3 py-2.5 transition-all ${errorFields.date
                    ? 'border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.18)]'
                    : highlightDate
                      ? 'border-neon-cyan/40 neon-pulse-glow'
                      : 'border-white/10'
                    }`}
                >
                  <button
                    ref={dateButtonRef}
                    type="button"
                    onClick={() => setIsCalendarOpen((prev) => !prev)}
                    disabled={isLoading}
                    aria-haspopup="dialog"
                    aria-expanded={isCalendarOpen}
                    aria-controls={isCalendarOpen ? calendarId : undefined}
                    aria-invalid={errorFields.date ? true : undefined}
                    aria-describedby={errorFields.date ? alertId : undefined}
                    className="w-full text-left cursor-pointer outline-none"
                  >
                    <span className="text-[10px] text-slate-300 font-bold uppercase mb-0.5 tracking-wider flex items-center gap-1.5">
                      <Calendar size={11} /> {t.search.date}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className={`text-base font-bold tracking-tight pr-4 ${searchParams.date ? 'text-white' : 'text-slate-400'}`}>
                        {displayDate || t.search.selectDate}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Search button: always visible ── */}
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full min-h-[48px] neon-gradient-btn px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <Search size={16} className="text-white shrink-0" aria-hidden="true" />
            )}
            <span className="whitespace-nowrap">
              {isLoading ? `${t.search.search}...` : t.search.search}
            </span>
          </button>

        </div>
      )}

      {/* Calendar bottom sheet portal (mobile only) */}
      {isSheet && createPortal(
        <AnimatePresence>
          {isCalendarOpen && (
            <motion.div
              className="fixed inset-0 z-[200] flex items-end bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => { if (e.target === e.currentTarget) closeCalendar(); }}
            >
              <motion.div
                id={calendarId}
                role="dialog"
                aria-modal="true"
                aria-label={t.search.date}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'tween', duration: 0.22 }}
                className="w-full max-h-[90dvh] overflow-y-auto overscroll-contain px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
                onClick={(e) => e.stopPropagation()}
              >
                {calendarNode}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}