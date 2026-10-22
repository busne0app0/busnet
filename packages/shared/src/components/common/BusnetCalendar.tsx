import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bus, Tag, MapPin, X } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { useCalendarSchedule, CalendarDayInfo } from '@busnet/shared/hooks/useCalendarSchedule';
import { formatISODate, isPastDate } from '@busnet/shared/lib/dateUtils';

export interface BusnetCalendarProps {
  selectedDate: string; // Format: YYYY-MM-DD
  onSelect: (date: string) => void;
  tripContext?: { from: string; to: string };
  onClose?: () => void;
}

const TOOLTIP_WIDTH = 210;

// Multilingual amenity names (UK / EN / IT)
const AMENITY_LABELS: Record<string, Record<string, string>> = {
  uk: { wifi: 'Wi-Fi', usb: 'USB', ac: 'Клімат', toilet: 'WC', coffee: 'Кава', tv: 'TV' },
  en: { wifi: 'Wi-Fi', usb: 'USB', ac: 'A/C', toilet: 'WC', coffee: 'Coffee', tv: 'TV' },
  it: { wifi: 'Wi-Fi', usb: 'USB', ac: 'Clima', toilet: 'WC', coffee: 'Caffè', tv: 'TV' },
};

/** Safe parser for YYYY-MM-DD into local Date object without UTC timezone shifts */
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
  const { langKey, t } = useLanguage();
  const amenityMap = AMENITY_LABELS[langKey] || AMENITY_LABELS.uk;
  const calText = t.calendar;

  // Initialize year and month without timezone drift
  const initDate = useMemo(() => {
    const d = parseLocalDate(selectedDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [selectedDate]);

  // Store { year, month } together to eliminate React StrictMode double-step bugs
  const [view, setView] = useState<{ year: number; month: number }>(initDate);
  const viewYear = view.year;
  const viewMonth = view.month;

  const [tooltip, setTooltip] = useState<{ day: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize month when selectedDate changes externally
  useEffect(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const d = parseLocalDate(selectedDate);
      setView({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [selectedDate]);

  // Close calendar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch schedule with query caching
  const { monthTrips, loading } = useCalendarSchedule({
    year: viewYear,
    month: viewMonth,
    from: tripContext?.from,
    to: tripContext?.to,
  });

  // Current day in ISO format
  const todayNow = new Date();
  const todayIso = formatISODate(
    todayNow.getFullYear(),
    todayNow.getMonth() + 1,
    todayNow.getDate()
  );

  // Disable "back" button for current or past months
  const isPastMonth =
    viewYear < todayNow.getFullYear() ||
    (viewYear === todayNow.getFullYear() && viewMonth <= todayNow.getMonth());

  // Deterministic month shift without Date arithmetic overflow
  const shiftMonth = useCallback((delta: number) => {
    setView(({ year, month }) => {
      let newMonth = month + delta;
      let newYear = year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      return { year: newYear, month: newMonth };
    });
    setTooltip(null);
  }, []);

  const handlePrevMonth = useCallback(() => {
    if (!isPastMonth) shiftMonth(-1);
  }, [isPastMonth, shiftMonth]);

  const handleNextMonth = useCallback(() => shiftMonth(1), [shiftMonth]);

  // Select "Today" button
  const handleSelectToday = useCallback(() => {
    const now = new Date();
    setView({ year: now.getFullYear(), month: now.getMonth() });
    const todayStr = formatISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    onSelect(todayStr);
    if (onClose) onClose();
  }, [onSelect, onClose]);

  // Generate 42 calendar grid cells (exact 6 rows, preventing height jumping)
  const cells: GridCell[] = useMemo(() => {
    const items: GridCell[] = [];
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Monday = 0, Sunday = 6
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const startOffset = (firstDay + 6) % 7;

    // Previous month padding
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

    // Current month cells
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

    // Next month padding (exactly 42 cells total)
    const totalRendered = startOffset + daysInCurrentMonth;
    const tailCount = 42 - totalRendered;
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
    if (cell.isPast) return;
    onSelect(cell.date);
    if (onClose) onClose();
  };

  const handleCellHover = (
    e: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>,
    cell: GridCell
  ) => {
    if (cell.monthOffset !== 0 || !cell.trip) {
      setTooltip(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const cellRect = e.currentTarget.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();

    const rawX = cellRect.left - contRect.left + cellRect.width / 2;
    const halfTooltip = TOOLTIP_WIDTH / 2;
    const safeX = Math.max(halfTooltip + 8, Math.min(rawX, contRect.width - halfTooltip - 8));

    // Dynamic height calculation: flip above cell if near bottom of card container
    const spaceBelowCell = contRect.bottom - cellRect.bottom;
    const estimatedHeight = 150;
    const showAbove = spaceBelowCell < estimatedHeight + 10;
    const safeY = showAbove
      ? cellRect.top - contRect.top - estimatedHeight - 8
      : cellRect.top - contRect.top + cellRect.height + 6;

    setTooltip({
      day: cell.day,
      x: safeX,
      y: safeY,
    });
  };

  const daysWithTripsCount = useMemo(
    () => Object.values(monthTrips).filter((t) => t.count > 0).length,
    [monthTrips]
  );

  return (
    <div
      className="cal-wrapper select-none w-full max-w-[310px] sm:max-w-[325px] focus:outline-none"
      ref={containerRef}
      role="region"
      aria-label={calText.ariaLabel}
    >
      <div className="bg-[#0b101b] border border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex flex-col">
            <h2 className="text-white font-black text-sm sm:text-base uppercase tracking-tight font-sans">
              {calText.months[viewMonth]} <span className="text-slate-400 font-semibold text-xs sm:text-sm">{viewYear}</span>
            </h2>
            <div className="text-slate-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_6px_#00D4FF]" aria-hidden="true" />
              {loading
                ? calText.loading
                : calText.daysWithTrips(daysWithTripsCount)}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isPastMonth}
              aria-label={calText.prevMonth}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
                isPastMonth
                  ? 'opacity-25 cursor-not-allowed text-slate-600'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 focus-visible:ring-1 focus-visible:ring-neon-cyan'
              }`}
            >
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              aria-label={calText.selectToday}
              className="px-2 h-7 sm:h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan text-[9px] font-black uppercase tracking-wider hover:bg-neon-cyan/20 transition-all active:scale-95 focus-visible:ring-1 focus-visible:ring-neon-cyan"
            >
              {t.search.today}
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label={calText.nextMonth}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 focus-visible:ring-1 focus-visible:ring-neon-cyan"
            >
              <ChevronRight size={14} aria-hidden="true" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t.validation.close}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all active:scale-95 ml-0.5"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 mb-1 border-b border-white/5 pb-1">
          {calText.weekdays.map((wd, idx) => (
            <div
              key={`${wd}-${idx}`}
              className="text-center text-[9px] font-extrabold text-slate-400 tracking-wider py-0.5"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Grid Container */}
        <div className="relative">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${viewYear}-${viewMonth}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="grid grid-cols-7 gap-1"
            >
              {cells.map((cell) => {
                const isSelected = selectedDate === cell.date;
                const hasTrip = !!cell.trip && cell.trip.count > 0;
                const isOtherMonth = cell.monthOffset !== 0;

                // Month calculation for neighbor days
                const cellMonth = parseInt(cell.date.split('-')[1], 10) - 1;
                const labelParts = [
                  `${cell.day} ${calText.monthsGenitive[cellMonth]}`,
                  cell.isPast ? `(${calText.pastDate})` : '',
                  hasTrip ? calText.tripsAria(cell.trip?.count ?? 0) : '',
                ].filter(Boolean);

                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={cell.isPast}
                    onMouseEnter={(e) => handleCellHover(e, cell)}
                    onMouseLeave={() => setTooltip(null)}
                    onFocus={(e) => handleCellHover(e, cell)}
                    onBlur={() => setTooltip(null)}
                    onClick={() => onCellClick(cell)}
                    aria-label={labelParts.join(', ')}
                    aria-pressed={isSelected}
                    className={`
                      relative h-[30px] sm:h-8 w-full max-w-[36px] mx-auto flex items-center justify-center rounded-lg transition-all group overflow-visible focus-visible:ring-1 focus-visible:ring-neon-cyan focus-visible:z-30 outline-none
                      ${cell.isPast ? 'opacity-25 cursor-not-allowed text-slate-600' : 'cursor-pointer'}
                      ${isOtherMonth && !cell.isPast ? 'opacity-35 hover:opacity-80' : ''}
                      ${hasTrip && !cell.isPast ? 'hover:scale-105 z-10' : ''}
                      ${cell.isToday && !isSelected ? 'ring-1 ring-neon-cyan/40 bg-neon-cyan/5 text-neon-cyan' : ''}
                      ${isSelected ? 'bg-neon-cyan text-slate-950 font-black shadow-[0_0_14px_rgba(0,212,255,0.5)] scale-105 z-20' : ''}
                      ${hasTrip && !isSelected && !cell.isPast ? 'hover:bg-white/10' : ''}
                    `}
                  >
                    <span
                      className={`
                        text-[11px] sm:text-xs font-bold leading-none
                        ${isSelected ? 'text-slate-950 font-black' : ''}
                        ${!isSelected && hasTrip ? 'text-neon-cyan' : ''}
                        ${!isSelected && !hasTrip && !isOtherMonth && !cell.isPast ? 'text-slate-200' : ''}
                        ${isOtherMonth && !isSelected ? 'text-slate-500' : ''}
                      `}
                    >
                      {cell.day}
                    </span>

                    {/* Dot indicator */}
                    {hasTrip && !cell.isPast && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
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
        <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_5px_#00D4FF]" aria-hidden="true" />
            <span>{calText.availableTrips}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" aria-hidden="true" />
            <span>{calText.noTrips}</span>
          </div>
        </div>

        {/* Dynamic Tooltip: wrapped in outer positioning container to avoid transform collision */}
        <AnimatePresence>
          {tooltip && monthTrips[tooltip.day] && (
            <div
              style={{
                left: tooltip.x,
                top: tooltip.y,
              }}
              className="absolute z-[100] -translate-x-1/2 pointer-events-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-[210px] bg-[#0a0f1a]/98 border border-neon-cyan/30 rounded-xl p-3 shadow-2xl backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-black text-xs italic tracking-tight">
                    {tooltip.day} {calText.monthsGenitive[viewMonth]}
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neon-cyan/10 border border-neon-cyan/20">
                    <div className="w-1 h-1 rounded-full bg-neon-cyan animate-pulse" aria-hidden="true" />
                    <span className="text-neon-cyan text-[8px] font-black uppercase tracking-wider">{calText.active}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Bus size={11} className="text-neon-cyan" aria-hidden="true" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{calText.tripsFound}</span>
                    </div>
                    <div className="text-white font-black italic">{monthTrips[tooltip.day].count}</div>
                  </div>

                  {monthTrips[tooltip.day].minPrice > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Tag size={11} className="text-emerald-400" aria-hidden="true" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{calText.lowestPrice}</span>
                      </div>
                      <div className="text-emerald-400 font-black italic">
                        {monthTrips[tooltip.day].minPrice} {monthTrips[tooltip.day].currency}
                      </div>
                    </div>
                  )}

                  {monthTrips[tooltip.day].routes.length > 0 && (
                    <div className="pt-1 border-t border-white/5">
                      <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-0.5 flex items-center gap-1">
                        <MapPin size={9} className="text-neon-cyan" aria-hidden="true" /> {calText.route}
                      </div>
                      <div className="text-white/90 font-bold text-[10px] italic leading-tight break-words">
                        {monthTrips[tooltip.day].routes[0]}
                      </div>
                      {monthTrips[tooltip.day].routes.length > 1 && (
                        <div className="text-[8px] font-bold text-neon-cyan mt-0.5">
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
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
