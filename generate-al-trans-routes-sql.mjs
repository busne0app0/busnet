// Usage: node generate-al-trans-routes-sql.mjs al_trans_master_routes.json
// Output: al_trans_routes_import.sql -> Supabase SQL Editor
//
// Пише 6 маршрутів AL-TRANS прямо в public.routes (звідти їх читають кабінет перевізника і лендинг).
// - Один рядок routes на лінію: розклади Пн/Чт, Чт/Нд, Сб/Вт зливаються в days (як вже зроблено для "Черкаси - Салерно")
// - dayOffset рахується з реальних днів тижня у JSON
// - Якщо маршрут з такою назвою у цього перевізника вже є — оновлюється (старі ціни по містах зберігаються)
import fs from "node:fs";
import { randomUUID } from "node:crypto";

const CARRIER_ID = "ec987229-0773-49b9-bac8-69d562a794d1"; // Al TRANS
const input = process.argv[2] || "al_trans_master_routes.json";
const lines = JSON.parse(fs.readFileSync(input, "utf8"));

const DAY_IDX = { "Понеділок": 0, "Вівторок": 1, "Середа": 2, "Четвер": 3, "П'ятниця": 4, "Субота": 5, "Неділя": 6 };
const ABBR = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "НД"];
const norm = (s) => String(s).replace(/[’ʼ]/g, "'").trim();
const dayIdx = (s) => {
  const v = DAY_IDX[norm(s)];
  if (v === undefined) throw new Error(`Невідомий день тижня: ${s}`);
  return v;
};
const minutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const uniq = (a) => [...new Set(a)];
const dq = (tag, json) => `$${tag}$${json}$${tag}$`;

const warnings = [];
function warnOrder(lineName, label, items) {
  for (let k = 1; k < items.length; k++) {
    const a = items[k - 1], b = items[k];
    if (a.country !== b.country) continue; // зсув часових поясів на кордоні
    if (a.offset * 1440 + minutes(a.time) > b.offset * 1440 + minutes(b.time))
      warnings.push(`${lineName} [${label}]: ${a.city} ${a.time} (+${a.offset}д) → ${b.city} ${b.time} (+${b.offset}д) — час іде назад`);
  }
}

let sql = `-- AL-TRANS → public.routes. Згенеровано з ${input}
-- 1. Вимикаємо користувацькі тригери валідації (без системних ключів)
ALTER TABLE public.routes DISABLE TRIGGER USER;

begin;

-- зберігає вже виставлені ціни по містах при оновленні існуючого маршруту
create or replace function pg_temp.altrans_carry_prices(new_j jsonb, old_j jsonb)
returns jsonb language sql as $f$
  select jsonb_set(new_j, '{stops}', coalesce((
    select jsonb_agg(
      case when o.price is not null then jsonb_set(s.stop, '{price}', to_jsonb(o.price)) else s.stop end
      order by s.ord)
    from jsonb_array_elements(new_j->'stops') with ordinality as s(stop, ord)
    left join lateral (
      select (os->>'price')::numeric as price
      from jsonb_array_elements(coalesce(old_j->'stops', '[]'::jsonb)) os
      where trim(os->>'city') = trim(s.stop->>'city') limit 1
    ) o on true
  ), '[]'::jsonb));
$f$;

`;

for (const line of lines) {
  const sched0 = line.schedules[0];
  const stops = [...sched0.stops].sort((a, b) => a.order - b.order);
  const parts = line.name.split(" - ");
  const name = parts.length >= 3 ? parts.slice(0, 2).join(" - ") : line.name;

  // туди
  const outBase = dayIdx(stops[0].departureDay);
  const outItems = stops.map((p) => ({
    id: randomUUID(), city: p.city, time: p.departureTime, price: 0,
    address: p.station, dayOffset: (dayIdx(p.departureDay) - outBase + 7) % 7,
    country: p.country,
    cityId: p.cityId,
  }));
  // назад (зупинки у зворотному порядку)
  const rev = [...stops].reverse();
  const inBase = dayIdx(rev[0].returnDay);
  const inItems = rev.map((p) => ({
    id: randomUUID(), city: p.city, time: p.returnTime, price: 0,
    address: p.station, dayOffset: (dayIdx(p.returnDay) - inBase + 7) % 7,
    country: p.country,
    cityId: p.cityId,
  }));

  warnOrder(name, "туди", outItems.map((x) => ({ ...x, offset: x.dayOffset })));
  warnOrder(name, "назад", inItems.map((x) => ({ ...x, offset: x.dayOffset })));

  const strip = ({ country, ...rest }) => ({ ...rest, offset: undefined });
  const build = (days, items) => JSON.stringify({
    days,
    stops: items.map(({ country, ...rest }) => rest),
  });

  const outbound = build(uniq(line.schedules.map((s) => ABBR[dayIdx(s.departureDay)])), outItems);
  const inbound = build(uniq(line.schedules.map((s) => ABBR[dayIdx(s.returnDay)])), inItems);
  const nameSql = `'${name.replace(/'/g, "''")}'`;

  sql += `-- ${name}: ${stops.length} зупинок, дні туди ${uniq(line.schedules.map((s) => s.departureDay)).join("/")}
with new as (
  select ${dq("o", outbound)}::jsonb as o, ${dq("i", inbound)}::jsonb as i
), up as (
  update public.routes r
  set outbound = pg_temp.altrans_carry_prices(new.o, r.outbound),
      inbound  = pg_temp.altrans_carry_prices(new.i, r.inbound),
      operator = 'AL-TRANS',
      status   = 'active',
      seats    = coalesce(r.seats, 50),
      currency = 'UAH'
  from new
  where r.carrier_id = '${CARRIER_ID}' and r.name = ${nameSql}
  returning r.id
)
insert into public.routes (carrier_id, name, operator, outbound, inbound, status, seats, currency)
select '${CARRIER_ID}', ${nameSql}, 'AL-TRANS', new.o, new.i, 'active', 50, 'UAH'
from new
where not exists (select 1 from up);

`;
}

sql += `
-- Видаляємо старі тестові маршрути
DELETE FROM public.routes 
WHERE carrier_id = '${CARRIER_ID}' 
  AND name NOT IN ('Черкаси - Салерно', 'Херсон - Лечче', 'Київ - Комо', 'Херсон - Імперія', 'Запоріжжя - Салерно', 'Чернівці - Турин');

commit;

-- Вмикаємо тригери назад
ALTER TABLE public.routes ENABLE TRIGGER USER;

-- Перевірка
select id, name, status,
       outbound->'days' as days_out, jsonb_array_length(outbound->'stops') as stops_out,
       inbound->'days'  as days_in,  jsonb_array_length(inbound->'stops')  as stops_in
from public.routes
where carrier_id = '${CARRIER_ID}'
order by name;
`;

fs.writeFileSync("al_trans_routes_import.sql", sql);
console.log(`OK: ${lines.length} ліній → al_trans_routes_import.sql (${(sql.length / 1024).toFixed(0)} KB)`);
if (warnings.length) {
  console.log(`\n⚠ Перевір порядок/час у джерелі (${warnings.length}):`);
  warnings.forEach((w) => console.log("  - " + w));
}
