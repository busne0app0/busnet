# Інтеграція з AL-TRANS API (Документація для BUSNET)

Цей документ фіксує схему даних та специфікацію взаємодії з бекендом AL-TRANS для імпорту маршрутної сітки та динамічного запиту тарифів.

---

## 1. Заголовки авторизації (Headers)

Усі запити до API вимагають передачі публічного ключа веб-клієнта:

```http
Content-Type: application/json
Api-Key: {{ALTRANS_API_KEY}}
Accept-Language: uk
```

---

## 2. Отримання списку магістральних ліній

* **URL:** `GET https://al-trans.com.ua/api/v3/cache/routes`
* **Опис:** Повертає список усіх діючих маршрутів компанії.

### Структура відповіді:
```json
{
  "routes": [
    {
      "id": 97,
      "name": "Черкаси - Салерно - Черкаси",
      "shedule_days": "Понеділок - Четвер / Четвер - Неділя / Субота - Вівторок",
      "carrier_name": "AL-TRANS",
      "countryName": "Італія",
      "countryISO": "IT",
      "navigation_key": "avtobus-cherkasy-salerno-al-trans"
    }
  ],
  "success": true
}
```

---

## 3. Отримання паспорта маршруту (Маршрутний лист і зупинки)

* **URL:** `POST https://al-trans.com.ua/api/v2/references/route_details_key`
* **Тіло запиту:**
```json
{
  "key": "avtobus-cherkasy-salerno-al-trans"
}
```

### Структура відповіді:
`schedules[].items[]` містить упорядковані зупинки лінії з точними географічними координатами:
* `city_id` (integer) — внутрішній ID міста в системі перевізника
* `city_name` (string) — назва міста (наприклад, "Київ", "Рим")
* `place` (string) — точна назва станції / автовокзалу з адресою
* `latitude` / `longitude` (float) — GPS-координати точки посадки
* `departure_day_str` / `departure_time_str` — день і час відправлення (туди)
* `return_day_str` / `return_time_str` — день і час відправлення (назад)

---

## 4. Динамічний пошук тарифів та рейсів

* **URL:** `POST https://al-trans.com.ua/api/v2/booking/search_trips`
* **Тіло запиту:**
```json
{
  "departure_city_id": 2,          // ID міста відправлення (наприклад, Київ = 2)
  "arrival_city_id": 41,           // ID міста прибуття (наприклад, Рим = 41)
  "depature_date": "2026-11-05T00:00:00", // Дата виїзду (ISO формат)
  "passengers_count": 1,
  "currecny_code": "UAH",          // УВАГА: саме з одруківкою в API перевізника: 'currecny_code' ('UAH' або 'EUR')
  "enable_external_search": false
}
```

### Структура відповіді (ВАЖЛИВО: структура поля цін):
Ціна **НЕ** лежить у корені! Кореневим об'єктом є масив **`trips_sequences`**:

```json
{
  "trips_sequences": [
    {
      "price": 7540,                         // Офіційна базова ціна за квиток
      "currency_code": "UAH",                // Валюта тарифу
      "liqpay_discount_in_percent": 10,      // Знижка при онлайн-оплаті (якщо діє)
      "departure_date": "05.11.2026",
      "departure_time": "22:30:00",
      "arrival_date": "07.11.2026",
      "arrival_time": "14:35:00",
      "trips": [
        {
          "id": 30628,
          "bus_number": "BC4204IO",
          "departure_city": "Київ",
          "departure_place": "АС \"Київ\", вул. С. Петлюри, 32 (10пл.)",
          "arrival_city": "Рим",
          "arrival_place": "Vicolo di Ponte Mammolo, 2 (неподалік метро Rebibbia)",
          "phoneNumber": "+380676741668 (Київ/автобус UA)..."
        }
      ]
    }
  ],
  "success": true
}
```

### Безпечний доступ до ціни в коді:
```js
const data = await res.json();
const price = data.trips_sequences?.[0]?.price ?? null;
const currency = data.trips_sequences?.[0]?.currency_code ?? 'UAH';
```

---

## 5. Архітектура збереження в BUSNET

1. **Статичні дані (Зберігаються в базі Supabase):**
   * Маршрутні лінії: `routes`
   * Зупинки та геодані: `route_stops` (назви станцій, точні адреси, GPS Lat/Lng, дні та час прибуття/відправлення).
   * Часові пояси: Україна (`UTC+2 / UTC+3`), Італія (`UTC+1 / UTC+2`).

2. **Динамічні дані (Запитуються на льоту або кешуються):**
   * Тарифи за квиток: запитуються через `/api/v2/booking/search_trips` під конкретну дату і пару міст при пошуку пасажиром.
   * Контактні телефони екіпажу на конкретну дату.
