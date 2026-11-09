/**
 * Утиліта визначення валюти та форматування цін на рейсах BUSNET.
 * ПРИНЦИП:
 * 1. Країна або місто виїзду мають найвищий пріоритет (виїзд з Італії -> EUR, з України -> UAH).
 * 2. Це захищає від ситуації, коли в об'єкті рейсу стоїть дефолтний 'грн' на італійському маршруті.
 */

const ITALIAN_CITIES = [
  // Українські назви
  'рим', 'мілан', 'болонья', 'неаполь', 'салерно', 'флоренція',
  'венеція', 'верона', 'трієст', 'генуя', 'падуя', 'турин', 'барі',
  'пескара', 'модена', 'парма', 'феррара', 'ріміні', 'анкона', 'удіне', 'брешія',
  'віченца', 'п\'яченца', 'пьяченца', 'реджо', 'емілія', 'тренто', 'больцано', 'казерта',
  'равенна', 'фоджа', 'таранто', 'катанія', 'палермо', 'бергамо', 'піза', 'лівворно',
  
  // Італійські / Англійські назви
  'roma', 'rome', 'milan', 'milano', 'bologna', 'napoli', 'naples', 'salerno',
  'firenze', 'florence', 'venezia', 'venice', 'verona', 'trieste', 'genova', 'genoa',
  'padova', 'padua', 'torino', 'turin', 'bari', 'pescara', 'modena', 'parma',
  'ferrara', 'rimini', 'ancona', 'udine', 'brescia', 'vicenza', 'piacenza', 'trento', 'bolzano',
  'reggio', 'emilia', 'caserta', 'ravenna', 'foggia', 'taranto', 'bergamo', 'pisa'
];

export function isItalianCity(cityName?: string): boolean {
  if (!cityName) return false;
  
  // Розбиваємо назву на окремі слова (захист від слів типу "Приморськ")
  const normalized = cityName.toLowerCase().trim();
  const words = normalized.split(/[\s,()\-\/\.\–\—]+/);

  return words.some(word => ITALIAN_CITIES.includes(word));
}

/**
 * Універсальний резолвер валюти: приймає об'єкт рейсу або окремі параметри
 */
export function getTripCurrency(param1?: any, param2?: string, param3?: string): string {
  // Якщо першим параметром передано об'єкт рейсу (Trip)
  if (param1 && typeof param1 === 'object') {
    const trip = param1;

    // 1. Перевіряємо код країни виїзду з бази
    const fromCountry = (trip.fromCountry || trip.departureCountry || trip.countryCode || trip.country || '').toUpperCase();
    if (fromCountry === 'IT' || fromCountry === 'ITALY' || fromCountry === 'ITA') return 'EUR';
    if (fromCountry === 'UA' || fromCountry === 'UKRAINE' || fromCountry === 'UKR') return 'UAH';

    // 2. Перевіряємо місто виїзду (виїзд з Італії завжди в EUR, навіть якщо дефолт був 'грн')
    const fromCity = trip.departureCity || trip.from || trip.fromCity || trip.route_from;
    if (fromCity) {
      if (isItalianCity(fromCity)) return 'EUR';
      return 'UAH';
    }

    // 3. Якщо міста немає — беремо явно вказану валюту з об'єкта
    if (trip.currency) {
      const c = trip.currency.trim().toUpperCase();
      if (c === 'EUR' || c === '€') return 'EUR';
      if (c === 'UAH' || c === 'ГРН') return 'UAH';
    }

    return 'UAH';
  }

  // Якщо передано рядками: getTripCurrency(fromCity, toCity, explicitCurrency)
  const fromCity = param1;
  const explicitCurrency = param3 || param2;

  // 1. Місто виїзду має пріоритет
  if (fromCity && typeof fromCity === 'string') {
    if (isItalianCity(fromCity)) return 'EUR';
    return 'UAH';
  }

  // 2. Якщо місто не передано — дивимось на explicitCurrency
  if (explicitCurrency && typeof explicitCurrency === 'string') {
    const c = explicitCurrency.trim().toUpperCase();
    if (c === 'EUR' || c === '€') return 'EUR';
    if (c === 'UAH' || c === 'ГРН') return 'UAH';
  }

  return 'UAH';
}

export function getTripCurrencySymbol(param1?: any, param2?: string, param3?: string): string {
  const curr = getTripCurrency(param1, param2, param3);
  return curr === 'EUR' ? '€' : 'грн';
}
