import React, { useState, useEffect, useRef, useId, useMemo, useCallback } from 'react';
import type { useAnimation } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Search, Loader2, X } from 'lucide-react';
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
  errorId?: string;
  availableCities?: ExtendedCity[];
  isLoading?: boolean;
  onSelectCity?: (city: ExtendedCity) => void;
  onEnter?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  enterKeyHint?: 'next' | 'search' | 'done';
}

export default function CityAutocomplete({
  label,
  value,
  onChange,
  placeholder,
  icon,
  animationControl,
  hasError = false,
  errorId,
  availableCities = [],
  isLoading = false,
  onSelectCity,
  onEnter,
  inputRef: externalInputRef,
  enterKeyHint,
}: CityAutocompleteProps) {
  const { langKey, t } = useLanguage();
  const inputId = useId();
  const listboxId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = (externalInputRef || internalInputRef) as React.RefObject<HTMLInputElement>;
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollOnChange = useRef(false);

  // Закриття списку під час пошуку
  useEffect(() => {
    if (isLoading) setIsOpen(false);
  }, [isLoading]);

  // Закриття при кліку поза компонентом (pointerdown)
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isOpen]);

  // Локалізована назва міста
  const getCityName = useCallback(
    (city: ExtendedCity): string => {
      const names = city.names as { uk?: string; en?: string; it?: string };
      return names[langKey] || names.uk || names.en || Object.values(names)[0] || '';
    },
    [langKey]
  );

  // Попередньо обчислений індекс для блискавичного пошуку
  const searchIndex = useMemo(
    () =>
      availableCities.map((city) => ({
        city,
        keys: Object.values(city.names).filter(Boolean).map(normalizeCityName),
      })),
    [availableCities]
  );

  // Миттєва фільтрація та ранжування (без затримки дебаунсу для локального масиву)
  const suggestions = useMemo(() => {
    const q = normalizeCityName(value.trim());
    if (!q) return [];

    return searchIndex
      .map(({ city, keys }) => {
        let rank = -1;
        if (keys.some((k) => k === q)) {
          rank = 0; // Точний збіг
        } else if (keys.some((k) => k.startsWith(q))) {
          rank = 1; // Префіксний збіг
        } else if (keys.some((k) => k.includes(q))) {
          rank = 2; // Підрядок
        }
        return { city, rank };
      })
      .filter((x) => x.rank >= 0)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        if (!!b.city.popular !== !!a.city.popular) return Number(!!b.city.popular) - Number(!!a.city.popular);
        return getCityName(a.city).localeCompare(getCityName(b.city), langKey);
      })
      .slice(0, 8)
      .map((x) => x.city);
  }, [searchIndex, value, getCityName, langKey]);

  // Скидання індексу при зміні списку
  useEffect(() => {
    setHighlightedIndex(-1);
    optionsRef.current.length = suggestions.length;
  }, [suggestions]);

  // Автоскрол тільки при клавіатурній навігації (не при hover)
  useEffect(() => {
    if (!scrollOnChange.current) return;
    scrollOnChange.current = false;
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'auto',
      });
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeCityQuery(e.target.value);
    onChange(sanitized);
    setHighlightedIndex(-1);
    setIsOpen(sanitized.trim().length > 0);
  };

  const handleSelect = (city: ExtendedCity) => {
    const cityName = getCityName(city);
    onChange(cityName);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelectCity?.(city);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Захист від IME композиції
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
      return;
    }

    if (!isOpen) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && suggestions.length > 0) {
        setIsOpen(true);
        scrollOnChange.current = true;
        setHighlightedIndex(0);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        onEnter?.();
      }
      return;
    }

    if (suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        scrollOnChange.current = true;
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        scrollOnChange.current = true;
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSelect(suggestions[highlightedIndex]);
        } else if (suggestions.length === 1) {
          e.preventDefault();
          handleSelect(suggestions[0]);
        } else {
          onEnter?.();
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const hasNoResults = isOpen && value.trim().length > 0 && suggestions.length === 0;

  return (
    <div className="w-full md:flex-1 relative" ref={containerRef}>
      <motion.div
        animate={animationControl}
        className={`px-4 py-3 md:px-6 cursor-text transition-all rounded-2xl h-full focus-within:ring-1 focus-within:ring-neon-cyan/50 focus-within:shadow-[0_0_15px_rgba(0,212,255,0.2)] ${
          hasError ? 'ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <label
          htmlFor={inputId}
          className="text-[10px] text-slate-400 font-black uppercase block mb-1.5 tracking-widest flex items-center gap-1.5 transition-colors"
        >
          {icon} <span>{label}</span>
          {isLoading && (
            <span className="flex items-center gap-1 text-neon-cyan" aria-hidden="true">
              <Loader2 size={10} className="animate-spin" />
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
            aria-controls={isOpen && suggestions.length > 0 ? listboxId : undefined}
            aria-activedescendant={
              isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length
                ? `${listboxId}-opt-${highlightedIndex}`
                : undefined
            }
            aria-invalid={hasError}
            aria-describedby={hasError && errorId ? errorId : undefined}
            readOnly={isLoading}
            maxLength={64}
            autoCapitalize="words"
            autoCorrect="off"
            enterKeyHint={enterKeyHint}
            value={value}
            onClick={() => {
              if (value.trim().length > 0 && suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            onBlur={(e) => {
              // Закриття при виході табуляцією
              if (!containerRef.current?.contains(e.relatedTarget as Node)) {
                setIsOpen(false);
              }
            }}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent border-none text-white text-base sm:text-lg font-black outline-none placeholder:text-slate-500 italic tracking-tight pr-10 read-only:opacity-50 read-only:cursor-not-allowed"
          />

          {value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={`${t.search.clear}: ${label}`}
              className="absolute right-0 p-2.5 -mr-1.5 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Жива область для скринрідерів */}
      <span className="sr-only" role="status" aria-live="polite">
        {isOpen && suggestions.length > 0
          ? `${suggestions.length} міст знайдено`
          : hasNoResults
          ? t.search.cityNotFound
          : ''}
      </span>

      {/* Dropdown Suggestions */}
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
                {t.search.cityNotFound}
              </div>
            ) : (
              <div
                id={listboxId}
                role="listbox"
                aria-label={label}
                className="max-h-[260px] overflow-y-auto py-1"
                onMouseDown={(e) => e.preventDefault()}
              >
                {suggestions.map((city, index) => {
                  const cityName = getCityName(city);
                  const isHighlighted = highlightedIndex === index;
                  const isSelected = normalizeCityName(cityName) === normalizeCityName(value);

                  return (
                    <div
                      key={city.id}
                      ref={(el) => { optionsRef.current[index] = el; }}
                      id={`${listboxId}-opt-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={-1}
                      onClick={() => handleSelect(city)}
                      onMouseEnter={() => {
                        scrollOnChange.current = false;
                        setHighlightedIndex(index);
                      }}
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
                          {city.popular ? <Star size={13} aria-hidden="true" /> : <MapPin size={13} aria-hidden="true" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight">{cityName}</p>
                          {city.countryCode && city.countryCode !== '??' && (
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
                        aria-hidden="true"
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
