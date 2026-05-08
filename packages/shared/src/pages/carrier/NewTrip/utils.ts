// =============================================================
// utils.ts — чисті функції без сайд-ефектів
// =============================================================

import { Stop, ParsedStop, Conflict, TripState, PriceSegment } from './types';
import { TWO_WORD_CITIES, KNOWN_CITIES_MOCK, DAY_MAP, DAYS_OF_WEEK } from './constants';

// -----------------------------------------------------------
// ГЕНЕРАЦІЯ ID — FIX #3 (crypto.randomUUID без помилок на HTTP)
// -----------------------------------------------------------
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Поліфіл для HTTP / старих браузерів
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

// -----------------------------------------------------------
// НОРМАЛІЗАЦІЯ ЧАСУ — FIX #9: "9:5" → "09:05"
// -----------------------------------------------------------
export const normalizeTime = (raw: string): string | null => {
  const match = raw.match(/([01]?\d|2[0-3])[:.h]([0-5]?\d)/);
  if (!match) return null;
  const h = match[1].padStart(2, '0');
  const m = match[2].padStart(2, '0');
  return `${h}:${m}`;
};

// -----------------------------------------------------------
// ВИРАХУВАННЯ ХВИЛИН від початку маршруту (з урахуванням dayOffset)
// -----------------------------------------------------------
export const toMinutes = (stop: Stop): number => {
  if (!stop.time) return stop.dayOffset * 1440;
  const [h, m] = stop.time.split(':').map(Number);
  return stop.dayOffset * 1440 + h * 60 + m;
};

// -----------------------------------------------------------
// ПЕРЕРАХУНОК dayOffset — FIX #9: єдина функція замість двох дублів
// -----------------------------------------------------------
export const recalculateDayOffsets = (stops: Stop[]): Stop[] => {
  if (stops.length === 0) return stops;
  let currentOffset = 0;
  return stops.map((stop, idx) => {
    if (idx === 0) return { ...stop, dayOffset: 0 };
    const prev = stops[idx - 1];
    if (prev.time && stop.time) {
      const [ph, pm] = prev.time.split(':').map(Number);
      const [ch, cm] = stop.time.split(':').map(Number);
      if (ch * 60 + cm < ph * 60 + pm) currentOffset += 1;
    }
    return { ...stop, dayOffset: currentOffset };
  });
};

// -----------------------------------------------------------
// ПАРСЕР РЯДКІВ РОЗКЛАДУ (простий режим — одна зупинка на рядок)
// FIX #1 (двослівні міста), #5 (confidence), #9 (normalizeTime)
// -----------------------------------------------------------
const formatValue = (val: string) =>
  val.trim().replace(/^[-—|.,\s]+|[-—|.,\s]+$/g, '');

export const parseScheduleLines = (text: string): ParsedStop[] => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  return lines.map(line => {
    const rawTime = normalizeTime(line);
    if (!rawTime) {
      return { city: '', address: '', time: '', isValid: false, error: 'Час не знайдено', confidence: 0 };
    }

    const rest = line.replace(/([01]?\d|2[0-3])[:.h]([0-5]?\d)/, '').trim();

    const delimiterMatch = rest.match(/[,|—\-;]/);
    let city: string;
    let address: string;

    if (delimiterMatch && delimiterMatch.index !== undefined) {
      city    = formatValue(rest.slice(0, delimiterMatch.index));
      address = formatValue(rest.slice(delimiterMatch.index + 1));
    } else {
      const words = rest.trim().split(/\s+/);
      const twoWord   = words.slice(0, 2).join(' ').toLowerCase();
      const threeWord = words.slice(0, 3).join(' ').toLowerCase();

      if (words.length > 2 && TWO_WORD_CITIES.has(threeWord)) {
        city    = words.slice(0, 3).join(' ');
        address = words.slice(3).join(' ');
      } else if (words.length > 1 && TWO_WORD_CITIES.has(twoWord)) {
        city    = words.slice(0, 2).join(' ');
        address = words.slice(2).join(' ');
      } else if (words.length > 3) {
        city    = words[0];
        address = words.slice(1).join(' ');
      } else {
        city    = rest.trim();
        address = '';
      }
    }

    const confidence = city.length > 2
      ? (address ? 1.0 : (delimiterMatch ? 0.8 : 0.6))
      : 0.3;

    return {
      city:    formatValue(city),
      address: formatValue(address),
      time:    rawTime,
      isValid: city.length > 2,
      confidence,
    };
  });
};

// -----------------------------------------------------------
// ПАРСЕР БЛОЧНОГО РОЗКЛАДУ (4-рядковий блок — оригінальний алгоритм)
// Зберігаємо з оригінального NewTrip.tsx, адаптуємо сигнатуру
// -----------------------------------------------------------
export const parseBlockSchedule = (
  text: string,
  priceMemory: Record<string, number>,
  exchangeRate: number,
  currency: string
): { outbound: Omit<Stop, 'id'>[]; inbound: Omit<Stop, 'id'>[] } => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const timeRegex = /([01]?\d|2[0-3])[:.]([0-5]\d)/;

  const dayOrder = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];

  const getDayIdx = (str: string): number => {
    if (!str) return -1;
    const lower = str.toLowerCase().replace(/['''`']/g, '').trim();
    const searchMap: Record<string, string> = {
      'понеділок': 'ПН', 'вівторок': 'ВТ', 'середа': 'СР',
      'четвер': 'ЧТ', 'пятниця': 'ПТ', 'субота': 'СБ', 'неділя': 'НД',
    };
    for (const [name, short] of Object.entries(searchMap)) {
      if (lower.includes(name)) return dayOrder.indexOf(short);
    }
    for (const short of dayOrder) {
      if (lower.includes(short.toLowerCase())) return dayOrder.indexOf(short);
    }
    return -1;
  };

  const newOutboundStops: Omit<Stop, 'id'>[] = [];
  const newInboundStops: Omit<Stop, 'id'>[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const timeMatch1 = line.match(timeRegex);
    if (!timeMatch1) continue;

    const outboundTime = timeMatch1[0];
    const city = lines[i + 1] || 'Місто';

    let address = '';
    let inboundTimeLine = '';
    let k = -1;

    for (let scan = 1; scan <= 4; scan++) {
      const scanLine = lines[i + scan];
      if (!scanLine) continue;
      if (scanLine.startsWith('(')) {
        address = scanLine;
      } else if (timeRegex.test(scanLine) && scanLine !== line) {
        inboundTimeLine = scanLine;
        k = i + scan;
        break;
      }
    }

    if (k !== -1) {
      const inboundTimeMatch = inboundTimeLine.match(timeRegex);
      if (inboundTimeMatch) {
        const inboundTime = inboundTimeMatch[0];
        const cleanCity = city.replace(/[(),]/g, '').trim();

        if (cleanCity) {
          const uahPrice = priceMemory[cleanCity.toLowerCase()] || 0;
          const outDayIdx = getDayIdx(line);
          const inDayIdx  = getDayIdx(inboundTimeLine);

          newOutboundStops.push({
            city: cleanCity,
            address: address || '',
            time: outboundTime,
            price: uahPrice,
            dayOffset: outDayIdx >= 0 ? outDayIdx : 0,
            priceManuallySet: false,
            cityStatus: 'pending',
          });

          newInboundStops.push({
            city: cleanCity,
            address: address || '',
            time: inboundTime,
            price: 0,
            dayOffset: inDayIdx >= 0 ? inDayIdx : 0,
            priceManuallySet: false,
            cityStatus: 'pending',
          });
        }
      }
      i = k;
    }
  }

  if (newOutboundStops.length === 0) return { outbound: [], inbound: [] };

  const firstOutDay = newOutboundStops[0].dayOffset;
  const finalOutbound = newOutboundStops.map(s => ({
    ...s,
    dayOffset: s.dayOffset >= 0 && firstOutDay >= 0 ? (s.dayOffset - firstOutDay + 7) % 7 : 0,
  }));

  const reversedInbound = [...newInboundStops].reverse();
  const firstInDay = reversedInbound[0].dayOffset;
  const finalInbound = reversedInbound.map(s => {
    const uahPrice = priceMemory[s.city.toLowerCase()] || 0;
    return {
      ...s,
      price: currency === 'ГРН' && exchangeRate > 0
        ? Math.round(uahPrice / exchangeRate)
        : uahPrice,
      dayOffset: s.dayOffset >= 0 && firstInDay >= 0 ? (s.dayOffset - firstInDay + 7) % 7 : 0,
    };
  });

  return { outbound: finalOutbound, inbound: finalInbound };
};

// -----------------------------------------------------------
// ТРИВАЛІСТЬ між зупинками
// -----------------------------------------------------------
export const getDurationText = (stops: Stop[], index: number): string | null => {
  if (index === 0 || stops.length === 0) return null;
  const diff = toMinutes(stops[index]) - toMinutes(stops[index - 1]);
  if (diff < 1) return null;
  return `${Math.floor(diff / 60)}г ${diff % 60}хв`;
};

export const getTotalDuration = (stops: Stop[]): string | null => {
  if (stops.length < 2) return null;
  const diff = toMinutes(stops[stops.length - 1]) - toMinutes(stops[0]);
  if (diff < 1) return null;
  return `${Math.floor(diff / 60)}г ${diff % 60}хв`;
};

// -----------------------------------------------------------
// НАЗВА ДНЯ
// -----------------------------------------------------------
export const getDayName = (
  direction: 'outbound' | 'inbound',
  trip: TripState,
  offset: number
): string => {
  const days = trip[direction].days;
  if (days.length === 0) return '';
  const startIdx = DAYS_OF_WEEK.indexOf(days[0] as any);
  if (startIdx === -1) return '';
  return DAYS_OF_WEEK[(startIdx + offset) % 7];
};

// -----------------------------------------------------------
// ВИЗНАЧЕННЯ ІНДЕКСУ ДНЯ
// -----------------------------------------------------------
export const getDayIndex = (text: string): number => {
  if (!text) return -1;
  const lower = text.toLowerCase().replace(/['''`']/g, '').trim();
  for (const [name, short] of Object.entries(DAY_MAP)) {
    if (lower.includes(name.replace(/['''`']/g, ''))) {
      return DAYS_OF_WEEK.indexOf(short as any);
    }
  }
  for (const short of DAYS_OF_WEEK) {
    if (lower.includes(short.toLowerCase())) return DAYS_OF_WEEK.indexOf(short);
  }
  return -1;
};

// -----------------------------------------------------------
// ВАЛІДАЦІЯ КОНФЛІКТІВ — FIX #10
// -----------------------------------------------------------
export const detectConflicts = (trip: TripState): Conflict[] => {
  const issues: Conflict[] = [];

  if (trip.routeName.length > 0 && trip.routeName.length < 3) {
    issues.push({ step: 1, message: 'Назва маршруту занадто коротка', severity: 'warning' });
  }

  const checkDirection = (type: 'outbound' | 'inbound', step: number) => {
    const stops = trip[type].stops;
    if (stops.length > 0 && stops.length < 2) {
      issues.push({
        step,
        message: `Маршрут ${type === 'outbound' ? 'туди' : 'назад'} повинен мати мінімум 2 зупинки`,
        severity: 'error',
      });
    }
    stops.forEach((stop, idx) => {
      if (!stop.city) issues.push({ step, message: `Зупинка ${idx + 1}: не вказано місто`, severity: 'error' });
      if (!stop.time) issues.push({ step, message: `Зупинка ${idx + 1}: не вказано час`, severity: 'error' });
      if (idx > 0) {
        const currMinutes = toMinutes(stop);
        const prevMinutes = toMinutes(stops[idx - 1]);
        if (currMinutes <= prevMinutes) {
          issues.push({
            step,
            message: `Зупинка ${idx + 1}: час раніше або дорівнює попередній. Перевірте зміщення дня.`,
            severity: 'error',
          });
        }
      }
    });
  };

  // Оригінальний NewTrip.tsx: outbound=step2, inbound=step3
  checkDirection('outbound', 2);
  checkDirection('inbound', 3);

  const allStops = [...trip.outbound.stops, ...trip.inbound.stops];
  if (allStops.some(s => s.price === 0)) {
    issues.push({ step: 4, message: 'Є зупинки з нульовою ціною', severity: 'warning' });
  }

  return issues;
};

// -----------------------------------------------------------
// СЕГМЕНТИ ДЛЯ ТАРИФІКАЦІЇ — memoized, FIX #3
// -----------------------------------------------------------
export const calculateSegments = (
  outboundStops: Stop[],
  priceMemory: Record<string, number>
): PriceSegment[] => {
  if (outboundStops.length < 2) return [];

  const minutes = outboundStops.map(toMinutes);
  let maxGapIndex = 0;
  let maxDist = 0;
  for (let i = 0; i < minutes.length - 1; i++) {
    const gap = minutes[i + 1] - minutes[i];
    if (gap > maxDist) { maxDist = gap; maxGapIndex = i; }
  }

  const isUA = (idx: number) => idx <= maxGapIndex;
  const segments: PriceSegment[] = [];

  for (let i = 0; i < outboundStops.length; i++) {
    for (let j = 0; j < outboundStops.length; j++) {
      if (i === j) continue;
      const from = outboundStops[i].city;
      const to   = outboundStops[j].city;
      if (!from || !to) continue;

      const key = `${from.toLowerCase()}_${to.toLowerCase()}`;

      if (isUA(i) && !isUA(j)) {
        segments.push({ from, to, price: priceMemory[key] || 0, currency: 'ГРН', key });
      } else if (!isUA(i) && isUA(j)) {
        segments.push({ from, to, price: priceMemory[key] || 0, currency: 'EUR', key });
      }
    }
  }
  return segments;
};

// -----------------------------------------------------------
// ПЕРЕВІРКА МІСТА — FIX #10: CityConfirmStatus замість boolean
// TODO: замінити KNOWN_CITIES_MOCK на запит до Supabase
// -----------------------------------------------------------
export const checkCityStatus = async (
  cityName: string
): Promise<'confirmed' | 'unrecognized'> => {
  await new Promise(r => setTimeout(r, 0));
  const isKnown = KNOWN_CITIES_MOCK.some(
    c => c.toLowerCase() === cityName.toLowerCase()
  );
  return isKnown ? 'confirmed' : 'unrecognized';
};

// -----------------------------------------------------------
// ПАРСЕР РЯДКА ЗАГАЛЬНОЇ ІНФОРМАЦІЇ (step1)
// Збережено з оригінального handleSmartParseStep1
// -----------------------------------------------------------
export const parseGeneralInfoText = (
  text: string
): { routeName: string; operator: string; outboundDays: string[]; inboundDays: string[] } => {
  const lines = text.split('\n').filter(l => l.trim());
  const dayOrder = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];

  const routeLine = lines.find(l => l.includes(' - ')) || lines[0] || '';

  let operator = '';
  const operatorKeywords = ['перевізник', 'оператор', 'company', 'транс', 'trans'];
  const operatorLine = lines.find(l => operatorKeywords.some(kw => l.toLowerCase().includes(kw)));
  if (operatorLine) operator = operatorLine.replace(/.*:\s*/, '').trim();

  const outboundDays: string[] = [];
  const inboundDays: string[] = [];

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    Object.entries(DAY_MAP).forEach(([dayName, shortDay]) => {
      if (lowerLine.includes(dayName)) {
        if (lowerLine.includes('відправлення') || lowerLine.includes('туди')) {
          if (!outboundDays.includes(shortDay)) outboundDays.push(shortDay);
        } else if (lowerLine.includes('повернення') || lowerLine.includes('назад')) {
          if (!inboundDays.includes(shortDay)) inboundDays.push(shortDay);
        } else {
          const parts = line.split(/[–-]/);
          if (parts.length === 2) {
            const d1 = DAY_MAP[parts[0].trim().toLowerCase()];
            const d2 = DAY_MAP[parts[1].trim().toLowerCase()];
            if (d1 && !outboundDays.includes(d1)) outboundDays.push(d1);
            if (d2 && !inboundDays.includes(d2)) inboundDays.push(d2);
          }
        }
      }
    });
  });

  return { routeName: routeLine.trim(), operator, outboundDays, inboundDays };
};
