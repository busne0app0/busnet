import { BUSNET_RX } from './constants';
import { Stop, PricingMode } from './types';

export function timeToMin(t: string): number {
  if (!t || !t.includes(':')) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function capitalize(str: string): string {
  return str ? str.replace(/\b([а-яіїєa-z])/gi, (c) => c.toUpperCase()) : '';
}

export function smartParse(text: string): { stops: Stop[]; errors: string[] } {
  const stops: Stop[] = [];
  const errors: string[] = [];
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  let cur: Stop | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (BUSNET_RX.SKIP_LINE.test(line)) continue;

    const tMatch = line.match(BUSNET_RX.TIME);

    if (tMatch) {
      if (cur && (cur.city || cur.address)) stops.push(cur);

      let dayOffset = 0;
      const dMatch = line.match(BUSNET_RX.DAY_PLUS);
      if (dMatch) {
        dayOffset = parseInt(dMatch[1]) || 1;
      } else if (stops.length > 0) {
        const prev = stops[stops.length - 1];
        const prevMin = timeToMin(prev.time) + (prev.dayOffset || 0) * 1440;
        const curMin = timeToMin(tMatch[1].padStart(2, '0') + ':' + tMatch[2]);
        if (curMin < prevMin - 30) {
          dayOffset = (prev.dayOffset || 0) + 1;
        } else {
          dayOffset = prev.dayOffset || 0;
        }
      }

      let price: number | null = null;
      const pMatch = line.match(BUSNET_RX.PRICE);
      if (pMatch) price = parseInt(pMatch[1].replace(/\s/g, ''));

      let rest = line
        .replace(tMatch[0], '')
        .replace(BUSNET_RX.MONTHS_UK, '')
        .replace(pMatch ? pMatch[0] : '', '')
        .replace(dMatch ? dMatch[0] : '', '')
        .replace(/[—–\-,|:]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      let city = '', address = '';
      const parts = rest.split(/[,\/\\]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        city = capitalize(parts[0]);
        address = parts.slice(1).join(', ');
      } else if (rest) {
        if (BUSNET_RX.ADDRESS.test(rest)) {
          address = rest;
        } else {
          city = capitalize(rest);
        }
      } else {
        errors.push(`Рядок ${i + 1}: час знайдено, але місто відсутнє`);
      }

      cur = {
        time: tMatch[1].padStart(2, '0') + ':' + tMatch[2],
        dayOffset, city, address, price,
        lat: null, lng: null,
      };

    } else if (cur) {
      const pMatch = line.match(BUSNET_RX.PRICE);
      if (pMatch && !cur.price) {
        cur.price = parseInt(pMatch[1].replace(/\s/g, ''));
      } else if (!cur.city && !BUSNET_RX.ADDRESS.test(line) && line.length < 60) {
        cur.city = capitalize(line.replace(/[.,]/g, '').trim());
      } else if (!cur.address && line.length < 120) {
        cur.address = (cur.address ? cur.address + ' ' : '') + line;
      }
    } else {
      errors.push(`Рядок ${i + 1}: "${line.slice(0, 40)}" — час не знайдено, пропущено`);
    }
  }
  if (cur && (cur.city || cur.address)) stops.push(cur);
  return { stops, errors };
}

export function autoFixDayOffsets(arr: Stop[]) {
  for (let i = 1; i < arr.length; i++) {
    if (!arr[i].time || !arr[i - 1].time) continue;
    const prevAbs = timeToMin(arr[i - 1].time) + (arr[i - 1].dayOffset || 0) * 1440;
    const curTime = timeToMin(arr[i].time);
    if (curTime + (arr[i].dayOffset || 0) * 1440 < prevAbs - 30) {
      arr[i].dayOffset = (arr[i - 1].dayOffset || 0) + 1;
    }
    if (curTime + arr[i].dayOffset * 1440 > prevAbs + 1440) {
      const reduced = arr[i].dayOffset - 1;
      if (reduced >= 0 && curTime + reduced * 1440 >= prevAbs - 30) {
        arr[i].dayOffset = reduced;
      }
    }
  }
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const d2r = Math.PI / 180;
  const dLat = (lat2 - lat1) * d2r;
  const dLon = (lon2 - lon1) * d2r;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateTripPrices(
  stops: Stop[],
  mode: PricingMode,
  options: {
    singlePrice?: number;
    kmRate?: number;
    borderStopIndex?: number;
    zoneAPrice?: number;
    zoneBPrice?: number;
    segmentPrices?: Record<number, number>;
    manualMatrix?: Record<string, number>;
  }
): Record<string, number> {
  const prices: Record<string, number> = {};

  if (mode === PricingMode.SINGLE && options.singlePrice) {
    for (let f = 0; f < stops.length - 1; f++) {
      for (let t = f + 1; t < stops.length; t++) {
        prices[`${f}-${t}`] = options.singlePrice;
      }
    }
  } else if (mode === PricingMode.SEGMENT && options.segmentPrices) {
    for (let from = 0; from < stops.length - 1; from++) {
      let cumulative = 0;
      for (let to = from + 1; to < stops.length; to++) {
        cumulative += options.segmentPrices[to - 1] || 0;
        prices[`${from}-${to}`] = cumulative;
      }
    }
  } else if (mode === PricingMode.ZONES && options.borderStopIndex !== undefined) {
    const border = options.borderStopIndex;
    const zA = options.zoneAPrice || 0;
    const zB = options.zoneBPrice || 0;
    for (let from = 0; from < stops.length - 1; from++) {
      for (let to = from + 1; to < stops.length; to++) {
        const key = `${from}-${to}`;
        if (from >= border) {
          prices[key] = zB;
        } else if (to > border) {
          prices[key] = zA + zB;
        } else {
          prices[key] = zA;
        }
      }
    }
  } else if (mode === PricingMode.KM && options.kmRate) {
    const rate = options.kmRate;
    for (let f = 0; f < stops.length - 1; f++) {
      for (let t = f + 1; t < stops.length; t++) {
        const s1 = stops[f];
        const s2 = stops[t];
        if (s1.lat && s1.lng && s2.lat && s2.lng) {
          prices[`${f}-${t}`] = Math.round(haversine(s1.lat, s1.lng, s2.lat, s2.lng) * rate);
        }
      }
    }
  } else if (mode === PricingMode.MATRIX && options.manualMatrix) {
    return { ...options.manualMatrix };
  }

  return prices;
}
