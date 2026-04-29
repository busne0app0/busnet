import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, History, Search } from 'lucide-react';
import { cities, City } from '@busnet/shared/data/cities';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

interface CityAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  animationControl?: any;
}

export default function CityAutocomplete({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  icon,
  animationControl 
}: CityAutocompleteProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal query state with external value (e.g., when clicking reverse or suggestion)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCityName = (city: City) => {
    // Return name in current UI language if available
    const lang = (language?.toLowerCase() || 'uk') as keyof typeof city.names;
    return city.names[lang] || city.names.uk;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (val.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);

    const filtered = cities.filter(city => {
      const searchStr = val.toLowerCase();
      return (
        city.names.uk.toLowerCase().includes(searchStr) ||
        city.names.en.toLowerCase().includes(searchStr) ||
        city.names.it.toLowerCase().includes(searchStr)
      );
    }).sort((a, b) => {
      // Prioritize exact starts
      const aStarts = Object.values(a.names).some(n => n.toLowerCase().startsWith(val.toLowerCase()));
      const bStarts = Object.values(b.names).some(n => n.toLowerCase().startsWith(val.toLowerCase()));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });

    setSuggestions(filtered.slice(0, 4));
  };

  const handleSelect = (city: City) => {
    const cityName = getCityName(city);
    setQuery(cityName);
    onChange(cityName);
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (query.trim().length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="w-full md:flex-1 relative" ref={containerRef}>
      <motion.div 
        animate={animationControl}
        className="px-4 py-3 md:px-6 cursor-text transition-all rounded-2xl group h-full focus-within:ring-1 focus-within:ring-neon-cyan/50 focus-within:shadow-[0_0_15px_rgba(0,212,255,0.2)]"
      >
        <label className="text-[10px] text-slate-500 font-black uppercase block mb-1.5 tracking-widest flex items-center gap-1.5 group-hover:text-neon-cyan transition-colors">
          {icon} {label}
        </label>
        <input 
          type="text" 
          value={query}
          onFocus={handleFocus}
          onChange={handleInputChange}
          placeholder={placeholder} 
          className="w-full bg-transparent border-none text-white text-lg font-black outline-none placeholder:text-slate-700 italic tracking-tight pr-6"
        />
      </motion.div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 right-0 top-full mt-2 bg-[#0a0f1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl max-w-[300px]"
          >
            <div className="overflow-y-hidden">
              {suggestions.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleSelect(city)}
                  className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-neon-cyan/10 group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-neon-cyan group-hover:border-neon-cyan/30 transition-all">
                      {city.popular ? <Star size={14} /> : <MapPin size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-neon-cyan transition-colors">
                        {getCityName(city)}
                      </p>
                    </div>
                  </div>
                  <Search size={12} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
