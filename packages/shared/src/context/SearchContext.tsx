import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SearchParams } from '../types';

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
    const today = new Date().toISOString().split('T')[0];
    return {
      from: '',
      to: '',
      date: today
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
