import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useId, useMemo } from 'react';
import { Search, MapPin, Calendar, ChevronDown, ArrowLeftRight, ArrowUpDown, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { useCities, ExtendedCity } from '@busnet/shared/hooks/useCities';
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

export default function SearchWidget({ onSearch, isLoading = false }: SearchWidgetProps) {
  const { searchParams, updateParam, swapCities, highlightDate } = useSearch();
  const { language, langKey, t } = useLanguage();
  const { dbCities } = useCities();
  
  const alertId = useId();
  const calendarId = useId();

  const [fromCity, setFromCity] = useState<ExtendedCity | null>(null);
  const [toCity, setToCity] = useState<ExtendedCity | null>(null);

  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ from?: boolean; to?: boolean; date?: boolean }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarOpensUp, setCalendarOpensUp] = useState(false);
  const [swapTurns, setSwapTurns] = useState(0);

  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const calendarTriggerRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

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

  // Close calendar if search is launched
  useEffect(() => {
    if (isLoading && isCalendarOpen) {
      setIsCalendarOpen(false);
    }
  }, [isLoading, isCalendarOpen]);

  // Measure calendar height and decide flip direction
  useLayoutEffect(() => {
    if (!isCalendarOpen) return;
    const trigger = calendarTriggerRef.current;
    const cal = calendarContainerRef.current;
    if (!trigger || !cal) return;

    const rect = trigger.getBoundingClientRect();
    const needed = cal.offsetHeight + 12;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top - HEADER_OFFSET;

    setCalendarOpensUp(below < needed && above > below);
  }, [isCalendarOpen]);

  // Close calendar on outside pointerdown
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        calendarTriggerRef.current &&
        !calendarTriggerRef.current.contains(target)
      ) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isCalendarOpen]);

  const triggerValidationError = (message: string, fields: { from?: boolean; to?: boolean; date?: boolean }) => {
    setValidationMessage(message);
    setErrorFields(fields);

    // Autofocus first erroneous field
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

  return (
    <div className="w-full max-w-[1120px] mx-auto mt-2 bg-[#141928]/90 backdrop-blur-2xl border border-white/10 rounded-[28px] sm:rounded-[32px] p-2.5 sm:p-3 shadow-[0_35px_60px_rgba(0,0,0,0.6)] relative z-20 flex flex-col md:flex-row items-center gap-2 md:gap-0">
      
      {/* Validation Alert (centered, without premature WCAG auto-dismiss) */}
      <div className="absolute left-0 right-0 top-full mt-3 flex justify-center pointer-events-none z-50">
        <AnimatePresence>
          {validationMessage && (
            <motion.div
              id={alertId}
              role="alert"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="pointer-events-auto w-[90%] max-w-[440px] p-3.5 bg-rose-600/30 backdrop-blur-2xl border border-rose-500/60 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.35)] text-left flex items-center justify-between gap-3"
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

      {/* From Input */}
      <CityAutocomplete
        label={t.search.from}
        value={searchParams.from}
        onChange={(val) => {
          updateParam('from', val);
          setFromCity(null);
        }}
        placeholder={t.search.placeholderFrom}
        icon={<MapPin size={10} />}
        hasError={errorFields.from}
        errorId={alertId}
        enterKeyHint="next"
        availableCities={dbCities}
        isLoading={isLoading}
        inputRef={fromInputRef}
        onSelectCity={(city) => {
          setFromCity(city);
          if (!searchParams.to) {
            toInputRef.current?.focus();
          }
        }}
        onEnter={() => toInputRef.current?.focus()}
      />

      {/* Swap Button */}
      <div className="relative flex items-center justify-center shrink-0 my-1 md:my-0 md:-mx-2 z-30">
        <button
          type="button"
          onClick={handleSwapCities}
          disabled={isLoading || (!searchParams.from && !searchParams.to)}
          aria-label={t.search.swap}
          title={t.search.swap}
          className="w-9 h-9 rounded-full bg-[#1b2236] border border-white/15 hover:border-neon-cyan/50 text-slate-300 hover:text-neon-cyan flex items-center justify-center transition-all shadow-md active:scale-90 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-neon-cyan"
        >
          <ArrowLeftRight
            size={14}
            className="hidden md:block transition-transform duration-300"
            style={{ transform: `rotate(${swapTurns * 180}deg)` }}
          />
          <ArrowUpDown
            size={14}
            className="block md:hidden transition-transform duration-300"
            style={{ transform: `rotate(${swapTurns * 180}deg)` }}
          />
        </button>
      </div>

      {/* To Input */}
      <CityAutocomplete
        label={t.search.to}
        value={searchParams.to}
        onChange={(val) => {
          updateParam('to', val);
          setToCity(null);
        }}
        placeholder={t.search.placeholderTo}
        icon={<MapPin size={10} />}
        hasError={errorFields.to}
        errorId={alertId}
        enterKeyHint="search"
        availableCities={dbCities}
        isLoading={isLoading}
        inputRef={toInputRef}
        onSelectCity={(city) => {
          setToCity(city);
        }}
        onEnter={handleSearchClick}
      />

      <div className="hidden md:block w-[1px] h-10 bg-white/10 mx-1 shrink-0" />

      {/* Date Picker Trigger */}
      <div
        ref={calendarTriggerRef}
        className={`w-full md:flex-1 relative px-4 py-3 md:px-6 transition-all duration-300 rounded-2xl group/date focus-within:ring-1 focus-within:ring-neon-cyan/50 focus-within:shadow-[0_0_15px_rgba(0,212,255,0.2)] ${
          errorFields.date ? 'ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''
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
          <span className="text-[10px] text-slate-400 font-black uppercase block mb-1.5 tracking-widest flex items-center gap-1.5 group-hover/date:text-neon-cyan transition-colors">
            <Calendar size={10} /> {t.search.date}
          </span>
          <div className="flex items-center justify-between">
            <span
              className={`text-base sm:text-lg font-black italic tracking-tight pr-4 ${
                searchParams.date ? 'text-white' : 'text-slate-500'
              }`}
            >
              {displayDate || t.search.selectDate}
            </span>
            <ChevronDown
              size={15}
              className={`text-slate-400 group-hover/date:text-neon-cyan transition-transform duration-200 ${
                isCalendarOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Floating Calendar */}
        <AnimatePresence>
          {isCalendarOpen && (
            <motion.div
              id={calendarId}
              ref={calendarContainerRef}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={`absolute left-0 right-0 mx-auto md:mx-0 md:left-auto md:right-0 z-[100] w-[calc(100vw-1.5rem)] sm:w-auto max-w-[325px] sm:max-w-none flex justify-center ${
                calendarOpensUp
                  ? 'bottom-full mb-2 origin-bottom md:origin-bottom-right'
                  : 'top-full mt-2 origin-top md:origin-top-right'
              }`}
            >
              <BusnetCalendar
                selectedDate={searchParams.date}
                onSelect={(val) => {
                  updateParam('date', val);
                  setIsCalendarOpen(false);
                  dateButtonRef.current?.focus();
                }}
                tripContext={
                  resolvedFrom && resolvedTo
                    ? {
                        from: resolvedFrom.names.uk,
                        to: resolvedTo.names.uk,
                      }
                    : undefined
                }
                onClose={() => {
                  setIsCalendarOpen(false);
                  dateButtonRef.current?.focus();
                }}
              />
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
        className="w-full md:w-auto md:ml-3 neon-gradient-btn px-8 sm:px-10 py-3.5 sm:py-4 md:py-5 rounded-[22px] sm:rounded-[24px] text-base font-black uppercase tracking-wider shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
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
  );
}
