// =============================================================
// hooks.ts — вся логіка стану, винесена з компонента
// =============================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TripState, Stop, TripDirection, Conflict } from './types';
import { DEFAULT_TRIP_STATE, SCHEMA_VERSION, STORAGE_KEYS } from './constants';
import {
  generateId,
  recalculateDayOffsets,
  detectConflicts,
  calculateSegments,
  checkCityStatus,
} from './utils';

// -----------------------------------------------------------
// useTripState — єдиний стейт маршруту + авто-збереження
// FIX #6: версіювання схеми в localStorage
// -----------------------------------------------------------
const loadDraft = (): TripState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIP_DRAFT);
    if (!raw) return DEFAULT_TRIP_STATE;
    const parsed = JSON.parse(raw) as TripState;
    // Якщо версія схеми не збігається — скидаємо чернетку
    if (parsed.__version !== SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEYS.TRIP_DRAFT);
      return DEFAULT_TRIP_STATE;
    }
    return { ...DEFAULT_TRIP_STATE, ...parsed };
  } catch {
    return DEFAULT_TRIP_STATE;
  }
};

export const useTripState = () => {
  const [trip, setTrip] = useState<TripState>(loadDraft);

  // Авто-збереження чернетки
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRIP_DRAFT, JSON.stringify(trip));
  }, [trip]);

  const resetTrip = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TRIP_DRAFT);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
    localStorage.removeItem(STORAGE_KEYS.EDITING_ROUTE_ID);
    setTrip(DEFAULT_TRIP_STATE);
  }, []);

  return { trip, setTrip, resetTrip };
};

// -----------------------------------------------------------
// usePriceMemory — FIX #4: єдине джерело правди для цін
// priceMemory — master, stops[].price — похідне
// -----------------------------------------------------------
export const usePriceMemory = (exchangeRate: number) => {
  const [priceMemory, setPriceMemory] = useState<Record<string, number>>({});

  const setSegmentPrice = useCallback(
    (fromCity: string, toCity: string, price: number, currency: 'ГРН' | 'EUR') => {
      const keyFwd = `${fromCity.toLowerCase()}_${toCity.toLowerCase()}`;
      const keyBwd = `${toCity.toLowerCase()}_${fromCity.toLowerCase()}`;

      const mirroredPrice =
        currency === 'ГРН'
          ? exchangeRate > 0 ? Math.round(price / exchangeRate) : 0
          : Math.round(price * exchangeRate);

      setPriceMemory(prev => ({
        ...prev,
        [keyFwd]: price,
        [keyBwd]: mirroredPrice,
      }));
    },
    [exchangeRate]
  );

  // Сумісність з оригінальним updateSegmentPrice (простий режим)
  const updateSegmentPrice = useCallback((key: string, priceValue: number) => {
    const [from, to] = key.split('_');
    const mirroredKey = `${to}_${from}`;
    setPriceMemory(prev => ({ ...prev, [key]: priceValue, [mirroredKey]: priceValue }));
  }, []);

  // Збереження цін зупинок у пам'ять (сумісність з оригіналом)
  const savePricesToMemory = useCallback((stops: Stop[]) => {
    setPriceMemory(prev => {
      const newMemory = { ...prev };
      stops.forEach(stop => {
        if (stop.city && stop.price) {
          newMemory[stop.city.toLowerCase()] = stop.price;
        }
      });
      return newMemory;
    });
  }, []);

  const getPrice = useCallback(
    (fromCity: string, toCity: string): number => {
      const key = `${fromCity.toLowerCase()}_${toCity.toLowerCase()}`;
      return priceMemory[key] || 0;
    },
    [priceMemory]
  );

  return { priceMemory, setPriceMemory, setSegmentPrice, updateSegmentPrice, savePricesToMemory, getPrice };
};

// -----------------------------------------------------------
// useDayOffsets — FIX #1 та #9: єдина функція перерахунку dayOffset
// Замінює дублюючі useEffect і autoCalculateDayOffsets
// -----------------------------------------------------------
export const useDayOffsets = (
  trip: TripState,
  setTrip: React.Dispatch<React.SetStateAction<TripState>>
) => {
  const prevTimesRef = useRef({ out: '', in: '' });

  useEffect(() => {
    const outTimes = trip.outbound.stops.map(s => s.time).join(',');
    const inTimes  = trip.inbound.stops.map(s => s.time).join(',');

    const outChanged = prevTimesRef.current.out !== outTimes;
    const inChanged  = prevTimesRef.current.in  !== inTimes;

    // FIX #1: перераховуємо ТІЛЬКИ якщо часи реально змінились
    if (!outChanged && !inChanged) return;
    prevTimesRef.current = { out: outTimes, in: inTimes };

    setTrip(prev => {
      const newOut = outChanged ? recalculateDayOffsets(prev.outbound.stops) : prev.outbound.stops;
      const newIn  = inChanged  ? recalculateDayOffsets(prev.inbound.stops)  : prev.inbound.stops;

      const outSame = JSON.stringify(newOut) === JSON.stringify(prev.outbound.stops);
      const inSame  = JSON.stringify(newIn)  === JSON.stringify(prev.inbound.stops);
      if (outSame && inSame) return prev;

      return {
        ...prev,
        outbound: { ...prev.outbound, stops: newOut },
        inbound:  { ...prev.inbound,  stops: newIn  },
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    trip.outbound.stops.map(s => s.time).join(','),
    trip.inbound.stops.map(s => s.time).join(','),
  ]);

  // Ручний перерахунок (кнопка в Preview)
  const recalculate = useCallback((type: TripDirection) => {
    setTrip(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        stops: recalculateDayOffsets(prev[type].stops),
      },
    }));
  }, [setTrip]);

  return { recalculate };
};

// -----------------------------------------------------------
// useExchangeRate — FIX #2: оновлення цін із захистом від перезапису
// -----------------------------------------------------------
export const useExchangeRate = (
  trip: TripState,
  setTrip: React.Dispatch<React.SetStateAction<TripState>>,
  initialRate = 0
) => {
  const [exchangeRate, setExchangeRate] = useState(initialRate);

  useEffect(() => {
    if (!exchangeRate || exchangeRate <= 0) return;

    setTrip(prev => {
      const newInbound = prev.inbound.stops.map(inStop => {
        // FIX #2: не перезаписуємо якщо ціна була задана вручну
        if (inStop.priceManuallySet) return inStop;

        const outStop = prev.outbound.stops.find(s => s.city === inStop.city);
        if (outStop && outStop.price > 0) {
          const newPrice = Math.round(outStop.price / exchangeRate);
          return newPrice !== inStop.price ? { ...inStop, price: newPrice } : inStop;
        }
        return inStop;
      });

      // Fallback: оновлюємо outbound з inbound (сумісність з оригіналом)
      const newOutbound = prev.outbound.stops.map(outStop => {
        if (outStop.priceManuallySet) return outStop;
        const inStop = prev.inbound.stops.find(s => s.city === outStop.city);
        if (inStop && inStop.price > 0 && !outStop.price) {
          const newPrice = Math.round(inStop.price * exchangeRate);
          return newPrice !== outStop.price ? { ...outStop, price: newPrice } : outStop;
        }
        return outStop;
      });

      const inboundChanged  = JSON.stringify(newInbound)  !== JSON.stringify(prev.inbound.stops);
      const outboundChanged = JSON.stringify(newOutbound) !== JSON.stringify(prev.outbound.stops);
      if (!inboundChanged && !outboundChanged) return prev;

      return {
        ...prev,
        outbound: { ...prev.outbound, stops: outboundChanged ? newOutbound : prev.outbound.stops },
        inbound:  { ...prev.inbound,  stops: inboundChanged  ? newInbound  : prev.inbound.stops  },
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeRate]);

  return { exchangeRate, setExchangeRate };
};

// -----------------------------------------------------------
// useStopActions — всі мутації зупинок в одному місці
// -----------------------------------------------------------
export const useStopActions = (
  setTrip: React.Dispatch<React.SetStateAction<TripState>>
) => {
  const addStop = useCallback((type: TripDirection) => {
    setTrip(prev => {
      const stops = prev[type].stops;
      const last = stops[stops.length - 1];
      const newStop: Stop = {
        id: generateId(),    // FIX #3: безпечна генерація ID
        city: '',
        address: '',
        time: '12:00',
        dayOffset: last?.dayOffset ?? 0,
        price: last?.price ?? 0,
        priceManuallySet: false,
        cityStatus: 'pending',
      };
      return { ...prev, [type]: { ...prev[type], stops: [...stops, newStop] } };
    });
  }, [setTrip]);

  const removeStop = useCallback((type: TripDirection, id: string) => {
    setTrip(prev => ({
      ...prev,
      [type]: { ...prev[type], stops: prev[type].stops.filter(s => s.id !== id) },
    }));
  }, [setTrip]);

  const insertStop = useCallback((type: TripDirection, index: number) => {
    setTrip(prev => {
      const newStop: Stop = {
        id: generateId(),
        city: '', address: '', time: '', price: 0, dayOffset: 0,
        priceManuallySet: false, cityStatus: 'pending',
      };
      const newStops = [...prev[type].stops];
      newStops.splice(index, 0, newStop);
      return { ...prev, [type]: { ...prev[type], stops: newStops } };
    });
  }, [setTrip]);

  const updateStop = useCallback(
    (type: TripDirection, id: string, updates: Partial<Stop>) => {
      setTrip(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          stops: prev[type].stops.map(s => {
            if (s.id !== id) return s;
            // FIX #2: якщо оновлюється price вручну — ставимо флаг
            const priceManuallySet =
              updates.price !== undefined ? true : s.priceManuallySet;
            return { ...s, ...updates, priceManuallySet };
          }),
        },
      }));
    },
    [setTrip]
  );

  const reorderStops = useCallback(
    (type: TripDirection, newStops: Stop[]) => {
      setTrip(prev => ({ ...prev, [type]: { ...prev[type], stops: newStops } }));
    },
    [setTrip]
  );

  // Верифікація міста в БД після зміни назви
  const verifyCity = useCallback(async (type: TripDirection, id: string, city: string) => {
    setTrip(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        stops: prev[type].stops.map(s =>
          s.id === id ? { ...s, cityStatus: 'pending' } : s
        ),
      },
    }));
    const status = await checkCityStatus(city);
    setTrip(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        stops: prev[type].stops.map(s =>
          s.id === id ? { ...s, cityStatus: status } : s
        ),
      },
    }));
  }, [setTrip]);

  return { addStop, removeStop, insertStop, updateStop, reorderStops, verifyCity };
};

// -----------------------------------------------------------
// useConflicts — FIX #10: обчислення конфліктів винесено в хук
// -----------------------------------------------------------
export const useConflicts = (trip: TripState): Conflict[] => {
  return useMemo(() => detectConflicts(trip), [trip]);
};

// -----------------------------------------------------------
// useSegments — FIX #3: memoized сегменти, обчислюються 1 раз
// -----------------------------------------------------------
export const useSegments = (
  trip: TripState,
  priceMemory: Record<string, number>
) => {
  return useMemo(
    () => calculateSegments(trip.outbound.stops, priceMemory),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trip.outbound.stops, priceMemory]
  );
};

// -----------------------------------------------------------
// useWizardNavigation — FIX #7 і #10
// -----------------------------------------------------------
export const useWizardNavigation = (
  conflicts: Conflict[],
  onFinalStep: () => void,
  totalSteps = 7
) => {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, currentStep.toString());
  }, [currentStep]);

  const nextStep = useCallback(() => {
    if (currentStep === totalSteps) {
      onFinalStep();
      return true;
    }
    const hasErrors = conflicts.some(
      c => c.step === currentStep && c.severity === 'error'
    );
    if (hasErrors) return false;
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    return true;
  }, [currentStep, conflicts, onFinalStep, totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  return { currentStep, setCurrentStep, nextStep, prevStep, goToStep };
};
