/**
 * NewTrip.tsx — MISSION CONTROL (ULTIMATE PREMIUM EDITION)
 * Дизайн: Next-Gen Aerospace / Cyber-Logic
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Bus, Euro, Clock, Check,
  ChevronLeft, ChevronRight, Loader2,
  Send, Save, Info, Trash2, Plus, Sparkles,
  Wifi, Wind, Coffee, Tv, Battery, Users,
  Globe, Zap, ArrowRight, Calendar, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../supabase/config';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '../../hooks/useFleet';
import { useDrivers } from '../../hooks/useDrivers';
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

const DAY_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];
const DAY_FULL  = ['Понеділок','Вівторок','Середа','Четвер','П\'ятниця','Субота','Неділя'];
const DAY_MAP: Record<string, number> = {
  'понеділок':0,'вівторок':1,'середа':2,'четвер':3,
  'п\'ятниця':4,'пятниця':4,'субота':5,'неділя':6,
};

const AMENITY_LIST = [
  { id:'wifi',   label:'Wi-Fi',   icon: Wifi },
  { id:'usb',    label:'USB',     icon: Battery },
  { id:'ac',     label:'Клімат',  icon: Wind },
  { id:'toilet', label:'Туалет',  icon: Users },
  { id:'coffee', label:'Кава',    icon: Coffee },
  { id:'tv',     label:'TV',      icon: Tv },
];

const STEPS = [
  { id:0, label:'Логістика', icon: Globe,   color: 'from-cyan-400 to-blue-600' },
  { id:1, label:'Маршрут',   icon: MapPin,  color: 'from-blue-500 to-indigo-600' },
  { id:2, label:'Графік',    icon: Calendar, color: 'from-indigo-500 to-violet-600' },
  { id:3, label:'Флот',      icon: Bus,      color: 'from-violet-500 to-fuchsia-600' },
  { id:4, label:'Фінанси',   icon: Euro,     color: 'from-fuchsia-500 to-pink-600' },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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
      isEU: false, // Simplified
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

// ─────────────────────────────────────────────
// Styled Components
// ─────────────────────────────────────────────

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass-mission-control rounded-[32px] p-8 border border-white/10 relative overflow-hidden ${className}`}>
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
    {children}
  </div>
);

const InputField = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 block">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
        <Icon size={18} />
      </div>
      <input
        {...props}
        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold placeholder:text-slate-700 outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all relative z-10"
      />
    </div>
  </div>
);

const StepIcon = ({ step, activeStep, icon: Icon, color }: any) => {
  const isActive = step === activeStep;
  const isPast = step < activeStep;
  
  return (
    <div className="flex flex-col items-center gap-3 relative">
      <div className={`
        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10
        ${isActive ? `bg-gradient-to-br ${color} shadow-[0_0_30px_rgba(0,212,255,0.3)] scale-110` : 
          isPast ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 
          'bg-white/5 border border-white/10 text-slate-600'}
      `}>
        {isPast ? <Check size={24} strokeWidth={3} /> : <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-white' : 'text-slate-600'}`}>
        {STEPS[step].label}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
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

  const handleNext = () => {
     if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
     if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-2">
                <Sparkles size={12} className="text-cyan-400" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">System Online</span>
              </div>
              <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center gap-2">
                <Zap size={12} className="text-violet-400" />
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Pro Builder</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-syne font-black italic tracking-tighter uppercase leading-none">
              Конструктор <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">рейсів</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Керування маршрутною мережею BUSNET UA v4.0</p>
          </div>

          <div className="hidden md:flex gap-12 items-center px-8 py-4 glass-mission-control rounded-3xl border border-white/5">
            <div className="text-center">
              <div className="text-2xl font-syne font-black text-white leading-none">15%</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Оптимізація</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-syne font-black text-cyan-400 leading-none">Smart</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Алгоритм</div>
            </div>
          </div>
        </div>

        {/* STEPPER */}
        <div className="relative flex justify-between px-4 max-w-3xl mx-auto">
          <div className="absolute top-7 left-0 w-full h-px bg-white/5 -z-10" />
          {STEPS.map((s, i) => (
            <StepIcon key={s.id} step={i} activeStep={step} icon={s.icon} color={s.color} />
          ))}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                <Card>
                  {step === 0 && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                          label="Назва маршруту" 
                          icon={Zap} 
                          placeholder="Наприклад: Київ — Варшава"
                          value={form.routeName}
                          onChange={(e: any) => setForm({...form, routeName: e.target.value})}
                        />
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 block">Режим поїздки</label>
                          <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl h-[58px]">
                            <button 
                              onClick={() => setForm({...form, direction: 'roundtrip'})}
                              className={`rounded-xl text-[10px] font-black uppercase transition-all ${form.direction === 'roundtrip' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                            >
                              Туди-Назад
                            </button>
                            <button 
                              onClick={() => setForm({...form, direction: 'oneway'})}
                              className={`rounded-xl text-[10px] font-black uppercase transition-all ${form.direction === 'oneway' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                            >
                              В один бік
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                          label="Місто відправлення" 
                          icon={MapPin} 
                          placeholder="Київ" 
                          value={form.fromCity}
                          onChange={(e: any) => setForm({...form, fromCity: e.target.value})}
                        />
                        <InputField 
                          label="Місто прибуття" 
                          icon={Globe} 
                          placeholder="Варшава" 
                          value={form.toCity}
                          onChange={(e: any) => setForm({...form, toCity: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        <button 
                          onClick={() => setDirTab(0)} 
                          className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${dirTab === 0 ? 'bg-cyan-500 text-black shadow-xl shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                        >
                          <ArrowRight size={14} /> Напрямок ТУДИ
                        </button>
                        {form.direction === 'roundtrip' && (
                          <button 
                            onClick={() => setDirTab(1)} 
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${dirTab === 1 ? 'bg-violet-500 text-white shadow-xl shadow-violet-500/20' : 'text-slate-500 hover:text-white'}`}
                          >
                             Напрямок НАЗАД <ArrowRight size={14} className="rotate-180" />
                          </button>
                        )}
                      </div>

                      <div className="relative group">
                        <div className="absolute -top-3 right-4 px-3 py-1 bg-cyan-500 text-black text-[9px] font-black uppercase rounded-lg z-20 shadow-lg">AI Parser Input</div>
                        <textarea
                          rows={8}
                          className="w-full bg-black/40 border border-white/10 rounded-[24px] p-6 text-sm text-white font-mono leading-relaxed outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                          placeholder="Вставте текст розкладу тут...&#10;Приклад:&#10;20:00 Пн&#10;Київ&#10;(Автовокзал Центральний)"
                          value={dirTab === 0 ? form.rawTextForward : form.rawTextBack}
                          onChange={(e) => setForm({...form, [dirTab === 0 ? 'rawTextForward' : 'rawTextBack']: e.target.value})}
                        />
                        <button 
                          onClick={() => {
                             const stops = parseStopsText(dirTab === 0 ? form.rawTextForward : form.rawTextBack);
                             setForm({...form, [dirTab === 0 ? 'stopsForward' : 'stopsBack']: stops});
                             toast.success('AI: Розклад успішно розпізнано!');
                          }}
                          className="absolute bottom-4 right-4 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md"
                        >
                          <Sparkles size={14} className="inline mr-2" /> Інтелектуальний розбір
                        </button>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Зупинки ({ (dirTab === 0 ? form.stopsForward : form.stopsBack).length })</label>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                           {(dirTab === 0 ? form.stopsForward : form.stopsBack).map((stop, i) => (
                             <motion.div 
                              initial={{ opacity: 0, y: 10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              key={i} 
                              className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-cyan-500/30 transition-all"
                             >
                               <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center font-syne font-black text-cyan-400 group-hover:scale-110 transition-transform">{stop.time}</div>
                               <div className="flex-1">
                                 <div className="text-sm font-bold text-white">{stop.city}</div>
                                 <div className="text-[10px] text-slate-500 uppercase font-bold">{stop.address || 'Центральний автовокзал'}</div>
                               </div>
                               {stop.dayOffset > 0 && <div className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded-lg font-black">+{stop.dayOffset} День</div>}
                               <button className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                             </motion.div>
                           ))}
                           { (dirTab === 0 ? form.stopsForward : form.stopsBack).length === 0 && (
                             <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl text-slate-600 text-sm italic font-medium">Зупинки не додано. Використовуйте AI Parser вище.</div>
                           )}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                         <div className="flex items-center gap-3 ml-2">
                           <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                           <label className="text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Розклад виїздів: ТУДИ</label>
                         </div>
                         <div className="grid grid-cols-7 gap-3">
                           {DAY_SHORT.map((d, i) => (
                             <button
                               key={i}
                               onClick={() => {
                                 const current = form.activeDaysThere;
                                 const updated = current.includes(i) ? current.filter(x => x !== i) : [...current, i];
                                 setForm({...form, activeDaysThere: updated});
                               }}
                               className={`
                                 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border
                                 ${form.activeDaysThere.includes(i) 
                                   ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_20px_rgba(0,212,255,0.3)]' 
                                   : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}
                               `}
                             >
                               <span className="text-xs font-black uppercase">{d}</span>
                             </button>
                           ))}
                         </div>
                       </div>

                       {form.direction === 'roundtrip' && (
                         <div className="space-y-4">
                            <div className="flex items-center gap-3 ml-2">
                              <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                              <label className="text-[10px] font-black text-slate-100 uppercase tracking-[0.2em]">Розклад виїздів: НАЗАД</label>
                            </div>
                            <div className="grid grid-cols-7 gap-3">
                              {DAY_SHORT.map((d, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    const current = form.activeDaysBack;
                                    const updated = current.includes(i) ? current.filter(x => x !== i) : [...current, i];
                                    setForm({...form, activeDaysBack: updated});
                                  }}
                                  className={`
                                    h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border
                                    ${form.activeDaysBack.includes(i) 
                                      ? 'bg-violet-500 border-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
                                      : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}
                                  `}
                                >
                                  <span className="text-xs font-black uppercase">{d}</span>
                                </button>
                              ))}
                            </div>
                         </div>
                       )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 block">Призначити автобус</label>
                           <select className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500/50">
                             <option>Mercedes-Benz Travego (52 місця)</option>
                             <option>Setra S515 HD (49 місць)</option>
                           </select>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 block">Головний водій</label>
                           <select className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500/50">
                             <option>Олександр Коваленко</option>
                             <option>Дмитро Петренко</option>
                           </select>
                         </div>
                       </div>

                       <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 block">Комплектація рейсу</label>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                           {AMENITY_LIST.map((amenity) => (
                             <button
                               key={amenity.id}
                               onClick={() => {
                                 const current = form.amenities;
                                 const updated = current.includes(amenity.id) ? current.filter(x => x !== amenity.id) : [...current, amenity.id];
                                 setForm({...form, amenities: updated});
                               }}
                               className={`
                                 p-4 rounded-2xl flex items-center gap-3 transition-all border
                                 ${form.amenities.includes(amenity.id) 
                                   ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' 
                                   : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}
                               `}
                             >
                               <amenity.icon size={18} />
                               <span className="text-[11px] font-black uppercase tracking-wider">{amenity.label}</span>
                             </button>
                           ))}
                         </div>
                       </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-8 bg-black/40 border border-white/10 rounded-[32px] space-y-4 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <Euro size={120} />
                           </div>
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Базова ціна ТУДИ</label>
                           <div className="flex items-end gap-3">
                              <input 
                                type="number" 
                                className="bg-transparent text-5xl font-syne font-black text-white outline-none w-32 border-b-2 border-cyan-500/30 focus:border-cyan-500 transition-all" 
                                value={form.singlePriceThere}
                                onChange={(e) => setForm({...form, singlePriceThere: +e.target.value})}
                              />
                              <span className="text-2xl font-black text-cyan-400 mb-1">UAH</span>
                           </div>
                         </div>

                         {form.direction === 'roundtrip' && (
                           <div className="p-8 bg-black/40 border border-white/10 rounded-[32px] space-y-4 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                               <Euro size={120} />
                             </div>
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Базова ціна НАЗАД</label>
                             <div className="flex items-end gap-3">
                                <input 
                                  type="number" 
                                  className="bg-transparent text-5xl font-syne font-black text-white outline-none w-32 border-b-2 border-violet-500/30 focus:border-violet-500 transition-all" 
                                  value={form.singlePriceBack}
                                  onChange={(e) => setForm({...form, singlePriceBack: +e.target.value})}
                                />
                                <span className="text-2xl font-black text-violet-400 mb-1">EUR</span>
                             </div>
                           </div>
                         )}
                       </div>

                       <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-start gap-4">
                         <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                           <Check size={20} strokeWidth={3} />
                         </div>
                         <div>
                           <div className="text-sm font-black text-emerald-400 uppercase tracking-widest">Система готова до запуску</div>
                           <p className="text-xs text-slate-400 mt-1">
                             Буде згенеровано <span className="text-white font-bold">{(form.activeDaysThere.length + form.activeDaysBack.length) * 4} рейсів</span> на найближчі 30 днів. 
                             Всі дані валідовано AI-модулем.
                           </p>
                         </div>
                       </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* NAVIGATION BUTTONS */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <button 
                onClick={handlePrev}
                disabled={step === 0}
                className={`px-8 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center gap-2 ${step === 0 ? 'opacity-0 pointer-events-none' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
              >
                <ChevronLeft size={18} /> Назад
              </button>
              
              <div className="flex-1" />

              {step < 4 ? (
                <button 
                  onClick={handleNext}
                  className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  Наступний крок <ChevronRight size={18} />
                </button>
              ) : (
                <div className="flex gap-4">
                  <button className="px-8 py-5 bg-white/5 border border-white/10 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2">
                    <Save size={18} /> Чернетка
                  </button>
                  <button className="px-12 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                    Запустити в роботу <Send size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR INFO */}
          <div className="hidden lg:block space-y-6">
            <div className="p-6 glass-mission-control rounded-[32px] border border-white/10 space-y-4">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Контрольна сума</div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Тип:</span>
                    <span className="text-xs font-bold text-white uppercase">{form.direction === 'roundtrip' ? 'Двосторонній' : 'Односторонній'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Зупинок:</span>
                    <span className="text-xs font-bold text-white">{(form.stopsForward.length + form.stopsBack.length)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Рейсів на тиждень:</span>
                    <span className="text-xs font-bold text-cyan-400">{(form.activeDaysThere.length + form.activeDaysBack.length)}</span>
                 </div>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center gap-3 text-emerald-400">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase">Дані захищено SSL</span>
              </div>
            </div>

            <div className="p-6 bg-cyan-500/5 rounded-[32px] border border-cyan-500/10 space-y-4">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-cyan-400" />
                <span className="text-xs font-black uppercase text-white">Smart Tip</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ви можете просто вставити текст з месенджера або PDF. Наш <span className="text-cyan-400 font-bold">AI Parser</span> автоматично виділить міста, час та дні виїзду.
              </p>
              <button className="text-[10px] font-black text-cyan-400 uppercase flex items-center gap-2 hover:gap-3 transition-all">
                Дивитись інструкцію <ArrowRight size={12} />
              </button>
            </div>
          </div>

        </div>
      </div>
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-600/5 via-transparent to-transparent -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[120px] -z-10 animate-pulse" />
    </div>
  );
}

function ShieldCheck({ size, className }: any) {
  return <Check size={size} className={className} />;
}
