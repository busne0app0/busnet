import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Calendar, ChevronDown, ArrowLeftRight, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { useCities } from '@busnet/shared/hooks/useCities';
import CityAutocomplete from './CityAutocomplete';
import BusnetCalendar from '../common/BusnetCalendar';
import { areCitiesIdentical } from '@busnet/shared/lib/cityUtils';
import { formatLocalizedDate } from '@busnet/shared/lib/dateUtils';

interface SearchWidgetProps {
  onSearch: () => void;
  isLoading?: boolean;
}

export default function SearchWidget({ onSearch, isLoading = false }: SearchWidgetProps) {
  const { searchParams, updateParam, lastUpdatedField, highlightDate } = useSearch();
  const { language = 'uk', t } = useLanguage();
  const { dbCities, loading: citiesLoading } = useCities();

  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ from?: boolean; to?: boolean; date?: boolean }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const calendarTriggerRef = useRef<HTMLDivElement>(null);
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Clear validation timer on unmount (item 10)
  useEffect(() => {
    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, []);

  // Clear validation message when user updates fields
  useEffect(() => {
    if (validationMessage) {
      setValidationMessage(null);
      setErrorFields({});
    }
  }, [searchParams.from, searchParams.to, searchParams.date]);

  // Handle outside clicks for calendar safely without mousedown/click race (item 9)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        calendarContainerRef.current &&
        !calendarContainerRef.current.contains(target) &&
        calendarTriggerRef.current &&
        !calendarTriggerRef.current.contains(target)
      ) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerValidationError = (message: string, fields: { from?: boolean; to?: boolean; date?: boolean }) => {
    setValidationMessage(message);
    setErrorFields(fields);

    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    validationTimerRef.current = setTimeout(() => {
      setValidationMessage(null);
      setErrorFields({});
    }, 6000);
  };

  const handleSearchClick = () => {
    if (isLoading) return; // Prevent double trigger (item 79)

    const fromMissing = !searchParams.from?.trim();
    const toMissing = !searchParams.to?.trim();
    const dateMissing = !searchParams.date?.trim();

    if (fromMissing || toMissing || dateMissing) {
      const msg = t.validation?.fillAll || 'Будь ласка, заповніть місто відправлення, прибуття та дату.';
      triggerValidationError(msg, { from: fromMissing, to: toMissing, date: dateMissing });
      return;
    }

    // Validate identical cities (item 13)
    if (areCitiesIdentical(searchParams.from, searchParams.to)) {
      const msg = t.validation?.sameCities || 'Місто відправлення та прибуття не можуть збігатися.';
      triggerValidationError(msg, { from: true, to: true });
      return;
    }

    setValidationMessage(null);
    setErrorFields({});
    onSearch();
  };

  // Swap cities ⇄ (item 15)
  const handleSwapCities = useCallback(() => {
    setIsSwapping(true);
    const tempFrom = searchParams.from;
    const tempTo = searchParams.to;
    updateParam('from', tempTo);
    updateParam('to', tempFrom);
    setTimeout(() => setIsSwapping(false), 300);
  }, [searchParams.from, searchParams.to, updateParam]);

  const displayDate = formatLocalizedDate(searchParams.date, language);

  return (
    <div className="w-full max-w-[1120px] mx-auto mt-2 bg-[#141928]/90 backdrop-blur-2xl border border-white/10 rounded-[28px] sm:rounded-[32px] p-2.5 sm:p-3 shadow-[0_35px_60px_rgba(0,0,0,0.6)] relative z-20 flex flex-col md:flex-row items-center gap-2 md:gap-0 group">
      
      {/* Validation Alert (Items 62, 73) */}
      <AnimatePresence>
        {validationMessage && (
          <motion.div
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -75, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[440px] p-3.5 bg-rose-600/30 backdrop-blur-2xl border border-rose-500/60 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.35)] z-50 text-left flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/80 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-xs uppercase tracking-tight leading-none mb-1">
                  {t.validation?.header || 'УВАГА'}
                </p>
                <p className="text-rose-200 text-xs font-semibold leading-tight">
                  {validationMessage}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setValidationMessage(null)}
              aria-label="Закрити сповіщення"
              className="text-rose-300 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* From Input */}
      <CityAutocomplete
        label={t.search.from}
        value={searchParams.from}
        onChange={(val) => updateParam('from', val)}
        placeholder={t.search.placeholderFrom}
        icon={<MapPin size={10} />}
        hasError={errorFields.from}
        availableCities={dbCities}
        isLoading={citiesLoading || isLoading}
        onSelectCity={() => {
          // Focus to 'to' field automatically when 'from' is selected (item 81)
          if (!searchParams.to) {
            toInputRef.current?.focus();
          }
        }}
      />

      {/* Swap Button (Item 15) */}
      <div className="relative flex items-center justify-center shrink-0 my-1 md:my-0 md:-mx-2 z-30">
        <button
          type="button"
          onClick={handleSwapCities}
          disabled={isLoading}
          aria-label="Поміняти місцями місто відправлення та прибуття"
          title="Поміняти місцями"
          className={`w-9 h-9 rounded-full bg-[#1b2236] border border-white/15 hover:border-neon-cyan/50 text-slate-300 hover:text-neon-cyan flex items-center justify-center transition-all shadow-md active:scale-90 hover:scale-105 focus-visible:ring-2 focus-visible:ring-neon-cyan ${
            isSwapping ? 'rotate-180 transition-transform duration-300' : ''
          }`}
        >
          <ArrowLeftRight size={14} />
        </button>
      </div>

      {/* To Input */}
      <CityAutocomplete
        label={t.search.to}
        value={searchParams.to}
        onChange={(val) => updateParam('to', val)}
        placeholder={t.search.placeholderTo}
        icon={<MapPin size={10} />}
        hasError={errorFields.to}
        availableCities={dbCities}
        isLoading={citiesLoading || isLoading}
        inputRef={toInputRef}
      />

      <div className="hidden md:block w-[1px] h-10 bg-white/10 mx-1 shrink-0" />

      {/* Date Picker Trigger (Items 9, 14, 58) */}
      <div
        ref={calendarTriggerRef}
        className={`w-full md:flex-1 relative px-4 py-3 md:px-6 transition-all duration-300 rounded-2xl group focus-within:ring-1 focus-within:ring-neon-cyan/50 focus-within:shadow-[0_0_15px_rgba(0,212,255,0.2)] ${
          errorFields.date ? 'ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''
        } ${highlightDate ? 'neon-pulse-glow z-20' : ''}`}
      >
        <button
          type="button"
          onClick={() => setIsCalendarOpen((prev) => !prev)}
          disabled={isLoading}
          aria-haspopup="dialog"
          aria-expanded={isCalendarOpen}
          aria-label={`Дата відправлення: ${displayDate || 'Оберіть дату'}`}
          className="w-full text-left cursor-pointer outline-none group/date"
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
              {displayDate || t.search.date}
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
            <div
              ref={calendarContainerRef}
              className="absolute top-full left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 mt-3 z-[100] origin-top md:origin-top-right w-[calc(100vw-1.5rem)] sm:w-auto max-w-[360px] sm:max-w-none flex justify-center"
            >
              <BusnetCalendar
                selectedDate={searchParams.date}
                onSelect={(val) => {
                  updateParam('date', val);
                  setIsCalendarOpen(false);
                }}
                tripContext={{ from: searchParams.from, to: searchParams.to }}
                onClose={() => setIsCalendarOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Button */}
      <button
        type="button"
        onClick={handleSearchClick}
        disabled={isLoading}
        aria-label={isLoading ? 'Пошук рейсів...' : t.search.search}
        className="w-full md:w-auto md:ml-3 neon-gradient-btn px-8 sm:px-10 py-3.5 sm:py-4 md:py-5 rounded-[22px] sm:rounded-[24px] text-base font-black uppercase tracking-wider shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
      >
        {isLoading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Search size={18} className="text-white shrink-0" />
        )}
        <span className="whitespace-nowrap">
          {isLoading ? `${t.search.search}...` : t.search.search}
        </span>
      </button>

    </div>
  );
}
