/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Clock, Bus,
  Euro, Wifi, Battery, Wind, Coffee, Tv, Info,
  Save, Send, Loader2, ChevronDown, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '@busnet/shared/hooks/useFleet';
import { useDrivers } from '@busnet/shared/hooks/useDrivers';
import { toast } from 'react-hot-toast';
import BusnetCalendar from '@busnet/shared/components/common/BusnetCalendar';

const STEPS = [
  { id: 1, label: 'Маршрут', icon: MapPin },
  { id: 2, label: 'Транспорт', icon: Bus },
  { id: 3, label: 'Фінанси', icon: Euro },
];

const UA_CITIES = [
  'Київ', 'Львів', 'Чернівці', 'Ужгород', 'Тернопіль', 'Харків',
  'Одеса', 'Дніпро', 'Запоріжжя', 'Кривий Ріг', 'Миколаїв',
  'Вінниця', 'Херсон', 'Полтава', 'Чернігів', 'Черкаси',
  'Житомир', 'Суми', 'Хмельницький', 'Рівне', 'Кропивницький',
  'Івано-Франківськ', 'Луцьк', 'Біла Церква'
].sort();

const EU_CITIES = [
  'Варшава', 'Берлін', 'Прага', 'Відень', 'Краків', 'Вроцлав',
  'Гданськ', 'Лодзь', 'Познань', 'Люблін', 'Катовіце', 'Щецин',
  'Бремен', 'Гамбург', 'Мюнхен', 'Кельн', 'Франкфурт',
  'Штутгарт', 'Дюссельдорф', 'Лейпциг', 'Дортмунд',
  'Дрезден', 'Париж', 'Марсель', 'Ліон', 'Мілан', 'Рим',
  'Барселона', 'Мадрид', 'Амстердам', 'Брюссель', 'Цюрих', 'Женева'
].sort();

const AMENITY_LIST = [
  { id: 'wifi', icon: Wifi, label: 'Wi-Fi' },
  { id: 'usb', icon: Battery, label: 'USB' },
  { id: 'ac', icon: Wind, label: 'Клімат' },
  { id: 'toilet', icon: Info, label: 'Туалет' },
  { id: 'coffee', icon: Coffee, label: 'Кава' },
  { id: 'tv', icon: Tv, label: 'TV' },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest ml-1 block mb-2">{children}</label>;
}

function InputWrap({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export default function NewTrip() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { buses, fetchFleet } = useFleet();
  const { drivers, fetchDrivers } = useDrivers();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    from: 'Київ', to: 'Варшава', date: today,
    time: '08:00', arrivalTime: '20:30', stops: '',
    busId: '', driverId: '', seats: 50, price: 55,
    amenities: ['wifi', 'ac', 'usb'] as string[]
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setIsCalendarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { if (user) { fetchFleet(user.uid); fetchDrivers(user.uid); } }, [user]);

  useEffect(() => {
    if (buses.length > 0 && !formData.busId) {
      const b = buses.find(b => b.status === 'active') || buses[0];
      setFormData(p => ({ ...p, busId: b.id, seats: b.capacity }));
    }
    if (drivers.length > 0 && !formData.driverId) {
      const d = drivers.find(d => d.status === 'active') || drivers[0];
      setFormData(p => ({ ...p, driverId: d.id }));
    }
  }, [buses, drivers]);

  const formatDate = (s: string) => {
    try { return new Date(s).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return s; }
  };

  const set = (key: string, val: any) => setFormData(p => ({ ...p, [key]: val }));
  const toggleAmenity = (id: string) => setFormData(p => ({
    ...p, amenities: p.amenities.includes(id) ? p.amenities.filter(a => a !== id) : [...p.amenities, id]
  }));

  const validate = () => {
    if (step === 1) {
      if (!formData.date || formData.date < today) { toast.error('Виберіть коректну дату'); return false; }
    }
    if (step === 3) {
      if (formData.price <= 0) { toast.error('Ціна повинна бути більшою за нуль'); return false; }
    }
    return true;
  };

  const next = () => { if (validate()) setStep(s => Math.min(3, s + 1)); };
  const prev = () => setStep(s => Math.max(1, s - 1));

  const handlePublish = async () => {
    if (!user || !validate()) return;
    setLoading(true);
    const tid = toast.loading('Публікація рейсу...');
    try {
      const { error } = await supabase
        .from('trips')
        .insert({
          id: crypto.randomUUID(),
          carrierId: user.uid,
          departureCity: formData.from,
          arrivalCity: formData.to,
          departureDate: formData.date,
          departureTime: formData.time,
          arrivalTime: formData.arrivalTime,
          price: Math.max(1, Number(formData.price)),
          seatsTotal: Number(formData.seats),
          seatsBooked: 0,
          availableSeats: Number(formData.seats),
          status: 'pending_approval',
          amenities: formData.amenities,
          busId: formData.busId,
          driverId: formData.driverId,
          stops: formData.stops.split(',').map(s => s.trim()).filter(Boolean),
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success('Рейс успішно опубліковано!', { id: tid });
      navigate('/carrier/trips');
    } catch (e) {
      console.error(e);
      toast.error('Помилка при публікації', { id: tid });
    } finally { setLoading(false); }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setLoading(true);
    const tid = toast.loading('Збереження чернетки...');
    try {
      const { error } = await supabase
        .from('trip_drafts')
        .upsert({
          id: `draft_${Date.now()}`,
          carrierId: user.uid,
          data: {
            ...formData,
            updatedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success('Чернетку збережено', { id: tid });
    } catch (e) {
      console.error(e);
      toast.error('Помилка збереження', { id: tid });
    } finally { setLoading(false); }
  };

  const inputCls = "w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 px-5 text-sm font-medium text-white outline-none focus:border-[#ff6b35] transition-all appearance-none";

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-syne font-black text-2xl italic tracking-tighter uppercase text-white">Створити новий рейс</h2>
        <p className="text-[#5a6a85] text-xs font-medium mt-1 uppercase tracking-widest">Заповніть форму для публікації маршруту</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${step === s.id ? 'bg-[#ff6b35]/15 text-[#ff6b35]' : step > s.id ? 'text-emerald-400 cursor-pointer' : 'text-[#5a6a85] cursor-default'}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-[10px] font-black ${step === s.id ? 'bg-[#ff6b35] border-[#ff6b35] text-white' : step > s.id ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10'}`}>
                {step > s.id ? <Check size={12} /> : s.id}
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 transition-colors ${step > s.id ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-[#8899b5] text-xs leading-relaxed">
          Рейси публікуються автоматично. Модерація потрібна лише якщо ціна відхиляється від базової більше ніж на ±20%.
        </p>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-[#1a2235] border border-white/5 rounded-[28px] p-6 space-y-6"
        >
          {/* Step 1: Route */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#ff6b35]/10 text-[#ff6b35] flex items-center justify-center border border-[#ff6b35]/20">
                  <MapPin size={18} />
                </div>
                <h3 className="text-base font-bold text-white uppercase italic tracking-tight">Маршрут та час</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputWrap>
                  <FieldLabel>Місто відправлення</FieldLabel>
                  <select value={formData.from} onChange={e => set('from', e.target.value)} className={inputCls}>
                    {UA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </InputWrap>
                <InputWrap>
                  <FieldLabel>Місто призначення</FieldLabel>
                  <select value={formData.to} onChange={e => set('to', e.target.value)} className={inputCls}>
                    {EU_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </InputWrap>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputWrap>
                  <FieldLabel>Дата</FieldLabel>
                  <div className="relative" ref={calendarRef}>
                    <div onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="relative cursor-pointer">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6a85]" size={15} />
                      <div className="w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-black italic text-white flex items-center justify-between cursor-pointer hover:border-[#ff6b35] transition-all">
                        <span className="truncate">{formatDate(formData.date) || 'Дата'}</span>
                        <ChevronDown size={13} className={`text-slate-600 shrink-0 ml-1 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    <AnimatePresence>
                      {isCalendarOpen && (
                        <div className="absolute top-full left-0 z-50 mt-2 w-full sm:w-auto">
                          <BusnetCalendar
                            selectedDate={formData.date}
                            onSelect={v => { set('date', v); setIsCalendarOpen(false); }}
                          />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </InputWrap>
                <InputWrap>
                  <FieldLabel>Час виїзду</FieldLabel>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6a85]" size={15} />
                    <input type="time" value={formData.time} onChange={e => set('time', e.target.value)} className={`${inputCls} pl-11`} />
                  </div>
                </InputWrap>
                <InputWrap>
                  <FieldLabel>Прибуття</FieldLabel>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6a85]" size={15} />
                    <input type="time" value={formData.arrivalTime} onChange={e => set('arrivalTime', e.target.value)} className={`${inputCls} pl-11`} />
                  </div>
                </InputWrap>
              </div>

              <InputWrap>
                <FieldLabel>Зупинки (через кому)</FieldLabel>
                <input
                  placeholder="напр. Рівне, Луцьк, Люблін"
                  value={formData.stops}
                  onChange={e => set('stops', e.target.value)}
                  className={inputCls}
                />
              </InputWrap>
            </>
          )}

          {/* Step 2: Transport */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#ff6b35]/10 text-[#ff6b35] flex items-center justify-center border border-[#ff6b35]/20">
                  <Bus size={18} />
                </div>
                <h3 className="text-base font-bold text-white uppercase italic tracking-tight">Транспорт та Персонал</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputWrap>
                  <FieldLabel>Виберіть автобус</FieldLabel>
                  <select
                    value={formData.busId}
                    onChange={e => { const b = buses.find(b => b.id === e.target.value); set('busId', e.target.value); if (b) set('seats', b.capacity); }}
                    className={inputCls}
                  >
                    {buses.length > 0
                      ? buses.map(b => <option key={b.id} value={b.id}>{b.model} ({b.number}) · {b.capacity} місць</option>)
                      : <option disabled>Немає доступних автобусів</option>}
                  </select>
                </InputWrap>
                <InputWrap>
                  <FieldLabel>Призначити водія</FieldLabel>
                  <select value={formData.driverId} onChange={e => set('driverId', e.target.value)} className={inputCls}>
                    {drivers.length > 0
                      ? drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName} ({d.licenseNumber})</option>)
                      : <option disabled>Немає доступних водіїв</option>}
                  </select>
                </InputWrap>
              </div>

              <InputWrap>
                <FieldLabel>Зручності на борту</FieldLabel>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AMENITY_LIST.map(item => (
                    <label key={item.id} className="cursor-pointer group">
                      <input type="checkbox" className="hidden peer" checked={formData.amenities.includes(item.id)} onChange={() => toggleAmenity(item.id)} />
                      <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-black/20 border border-white/5 text-[#5a6a85] transition-all peer-checked:bg-[#ff6b35]/10 peer-checked:border-[#ff6b35] peer-checked:text-[#ff6b35]">
                        <item.icon size={15} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </InputWrap>
            </>
          )}

          {/* Step 3: Finance */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#ff6b35]/10 text-[#ff6b35] flex items-center justify-center border border-[#ff6b35]/20">
                  <Euro size={18} />
                </div>
                <h3 className="text-base font-bold text-white uppercase italic tracking-tight">Фінансові умови</h3>
              </div>

              <InputWrap>
                <FieldLabel>Ваша ціна квитка (€)</FieldLabel>
                <div className="relative">
                  <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff6b35]" size={18} />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => set('price', Number(e.target.value))}
                    className="w-full bg-black/30 border border-white/5 rounded-2xl py-4 pl-11 pr-6 text-2xl font-syne font-black text-[#ff6b35] outline-none focus:border-[#ff6b35] transition-all"
                  />
                </div>
                <p className="text-[9px] text-amber-400 font-bold uppercase tracking-tight ml-1 flex items-center gap-1 mt-1">
                  <Info size={10} /> Діапазон: €44–€66 (±20% від базової)
                </p>
              </InputWrap>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                  <span className="text-[#5a6a85]">Комісія BUSNET (8%)</span>
                  <span className="text-rose-400">-€{(formData.price * 0.08).toFixed(2)}</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black uppercase text-white tracking-widest">Ви отримуєте</span>
                  <span className="text-2xl font-syne font-black text-emerald-400 italic tracking-tighter">€{(formData.price * 0.92).toFixed(2)}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-2xl bg-[#ff6b35]/5 border border-[#ff6b35]/20 space-y-2 text-xs">
                <p className="font-black text-[#ff6b35] uppercase tracking-widest text-[10px]">Підсумок рейсу</p>
                <p className="text-white font-bold">{formData.from} → {formData.to}</p>
                <p className="text-[#8899b5]">{formatDate(formData.date)}, {formData.time} – {formData.arrivalTime}</p>
                {formData.stops && <p className="text-[#8899b5]">Зупинки: {formData.stops}</p>}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons — sticky on mobile */}
      <div className="fixed bottom-0 left-0 right-0 lg:relative bg-[#0b0e14]/90 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none border-t border-white/5 lg:border-0 p-4 lg:p-0 flex gap-3 z-40">
        {step > 1 && (
          <button onClick={prev} className="flex items-center gap-2 px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase hover:bg-white/10 transition-all">
            <ChevronLeft size={16} /> Назад
          </button>
        )}
        {step < 3 ? (
          <button onClick={next} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#ff6b35] to-[#cc3300] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all">
            Далі <ChevronRight size={16} />
          </button>
        ) : (
          <div className="flex-1 flex gap-3">
            <button onClick={handleSaveDraft} disabled={loading} className="px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50">
              <Save size={15} /> Чернетка
            </button>
            <button onClick={handlePublish} disabled={loading || !formData.date} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#ff6b35] to-[#cc3300] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Опублікувати
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
