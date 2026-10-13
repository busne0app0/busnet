import React, { useState, useEffect, useRef, useId, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { MapPin, Star, Search, Loader2, X } from 'lucide-react';
import { City } from '@busnet/shared/data/cities';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { ExtendedCity } from '@busnet/shared/hooks/useCities';
import { sanitizeCityQuery, normalizeCityName } from '@busnet/shared/lib/cityUtils';

export interface CityAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  animationControl?: ReturnType<typeof useAnimation>;
  hasError?: boolean;
  availableCities?: ExtendedCity[];
  isLoading?: boolean;
  onSelectCity?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function CityAutocomplete({
  label,
  value,
  onChange,
  placeholder,
  icon,
  animationControl,
  hasError = false,
  availableCities = [],
  isLoading = false,
  onSelectCity,
  inputRef: externalInputRef,
}: CityAutocompleteProps) {
  const { language = 'uk' } = useLanguage();
  const inputId = useId();
  const listboxId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState(value);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = (externalInputRef || internalInputRef) as React.RefObject<HTMLInputElement>;
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Дебаунс запиту для оптимізації фільтрації
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(value);
    }, 120);
    return () => clearTimeout(handler);
  }, [value]);

  // Закриття при кліку поза полем
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Автоскрол до виділеного елемента при клавіатурній навігації (пункт 2)
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex]);

  // Локалізована назва міста з безпечним мапінгом
  const getCityName = useCallback((city: City | ExtendedCity): string => {
    const raw = language?.toLowerCase();
    const langKey: 'uk' | 'en' | 'it' = raw === 'en' ? 'en' : raw === 'it' ? 'it' : 'uk';
    const names = city.names as { uk?: string; en?: string; it?: string };
    return names[langKey] || names.uk || names.en || Object.values(names)[0] || '';
  }, [language]);

  // Фільтрація та сортування
  const suggestions = useMemo(() => {
    const rawVal = debouncedQuery.trim();
    if (!rawVal) return [];

    const searchStr = normalizeCityName(rawVal);
    if (!searchStr) return [];

    return availableCities
      .filter((city) => {
        const uk = normalizeCityName(city.names.uk || '');
        const en = normalizeCityName(city.names.en || '');
        const it = normalizeCityName(city.names.it || '');
        return uk.includes(searchStr) || en.includes(searchStr) || it.includes(searchStr);
      })
      .sort((a, b) => {
        const aStarts = Object.values(a.names).some((n) =>
          normalizeCityName(n).startsWith(searchStr)
        );
        const bStarts = Object.values(b.names).some((n) =>
          normalizeCityName(n).startsWith(searchStr)
        );
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;

        return 0;
      })
      .slice(0, 8);
  }, [debouncedQuery, availableCities]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeCityQuery(e.target.value);
    onChange(sanitized);
    setHighlightedIndex(-1);
    setIsOpen(sanitized.trim().length > 0);
  };

  const handleSelect = (city: City | ExtendedCity) => {
    const cityName = getCityName(city);
    onChange(cityName);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelectCity?.();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Виправлена клавіатурна навігація (пункт 1: Escape завжди працює)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (!isOpen) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
    }
  };

  const hasNoResults = isOpen && debouncedQuery.trim().length > 0 && suggestions.length === 0 && !isLoading;
  const notFoundText = (language?.toLowerCase() === 'en' ? 'City not found' : language?.toLowerCase() === 'it' ? 'Città non trovata' : 'Місто не знайдено');

  return (
    <div className="w-full md:flex-1 relative" ref={containerRef}>
      <motion.div
        animate={animationControl}
        className={`px-4 py-3 md:px-6 cursor-text transition-all rounded-2xl group h-full focus-within:ring-1 focus-within:ring-neon-cyan/50 focus-within:shadow-[0_0_15px_rgba(0,212,255,0.2)] ${
          hasError ? 'ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <label
          htmlFor={inputId}
          className="text-[10px] text-slate-400 font-black uppercase block mb-1.5 tracking-widest flex items-center gap-1.5 group-hover:text-neon-cyan transition-colors"
        >
          {icon} <span>{label}</span>
          {isLoading && (
            <span className="flex items-center gap-1 text-neon-cyan">
              <Loader2 size={10} className="animate-spin" />
              <span className="sr-only">Завантаження міст...</span>
            </span>
          )}
        </label>

        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={
              highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined
            }
            disabled={isLoading}
            value={value}
            onFocus={() => {
              if (value.trim().length > 0 && suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent border-none text-white text-base sm:text-lg font-black outline-none placeholder:text-slate-500 italic tracking-tight pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={`Очистити поле ${label}`}
              className="absolute right-0 p-1 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Dropdown Suggestions (WAI-ARIA 1.2 Combobox compliant) */}
      <AnimatePresence>
        {(isOpen && (suggestions.length > 0 || hasNoResults)) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 w-full min-w-[260px] bg-[#0a0f1a]/98 border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
          >
            {hasNoResults ? (
              <div className="px-4 py-3.5 text-xs font-semibold text-slate-400 text-center">
                {notFoundText}
              </div>
            ) : (
              <div
                id={listboxId}
                role="listbox"
                aria-label={`Підказки для ${label}`}
                className="max-h-[260px] overflow-y-auto py-1"
                onMouseDown={(e) => e.preventDefault()} // Запобігає втраті фокусу перед кліком (пункт 5)
              >
                {suggestions.map((city, index) => {
                  const cityName = getCityName(city);
                  const isHighlighted = highlightedIndex === index;

                  return (
                    <div
                      key={city.id}
                      ref={(el) => { optionsRef.current[index] = el; }}
                      id={`${listboxId}-opt-${index}`}
                      role="option"
                      aria-selected={isHighlighted}
                      tabIndex={-1}
                      onClick={() => handleSelect(city)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between cursor-pointer transition-all ${
                        isHighlighted
                          ? 'bg-neon-cyan/15 text-neon-cyan'
                          : 'text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            isHighlighted
                              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                              : 'bg-white/5 text-slate-400 border border-white/10'
                          }`}
                        >
                          {city.popular ? <Star size={13} /> : <MapPin size={13} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight">{cityName}</p>
                          {city.countryCode && (
                            <span className="text-[10px] text-slate-500 font-semibold tracking-wider">
                              {city.countryCode}
                            </span>
                          )}
                        </div>
                      </div>
                      <Search
                        size={12}
                        className={`transition-opacity ${
                          isHighlighted ? 'opacity-100 text-neon-cyan' : 'opacity-0'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
