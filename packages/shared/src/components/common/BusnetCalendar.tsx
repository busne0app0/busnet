import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bus, Tag, MapPin } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { useCalendarSchedule, CalendarDayInfo } from '@busnet/shared/hooks/useCalendarSchedule';
import { formatISODate, isPastDate } from '@busnet/shared/lib/dateUtils';

export interface BusnetCalendarProps {
  selectedDate: string; // Формат: YYYY-MM-DD
  onSelect: (date: string) => void;
  tripContext?: { from: string; to: string };
  onClose?: () => void;
}

// Мультиязичні назви зручностей (UK / EN / IT)
const AMENITY_LABELS: Record<string, Record<string, string>> = {
  UK: { wifi: 'Wi-Fi', usb: 'USB', ac: 'Клімат', toilet: 'WC', coffee: 'Кава', tv: 'TV' },
  EN: { wifi: 'Wi-Fi', usb: 'USB', ac: 'A/C', toilet: 'WC', coffee: 'Coffee', tv: 'TV' },
  IT: { wifi: 'Wi-Fi', usb: 'USB', ac: 'Clima', toilet: 'WC', coffee: 'Caffè', tv: 'TV' },
};

/** Безпечний парсинг YYYY-MM-DD у локальний об'єкт Date без зсуву часових поясів */
function parseLocalDate(dateString: string): Date {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const fallback = new Date();
    fallback.setHours(12, 0, 0, 0);
    return fallback;
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

interface GridCell {
  day: number;
  monthOffset: -1 | 0 | 1; // -1: prev month, 0: current month, 1: next month
  date: string;
  isToday: boolean;
  isPast: boolean;
  trip: CalendarDayInfo | null;
  key: string;
}

export default function BusnetCalendar({
  selectedDate,
  onSelect,
  tripContext,
  onClose,
}: BusnetCalendarProps) {
  const { language = 'UK', t } = useLanguage();
  const currentLang = (language?.toUpperCase() === 'EN' ? 'EN' : language?.toUpperCase() === 'IT' ? 'IT' : 'UK') as 'UK' | 'EN' | 'IT';
  const amenityMap = AMENITY_LABELS[currentLang] || AMENITY_LABELS.UK;
  const calText = t.calendar;

  // Ініціалізація року та місяця без зсуву по таймзоні
  const initDate = useMemo(() => {
    const d = parseLocalDate(selectedDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [selectedDate]);

  const [viewYear, setViewYear] = useState<number>(initDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initDate.month);
  const [tooltip, setTooltip] = useState<{ day: number; x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Синхронізація місяця при зовнішній зміні selectedDate (пункт 2 аудиту)
  useEffect(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const d = parseLocalDate(selectedDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [selectedDate]);

  // Закриття календаря клавішею Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Отримання розкладу через ізольований хук з кешуванням та AbortController
  const { monthTrips, loading } = useCalendarSchedule({
    year: viewYear,
    month: viewMonth,
    from: tripContext?.from,
    to: tripContext?.to,
  });

  // Сьогоднішня дата в ISO
  const todayNow = new Date();
  const todayIso = formatISODate(
    todayNow.getFullYear(),
    todayNow.getMonth() + 1,
    todayNow.getDate()
  );

  // Перемикання місяців
  const handlePrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
    setTooltip(null);
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setTooltip(null);
  }, []);

  // Кнопка «СЬОГОДНІ» обирає сьогоднішню дату
  const handleSelectToday = useCallback(() => {
    setViewYear(todayNow.getFullYear());
    setViewMonth(todayNow.getMonth());
    onSelect(todayIso);
    if (onClose) onClose();
  }, [todayIso, onSelect, onClose]);

  // Генерація клітинок сітки календаря
  const cells: GridCell[] = useMemo(() => {
    const items: GridCell[] = [];
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Зміщення дня тижня (Понеділок = 0, Неділя = 6)
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const startOffset = (firstDay + 6) % 7;

    // Дні попереднього місяця
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonthNum = viewMonth === 0 ? 12 : viewMonth;
    for (let i = 0; i < startOffset; i++) {
      const dayNum = daysInPrevMonth - startOffset + 1 + i;
      const dateStr = formatISODate(prevYear, prevMonthNum, dayNum);
      items.push({
        day: dayNum,
        monthOffset: -1,
        date: dateStr,
        isToday: dateStr === todayIso,
        isPast: isPastDate(dateStr),
        trip: null,
        key: `prev-${dayNum}`,
      });
    }

    // Дні поточного місяця
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = formatISODate(viewYear, viewMonth + 1, d);
      items.push({
        day: d,
        monthOffset: 0,
        date: dateStr,
        isToday: dateStr === todayIso,
        isPast: isPastDate(dateStr),
        trip: monthTrips[d] || null,
        key: `curr-${d}`,
      });
    }

    // Дні наступного місяця
    const totalRendered = startOffset + daysInCurrentMonth;
    const tailCount = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonthNum = viewMonth === 11 ? 1 : viewMonth + 2;
    for (let i = 1; i <= tailCount; i++) {
      const dateStr = formatISODate(nextYear, nextMonthNum, i);
      items.push({
        day: i,
        monthOffset: 1,
        date: dateStr,
        isToday: dateStr === todayIso,
        isPast: isPastDate(dateStr),
        trip: null,
        key: `next-${i}`,
      });
    }

    return items;
  }, [viewYear, viewMonth, monthTrips, todayIso]);

  const onCellClick = (cell: GridCell) => {
    // Минулі дати недоступні для вибору
    if (cell.isPast) return;

    if (cell.monthOffset === -1) {
      handlePrevMonth();
    } else if (cell.monthOffset === 1) {
      handleNextMonth();
    }

    onSelect(cell.date);
    if (onClose) onClose();
  };

  // safeX обчислюється тут одразу, щоб JSX залишався чистим (без IIFE-антипатерну)
  const handleCellHover = (e: React.MouseEvent<HTMLButtonElement>, cell: GridCell) => {
    if (cell.monthOffset !== 0 || !cell.trip) {
      setTooltip(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const cellRect = e.currentTarget.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();

    const rawX = cellRect.left - contRect.left + cellRect.width / 2;
    const halfTooltip = 115; // половина ширини w-[230px]
    const safeX = Math.max(halfTooltip + 8, Math.min(rawX, contRect.width - halfTooltip - 8));

    setTooltip({
      day: cell.day,
      x: safeX,
      y: cellRect.top - contRect.top + cellRect.height + 8,
    });
  };

  const daysWithTripsCount = Object.keys(monthTrips).length;

  return (
    <div
      className="cal-wrapper select-none w-full max-w-[340px] sm:max-w-[420px] focus:outline-none"
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Календар вибору дати"
    >
      <div className="bg-[#0e1420]/95 border border-white/10 rounded-[24px] p-4 sm:p-5 shadow-[0_24px_50px_rgba(0,0,0,0.7)] overflow-hidden relative backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-white font-black text-lg sm:text-xl uppercase tracking-tight font-sans italic">
              {calText.months[viewMonth]} {viewYear}
            </h2>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_#00D4FF]" aria-hidden="true" />
              {loading
                ? calText.loading
                : calText.daysWithTrips(daysWithTripsCount)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Попередній місяць"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              aria-label="Обрати сьогоднішню дату"
              className="px-2.5 sm:px-3 h-9 sm:h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              {t?.search?.today || 'СЬОГОДНІ'}
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Наступний місяць"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 mb-2">
          {calText.weekdays.map((wd) => (
            <div
              key={wd}
              className="text-center text-[10px] font-black text-slate-500 tracking-widest py-1.5"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-7 gap-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewYear}-${viewMonth}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-7 gap-1 col-span-7"
            >
              {cells.map((cell) => {
                const isSelected = selectedDate === cell.date;
                const hasTrip = !!cell.trip && cell.trip.count > 0;
                const isOtherMonth = cell.monthOffset !== 0;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={cell.isPast}
                    onMouseEnter={(e) => handleCellHover(e, cell)}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => onCellClick(cell)}
                    aria-label={`${cell.day} ${calText.monthsGenitive[viewMonth]} ${cell.isPast ? '(минула дата)' : ''} ${hasTrip ? `, знайдено ${cell.trip?.count} рейсів` : ''}`}
                    aria-selected={isSelected}
                    aria-disabled={cell.isPast}
                    className={`
                      relative aspect-square flex items-center justify-center rounded-xl transition-all group overflow-visible focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:z-30 outline-none
                      ${cell.isPast ? 'opacity-25 cursor-not-allowed text-slate-600' : 'cursor-pointer'}
                      ${isOtherMonth && !cell.isPast ? 'opacity-40 hover:opacity-80' : ''}
                      ${hasTrip && !cell.isPast ? 'hover:scale-105 z-10' : ''}
                      ${cell.isToday && !isSelected ? 'bg-neon-cyan/5 border border-neon-cyan/30' : ''}
                      ${isSelected ? 'bg-neon-cyan text-slate-950 font-black border border-neon-cyan shadow-[0_0_20px_rgba(0,212,255,0.4)] scale-105 z-20' : ''}
                      ${hasTrip && !isSelected && !cell.isPast ? 'hover:bg-white/10' : ''}
                    `}
                  >
                    <span
                      className={`
                        text-xs sm:text-sm font-black italic
                        ${isSelected ? 'text-slate-950' : ''}
                        ${!isSelected && hasTrip ? 'text-neon-cyan' : ''}
                        ${!isSelected && !hasTrip && !isOtherMonth && !cell.isPast ? 'text-slate-300' : ''}
                        ${isOtherMonth && !isSelected ? 'text-slate-500' : ''}
                      `}
                    >
                      {cell.day}
                    </span>

                    {/* Dot indicator */}
                    {hasTrip && !cell.isPast && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        <div
                          className={`w-1 h-1 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-neon-cyan shadow-[0_0_4px_#00D4FF]'}`}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_5px_#00D4FF]" aria-hidden="true" />
            {calText.availableTrips}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-white/10 border border-white/20" aria-hidden="true" />
            {calText.noTrips}
          </div>
        </div>

        {/* Dynamic Tooltip — координати вже обчислені в handleCellHover */}
        <AnimatePresence>
          {tooltip && monthTrips[tooltip.day] && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translateX(-50%)',
              }}
              className="absolute z-[100] w-[230px] bg-[#0a0f1a]/98 border border-neon-cyan/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl pointer-events-none"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-white font-black text-sm italic tracking-tight">
                  {tooltip.day} {calText.monthsGenitive[viewMonth]}
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                  <div className="w-1 h-1 rounded-full bg-neon-cyan animate-pulse" aria-hidden="true" />
                  <span className="text-neon-cyan text-[8px] font-black uppercase tracking-wider">ACTIVE</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Bus size={12} className="text-neon-cyan" aria-hidden="true" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{calText.tripsFound}</span>
                  </div>
                  <div className="text-white font-black italic">{monthTrips[tooltip.day].count}</div>
                </div>

                {monthTrips[tooltip.day].minPrice > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Tag size={12} className="text-emerald-400" aria-hidden="true" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{calText.lowestPrice}</span>
                    </div>
                    <div className="text-emerald-400 font-black italic">
                      {monthTrips[tooltip.day].minPrice} {monthTrips[tooltip.day].currency}
                    </div>
                  </div>
                )}

                {monthTrips[tooltip.day].routes.length > 0 && (
                  <div className="pt-1 border-t border-white/5">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <MapPin size={10} className="text-neon-cyan" aria-hidden="true" /> {calText.route}
                    </div>
                    <div className="text-white/90 font-bold text-[10px] italic leading-tight break-words">
                      {monthTrips[tooltip.day].routes[0]}
                    </div>
                    {monthTrips[tooltip.day].routes.length > 1 && (
                      <div className="text-[8px] font-bold text-neon-cyan mt-1">
                        {calText.moreRoutes(monthTrips[tooltip.day].routes.length - 1)}
                      </div>
                    )}
                  </div>
                )}

                {monthTrips[tooltip.day].amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {monthTrips[tooltip.day].amenities.slice(0, 4).map((a) => (
                      <span
                        key={a}
                        className="px-1.5 py-0.5 rounded-md bg-neon-cyan/5 text-neon-cyan text-[8px] font-bold uppercase border border-neon-cyan/15"
                      >
                        {amenityMap[a] || a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
