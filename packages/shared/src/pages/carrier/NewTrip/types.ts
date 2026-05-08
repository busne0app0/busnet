// =============================================================
// types.ts — єдине джерело всіх типів NewTrip
// =============================================================

export type Amenity = 'wifi' | 'ac' | 'toilet' | 'usb' | 'coffee';
export type TripDirection = 'outbound' | 'inbound';
export type PriceCurrency = 'ГРН' | 'EUR';
export type ConflictSeverity = 'warning' | 'error';

// FIX #10: три стани замість boolean isConfirmed
export type CityConfirmStatus = 'confirmed' | 'unrecognized' | 'pending';

export interface Stop {
  id: string;
  city: string;
  address: string;
  time: string;        // завжди "HH:mm" з padding'ом
  price: number;
  dayOffset: number;
  priceManuallySet?: boolean;   // FIX #2: флаг ручного введення ціни
  cityStatus?: CityConfirmStatus; // FIX #10: замість boolean isConfirmed
}

export interface DirectionState {
  stops: Stop[];
  days: string[];
}

export interface TripState {
  __version: number;            // FIX #6: версія схеми для localStorage
  routeName: string;
  operator: string;
  seats: number;
  amenities: Amenity[];
  isTransfer: boolean;
  transferType: 'direct' | 'transfer';
  transferCity?: string;
  transferTime?: string;
  currency: PriceCurrency;
  discounts: {
    child04: boolean;
    child412: boolean;
  };
  customDiscounts: { id: string; label: string; value: number }[];
  rules: string[];
  customRules: string[];
  outbound: DirectionState;
  inbound: DirectionState;
}

export interface PriceSegment {
  from: string;
  to: string;
  price: number;
  currency: PriceCurrency;
  key: string; // "from_to" lowercase
}

export interface Conflict {
  step: number;
  message: string;
  severity: ConflictSeverity;
}

export interface ParsedStop {
  city: string;
  address: string;
  time: string;
  isValid: boolean;
  error?: string;
  confidence: number; // 0–1
}
