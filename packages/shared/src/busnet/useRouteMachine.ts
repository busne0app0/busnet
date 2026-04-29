import { useState, useEffect, useCallback } from 'react';
import { RouteTemplate, Stop, PricingMode, RouteStatus } from './types';
import { smartParse, autoFixDayOffsets, calculateTripPrices } from './logic';

const DRAFT_KEY = 'busnet_route_draft';

export function useRouteMachine(initialData?: Partial<RouteTemplate>) {
  const [data, setData] = useState<RouteTemplate>({
    name: '',
    direction: 'roundtrip',
    seats: 42,
    currency: 'UAH',
    status: RouteStatus.DRAFT,
    comment: '',
    activeDays: [],
    stopsThere: [],
    stopsBack: [],
    pricesThere: {},
    pricesBack: {},
    pricingMode: PricingMode.SINGLE,
    singlePrice: 0,
    kmRate: 0,
    borderStopIndex: 0,
    zoneAPrice: 0,
    zoneBPrice: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    carrierId: '',
    ...initialData,
  });

  const [parsingThere, setParsingThere] = useState(false);
  const [parsingBack, setParsingBack] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (data.status === RouteStatus.DRAFT) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    }
  }, [data]);

  const loadDraft = useCallback(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setData(parsed);
        return true;
      } catch (e) {
        console.error('Failed to load draft', e);
      }
    }
    return false;
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const updateField = (field: keyof RouteTemplate, value: any) => {
    setData(prev => ({ ...prev, [field]: value, updatedAt: Date.now() }));
  };

  const handleParse = (text: string, dir: 'there' | 'back') => {
    const { stops, errors: parseErrors } = smartParse(text);
    if (parseErrors.length > 0) {
      setErrors(parseErrors);
    }
    
    if (dir === 'there') {
      setData(prev => ({ ...prev, stopsThere: stops, updatedAt: Date.now() }));
    } else {
      setData(prev => ({ ...prev, stopsBack: stops, updatedAt: Date.now() }));
    }
  };

  const mirrorRoute = () => {
    const mirrored = [...data.stopsThere].reverse().map(s => ({
      ...s,
      time: '', // Clear time as per logic
    }));
    
    // Day offset logic for mirror: max - current
    const maxOffset = Math.max(...mirrored.map(s => s.dayOffset || 0));
    const processed = mirrored.map(s => ({
      ...s,
      dayOffset: maxOffset - (s.dayOffset || 0)
    }));

    setData(prev => ({ ...prev, stopsBack: processed, updatedAt: Date.now() }));
  };

  const updateStop = (dir: 'there' | 'back', index: number, field: keyof Stop, value: any) => {
    const stopsField = dir === 'there' ? 'stopsThere' : 'stopsBack';
    const newStops = [...data[stopsField]];
    newStops[index] = { ...newStops[index], [field]: value };
    
    if (field === 'time') {
      autoFixDayOffsets(newStops);
    }
    
    setData(prev => ({ ...prev, [stopsField]: newStops, updatedAt: Date.now() }));
  };

  const addStop = (dir: 'there' | 'back') => {
    const stopsField = dir === 'there' ? 'stopsThere' : 'stopsBack';
    const newStop: Stop = { time: '', dayOffset: 0, city: '', address: '', price: null, lat: null, lng: null };
    setData(prev => ({ ...prev, [stopsField]: [...prev[stopsField], newStop], updatedAt: Date.now() }));
  };

  const removeStop = (dir: 'there' | 'back', index: number) => {
    const stopsField = dir === 'there' ? 'stopsThere' : 'stopsBack';
    const newStops = data[stopsField].filter((_, i) => i !== index);
    setData(prev => ({ ...prev, [stopsField]: newStops, updatedAt: Date.now() }));
  };

  const moveStop = (dir: 'there' | 'back', index: number, direction: 'up' | 'down') => {
    const stopsField = dir === 'there' ? 'stopsThere' : 'stopsBack';
    const newStops = [...data[stopsField]];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStops.length) return;
    
    [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
    setData(prev => ({ ...prev, [stopsField]: newStops, updatedAt: Date.now() }));
  };

  const recalculatePrices = () => {
    const options = {
      singlePrice: data.singlePrice,
      kmRate: data.kmRate,
      borderStopIndex: data.borderStopIndex,
      zoneAPrice: data.zoneAPrice,
      zoneBPrice: data.zoneBPrice,
      // For segment prices, we'll need a way to store them in the state if needed,
      // or extract them from stop prices.
    };
    
    const pricesThere = calculateTripPrices(data.stopsThere, data.pricingMode, options);
    const pricesBack = calculateTripPrices(data.stopsBack, data.pricingMode, options);
    
    setData(prev => ({ ...prev, pricesThere, pricesBack, updatedAt: Date.now() }));
  };

  return {
    data,
    setData,
    updateField,
    handleParse,
    mirrorRoute,
    updateStop,
    addStop,
    removeStop,
    moveStop,
    recalculatePrices,
    loadDraft,
    clearDraft,
    errors,
    setErrors
  };
}
