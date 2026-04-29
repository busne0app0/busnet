import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import CityAutocomplete from './CityAutocomplete';
import BusnetCalendar from '../common/BusnetCalendar';

interface SearchWidgetProps {
  onSearch: () => void;
  isLoading?: boolean;
}

export default function SearchWidget({ onSearch, isLoading }: SearchWidgetProps) {
  const { searchParams, updateParam, lastUpdatedField, highlightDate } = useSearch();
  const { t } = useLanguage();
  
  const [showValidation, setShowValidation] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Animation controllers for neon highlight feedback
  const controlsFrom = useAnimation();
  const controlsTo = useAnimation();
  const controlsDate = useAnimation();

  const handleSearchClick = () => {
    const isMissing = !searchParams.from || !searchParams.to || !searchParams.date;
    
    if (isMissing) {
      setShowValidation(true);
      
      // Highlight exactly what's missing
      if (!searchParams.from) {
        controlsFrom.start({ 
          boxShadow: ["0 0 0px #F43F5E", "0 0 30px #F43F5E", "0 0 0px #F43F5E"],
          borderColor: ["rgba(255,255,255,0.1)", "#F43F5E", "rgba(255,255,255,0.1)"],
          transition: { duration: 0.8, repeat: 1 }
        });
      }
      if (!searchParams.to) {
        controlsTo.start({ 
          boxShadow: ["0 0 0px #F43F5E", "0 0 30px #F43F5E", "0 0 0px #F43F5E"],
          borderColor: ["rgba(255,255,255,0.1)", "#F43F5E", "rgba(255,255,255,0.1)"],
          transition: { duration: 0.8, repeat: 1 }
        });
      }
      if (!searchParams.date) {
        controlsDate.start({ 
          boxShadow: ["0 0 0px #F43F5E", "0 0 30px #F43F5E", "0 0 0px #F43F5E"],
          borderColor: ["rgba(255,255,255,0.1)", "#F43F5E", "rgba(255,255,255,0.1)"],
          transition: { duration: 0.8, repeat: 1 }
        });
      }

      setTimeout(() => setShowValidation(false), 4000);
      return;
    }

    onSearch();
  };

  useEffect(() => {
    if (lastUpdatedField === 'from') {
      controlsFrom.start({ boxShadow: ["0 0 0px #00D4FF", "0 0 20px #00D4FF", "0 0 0px #00D4FF"], transition: { duration: 0.6 } });
    } else if (lastUpdatedField === 'to') {
      controlsTo.start({ boxShadow: ["0 0 0px #00D4FF", "0 0 20px #00D4FF", "0 0 0px #00D4FF"], transition: { duration: 0.6 } });
    } else if (lastUpdatedField === 'date') {
      controlsDate.start({ boxShadow: ["0 0 0px #00D4FF", "0 0 20px #00D4FF", "0 0 0px #00D4FF"], transition: { duration: 0.6 } });
    } else if (!lastUpdatedField && searchParams.from && searchParams.to) {
      // If all fields updated at once (from suggestion)
      controlsFrom.start({ boxShadow: ["0 0 0px #00D4FF", "0 0 20px #00D4FF", "0 0 0px #00D4FF"] });
      controlsTo.start({ boxShadow: ["0 0 0px #00D4FF", "0 0 20px #00D4FF", "0 0 0px #00D4FF"] });
    }
  }, [searchParams, lastUpdatedField]);

  // Handle click outside for calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('uk-UA', { 
        day: 'numeric', 
        month: 'long' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto mt-2 bg-[#141928]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-2.5 shadow-[0_35px_60px_rgba(0,0,0,0.6)] relative z-20 flex flex-col md:flex-row items-center gap-2 md:gap-0 group">
      
      {/* Validation Interactive Hint */}
      <AnimatePresence>
        {showValidation && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -80, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-1/2 -translate-x-1/2 w-[280px] sm:w-[400px] p-4 bg-rose-600/20 backdrop-blur-2xl border border-rose-500/50 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.3)] z-50 text-center flex items-center justify-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center animate-pulse">
               <MapPin size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-tight leading-none mb-1">{t.validation.header}</p>
              <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest leading-none">{t.validation.fillAll}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* From */}
      <CityAutocomplete 
        label={t.search.from}
        value={searchParams.from}
        onChange={(val) => updateParam('from', val)}
        placeholder={t.search.placeholderFrom}
        icon={<MapPin size={10} />}
        animationControl={controlsFrom}
      />

      <div className="hidden md:block w-[1px] h-12 bg-white/10" />

      {/* To */}
      <CityAutocomplete 
        label={t.search.to}
        value={searchParams.to}
        onChange={(val) => updateParam('to', val)}
        placeholder={t.search.placeholderTo}
        icon={<MapPin size={10} />}
        animationControl={controlsTo}
      />

      <div className="hidden md:block w-[1px] h-12 bg-white/10" />

      {/* Date */}
      <motion.div 
        animate={controlsDate}
        className={`w-full md:flex-1 relative px-6 py-4 md:py-3 transition-all duration-500 rounded-2xl focus-within:ring-1 focus-within:ring-neon-cyan/50 focus-within:shadow-[0_0_15px_rgba(0,212,255,0.2)] ${highlightDate ? 'neon-pulse-glow z-20' : ''}`}
      >
        <div 
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="cursor-pointer group/date"
        >
          <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5 tracking-widest flex items-center gap-1.5 group-hover:text-neon-cyan transition-colors group-hover/date:text-neon-cyan">
            <Calendar size={10} /> {t.search.date}
          </label>
          <div className="flex items-center justify-between">
            <div className={`text-lg font-black italic tracking-tight pr-6 ${searchParams.date ? 'text-white' : 'text-slate-700'}`}>
              {formatDate(searchParams.date) || t.search.date}
            </div>
            <ChevronDown size={14} className={`text-slate-600 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Calendar Popover */}
        <AnimatePresence>
          {isCalendarOpen && (
            <div ref={calendarRef} className="absolute top-full left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-0 mt-4 z-[100] origin-top md:origin-top-right w-[calc(100vw-2rem)] md:w-auto max-w-[340px] md:max-w-none flex justify-center">
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
      </motion.div>

      {/* Search Button */}
      <button 
        onClick={handleSearchClick}
        disabled={isLoading}
        className="w-full md:w-auto md:ml-4 neon-gradient-btn px-10 py-4 md:py-5 rounded-[24px] text-base font-black uppercase tracking-wider shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
      >
        {isLoading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Search size={20} className="text-white" />
        )}
        {isLoading ? `${t.search.search}...` : t.search.search}
      </button>

    </div>
  );
}
