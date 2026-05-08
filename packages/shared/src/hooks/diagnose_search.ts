import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 1. Конвертація дати в українське скорочення дня тижня
 *
 * ✅ FIX: використовуємо UTC noon щоб уникнути зсуву дня через timezone.
 * new Date("2026-05-20") парситься як UTC midnight → в Україні (UTC+3)
 * це вже наступний день, тому getDay() поверне невірний результат.
 * Додаємо 'T12:00:00Z' — завжди залишаємось у правильній добі.
 */
export const getUaDayOfWeek = (dateString: string): string => {
  const days = ["НД", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
  const date = new Date(dateString + 'T12:00:00Z');
  return days[date.getUTCDay()]; // getUTCDay(), не getDay()
};

/**
 * 2. Основна логіка діагностики пошуку
 */
export async function diagnoseSearch(fromCity: string, toCity: string, dateStr: string) {
  console.log(`\n🔍 ДІАГНОСТИКА ПОШУКУ: [${fromCity}] -> [${toCity}] на [${dateStr}]`);

  const uaDay = getUaDayOfWeek(dateStr);
  console.log(`📅 День тижня (UA): ${uaDay}`);

  const { data: routes, error } = await supabase
    .from('routes')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('❌ Помилка завантаження маршрутів:', error.message);
    return;
  }

  console.log(`📊 Знайдено активних маршрутів у БД: ${routes?.length || 0}`);

  const results = routes?.map(route => {
    const outbound = route.outbound || {};
    const days: string[] = outbound.days || [];
    const stops: any[] = outbound.stops || [];

    const hasDay = days.includes(uaDay);

    const fromStopIndex = stops.findIndex(s =>
      s.city?.toLowerCase().includes(fromCity.toLowerCase())
    );
    const toStopIndex = stops.findIndex(s =>
      s.city?.toLowerCase().includes(toCity.toLowerCase())
    );

    const hasFrom = fromStopIndex !== -1;
    const hasTo = toStopIndex !== -1;
    const correctOrder = hasFrom && hasTo && fromStopIndex < toStopIndex;

    return {
      name: route.name,
      id: route.id,
      checks: {
        dayMatch: hasDay,
        hasFromCity: hasFrom,
        hasToCity: hasTo,
        isOrderCorrect: correctOrder,
        fromStop: hasFrom ? stops[fromStopIndex].city : null,
        toStop: hasTo ? stops[toStopIndex].city : null,
        availableDays: days.join(', '),
      },
      passed: hasDay && correctOrder,
    };
  });

  console.table(
    results?.map(r => ({
      Маршрут: r.name,
      'Дні маршруту': r.checks.availableDays,
      'День OK': r.checks.dayMatch ? '✅' : '❌',
      'Звідки': r.checks.hasFromCity ? `✅ (${r.checks.fromStop})` : '❌',
      'Куди': r.checks.hasToCity ? `✅ (${r.checks.toStop})` : '❌',
      'Порядок': r.checks.isOrderCorrect ? '✅' : '❌',
      'РЕЗУЛЬТАТ': r.passed ? '🟢 ПОКАЗАТИ' : '🔴 ПРИХОВАТИ',
    }))
  );

  const matched = results?.filter(r => r.passed) ?? [];

  if (matched.length > 0) {
    console.log(`\n🎉 УСПІХ: Знайдено ${matched.length} маршрутів, які підходять.`);
  } else {
    console.log(`\n⚠️ ПРИЧИНА НЕВДАЧІ:`);

    const noDayMatch = !results?.some(r => r.checks.dayMatch);
    const noFromCity = !results?.some(r => r.checks.hasFromCity);
    const noToCity   = !results?.some(r => r.checks.hasToCity);
    const wrongOrder = results?.some(r => r.checks.hasFromCity && r.checks.hasToCity && !r.checks.isOrderCorrect);

    if (noDayMatch) {
      console.log(`- Жоден маршрут не ходить у день "${uaDay}". Перевірте поле outbound.days.`);
    }
    if (noFromCity) {
      console.log(`- Місто "${fromCity}" не знайдено в зупинках. Перевірте написання (напр. "Київ" vs "Kyiv").`);
    }
    if (noToCity) {
      console.log(`- Місто "${toCity}" не знайдено в зупинках.`);
    }
    if (wrongOrder) {
      console.log(`- Обидва міста знайдені, але "${toCity}" стоїть раніше "${fromCity}" у маршруті (зворотній напрямок?).`);
    }
  }
}

