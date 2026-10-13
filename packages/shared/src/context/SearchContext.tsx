import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SearchParams } from '../types';
import { formatISODate } from '../lib/dateUtils';

/** Returns today's date in YYYY-MM-DD using local timezone (not UTC) */
function getTodayLocalISO(): string {
  const now = new Date();
  return formatISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

interface SearchContextType {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  updateParam: (key: keyof SearchParams, value: string) => void;
  triggerSearch: boolean;
  setTriggerSearch: (val: boolean) => void;
  lastUpdatedField: keyof SearchParams | null;
  highlightDate: boolean;
  setHighlightDate: (val: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParamsState] = useState<SearchParams>(() => {
    return {
      from: '',
      to: '',
      date: getTodayLocalISO(),
    };
  });
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [highlightDate, setHighlightDate] = useState(false);
  const [lastUpdatedField, setLastUpdatedField] = useState<keyof SearchParams | null>(null);

  const setSearchParams = (params: SearchParams) => {
    setSearchParamsState(params);
    setLastUpdatedField(null); // All fields updated
  };

  const updateParam = (key: keyof SearchParams, value: string) => {
    setSearchParamsState(prev => ({ ...prev, [key]: value }));
    setLastUpdatedField(key);
  };

  return (
    <SearchContext.Provider value={{ 
      searchParams, 
      setSearchParams, 
      updateParam, 
      triggerSearch, 
      setTriggerSearch,
      lastUpdatedField,
      highlightDate,
      setHighlightDate
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
