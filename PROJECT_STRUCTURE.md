# 🚌 BUSNET OS — Повний довідник структури проекту та файлів

> **Призначення файлу:** Цей документ створено для розробників та будь-яких ШІ (ChatGPT, Claude, Gemini тощо), які не мають прямого доступу до кодової бази. Тут до найдрібніших деталей описано архітектуру, призначення кожної папки та файлу, а також шпаргалку швидкого пошуку «де що правити».

---

## 🧭 Шпаргалка швидкого пошуку: «Де що лежить і що правити?»

| Що ви хочете змінити або полагодити? | Де це знаходиться? (Точний шлях до файлу) |
|---|---|
| **Шапка сайту, логотип, мови (UA/EN/IT), кнопка входу/кабінету** | `packages/shared/src/components/layout/Header.tsx` |
| **Головний екран (Hero), космічний фон Землі, слоган «Європа ближче ніж здається»** | `packages/shared/src/components/home/HeroSection.tsx` & `.css` |
| **Віджет пошуку квитків (Звідки, Куди, Дата, кнопка «Пошук»)** | `packages/shared/src/components/home/SearchWidget.tsx` |
| **Автокомпліт вибору міст із підказками та іконками** | `packages/shared/src/components/home/CityAutocomplete.tsx` |
| **Список знайдених рейсів (картки рейсів, ціни, вільні місця)** | `packages/shared/src/components/home/SearchResults.tsx` |
| **Картки популярних напрямків (Київ–Варшава тощо, неон, скрол)** | `packages/shared/src/components/home/PopularDestinations.tsx` |
| **Календар вибору дати поїздки** | `packages/shared/src/components/common/BusnetCalendar.tsx` |
| **Покрокове бронювання квитків (вибір місця, дані пасажира, оплата)** | `packages/shared/src/components/booking/BookingStepper.tsx` + папка `steps/` |
| **Логіка ролей, посилання на кабінети перевізника/адміна/водія** | `packages/shared/src/constants/roleRoutes.ts` |
| **Авторизація пасажира (вхід, реєстрація, скидання пароля)** | `packages/shared/src/pages/AuthPage.tsx` |
| **Форма входу в кабінети перевізника, адміна, агента, водія** | `packages/shared/src/components/auth/PortalLogin.tsx` |
| **Сховище авторизації (стан користувача, сесія Supabase, логін/вихід)** | `packages/shared/src/store/useAuthStore.ts` |
| **Сховище бронювання (обраний рейс, обрані місця, сума)** | `packages/shared/src/store/useBookingStore.ts` |
| **Особистий кабінет пасажира (квитки, поїздки, профіль)** | `packages/shared/src/pages/Dashboard.tsx` |
| **Кабінет Перевізника: головна панель, аналітика** | `packages/shared/src/pages/carrier/CarrierDashboard.tsx` |
| **Кабінет Перевізника: розклад та список рейсів** | `packages/shared/src/pages/carrier/Schedule.tsx` |
| **Кабінет Перевізника: форма створення нового рейсу** | `packages/shared/src/pages/carrier/NewTrip/NewTrip.tsx` |
| **Кабінет Перевізника: водії та автобуси** | `packages/shared/src/pages/carrier/Drivers.tsx` & `Fleet.tsx` |
| **Кабінет Адміністратора: контроль системи, перевізники, заявки** | `packages/shared/src/pages/admin/AdminLayout.tsx` та `packages/shared/src/pages/admin/*` |
| **Форум попутників / відгуків** | `packages/shared/src/pages/ForumPage.tsx` |
| **Переклади текстів на сайті (UK, EN, IT)** | `packages/shared/src/constants/translations.ts` |
| **Глобальні кольори, градієнти, Tailwind стилі, неонові ефекти** | `packages/shared/src/index.css` |
| **Підключення до бази даних Supabase** | `packages/shared/src/supabase/config.ts` |
| **TypeScript інтерфейси (моделі Trip, User, Booking, City тощо)** | `packages/shared/src/types/index.ts` |

---

## 🏛️ Загальна архітектура проекту (Monorepo Turborepo)

Проект побудований як сучасний **Turborepo Monorepo**:
```
busnet-fresh/
├── apps/               # 5 окремих самостійних застосунків
│   ├── landing/        # Публічний сайт + пасажирський кабінет (Vercel: busnet-ua.vercel.app)
│   ├── carrier/        # CRM Кабінет перевізника (Vercel: carrier-blond.vercel.app)
│   ├── admin/          # Панель головного адміністратора (Vercel: admin-puce-delta.vercel.app)
│   ├── agent/          # Кабінет квиткового агента/партнера (Vercel: agent-ruby-three.vercel.app)
│   └── driver/         # Мобільний PWA додаток для водіїв (Vercel: driver-eight-topaz.vercel.app)
├── packages/
│   └── shared/         # Єдине спільне серце коду (компоненти, хуки, стори, сервіси, сторінки)
├── public/             # Глобальні статичні файли (іконки, логотипи)
├── scripts/            # Скрипти збірки (prepare-dist.mjs)
├── server.ts           # Єдиний локальний шлюз Multi-Vite для тестування всіх 5 застосунків на порту 3000
├── turbo.json          # Конфігурація швидкої збірки Turborepo
├── package.json        # Головні залежності та скрипти
└── vercel.json         # Правила маршрутизації (URL rewrites)
```

### Технологічний стек:
* **Frontend:** React 19, TypeScript 5.8, Vite 6
* **Стилізація:** Tailwind CSS 4, стилістична концепція «Base44 Cyberpunk / Glassmorphism» (глибокий темний космос `#030712`, неоновий ціан `#00E5FF`, неонове золото `#FBBF24`)
* **Анімації:** Framer Motion 12
* **База даних і Realtime:** Supabase JS v2
* **State Management:** Zustand 5
* **PWA:** `vite-plugin-pwa` (автономна робота на мобільних телефонах)
* **Хостинг:** Vercel (Production CI/CD з GitHub)

---

## 📦 Детальний розбір: `apps/` (5 Застосунків)

Кожен застосунок в `apps/` — це швидкий Vite-проект, який підтягує всі компоненти з `@busnet/shared`:

### 1. `apps/landing/` — Головний публічний портал
* **Адреса в продакшені:** `https://busnet-ua.vercel.app`
* **Головний файл роутингу:** `apps/landing/src/App.tsx`
* **Основні маршрути:**
  * `/` — Головна сторінка з пошуком квитків, перевагами, популярними маршрутами
  * `/booking` — Візард бронювання квитка
  * `/auth` — Вхід та реєстрація пасажира
  * `/dashboard` — Захищений кабінет куплених квитків пасажира
  * `/forum` — Форум пасажирів та перевізників
  * `/bridge` — Шлюз синхронізації сесії Supabase

### 2. `apps/carrier/` — Кабінет Перевізника (Busnet Carrier CRM)
* **Адреса в продакшені:** `https://carrier-blond.vercel.app`
* **Головний файл роутингу:** `apps/carrier/src/App.tsx`
* **Локальний dev-порт:** 3001
* **Основні розділи:**
  * `/` — Дашборд перевізника (виручка, статистика заповненості автобусів)
  * `/trips` — Розклад і статуси рейсів
  * `/newtrip` — Створення нового рейсу (маршрут, зупинки, ціни, розклад)
  * `/livetrips` — Рейси в реальному часі на карті
  * `/bookings` & `/passengers` — Списки пасажирів і бронювань
  * `/buses` — Автопарк
  * `/drivers` — Водії компанії
  * `/finance` & `/invoices` — Фінанси, виплати, рахунки

### 3. `apps/admin/` — Панель Суперадміністратора (Busnet Core Admin)
* **Адреса в продакшені:** `https://admin-puce-delta.vercel.app`
* **Головний файл роутингу:** `apps/admin/src/App.tsx`
* **Локальний dev-порт:** 3002
* **Функціонал:** Модерація заявок нових перевізників, глобальний моніторинг рейсів, управління тарифами, аудит безпеки, логи системи.

### 4. `apps/agent/` — Кабінет Квиткового Агента (Busnet Partner Desk)
* **Адреса в продакшені:** `https://agent-ruby-three.vercel.app`
* **Головний файл роутингу:** `apps/agent/src/App.tsx`
* **Локальний dev-порт:** 3003
* **Функціонал:** Швидкий продаж квитків агентом на автостанціях, комісійні винагороди, база клієнтів.

### 5. `apps/driver/` — Мобільний додаток Водія (Busnet Driver PWA)
* **Адреса в продакшені:** `https://driver-eight-topaz.vercel.app`
* **Головний файл роутингу:** `apps/driver/src/App.tsx`
* **Локальний dev-порт:** 3004
* **Функціонал:** Список пасажирів поточного рейсу, QR-сканер квитків при посадці, статус рейсу (Виїхав / Затримка / Прибув).

---

## 💎 Детальний розбір: `packages/shared/src/` (Спільний код)

### 📁 `components/home/` — Блоки головної сторінки
* **`HeroSection.tsx` & `.css`** — Головний банер. Преміальне фото Землі вночі, адаптивний оверлей, заголовки, швидкі бейджі.
* **`SearchWidget.tsx`** — Форма пошуку. Поля «Звідки», «Куди», вибір дати, кнопка «Знайти квитки». Обмінюється даними через `SearchContext`.
* **`CityAutocomplete.tsx`** — Розумний випадний список міст із фільтрацією та збереженням популярних напрямків.
* **`PopularDestinations.tsx`** — Секція популярних маршрутів (картки з неоновими лініями маршрутів, цінами та плавним автоскролом до пошуку при кліку).
* **`SearchResults.tsx`** — Видача результатів пошуку після натискання кнопки «Пошук». Показує картки рейсів з часом, автобусом, ціною та кнопкою «Обрати».
* **`AdvantagesSection.tsx`** — Блок «Чому обирають Busnet» (безпека, повернення 100%, 24/7 підтримка).
* **`AppEcoSection.tsx`** — Презентація мобільного додатку.
* **`AboutSection.tsx`** — Про компанію Busnet UA.
* **`ReviewsSection.tsx`** — Відгуки реальних пасажирів.
* **`SEOFooterSection.tsx`** — SEO-тексти та підвал головної сторінки.

### 📁 `components/layout/` — Каркас сайту
* **`Header.tsx`** — Головне навігаційне меню:
  * Логотип Busnet UA
  * Навігаційні посилання (Маршрути, Партнерам, Форум)
  * Перемикач мов (UA / EN / IT)
  * Розумна кнопка профілю: якщо увійшов перевізник — пише `КАБІНЕТ: AI TRANS` та веде одразу в CRM перевізника; якщо гість — кнопка `Увійти`.
  * Кнопка `Вихід`
* **`MainLayout.tsx`** — Обгортка з підключенням хедера, футера та глобального фону.

### 📁 `components/booking/` — Бронювання квитків
* **`BookingStepper.tsx`** — Головний контролер кроків покупки квитка:
  * `steps/Step1Confirmation.tsx` — Підтвердження рейсу та вибір місць на схемі автобуса.
  * `steps/Step2Details.tsx` — Введення прізвища, імені, телефону та email кожного пасажира.
  * `steps/Step3Success.tsx` — Екран успіху з генерацією квитка, завантаженням PDF та QR-кодом.

### 📁 `components/auth/` — Авторизація
* **`PortalLogin.tsx`** — Єдина мультиязична форма входу для всіх спец-кабінетів (перевізник, адмін, агент, водій).
* **`PartnerApplicationModal.tsx`** — Модальне вікно подачі заявки на партнерство для нових перевізників.

### 📁 `constants/` — Константи та конфігурації
* **`roleRoutes.ts`** — **Критично важливий файл!** Керує всіма адресами переходів за ролями:
  * `getPortalUrl(role)` — повертає адресу кабінету (Vercel URL в продакшені або локальний порт).
  * `getPostLoginTarget(role)` — захищає від зациклення перезавантажень та безпечно перенаправляє авторизованого користувача.
* **`translations.ts`** — Словник усіх текстів інтерфейсу (українська, англійська, італійська).

### 📁 `store/` — Zustand Сховища стану
* **`useAuthStore.ts`** — Авторизація, профіль користувача, збереження токена Supabase, методи `login()`, `logout()`, `registerCarrier()`.
* **`useBookingStore.ts`** — Поточне бронювання: обраний рейс, список заповнених пасажирів, промокод, розрахунок суми.
* **`useAdminStore.ts`** — Завантаження статистики та керування суперадмінкою.
* **`useForumStore.ts`** — Пости форуму, коментарі, створення тем.

### 📁 `context/` — React Контексти
* **`SearchContext.tsx`** — Зберігає поточні параметри пошуку: `fromCity`, `toCity`, `date`, `passengersCount`.
* **`LanguageContext.tsx`** — Зберігає поточну мову (UK, EN, IT) та перемикає її на льоту.

### 📁 `supabase/` — База даних
* **`config.ts`** — Ініціалізація клієнта Supabase за допомогою змінних середовища `VITE_SUPABASE_URL` та `VITE_SUPABASE_ANON_KEY`.

---

## ⚙️ Змінні середовища (`.env`)

Для коректної роботи на Vercel та локально використовуються такі ключі:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...

# Адреси бойових кабінетів у Vercel:
VITE_LANDING_URL=https://busnet-ua.vercel.app
VITE_CARRIER_URL=https://carrier-blond.vercel.app
VITE_ADMIN_URL=https://admin-puce-delta.vercel.app
VITE_AGENT_URL=https://agent-ruby-three.vercel.app
VITE_DRIVER_URL=https://driver-eight-topaz.vercel.app
```

---

## 🛠️ Як запускати проект локально

1. **Встановлення залежностей:** `npm install`
2. **Єдиний запуск усіх кабінетів одразу:** `npm run dev` (запускає `server.ts` на порту 3000):
   * Головний лендинг: `http://localhost:3000/`
   * Кабінет перевізника: `http://localhost:3000/carrier`
   * Кабінет адміна: `http://localhost:3000/admin`
   * Кабінет агента: `http://localhost:3000/agent`
   * Кабінет водія: `http://localhost:3000/driver`
3. **Повна збірка для перевірки помилок:** `npm run build`
