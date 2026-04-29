/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TITLES: Record<string, string> = {
  dashboard: 'Дашборд агента',
  book: 'Нове бронювання',
  mybookings: 'Мої бронювання',
  passengers: 'База пасажирів',
  crm: 'CRM / Угоди',
  chat: 'Повідомлення',
  finance: 'Доходи та виплати',
  refunds: 'Повернення',
  analytics: 'Статистика',
  routes: 'Маршрути',
  carriers: 'Перевізники',
  notifications: 'Сповіщення',
  profile: 'Мій профіль',
  settings: 'Налаштування'
};

export const ICOS: Record<string, string> = {
  dashboard: '◈',
  book: '+',
  mybookings: '≡',
  passengers: '◎',
  crm: '◇',
  chat: '▣',
  finance: '◑',
  refunds: '↺',
  analytics: '▲',
  routes: '→',
  carriers: '□',
  notifications: '◉',
  profile: '◐',
  settings: '⊞'
};

export const BOOKINGS_DATA = [
  { id: 'BK-4901', pax: 'Олена Самойленко', trip: 'BN-2247', route: 'Київ → Варшава', date: '17.04', seat: '12A', price: 55, type: 'busnet', rate: 5, comm: 2.75, status: 'onboard' },
  { id: 'BK-4902', pax: 'Тарас Мельник', trip: 'BN-2248', route: 'Київ → Берлін', date: '17.04', seat: '8C', price: 70, type: 'own', rate: 10, comm: 7.00, status: 'onboard' },
  { id: 'BK-4903', pax: 'Наталія Бондар', trip: 'BN-2250', route: 'Київ → Відень', date: '20.04', seat: '3B', price: 65, type: 'busnet', rate: 5, comm: 3.25, status: 'booked' },
  { id: 'BK-4904', pax: 'Андрій Лисенко', trip: 'BN-2251', route: 'Київ → Прага', date: '22.04', seat: '21C', price: 60, type: 'busnet', rate: 5, comm: 3.00, status: 'booked' },
  { id: 'BK-4905', pax: 'Сергій Ткаченко', trip: 'BN-2252', route: 'Київ → Варшава', date: '25.04', seat: '7A', price: 55, type: 'own', rate: 10, comm: 5.50, status: 'booked' },
  { id: 'BK-4850', pax: 'Ірина Коваль', trip: 'BN-2200', route: 'Київ → Берлін', date: '01.04', seat: '15B', price: 70, type: 'busnet', rate: 5, comm: 3.50, status: 'completed' },
  { id: 'BK-4810', pax: 'Максим Горовий', trip: 'BN-2180', route: 'Київ → Варшава', date: '25.03', seat: '9D', price: 55, type: 'own', rate: 10, comm: 5.50, status: 'completed' },
  { id: 'BK-4799', pax: 'Юлія Петренко', trip: 'BN-2160', route: 'Київ → Прага', date: '15.03', seat: '6A', price: 60, type: 'busnet', rate: 5, comm: 3.00, status: 'cancelled' },
];

export const PASSENGERS_DATA = [
  { name: 'Олена Самойленко', trips: 14, last: '17.04.2026', route: 'Київ → Варшава', type: 'busnet', spent: 742, status: 'active', av: '#0099cc' },
  { name: 'Тарас Мельник', trips: 8, last: '17.04.2026', route: 'Київ → Берлін', type: 'own', spent: 560, status: 'active', av: '#7c5cfc' },
  { name: 'Наталія Бондар', trips: 23, last: '20.04.2026', route: 'Київ → Варшава', type: 'own', spent: 1240, status: 'active', av: '#00c4d4' },
  { name: 'Андрій Лисенко', trips: 3, last: '22.04.2026', route: 'Київ → Прага', type: 'busnet', spent: 180, status: 'active', av: '#ff9d00' },
  { name: 'Сергій Ткаченко', trips: 6, last: '25.04.2026', route: 'Київ → Варшава', type: 'own', spent: 330, status: 'active', av: '#00d97e' },
  { name: 'Ірина Коваль', trips: 11, last: '01.04.2026', route: 'Київ → Берлін', type: 'busnet', spent: 770, status: 'active', av: '#ff3d5a' },
  { name: 'Максим Горовий', trips: 5, last: '01.04.2026', route: 'Київ → Варшава', type: 'own', spent: 275, status: 'active', av: '#f5c842' },
  { name: 'Юлія Петренко', trips: 1, last: '15.03.2026', route: 'Київ → Прага', type: 'busnet', spent: 60, status: 'inactive', av: '#a855f7' },
  { name: 'Василь Шевченко', trips: 0, last: '—', route: '—', type: 'busnet', spent: 0, status: 'new', av: '#0099cc' },
];

export const ROUTES_DATA = [
  { from: 'Київ', to: 'Варшава', km: 810, time: '10г 30хв', carriers: 3, next: '22.04 08:00', price: 55, demand: 87 },
  { from: 'Київ', to: 'Берлін', km: 1430, time: '16г 00хв', carriers: 2, next: '22.04 07:00', price: 70, demand: 75 },
  { from: 'Київ', to: 'Прага', km: 1120, time: '13г 45хв', carriers: 3, next: '22.04 09:15', price: 60, demand: 69 },
  { from: 'Київ', to: 'Відень', km: 1190, time: '14г 00хв', carriers: 2, next: '24.04 07:00', price: 65, demand: 80 },
  { from: 'Київ', to: 'Рим', km: 2100, time: '22г 00хв', carriers: 1, next: '23.04 06:00', price: 90, demand: 62 },
  { from: 'Київ', to: 'Мілан', km: 1800, time: '19г 00хв', carriers: 2, next: '24.04 06:30', price: 85, demand: 70 },
  { from: 'Харків', to: 'Варшава', km: 1040, time: '12г 00хв', carriers: 2, next: '23.04 07:00', price: 60, demand: 55 },
];

export const CARRIERS_DATA = [
  { name: 'ТОВ "Євро Тур"', routes: 12, rating: 4.8, trips: 47, status: 'active', av: '#ff9d00' },
  { name: 'ТОВ "Карпати Тур"', routes: 8, rating: 4.6, trips: 31, status: 'active', av: '#00c4d4' },
  { name: 'ТОВ "Схід Транс"', routes: 5, rating: 4.1, trips: 18, status: 'active', av: '#7c5cfc' },
  { name: 'ФОП Сидоренко В.', routes: 3, rating: 3.7, trips: 9, status: 'warning', av: '#ff3d5a' },
];

export const NOTIFICATIONS_DATA = [
  { ico: '▣', text: 'Нове повідомлення від пасажира: Олена Самойленко', time: '2 хв тому', unread: true },
  { ico: '+', text: 'Нове бронювання BK-4905 підтверджено системою', time: '45 хв тому', unread: true },
  { ico: '◑', text: 'Виплата €1,076 зарахована на рахунок · Березень 2026', time: '5 квітня', unread: true },
  { ico: '↺', text: 'Запит на повернення по BK-4799 (Юлія Петренко · €60)', time: '7 квітня', unread: false },
  { ico: '▲', text: 'Ваш рейтинг зріс до TOP-1 у регіоні Київ', time: '10 квітня', unread: false },
];

export const CHAT_CONTACTS = [
  { id: 'c1', name: 'Олена Самойленко', sub: 'Пасажир · BK-4901 активний', section: 'passengers', av: '#0099cc', initials: 'ОС', online: true, unread: 2, last: 'Дякую за квиток!', time: '14:32' },
  { id: 'c2', name: 'Тарас Мельник', sub: 'Пасажир · Власний клієнт', section: 'passengers', av: '#7c5cfc', initials: 'ТМ', online: false, unread: 1, last: 'Кови наступний рейс?', time: '11:20' },
  { id: 'c3', name: 'Наталія Бондар', sub: 'Пасажир · 23 поїздки', section: 'passengers', av: '#00c4d4', initials: 'НБ', online: true, unread: 0, last: 'Добре, чекаю', time: '09:15' },
  { id: 'c4', name: 'ТОВ "Євро Тур"', sub: 'Перевізник · 12 маршрутів', section: 'carriers', av: '#ff9d00', initials: 'ЄТ', online: true, unread: 0, last: 'Рейс підтверджено', time: '08:45' },
  { id: 'c5', name: 'ТОВ "Карпати Тур"', sub: 'Перевізник · 8 маршрутів', section: 'carriers', av: '#00c4d4', initials: 'КТ', online: false, unread: 0, last: 'Доброго дня', time: 'Вчора' },
  { id: 'c6', name: 'Підтримка BUSNET UA', sub: 'Адміністрація · Середній час відповіді 2 год', section: 'admin', av: '#7c5cfc', initials: 'BN', online: true, unread: 4, last: 'Вашу заявку обробляють', time: '13:10' },
  { id: 'c7', name: 'Андрій Лисенко', sub: 'Пасажир · Новий клієнт', section: 'passengers', av: '#ff9d00', initials: 'АЛ', online: false, unread: 0, last: '—', time: '' },
];

export const CHAT_MESSAGES: Record<string, any[]> = {
  c1: [
    { type: 'system', text: '17 квітня 2026' },
    { type: 'in', text: 'Добрий день! Коли рейс відправляється?', time: '14:28' },
    { type: 'out', text: 'Доброго дня, Олено! Рейс BN-2247 відправляється о 08:00 з центрального автовокзалу Київ.', time: '14:29' },
    { type: 'in', text: 'Дякую за квиток!', time: '14:32' },
  ],
  c2: [
    { type: 'in', text: 'Коли наступний рейс до Берліна?', time: '11:20' },
  ],
  c6: [
    { type: 'system', text: '16 квітня 2026' },
    { type: 'in', text: 'Вашу заявку щодо зміни реквізитів прийнято. Будемо розглядати протягом 1 робочого дня.', time: '13:10' },
    { type: 'out', text: 'Дякую! Чекаю підтвердження.', time: '13:12' },
    { type: 'system', text: 'Тікет #SU-2041 відкрито' },
    { type: 'in', text: 'Реквізити змінено. Наступна виплата піде на новий рахунок.', time: '17 квітня 10:30' },
  ],
};

export const CRM_DEALS = {
  new: [
    { name: 'Василь Шевченко', route: 'Київ → Варшава', date: '25.04', pax: 2, note: 'Дзвонив з рефералу' },
    { name: 'Ольга Мартиненко', route: 'Київ → Прага', date: '01.05', pax: 1, note: '' },
    { name: 'Ігор Романенко', route: 'Київ → Берлін', date: '28.04', pax: 3, note: 'Група' },
  ],
  inProgress: [
    { name: 'Катерина Яковенко', route: 'Київ → Рим', date: '15.05', pax: 1, note: 'Надіслала пропозицію' },
    { name: 'Олексій Данченко', route: 'Київ → Відень', date: '02.05', pax: 2, note: 'Чекає підтвердження' },
    { name: 'Людмила Сергієнко', route: 'Київ → Варшава', date: '30.04', pax: 1, note: '' },
    { name: 'Петро Захаренко', route: 'Київ → Берлін', date: '10.05', pax: 4, note: 'Корпоративний' },
    { name: 'Аліна Козленко', route: 'Київ → Прага', date: '05.05', pax: 1, note: '' },
  ],
  closed: [
    { name: 'Олена Самойленко', route: 'Київ → Варшава', date: '17.04', comm: '€2.75' },
    { name: 'Тарас Мельник', route: 'Київ → Берлін', date: '17.04', comm: '€7.00' },
    { name: 'Андрій Лисенко', route: 'Київ → Прага', date: '22.04', comm: '€3.00' },
  ]
};

export const TASKS = [
  { text: 'Передзвонити Василю Шевченку — уточнити дати', deadline: 'Сьогодні 17:00', priority: 'urgent', done: false },
  { text: 'Надіслати пропозицію Ользі Мартиненко', deadline: 'Завтра 10:00', priority: 'high', done: false },
  { text: 'Підготувати квитки для групи Захаренка (4 особи)', deadline: '27.04 09:00', priority: 'high', done: false },
  { text: 'Нагадати Наталії Бондар про збір на виїзд', deadline: '20.04 07:00', priority: 'normal', done: true },
];
