import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { SearchParams } from '../types';
import { formatISODate } from '../lib/dateUtils';

/** Returns today's date in YYYY-MM-DD using local timezone (not UTC) */
function getTodayLocalISO(): string {
  const now = new Date();
  return formatISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

const createInitialParams = (): SearchParams => ({
  from: '',
  to: '',
  date: getTodayLocalISO(),
});

interface SearchContextType {
  searchParams: SearchParams;
  setSearchParams: (params: Partial<SearchParams>) => void;
  updateParam: <K extends keyof SearchParams>(key: K, value: SearchParams[K]) => void;
  swapCities: () => void;
  resetSearch: () => void;
  triggerSearch: boolean;
  setTriggerSearch: (val: boolean) => void;
  lastUpdatedField: keyof SearchParams | null;
  highlightDate: boolean;
  setHighlightDate: (val: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParamsState] = useState<SearchParams>(createInitialParams);
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [highlightDate, setHighlightDate] = useState(false);
  const [lastUpdatedField, setLastUpdatedField] = useState<keyof SearchParams | null>(null);

  const setSearchParams = useCallback((params: Partial<SearchParams>) => {
    setSearchParamsState((prev) => ({ ...prev, ...params }));
    setLastUpdatedField(null);
  }, []);

  const updateParam = useCallback(
    <K extends keyof SearchParams>(key: K, value: SearchParams[K]) => {
      setSearchParamsState((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
      setLastUpdatedField(key);
    },
    []
  );

  const swapCities = useCallback(() => {
    setSearchParamsState((prev) => ({ ...prev, from: prev.to, to: prev.from }));
    setLastUpdatedField(null);
  }, []);

  // Advance date if day turned midnight while tab was inactive
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const today = getTodayLocalISO();
        setSearchParamsState((prev) => {
          if (prev.date && prev.date < today) {
            return { ...prev, date: today };
          }
          return prev;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const resetSearch = useCallback(() => {
    setSearchParamsState(createInitialParams());
    setLastUpdatedField(null);
    setTriggerSearch(false);
    setHighlightDate(false);
  }, []);

  const value = useMemo<SearchContextType>(
    () => ({
      searchParams,
      setSearchParams,
      updateParam,
      swapCities,
      resetSearch,
      triggerSearch,
      setTriggerSearch,
      lastUpdatedField,
      highlightDate,
      setHighlightDate,
    }),
    [
      searchParams,
      setSearchParams,
      updateParam,
      swapCities,
      resetSearch,
      triggerSearch,
      lastUpdatedField,
      highlightDate,
    ]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
