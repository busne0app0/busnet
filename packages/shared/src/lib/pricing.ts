/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DirectionData {
  stops?: Array<{ id?: string; city?: string; price?: number; [key: string]: any }>;
  prices?: Record<string, any>;
  currency?: string;
  days?: string[];
  [key: string]: any;
}

const num = (x: unknown): number | undefined => {
  if (typeof x === 'number') {
    return Number.isFinite(x) && x > 0 ? x : undefined;
  }
  if (typeof x === 'string') {
    const n = parseFloat(x.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return undefined;
};

/**
 * Отримує ціну між двома зупинками за їх індексами у напрямку.
 * Підтримує формати:
 * 1. "stopIdA|stopIdB" (формат форми збереження NewTrip)
 * 2. "i-j" (індексний формат розрахунку матриці)
 * 3. b.price (legacy ціна окремої зупинки)
 */
export function getSegmentPrice(dir: DirectionData | null | undefined, i: number, j: number): number | null {
  const stops = dir?.stops ?? [];
  const prices = dir?.prices ?? {};
  const a = stops[i];
  const b = stops[j];
  if (!a || !b) return null;

  return (
    num(a.id && b.id ? prices[`${a.id}|${b.id}`] : undefined) ??
    num(prices[`${i}-${j}`]) ??
    num(b.price) ??
    null
  );
}

/**
 * Розраховує діапазон цін і покриття пар зупинок для маршруту
 */
export function getPriceRange(dir: DirectionData | null | undefined): {
  min: number;
  max: number;
  priced: number;
  total: number;
} | null {
  const n = dir?.stops?.length ?? 0;
  if (n < 2) return null;

  const all: number[] = [];
  let total = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      total++;
      const p = getSegmentPrice(dir, i, j);
      if (p !== null && p > 0) {
        all.push(p);
      }
    }
  }

  if (!all.length) return null;
  return {
    min: Math.min(...all),
    max: Math.max(...all),
    priced: all.length,
    total,
  };
}

/**
 * Форматує назву валюти
 */
export function formatCurrency(currency?: string): string {
  if (!currency) return '—';
  const c = currency.trim().toUpperCase();
  if (c === 'UAH' || c === 'ГРН') return 'ГРН';
  if (c === 'EUR') return 'EUR';
  if (c === 'USD') return '$';
  if (c === 'PLN') return 'PLN';
  return c;
}
