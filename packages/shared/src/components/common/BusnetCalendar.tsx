import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bus, Tag, Map, Clock, ExternalLink } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../../types';

interface BusnetCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  tripContext?: { from: string; to: string };
  onClose?: () => void;
}

export default function BusnetCalendar({ selectedDate, onSelect, tripContext, onClose }: BusnetCalendarProps) {
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    // Ensure we are at noon to avoid timezone issues during month switching
    d.setHours(12, 0, 0, 0);
    return d;
  });
  
  const [monthTrips, setMonthTrips] = useState<Record<number, { count: number; minPrice: number; routes: string[]; amenities: string[] }>>({});
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState<{ day: number; x: number; y: number } | null>(null);

  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth();

  const MONTHS_UK = [
    'Січень', 'Лютий', 'Березень', 'Квітень',
    'Травень', 'Червень', 'Липень', 'Серпень',
    'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];
  const MONTHS_GEN = [
    'січня', 'лютого', 'березня', 'квітня',
    'травня', 'червня', 'липня', 'серпня',
    'вересня', 'жовтня', 'листопада', 'грудня'
  ];
  
  const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];

  const plural = (n: number, forms: [string, string, string]) => {
    const cases = [2, 0, 1, 1, 1, 2];
    return forms[(n % 100 > 4 && n % 100 < 20) ? 2 : cases[(n % 10 < 5) ? n % 10 : 5]];
  };

  const ICON = {
    bus: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/><path d="M7 8h10M7 12h5"/></svg>,
    tag: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    map: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    clock: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  };

  const AMENITY_MAP: Record<string, string> = {
    wifi: 'Wi-Fi',
    usb: 'USB',
    ac: 'Клімат',
    toilet: 'WC',
    coffee: 'Кава',
    tv: 'TV'
  };

  // Fetch trips for the current month
  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      const startOfMonth = new Date(curYear, curMonth, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(curYear, curMonth + 1, 0).toISOString().split('T')[0];

      try {
        let query = supabase
          .from('trips')
          .select('*')
          .eq('status', 'active')
          .gte('departure_date', startOfMonth)
          .lte('departure_date', endOfMonth);

        // If we have search context, filter trips by route to show relevant dots
        if (tripContext?.from) {
          query = query.eq('departure_city', tripContext.from);
        }
        if (tripContext?.to) {
          query = query.eq('arrival_city', tripContext.to);
        }

        const { data, error } = await query;
        if (error) throw error;

        const tripsData: Record<number, any> = {};

        (data || []).forEach(trip => {
          const day = new Date(trip.departure_date).getDate();

          if (!tripsData[day]) {
            tripsData[day] = { count: 0, minPrice: Infinity, routes: [], amenities: [] };
          }

          tripsData[day].count += 1;
          tripsData[day].minPrice = Math.min(tripsData[day].minPrice, trip.price);
          const routeStr = `${trip.departure_city} → ${trip.arrival_city}`;
          if (!tripsData[day].routes.includes(routeStr)) {
            tripsData[day].routes.push(routeStr);
          }
          trip.amenities?.forEach((a: string) => {
            if (!tripsData[day].amenities.includes(a)) tripsData[day].amenities.push(a);
          });
        });

        setMonthTrips(tripsData);
      } catch (err) {
        console.error("Error fetching calendar data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthData();
  }, [curYear, curMonth, tripContext?.from, tripContext?.to]);

  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(curYear, curMonth, 1).getDay();
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInPrevMonth = new Date(curYear, curMonth, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(curYear, curMonth - 1, 15));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(curYear, curMonth + 1, 15));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = useMemo(() => {
    const items = [];
    
    // Prev month filler
    for (let i = 0; i < offset; i++) {
      items.push({ 
        day: daysInPrevMonth - offset + 1 + i, 
        type: 'other', 
        key: `prev-${i}` 
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dt = new Date(curYear, curMonth, d);
      dt.setHours(0,0,0,0);
      
      items.push({
        day: d,
        type: 'current',
        date: dateStr,
        isToday: dt.getTime() === today.getTime(),
        trip: monthTrips[d] || null,
        key: `curr-${d}`
      });
    }

    // Next month filler
    const total = offset + daysInMonth;
    const tail = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= tail; i++) {
      items.push({ 
        day: i, 
        type: 'other', 
        key: `next-${i}` 
      });
    }

    return items;
  }, [curYear, curMonth, monthTrips, offset, daysInMonth, daysInPrevMonth]);

  const onDayClick = (date: string) => {
    onSelect(date);
    if (onClose) onClose();
  };

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="cal-wrapper select-none w-full max-w-[340px] sm:max-w-[420px]" ref={containerRef}>
      <div className="bg-[#0e1420] border border-white/10 rounded-[24px] p-5 shadow-[0_24px_48px_rgba(0,0,0,0.5)] overflow-hidden relative backdrop-blur-3xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-0.5">
            <div className="text-white font-black text-lg sm:text-xl uppercase tracking-tight font-sans italic">
              {MONTHS_UK[curMonth]} {curYear}
            </div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_#00D4FF]" />
              {Object.keys(monthTrips).length} {plural(Object.keys(monthTrips).length, ['день', 'дні', 'днів'])} з рейсами
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan/20 transition-all active:scale-95"
            >
              {t.search.today}
            </button>
            <button 
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 mb-2">
          {weekdays.map(wd => (
            <div key={wd} className="text-center text-[10px] font-black text-slate-600 tracking-widest py-2">
              {wd}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${curYear}-${curMonth}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 gap-1 col-span-7"
            >
              {cells.map((cell) => {
                const isSelected = selectedDate === cell.date;
                const hasTrip = !!cell.trip;
                
                return (
                  <div 
                    key={cell.key}
                    onMouseEnter={(e) => {
                      if (cell.trip) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const containerRect = containerRef.current?.getBoundingClientRect();
                        if (containerRect) {
                          setTooltip({ 
                            day: cell.day!, 
                            x: rect.left - containerRect.left + rect.width / 2, 
                            y: rect.top - containerRect.top + rect.height + 8
                          });
                        }
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => cell.date && onDayClick(cell.date)}
                    className={`
                      relative aspect-square flex items-center justify-center rounded-xl cursor-default transition-all group overflow-visible
                      ${cell.type === 'other' ? 'opacity-20 pointer-events-none' : ''}
                      ${hasTrip ? 'cursor-pointer hover:scale-110 z-10' : ''}
                      ${cell.isToday && !isSelected ? 'bg-neon-cyan/5 border border-neon-cyan/20' : ''}
                      ${isSelected ? 'bg-neon-cyan border border-neon-cyan shadow-[0_0_20px_rgba(0,212,255,0.4)] scale-105 z-20' : ''}
                      ${hasTrip && !isSelected ? 'hover:bg-white/5' : ''}
                    `}
                  >
                    <span className={`
                      text-sm font-black italic
                      ${cell.type === 'other' ? 'text-slate-500' : 'text-slate-300'}
                      ${hasTrip && !isSelected ? 'text-neon-cyan' : ''}
                      ${cell.isToday && !isSelected ? 'text-white' : ''}
                      ${isSelected ? 'text-white' : ''}
                    `}>
                      {cell.day}
                    </span>

                    {/* Indicators */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {hasTrip && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-neon-cyan'}`} />}
                      {cell.isToday && !hasTrip && <div className="w-1 h-1 rounded-full bg-slate-500" />}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_5px_#00D4FF]" />
            Рейси доступні
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-white/5 border border-white/20" />
            Немає рейсів
          </div>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && monthTrips[tooltip.day] && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              style={{ 
                left: tooltip.x, 
                top: tooltip.y,
                transform: 'translateX(-50%)'
              }}
              className="absolute z-[100] w-[220px] bg-[#0a0f1a] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl pointer-events-none"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-white font-black text-sm italic tracking-tight">
                  {tooltip.day} {MONTHS_GEN[curMonth]}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                   <div className="w-1 h-1 rounded-full bg-neon-cyan animate-pulse" />
                   <span className="text-neon-cyan text-[8px] font-black uppercase tracking-wider">ACTIVE</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2.5 text-[#5a6a85]">
                    <span className="text-neon-cyan/60">{ICON.bus}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Рейсів знайдено</span>
                  </div>
                  <div className="text-white font-black text-xs italic">{monthTrips[tooltip.day].count}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[#5a6a85]">
                    <span className="text-neon-cyan/60">{ICON.tag}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Найнижча ціна</span>
                  </div>
                  <div className="text-emerald-400 font-black text-xs italic">€{monthTrips[tooltip.day].minPrice}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[#5a6a85]">
                    <span className="text-neon-cyan/60">{ICON.map}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Маршрут</span>
                  </div>
                  <div className="text-white/80 font-bold text-[9px] italic truncate max-w-[80px]">
                    {monthTrips[tooltip.day].routes[0]?.split(' → ')[0] || '-'}
                  </div>
                </div>

                {monthTrips[tooltip.day].routes.length > 1 && (
                  <>
                    <div className="h-px bg-white/5 my-2" />
                    <div className="flex flex-wrap gap-1.5">
                      {monthTrips[tooltip.day].routes.slice(1, 4).map((r, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] font-bold text-slate-400">
                          {r}
                        </span>
                      ))}
                      {monthTrips[tooltip.day].routes.length > 4 && (
                        <span className="text-[8px] font-black text-neon-cyan uppercase">+{monthTrips[tooltip.day].routes.length - 4} MORE</span>
                      )}
                    </div>
                  </>
                )}

                {monthTrips[tooltip.day].amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {monthTrips[tooltip.day].amenities.slice(0, 4).map((a, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-md bg-neon-cyan/5 text-neon-cyan text-[8px] font-bold uppercase border border-neon-cyan/10">
                        {AMENITY_MAP[a] || a}
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
