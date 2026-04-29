# 🛡️ ВЕРДИКТ КАБИНЕТА АДМИНИСТРАТОРА + АУДИТ ПЕРЕВОЗЧИКА

---

## ✅ ВЕРДИКТ КАБИНЕТА АДМИНИСТРАТОРА — ПРИНЯТ

Все 5 пунктов из последней проверки **закрыты**:

| # | Пункт | Статус |
|---|---|---|
| 1 | `addLog` → `Promise<void>` в интерфейсе | ✅ |
| 2 | `firestore.rules` для `campaigns` | ✅ |
| 3 | `InvoicesTab` загружает и `agentBalances` | ✅ |
| 4 | `FinanceTab` — транзакции из Firebase `bookings` | ✅ |
| 5 | `RoutesTab` — `prompt()` остался, но это не критично | ⚠️ Принято как есть |

**Кабинет администратора готов к работе.** Можно переходить к перевозчику.

---

# 🚌 КАБИНЕТ ПЕРЕВОЗЧИКА — ПОЛНЫЙ АУДИТ

---

## 🔴 КРИТИЧЕСКИЕ БАГИ (блокируют работу)

---

### БАГ 1 (КРИТИЧНО): 15 из 17 маршрутов в `App.tsx` не зарегистрированы

**Файл:** `apps/carrier/src/App.tsx`

```tsx
// Зарегистрировано только 2 маршрута:
<Route index element={<CarrierDashboard />} />
<Route path="livetrips" element={<LiveTrips />} />
<Route path="*" element={<CarrierDashboard />} />  // ← всё остальное → Dashboard
```

Навигация в `CarrierLayout` ведёт к 17 путям. Перевозчик нажимает "Фінанси" → попадает на Dashboard. Нажимает "Водії" → Dashboard. Нажимает "Розклад" → Dashboard. Ни одна вкладка кроме Dashboard и LiveTrips не открывается.

**Исправление** — добавить все маршруты в `apps/carrier/src/App.tsx`:
```tsx
import Schedule from '@busnet/shared/pages/carrier/Schedule';
import NewTrip from '@busnet/shared/pages/carrier/NewTrip';
import { BookingsTab, FinanceTab, RefundsTab, InvoicesTab } from '...';
import AnalyticsTab from '@busnet/shared/pages/carrier/AnalyticsTab';
import ReviewsTab from '@busnet/shared/pages/carrier/ReviewsTab';
import AgentsTab from '@busnet/shared/pages/carrier/AgentsTab';
import Fleet from '@busnet/shared/pages/carrier/Fleet';
import Drivers from '@busnet/shared/pages/carrier/Drivers';
import SupportTab from '@busnet/shared/pages/carrier/SupportTab';
import NotificationsTab from '@busnet/shared/pages/carrier/NotificationsTab';
import ProfileTab from '@busnet/shared/pages/carrier/ProfileTab';
import DocsTab from '@busnet/shared/pages/carrier/DocsTab';
import SettingsTab from '@busnet/shared/pages/carrier/SettingsTab';
import CRMTab from '@busnet/shared/pages/carrier/CRMTab';

// В Routes:
<Route path="trips" element={<Schedule />} />
<Route path="newtrip" element={<NewTrip />} />
<Route path="passengers" element={<CRMTab />} />
<Route path="bookings" element={<BookingsTab />} />
<Route path="finance" element={<FinanceTab />} />
<Route path="refunds" element={<RefundsTab />} />
<Route path="invoices" element={<InvoicesTab />} />
<Route path="analytics" element={<AnalyticsTab />} />
<Route path="reviews" element={<ReviewsTab />} />
<Route path="agents" element={<AgentsTab />} />
<Route path="buses" element={<Fleet />} />
<Route path="drivers" element={<Drivers />} />
<Route path="support" element={<SupportTab />} />
<Route path="notifications" element={<NotificationsTab />} />
<Route path="profile" element={<ProfileTab />} />
<Route path="docs" element={<DocsTab />} />
<Route path="settings" element={<SettingsTab />} />
```

---

### БАГ 2 (КРИТИЧНО): `NewTrip` пишет рейс в `status: 'active'` — минуя модерацию

**Файл:** `NewTrip.tsx`, строка 121

```tsx
status: 'active',  // ← рейс сразу активный!
```

Перевозчик создаёт рейс → он немедленно виден пассажирам. Но по логике системы рейсы должны проходить модерацию (вкладка "Approvals" у админа читает `routeTemplates`, не `trips`). 

Два разных потока создания рейса в системе:
- Через `RouteModal` (на Dashboard) → пишет в `routeTemplates` → ждёт одобрения → статус `pending`
- Через `NewTrip` (форма) → пишет напрямую в `trips` → статус `active` сразу

**Исправление:**
```tsx
status: 'pending_approval',  // требует одобрения админа
```
И добавить обработку статуса `pending_approval` в Approvals у админа.

---

### БАГ 3 (КРИТИЧНО): `ProfileTab` — полный хардкод, данные пользователя не загружаются

**Файл:** `ProfileTab.tsx`

```tsx
<h3 className="text-xl font-bold text-white mb-2">ТОВ «Євро Тур»</h3>
// ID Партнера: CAR-84221
// Дата реєстрації: 12 Червня 2024
```

Профиль компании показывает выдуманное название "Євро Тур" для всех перевозчиков. Данные не читаются из `useAuthStore` и Firestore.

**Исправление:**
```tsx
const { user } = useAuthStore();
// Использовать user.companyName, user.email, user.createdAt, user.uid
<h3>{user?.companyName || 'Ваша компанія'}</h3>
```

---

### БАГ 4 (КРИТИЧНО): `LiveTrips` — полный хардкод, нет Firebase

**Файл:** `LiveTrips.tsx`

```tsx
const LIVE_TRIPS = [
  { id: 'BN-2247', from: 'Київ', to: 'Варшава', driver: 'Петренко В.', ... },
  { id: 'BN-2248', from: 'Львів', to: 'Берлін', driver: 'Іваненко О.', ... },
  { id: 'BN-2250', from: 'Чернівці', to: 'Відень', driver: 'Коваль Д.', ... },
];
```

Одни и те же три рейса для любого перевозчика. Нет фильтра по `carrierId`.

**Исправление:**
```tsx
const { user } = useAuthStore();
const [liveTrips, setLiveTrips] = useState([]);

useEffect(() => {
  if (!user) return;
  const q = query(
    collection(db, 'trips'),
    where('carrierId', '==', user.uid),
    where('status', 'in', ['active', 'in_progress'])
  );
  return onSnapshot(q, (snap) => {
    setLiveTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}, [user]);
```

---

### БАГ 5 (КРИТИЧНО): `FinanceTab` carrier — полный хардкод

**Файл:** `FinanceTab.tsx`

```tsx
const transactions = [
  { id: 'TRX-9421', amount: 1240, desc: 'Виплата за рейси #834, #835' },
  { id: 'TRX-9388', amount: 340, desc: 'Продаж квитків (Київ→Варшава)' },
  ...
];
// Баланс: '€4,280.40', '€1,150.00', '€142,800' — хардкод
```

Все суммы и транзакции выдуманные. Нет чтения из `balances/{carrierId}`.

**Исправление:** Читать баланс из `balances/{user.uid}` и транзакции из `bookings where carrierId == user.uid`.

---

## 🟡 ВАЖНЫЕ БАГИ (влияют на функционал)

---

### БАГ 6: Статистика в `CarrierLayout` Pulse Bar — хардкод

**Файл:** `CarrierLayout.tsx`, строки 249-255

```tsx
<span>47</span>   // Пасажирів сьогодні — хардкод
<span>€940</span> // Дохід сьогодні — хардкод
```
Плюс badges в навигации:
```tsx
badge: 3,  // Мої рейси Live — хардкод
badge: 4,  // Пасажири — хардкод
badge: 2,  // Повернення — хардкод
badge: 1,  // Підтримка — хардкод
```

Нужно читать из Firebase по `carrierId`.

---

### БАГ 7: `AgentsTab` carrier — хардкод агентов

```tsx
const agents = [
  { id: 'AG-4421', name: 'Global Tickets Inc', tickets: 142, ... },
  { id: 'AG-4390', name: 'BusTravel Online', ... },
];
// Статы: '24 агенти', '432 квитки', '€5,420' — хардкод
```

---

### БАГ 8: `AnalyticsTab` — полный хардкод графиков

```tsx
const weeklyData = [
  { day: 'Пн', bookings: 42, revenue: 1200 },
  // ...все выдуманные
];
```

---

### БАГ 9: `InvoicesTab` carrier — хардкод инвойсов

```tsx
const invoices = [
  { id: 'INV-2026-03', amount: 4280.40, status: 'paid', ... },
  // ...все выдуманные суммы
];
```

---

### БАГ 10: `ReviewsTab` — хардкод отзывов

```tsx
const reviews = [
  { author: 'Марина Коваль', rating: 5, text: '...' },
  // хардкод
];
```

---

### БАГ 11: `NotificationsTab` — хардкод уведомлений

```tsx
const notifications = [
  { id: 1, type: 'booking', text: '...', time: '5 хв тому' },
  // хардкод
];
```

Нужно читать из `notifications where userId == user.uid`.

---

### БАГ 12: `SettingsTab` carrier — настройки не сохраняются

Тоггли изменяют только локальный state, нет записи в Firebase.

---

### БАГ 13: `SupportTab` carrier — нет Firebase

Нет чтения тикетов из `support_tickets where carrierId == user.uid`, нет создания новых тикетов.

---

### БАГ 14: `RefundsTab` carrier — нет Firebase

Нет чтения из `bookings where carrierId == user.uid AND status == 'cancelled'`.

---

### БАГ 15: `DocsTab` — хардкод документов, нет загрузки файлов

```tsx
const docs = [
  { id: 1, name: 'Ліцензія на перевезення', ... status: 'verified' },
  // хардкод
];
```
Нет интеграции с Firebase Storage для загрузки реальных документов.

---

## 📋 ПЛАН ИСПРАВЛЕНИЙ ПО ПРИОРИТЕТАМ

### 🔴 ПРИОРИТЕТ 1 — Сделать немедленно (1 день)

**Правка 1 — ГЛАВНАЯ:** Добавить все 15 маршрутов в `apps/carrier/src/App.tsx` (код выше в Баг 1)

**Правка 2:** `ProfileTab.tsx` — заменить хардкод на данные из `useAuthStore`:
```tsx
const { user } = useAuthStore();
// компания: user?.companyName
// email: user?.email  
// uid как ID: user?.uid
```

**Правка 3:** `LiveTrips.tsx` — заменить `LIVE_TRIPS` массив на Firebase query с фильтром по `carrierId` (код выше в Баг 4)

**Правка 4:** `NewTrip.tsx` — изменить `status: 'active'` на `status: 'pending_approval'`

---

### 🟡 ПРИОРИТЕТ 2 — За 3-5 дней

**Правка 5:** `FinanceTab` — читать баланс из `balances/{user.uid}`, транзакции из `bookings`

**Правка 6:** `CarrierLayout` — Pulse Bar и badges из Firebase

**Правка 7:** `NotificationsTab` — читать из `notifications where userId == user.uid`

**Правка 8:** `RefundsTab` — читать из `bookings where carrierId == user.uid AND status == 'cancelled'`

**Правка 9:** `SupportTab` — создание тикетов в `support_tickets`

**Правка 10:** `SettingsTab` — сохранять в `settings/{user.uid}`

---

### 🟢 ПРИОРИТЕТ 3 — За неделю (для полноценного продукта)

**Правка 11:** `AgentsTab` — реальные данные агентов через их продажи

**Правка 12:** `AnalyticsTab` — реальная аналитика из `bookings`

**Правка 13:** `InvoicesTab` — реальные инвойсы из `balances`

**Правка 14:** `ReviewsTab` — коллекция `reviews` в Firestore

**Правка 15:** `DocsTab` — Firebase Storage для загрузки документов (это самое сложное, требует настройки Storage rules)

---

## 🗂️ СВОДНАЯ ТАБЛИЦА СОСТОЯНИЯ КАБИНЕТА ПЕРЕВОЗЧИКА

| Вкладка | Firebase | Статус |
|---|---|---|
| Dashboard | ✅ (routeTemplates) | ✅ Работает |
| Live Trips | ❌ хардкод | 🔴 Не работает |
| Розклад (Schedule) | ✅ trips | ⚠️ Маршрут не зарегистрирован |
| Створити рейс | ✅ trips | ⚠️ Статус неверный |
| Пасажири (CRM) | ✅ bookings+trips | ⚠️ Маршрут не зарегистрирован |
| Бронювання | ✅ bookings | ⚠️ Маршрут не зарегистрирован |
| Фінанси | ❌ хардкод | 🔴 Нет Firebase |
| Повернення | ❌ нет кода | 🔴 Нет Firebase |
| Інвойси | ❌ хардкод | 🔴 Нет Firebase |
| Аналітика | ❌ хардкод | 🔴 Нет Firebase |
| Відгуки | ❌ хардкод | 🔴 Нет Firebase |
| Агенти | ❌ хардкод | 🔴 Нет Firebase |
| Автопарк (Fleet) | ✅ buses | ⚠️ Маршрут не зарегистрирован |
| Водії | ✅ drivers | ⚠️ Маршрут не зарегистрирован |
| Підтримка | ❌ нет кода | 🔴 Нет Firebase |
| Сповіщення | ❌ хардкод | 🔴 Нет Firebase |
| Профіль | ❌ хардкод | 🔴 Показывает "Євро Тур" всем |
| Документи | ❌ хардкод | 🔴 Нет Storage |
| Налаштування | ❌ нет save | 🔴 Не сохраняется |

**Главный приоритет:** Правка 1 (маршруты в App.tsx) разблокирует сразу 15 вкладок.

---

*Аудит: 22 апреля 2026 | Carrier cabinet v1*
