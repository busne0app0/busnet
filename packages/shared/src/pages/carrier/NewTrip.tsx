/**
 * NewTrip.tsx — MISSION CONTROL (SMART EDITION)
 * Форма створення маршрутів з інтелектуальним парсингом та автоматичною генерацією рейсів.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Bus, Euro, Clock, Check,
  ChevronLeft, ChevronRight, Loader2,
  Send, Save, Info, Trash2, Plus, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '@busnet/shared/hooks/useFleet';
import { useDrivers } from '@busnet/shared/hooks/useDrivers';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ParsedStop {
  city: string;
  address: string;
  time: string;           
  dayHint: string;        
  dayOffset: number;      
  isEU: boolean;
}

interface SegmentPrice {
  fromCity: string;
  toCity: string;
  price: number;
  currency: 'UAH' | 'EUR';
}

interface FormState {
  routeName: string;
  fromCity: string;
  toCity: string;
  direction: 'oneway' | 'roundtrip';
  currency: string;
  seats: number;
  rawTextForward: string;
  rawTextBack: string;
  stopsForward: ParsedStop[];
  stopsBack: ParsedStop[];
  activeDaysThere: number[];   
  activeDaysBack: number[];
  busId: string;
  driverId: string;
  amenities: string[];
  pricesThere: SegmentPrice[];
  pricesBack: SegmentPrice[];
  singlePriceThere: number;
  singlePriceBack: number;
  pricingMode: 'single' | 'segment';
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const EU_KEYWORDS = [
  'варшав','берлін','прага','відень','краків','вроцлав','гданськ','лодзь',
  'познань','люблін','катовіце','щецин','бремен','гамбург','мюнхен','кельн',
  'франкфурт','штутгарт','дюссельдорф','лейпциг','дортмунд','дрезден',
  'париж','марсель','ліон','мілан','рим','барселон','мадрид','амстердам',
  'брюссель','цюрих','женева','флоренц','неаполь','салерн','кассін','каянелл',
  'капу','казерт','будапешт','бухарест','братислав','варн','софі',
];

const DAY_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];
const DAY_FULL  = ['Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота','Неділя'];
const DAY_MAP: Record<string, number> = {
  'понеділок':0,'вівторок':1,'середа':2,'четвер':3,
  'п\'ятниця':4,'пятниця':4,'субота':5,'неділя':6,
};

const AMENITY_LIST = [
  { id:'wifi',   label:'Wi-Fi' },
  { id:'usb',    label:'USB' },
  { id:'ac',     label:'Клімат' },
  { id:'toilet', label:'Туалет' },
  { id:'coffee', label:'Кава' },
  { id:'tv',     label:'TV' },
];

const STEPS = [
  { id:0, label:'Маршрут',  icon: MapPin },
  { id:1, label:'Зупинки',  icon: MapPin },
  { id:2, label:'Розклад',  icon: Clock  },
  { id:3, label:'Транспорт',icon: Bus    },
  { id:4, label:'Ціни',     icon: Euro   },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isEuCity(name: string): boolean {
  const lower = name.toLowerCase();
  return EU_KEYWORDS.some(k => lower.includes(k));
}

function parseStopsText(raw: string): ParsedStop[] {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const stops: ParsedStop[] = [];
  let i = 0;

  while (i < lines.length) {
    const timeLineMatch = lines[i].match(/^(\d{1,2}:\d{2})\s*(.*)$/);
    if (!timeLineMatch) { i++; continue; }

    const time     = timeLineMatch[1];
    const dayHint  = timeLineMatch[2].trim();
    const city     = lines[i + 1] ?? '';
    const addrRaw  = lines[i + 2] ?? '';
    const address  = addrRaw.startsWith('(')
      ? addrRaw.replace(/^\(/, '').replace(/\)$/, '').trim()
      : '';

    stops.push({
      time,
      dayHint,
      city: city.trim(),
      address,
      dayOffset: 0,
      isEU: isEuCity(city),
    });

    i += address ? 3 : 2;
  }

  let baseDay = -1;
  return stops.map((s, idx) => {
    const d = DAY_MAP[s.dayHint.toLowerCase()] ?? -1;
    if (idx === 0) { baseDay = d; return { ...s, dayOffset: 0 }; }
    if (d === -1 || baseDay === -1) return s;
    let diff = d - baseDay;
    if (diff < 0) diff += 7;
    return { ...s, dayOffset: diff };
  });
}

function getNextDates(weekDay: number, weeksAhead = 4): string[] {
  const today = new Date();
  const dates: string[] = [];
  const jsDay = weekDay === 6 ? 0 : weekDay + 1;
  
  for (let w = 0; w < weeksAhead; w++) {
    const d = new Date(today);
    const diff = ((jsDay - d.getDay()) + 7) % 7 || 7;
    d.setDate(d.getDate() + diff + w * 7);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function buildTripsForRoute(
  routeId: string,
  carrierId: string,
  stops: ParsedStop[],
  activeDays: number[],
  seats: number,
  busId: string,
  driverId: string,
  amenities: string[],
  pricesMap: Record<string, number>,
  defaultPrice: number,
): any[] {
  if (!stops.length || !activeDays.length) return [];

  const fromCity = stops[0].city;
  const toCity   = stops[stops.length - 1].city;
  const depTime  = stops[0].time;
  const arrTime  = stops[stops.length - 1].time;
  const arrOffset= stops[stops.length - 1].dayOffset;

  const trips: any[] = [];

  for (const day of activeDays) {
    for (const depDate of getNextDates(day, 4)) {
      const arrDate = new Date(depDate);
      arrDate.setDate(arrDate.getDate() + arrOffset);

      trips.push({
        id:             'T-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        carrierId,
        routeId,
        departureCity:  fromCity,
        arrivalCity:    toCity,
        departureDate:  depDate,
        departureTime:  depTime,
        arrivalTime:    arrTime,
        price:          defaultPrice,
        seatsTotal:     seats,
        seatsBooked:    0,
        availableSeats: seats,
        status:         'pending_approval',
        busId:          busId || null,
        driverId:       driverId || null,
        amenities,
        stops: stops.map(s => ({
          city:    s.city,
          address: s.address,
          time:    s.time,
          dayOffset: s.dayOffset,
        })),
        created_at: new Date().toISOString(),
      });
    }
  }
  return trips;
}

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest block mb-1.5">
      {children}
    </label>
  );
}

function StopRow({
  stop, index, total,
  onUpdate, onDelete,
}: {
  stop: ParsedStop; index: number; total: number;
  onUpdate: (i: number, key: keyof ParsedStop, val: string) => void;
  onDelete: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr_1fr_32px] gap-3 items-start py-3 border-b border-white/5 last:border-0">
      <div>
        <input
          type="text"
          value={stop.time}
          onChange={e => onUpdate(index, 'time', e.target.value)}
          className="w-full bg-black/20 border border-white/5 rounded-xl px-2 py-1.5 text-xs font-bold text-white text-center outline-none focus:border-[#ff6b35]"
          placeholder="HH:MM"
        />
        {stop.dayOffset > 0 && (
          <div className="text-[9px] text-amber-400 font-bold text-center mt-1">
            +{stop.dayOffset}д
          </div>
        )}
      </div>

      <div>
        <input
          value={stop.city}
          onChange={e => onUpdate(index, 'city', e.target.value)}
          className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-1.5 text-sm font-medium text-white outline-none focus:border-[#ff6b35]"
          placeholder="Місто"
        />
        <div className="flex items-center gap-1 mt-1">
          {index === 0 && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">Відправлення</span>}
          {index === total - 1 && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Прибуття</span>}
        </div>
      </div>

      <input
        value={stop.address}
        onChange={e => onUpdate(index, 'address', e.target.value)}
        className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-[#8899b5] outline-none focus:border-[#ff6b35]"
        placeholder="Адреса зупинки"
      />

      <button
        onClick={() => onDelete(index)}
        className="mt-1 text-[#5a6a85] hover:text-rose-400 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

export default function NewTrip() {
  const { user }  = useAuthStore();
  const navigate  = useNavigate();
  const { buses, fetchFleet }     = useFleet();
  const { drivers, fetchDrivers } = useDrivers();

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [dirTab, setDirTab]   = useState<0 | 1>(0);

  const [form, setForm] = useState<FormState>({
    routeName:        '',
    fromCity:         '',
    toCity:           '',
    direction:        'roundtrip',
    currency:         'UAH',
    seats:            50,
    rawTextForward:   '',
    rawTextBack:      '',
    stopsForward:     [],
    stopsBack:        [],
    activeDaysThere:  [],
    activeDaysBack:   [],
    busId:            '',
    driverId:         '',
    amenities:        ['wifi','ac','usb'],
    pricesThere:      [],
    pricesBack:       [],
    singlePriceThere: 2800,
    singlePriceBack:  65,
    pricingMode:      'segment',
  });

  useEffect(() => {
    if (user) { fetchFleet(user.uid); fetchDrivers(user.uid); }
  }, [user]);

  useEffect(() => {
    if (buses.length > 0 && !form.busId) {
      const b = buses.find(b => b.status === 'active') || buses[0];
      setForm(p => ({ ...p, busId: b.id, seats: b.capacity }));
    }
    if (drivers.length > 0 && !form.driverId) {
      const d = drivers.find(d => d.status === 'active') || drivers[0];
      setForm(p => ({ ...p, driverId: d.id }));
    }
  }, [buses, drivers]);

  useEffect(() => {
    if (form.stopsForward.length > 1) {
      const segs: SegmentPrice[] = form.stopsForward.slice(0, -1).map((s, i) => ({
        fromCity: s.city,
        toCity:   form.stopsForward[i + 1].city,
        price:    form.pricesThere[i]?.price ?? 2800,
        currency: 'UAH',
      }));
      setForm(p => ({ ...p, pricesThere: segs }));
    }
    if (form.stopsBack.length > 1) {
      const segs: SegmentPrice[] = form.stopsBack.slice(0, -1).map((s, i) => ({
        fromCity: s.city,
        toCity:   form.stopsBack[i + 1].city,
        price:    form.pricesBack[i]?.price ?? 65,
        currency: 'EUR',
      }));
      setForm(p => ({ ...p, pricesBack: segs }));
    }
  }, [form.stopsForward.length, form.stopsBack.length]);

  const handleParse = (dir: 'forward' | 'back') => {
    const raw = dir === 'forward' ? form.rawTextForward : form.rawTextBack;
    if (!raw.trim()) { toast.error('Вставте текст із зупинками'); return; }
    const stops = parseStopsText(raw);
    if (!stops.length) { toast.error('Не вдалося розпізнати зупинки'); return; }

    if (dir === 'forward') {
      setForm(p => ({
        ...p,
        stopsForward: stops,
        fromCity: p.fromCity || stops[0]?.city || '',
        toCity:   p.toCity   || stops[stops.length - 1]?.city || '',
        routeName: p.routeName || `${stops[0]?.city} — ${stops[stops.length - 1]?.city}`,
      }));
    } else {
      setForm(p => ({ ...p, stopsBack: stops }));
    }
    toast.success(`Розпізнано ${stops.length} зупинок`);
  };

  const handlePublish = async () => {
    if (!user) return;
    if (!form.routeName.trim()) { toast.error('Введіть назву маршруту'); setStep(0); return; }
    if (form.stopsForward.length < 2) { toast.error('Додайте зупинки'); setStep(1); return; }
    if (form.activeDaysThere.length === 0) { toast.error('Оберіть дні'); setStep(2); return; }

    setLoading(true);
    const tid = toast.loading('Публікація маршруту...');

    try {
      const routeId = 'R-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error: routeErr } = await supabase.from('routes').insert({
        id:           routeId,
        carrierId:    user.uid,
        name:         form.routeName,
        direction:    form.direction,
        seats:        form.seats,
        currency:     'UAH',
        status:       'pending',
        stopsThere:   form.stopsForward,
        stopsBack:    form.stopsBack,
        pricesThere:  form.pricesThere,
        pricesBack:   form.pricesBack,
        pricingMode:  form.pricingMode,
        singlePrice:  form.singlePriceThere,
      });
      if (routeErr) throw routeErr;

      const tripsForward = buildTripsForRoute(
        routeId, user.uid,
        form.stopsForward,
        form.activeDaysThere,
        form.seats,
        form.busId,
        form.driverId,
        form.amenities,
        {},
        form.singlePriceThere,
      );

      const tripsBack = form.direction === 'roundtrip'
        ? buildTripsForRoute(
            routeId, user.uid,
            form.stopsBack,
            form.activeDaysBack,
            form.seats,
            form.busId,
            form.driverId,
            form.amenities,
            {},
            form.singlePriceBack,
          )
        : [];

      const allTrips = [...tripsForward, ...tripsBack];
      if (allTrips.length > 0) {
        const { error: tripsErr } = await supabase.from('trips').insert(allTrips);
        if (tripsErr) throw tripsErr;
      }

      toast.success(`Успішно! Створено ${allTrips.length} рейсів.`, { id: tid });
      navigate('/carrier/trips');
    } catch (e: any) {
      toast.error('Помилка: ' + (e.message || 'невідома'), { id: tid });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('trip_drafts').upsert({
        id: `draft_${user.uid}`,
        carrierId: user.uid,
        data: form,
        updatedAt: new Date().toISOString()
      });
      if (error) throw error;
      toast.success('Чернетку збережено');
    } catch (e: any) {
      toast.error('Помилка збереження: ' + e.message);
    }
  };

  const inputCls = "w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-[#ff6b35] transition-all";
  const textareaCls = "w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-[#ff6b35] font-mono leading-relaxed resize-none";

  return (
    <div className="space-y-5 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-syne font-black text-2xl italic tracking-tighter uppercase text-white">Новий маршрут</h2>
          <p className="text-[#5a6a85] text-[10px] font-medium uppercase tracking-widest mt-1">Smart Builder Edition</p>
        </div>
        <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Sparkles size={14} className="text-[#ff6b35]" />
          <span className="text-[10px] font-black text-[#ff6b35] uppercase">AI Parser Active</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-2 p-1.5 rounded-xl transition-all ${step === i ? 'bg-[#ff6b35]/10 text-[#ff6b35]' : 'text-[#5a6a85]'}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border ${step === i ? 'bg-[#ff6b35] border-[#ff6b35] text-white' : 'border-white/10 bg-white/5'}`}>
                {i < step ? <Check size={10} /> : s.id + 1}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider hidden sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-white/5 mx-1" />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-mission-control border border-white/5 rounded-[32px] p-6 min-h-[400px]"
        >
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Назва маршруту</FieldLabel>
                  <input className={inputCls} value={form.routeName} onChange={e => setForm(p => ({ ...p, routeName: e.target.value }))} placeholder="Черкаси — Варшава" />
                </div>
                <div>
                  <FieldLabel>Тип</FieldLabel>
                  <select className={inputCls} value={form.direction} onChange={e => setForm(p => ({ ...p, direction: e.target.value as any }))}>
                    <option value="roundtrip">Туди і назад</option>
                    <option value="oneway">Тільки туди</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input className={inputCls} value={form.fromCity} onChange={e => setForm(p => ({ ...p, fromCity: e.target.value }))} placeholder="Звідки" />
                <input className={inputCls} value={form.toCity} onChange={e => setForm(p => ({ ...p, toCity: e.target.value }))} placeholder="Куди" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mb-4">
                <button onClick={() => setDirTab(0)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dirTab === 0 ? 'bg-[#ff6b35] text-white' : 'text-[#5a6a85]'}`}>Туди →</button>
                <button onClick={() => setDirTab(1)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dirTab === 1 ? 'bg-cyan-500 text-white' : 'text-[#5a6a85]'}`}>← Назад</button>
              </div>
              <textarea
                className={textareaCls}
                rows={10}
                value={dirTab === 0 ? form.rawTextForward : form.rawTextBack}
                onChange={e => setForm(p => ({ ...p, [dirTab === 0 ? 'rawTextForward' : 'rawTextBack']: e.target.value }))}
                placeholder="20:00 Пн&#10;Київ&#10;(Автовокзал)&#10;..."
              />
              <button onClick={() => handleParse(dirTab === 0 ? 'forward' : 'back')} className="w-full py-3 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-2xl text-[#ff6b35] text-[10px] font-black uppercase tracking-widest hover:bg-[#ff6b35]/20">Розпізнати зупинки</button>
              
              <div className="space-y-2 mt-4">
                {(dirTab === 0 ? form.stopsForward : form.stopsBack).map((s, i) => (
                  <StopRow key={i} stop={s} index={i} total={(dirTab === 0 ? form.stopsForward : form.stopsBack).length} onUpdate={(idx, k, v) => {
                    const arr = dirTab === 0 ? [...form.stopsForward] : [...form.stopsBack];
                    (arr[idx] as any)[k] = v;
                    setForm(p => ({ ...p, [dirTab === 0 ? 'stopsForward' : 'stopsBack']: arr }));
                  }} onDelete={idx => {
                    setForm(p => ({ ...p, [dirTab === 0 ? 'stopsForward' : 'stopsBack']: (dirTab === 0 ? p.stopsForward : p.stopsBack).filter((_, ix) => ix !== idx) }));
                  }} />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <FieldLabel>Дні виїзду — Туди</FieldLabel>
                <div className="grid grid-cols-7 gap-2">
                  {DAY_SHORT.map((d, i) => (
                    <button key={i} onClick={() => {
                      const cur = form.activeDaysThere;
                      setForm(p => ({ ...p, activeDaysThere: cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i].sort() }));
                    }} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${form.activeDaysThere.includes(i) ? 'bg-[#ff6b35] border-[#ff6b35] text-white' : 'bg-white/5 border-white/5 text-[#5a6a85]'}`}>{d}</button>
                  ))}
                </div>
              </div>
              {form.direction === 'roundtrip' && (
                <div>
                  <FieldLabel>Дні виїзду — Назад</FieldLabel>
                  <div className="grid grid-cols-7 gap-2">
                    {DAY_SHORT.map((d, i) => (
                      <button key={i} onClick={() => {
                        const cur = form.activeDaysBack;
                        setForm(p => ({ ...p, activeDaysBack: cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i].sort() }));
                      }} className={`py-3 rounded-xl text-[10px] font-black border transition-all ${form.activeDaysBack.includes(i) ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white/5 border-white/5 text-[#5a6a85]'}`}>{d}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select className={inputCls} value={form.busId} onChange={e => setForm(p => ({ ...p, busId: e.target.value }))}>
                  {buses.map(b => <option key={b.id} value={b.id}>{b.number} ({b.capacity} місць)</option>)}
                </select>
                <select className={inputCls} value={form.driverId} onChange={e => setForm(p => ({ ...p, driverId: e.target.value }))}>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {AMENITY_LIST.map(a => (
                  <button key={a.id} onClick={() => setForm(p => ({ ...p, amenities: p.amenities.includes(a.id) ? p.amenities.filter(x => x !== a.id) : [...p.amenities, a.id] }))} className={`p-3 rounded-xl text-[9px] font-black uppercase border transition-all ${form.amenities.includes(a.id) ? 'bg-[#ff6b35]/20 border-[#ff6b35] text-[#ff6b35]' : 'bg-white/5 border-white/5 text-[#5a6a85]'}`}>{a.label}</button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
               <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <FieldLabel>Ціна за замовчуванням (₴)</FieldLabel>
                <div className="flex items-center gap-3">
                  <input type="number" className="bg-transparent text-3xl font-syne font-black text-[#ff6b35] outline-none w-full" value={form.singlePriceThere} onChange={e => setForm(p => ({ ...p, singlePriceThere: +e.target.value }))} />
                  <span className="text-xl font-black text-[#5a6a85]">UAH</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                <div className="text-[10px] font-black text-cyan-400 uppercase mb-2">Підсумок</div>
                <div className="text-xs text-[#8899b5]">Буде створено <span className="text-white font-bold">{(form.activeDaysThere.length + form.activeDaysBack.length) * 4}</span> рейсів на наступні 30 днів.</div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0b0e14]/80 backdrop-blur-md border-t border-white/5 flex gap-3 z-50">
        {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase"><ChevronLeft size={16} /></button>}
        {step < 4 ? (
          <button onClick={() => setStep(s => s + 1)} className="flex-1 py-4 bg-gradient-to-r from-[#ff6b35] to-[#cc3300] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#ff6b35]/20">Далі</button>
        ) : (
          <div className="flex-1 flex gap-2">
            <button onClick={handleSaveDraft} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase"><Save size={16} /></button>
            <button onClick={handlePublish} disabled={loading} className="flex-1 py-4 bg-gradient-to-r from-[#ff6b35] to-[#cc3300] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#ff6b35]/20 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Публікувати
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
