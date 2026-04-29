/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Users, 
  ChevronRight, ArrowRight, User,
  CreditCard, Info, CheckCircle2,
  Wifi, Battery, Wind, Coffee, Tv,
  Loader2, ArrowLeft, X, Clock,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PASSENGERS_DATA } from './constants';
import BusnetCalendar from '@busnet/shared/components/common/BusnetCalendar';

const STEPS = [
  { id: 1, label: 'Пошук рейсу' },
  { id: 2, label: 'Вибір місця' },
  { id: 3, label: 'Пасажир' },
  { id: 4, label: 'Підтвердження' },
];

const MOCK_TRIPS = [
  { id: 'BN-2251', carrier: 'ТОВ "Євро Тур"', dep: '08:00', arr: '18:30', duration: '10г 30хв', seats: 12, price: 55, rating: 4.8, amenities: ['wifi', 'usb', 'wc'] },
  { id: 'BN-2252', carrier: 'ТОВ "Карпати Тур"', dep: '10:00', arr: '20:30', duration: '10г 30хв', seats: 5, price: 50, rating: 4.6, amenities: ['wifi', 'usb'] },
  { id: 'BN-2253', carrier: 'ТОВ "Євро Тур"', dep: '22:00', arr: '08:30+', duration: '10г 30хв', seats: 24, price: 48, rating: 4.8, amenities: ['wifi', 'usb', 'wc', 'coffee'] },
];

const AMENITIES_MAP: Record<string, any> = {
  wifi: { label: 'Wi-Fi', icon: Wifi },
  usb: { label: 'Розетки', icon: Battery },
  wc: { label: 'Туалет', icon: CircleDotWorkaround },
  coffee: { label: 'Кава', icon: Coffee },
};

function CircleDotWorkaround() {
  return <div className="w-1 h-1 rounded-full bg-current" />;
}

export default function NewBooking() {
  const [step, setStep] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isOwnPassenger, setIsOwnPassenger] = useState(false);
  const [paxForm, setPaxForm] = useState({
    firstName: '',
    lastName: '',
    docType: 'Паспорт',
    docSeries: '',
    docNumber: '',
    birthDate: '',
    note: ''
  });
  const [showPaxModal, setShowPaxModal] = useState(false);
  const [paxSearch, setPaxSearch] = useState('');
  const [saveToDB, setSaveToDB] = useState(true);
  const [bookingId, setBookingId] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useState({
    from: 'Київ',
    to: 'Варшава',
    date: '2026-04-22'
  });

  // Handle click outside for calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('uk-UA', { 
        day: 'numeric', 
        month: 'long' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  const [showTripDetails, setShowTripDetails] = useState<any>(null);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
      toast.success(`Знайдено 3 варіанти з ${searchParams.from} до ${searchParams.to}`);
    }, 1000);
  };

  const handleSelectTrip = (trip: any) => {
    setSelectedTrip(trip);
    setStep(2);
  };

  const handleSelectFromBase = (p: any) => {
    const [first, ...last] = p.name.split(' ');
    setPaxForm({
      ...paxForm,
      firstName: first || '',
      lastName: last.join(' ') || ''
    });
    setShowPaxModal(false);
    toast.success('Пасажир вибраний з бази');
  };

  const handleConfirm = () => {
    if (!paxForm.firstName || !paxForm.lastName) {
      toast.error('Будь ласка, заповніть ім\'я та прізвище');
      return;
    }
    const newId = `BK-${Math.floor(4900 + Math.random() * 100)}`;
    setBookingId(newId);
    setStep(4);
    if (saveToDB) {
      toast.success('Пасажира збережено до вашої клієнтської бази');
    }
    toast.success('Бронювання підтверджено!');
  };

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 mb-8 max-w-2xl mx-auto">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex items-center gap-3 group">
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all
              ${step === s.id ? 'bg-[#7c5cfc] border-[#7c5cfc] text-white' : ''}
              ${step > s.id ? 'bg-[#00d97e] border-[#00d97e] text-white' : 'border-white/10 text-[#4a5c72]'}
            `}>
              {step > s.id ? <CheckCircle2 size={16} /> : s.id}
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${step >= s.id ? 'text-white' : 'text-[#4a5c72]'}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px bg-white/10 mx-2 ${step > s.id + 1 ? 'bg-[#00d97e]' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
          Нове бронювання
        </h1>
        <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
          Пошук рейсу та оформлення квитка для пасажира
        </p>
      </div>

      {renderStepIndicator()}

      {/* Passenger Select Modal */}
      <AnimatePresence>
        {showPaxModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center pt-10"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0d1119] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-['Syne'] font-black text-sm uppercase italic tracking-tight">База пасажирів</h3>
                <button onClick={() => setShowPaxModal(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#4a5c72]"><X size={18} /></button>
              </div>
              <div className="p-4 bg-white/[0.02]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5c72]" size={14} />
                  <input type="text" placeholder="Пошук за ім'ям..." value={paxSearch} onChange={(e) => setPaxSearch(e.target.value)} className="w-full bg-[#121824] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {PASSENGERS_DATA.filter(p => !paxSearch || p.name.toLowerCase().includes(paxSearch.toLowerCase())).map((p, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSelectFromBase(p)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: p.av }}>{p.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-[#4a5c72] font-black uppercase tracking-widest mt-0.5">{p.trips} поїздок · {p.route}</div>
                    </div>
                    <ChevronRight size={16} className="text-[#4a5c72] opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Звідки</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a5c72] group-focus-within:text-[#7c5cfc] transition-colors" size={16} />
                    <select 
                      value={searchParams.from}
                      onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                      className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 pl-12 pr-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] transition-all appearance-none cursor-pointer"
                    >
                      <option>Київ</option><option>Львів</option><option>Одеса</option><option>Варшава</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Куди</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a5c72] group-focus-within:text-[#7c5cfc] transition-colors" size={16} />
                    <select 
                      value={searchParams.to}
                      onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                      className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 pl-12 pr-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] transition-all appearance-none cursor-pointer"
                    >
                      <option>Варшава</option><option>Берлін</option><option>Прага</option><option>Київ</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Дата</label>
                  <div 
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="relative group cursor-pointer"
                  >
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a5c72] group-hover:text-[#7c5cfc] transition-colors" size={16} />
                    <div className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 pl-12 pr-10 text-sm font-black italic text-white outline-none focus:border-[#7c5cfc] transition-all flex items-center justify-between">
                      {formatDate(searchParams.date) || 'Виберіть дату'}
                      <ChevronDown size={14} className={`text-slate-600 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isCalendarOpen && (
                      <div ref={calendarRef} className="absolute top-full left-0 md:left-auto md:right-0 mt-2 z-[150] origin-top-right">
                        <BusnetCalendar 
                          selectedDate={searchParams.date}
                          onSelect={(val) => {
                            setSearchParams({...searchParams, date: val});
                            setIsCalendarOpen(false);
                          }}
                          tripContext={{ from: searchParams.from, to: searchParams.to }}
                        />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Пасажирів</label>
                  <select className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] appearance-none">
                    <option>1</option><option>2</option><option>3</option><option>4</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Перевізник (опціонально)</label>
                  <select className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] appearance-none">
                    <option>Всі перевізники</option><option>ТОВ "Євро Тур"</option><option>ТОВ "Карпати Тур"</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-10 h-5">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isOwnPassenger}
                        onChange={(e) => setIsOwnPassenger(e.target.checked)}
                      />
                      <div className="w-full h-full bg-[#121824] border border-white/10 rounded-full transition-all peer-checked:bg-[#7c5cfc]/20 peer-checked:border-[#7c5cfc33]" />
                      <div className="absolute left-1 top-1 w-3 h-3 bg-[#4a5c72] rounded-full transition-all peer-checked:left-6 peer-checked:bg-[#7c5cfc]" />
                    </div>
                    <span className="text-xs font-bold text-[#7a8fa8] group-hover:text-white transition-colors">Власний пасажир</span>
                  </label>
                  <div className={`
                    text-[10px] font-black px-2 py-0.5 rounded uppercase border transition-all
                    ${isOwnPassenger ? 'bg-[#7c5cfc1a] text-[#a28afd] border-[#7c5cfc33]' : 'bg-[#00c4d41a] text-[#00c4d4] border-[#00c4d433]'}
                  `}>
                    {isOwnPassenger ? 'СВОЇ 10%' : 'BUSNET 5%'}
                  </div>
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-[#7c5cfc] text-white px-8 py-3 rounded-2xl font-bold text-sm tracking-wide shadow-xl shadow-purple-900/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                >
                  {isSearching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  Шукати рейси
                </button>
              </div>
            </div>

            {/* Тип пасажира */}
            <div className="flex items-center gap-4 p-4 bg-[#121824] border border-white/5 rounded-2xl mt-4">
              <span className="text-xs font-bold text-[#7a8fa8] flex-1">Тип пасажира (впливає на % комісії)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOwnPassenger(false)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!isOwnPassenger ? 'bg-[#00c4d41a] text-[#00c4d4] border-[#00c4d433]' : 'bg-transparent text-[#4a5c72] border-white/10'}`}
                >
                  BUSNET 5%
                </button>
                <button
                  onClick={() => setIsOwnPassenger(true)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isOwnPassenger ? 'bg-[#7c5cfc1a] text-[#a28afd] border-[#7c5cfc33]' : 'bg-transparent text-[#4a5c72] border-white/10'}`}
                >
                  СВІЙ 10%
                </button>
              </div>
            </div>

            {showResults && (
              <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-sm font-bold text-[#7a8fa8] px-2 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#00d97e]" />
                  Київ → Варшава · 22.04 · 3 рейси знайдено
                </h3>
                <div className="space-y-3">
                  {MOCK_TRIPS.map((trip, i) => (
                    <div 
                      key={trip.id} 
                      onClick={() => handleSelectTrip(trip)}
                      className="bg-[#151c28] border border-white/5 rounded-2xl p-5 hover:border-[#7c5cfc33] transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-white uppercase italic tracking-tighter">Київ → Варшава</div>
                          <div className="text-[10px] text-[#4a5c72] font-black uppercase tracking-widest">{trip.carrier} · ★ {trip.rating}</div>
                        </div>
                        <div className={`
                          px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest 
                          ${trip.seats < 6 ? 'bg-[#ff3d5a1a] text-[#ff3d5a] border border-[#ff3d5a33]' : 'bg-[#00d97e1a] text-[#00d97e] border border-[#00d97e33]'}
                        `}>
                          {trip.seats < 6 ? 'Лише ' : ''}{trip.seats} місць
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                        <div className="space-y-1">
                          <div className="text-lg font-['Syne'] font-black text-white italic tracking-tighter">{trip.dep} — {trip.arr}</div>
                          <div className="text-[10px] text-[#4a5c72] font-bold uppercase">{trip.duration} в дорозі</div>
                        </div>
                        <div className="flex gap-2">
                          {trip.amenities.map((a: string) => {
                            const Icon = AMENITIES_MAP[a].icon;
                            return (
                              <div key={a} className="p-2 rounded-lg bg-white/5 border border-white/5 text-[#4a5c72] group-hover:text-white transition-colors">
                                <Icon size={14} />
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-right ml-auto">
                          <div className="text-2xl font-['Syne'] font-black text-[#00d97e] italic tracking-tighter">€{trip.price}</div>
                          <div className="text-[9px] text-[#7a8fa8] font-bold uppercase tracking-tight">Ваша комісія: €{(trip.price * (isOwnPassenger ? 10 : 5) / 100).toFixed(2)}</div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTripDetails(trip);
                            }}
                            className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#7a8fa8] hover:text-white transition-all shadow-lg"
                          >
                            Деталі
                          </button>
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#4a5c72] group-hover:bg-[#7c5cfc] group-hover:text-white transition-all shadow-lg group-hover:shadow-purple-900/40">
                            <ChevronRight size={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold text-white uppercase italic tracking-tight">Вибір місця</h3>
                  <div className="px-2.5 py-1 bg-[#7c5cfc1a] text-[#a28afd] border border-[#7c5cfc33] rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedTrip?.id}</div>
                </div>
                
                <div className="flex gap-6 mb-8 text-[10px] font-bold text-[#4a5c72] uppercase tracking-widest px-4">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#121824] border border-white/10" /> Вільне</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#7c5cfc33] border border-[#7c5cfc]" /> Вибрано</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#ff3d5a12] border border-[#ff3d5a2b]" /> Зайнято</div>
                </div>

                <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto mb-8 bg-black/20 p-6 rounded-[40px] border border-white/5">
                  {Array.from({ length: 15 }).map((_, i) => {
                    const isAisle = (i + 1) % 5 === 3;
                    if (isAisle) return <div key={i} />;
                    const num = `${Math.floor(i/5) + 1}${['A','B','C', 'D'][i % 5 > 2 ? i % 5 - 1 : i % 5]}`;
                    const isTaken = [3, 7, 12].includes(i);
                    const isSelected = selectedSeat === num;
                    return (
                      <button 
                        key={num}
                        disabled={isTaken}
                        onClick={() => setSelectedSeat(num)}
                        className={`
                          h-9 rounded-lg border text-[10px] font-bold transition-all
                          ${isTaken ? 'bg-[#ff3d5a0a] border-white/5 text-[#4a5c72] cursor-not-allowed opacity-50' : ''}
                          ${isSelected ? 'bg-[#7c5cfc] border-[#7c5cfc] text-white shadow-lg shadow-purple-900/40' : 'bg-[#121824] border-white/10 text-[#7a8fa8] hover:border-[#7c5cfc] hover:text-white'}
                        `}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <div className="text-center pt-4 border-t border-white/5 text-sm text-[#7a8fa8]">
                  Обрано місце: <span className="text-[#a28afd] font-black italic ml-1">{selectedSeat || '—'}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-[#7a8fa8] hover:text-white transition-all flex items-center gap-2">
                  <ArrowLeft size={16} /> Назад
                </button>
                <button 
                  disabled={!selectedSeat}
                  onClick={() => setStep(3)}
                  className="flex-1 bg-[#7c5cfc] text-white py-3 rounded-2xl font-bold text-sm tracking-wide shadow-xl shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  Далі: Пасажир →
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-6 sticky top-6">
                <h3 className="font-bold text-white uppercase italic tracking-tight mb-6">Деталі рейсу</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Рейс', val: selectedTrip?.id, type: 'purple' },
                    { label: 'Перевізник', val: selectedTrip?.carrier },
                    { label: 'Маршрут', val: 'Київ → Варшава' },
                    { label: 'Відправлення', val: selectedTrip?.dep, type: 'bold' },
                    { label: 'Прибуття', val: selectedTrip?.arr },
                    { label: 'В дорозі', val: selectedTrip?.duration },
                    { label: 'Ціна', val: `€${selectedTrip?.price}`, type: 'green' },
                    { label: 'Ваша комісія', val: `€${(selectedTrip?.price * (isOwnPassenger ? 10 : 5) / 100).toFixed(2)}`, type: 'purple' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4a5c72] uppercase font-bold tracking-widest text-[9px]">{item.label}</span>
                      <span className={`
                        ${item.type === 'purple' ? 'text-[#a28afd] font-black' : ''}
                        ${item.type === 'green' ? 'text-[#00d97e] font-black' : ''}
                        ${item.type === 'bold' ? 'text-white font-black italic' : 'text-[#7a8fa8] font-medium'}
                      `}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold text-white uppercase italic tracking-tight">Дані пасажира</h3>
                  <button 
                    onClick={() => setShowPaxModal(true)}
                    className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#7a8fa8] hover:text-white transition-all"
                  >
                    З бази
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Ім'я</label>
                    <input 
                      type="text" 
                      placeholder="Марія" 
                      value={paxForm.firstName}
                      onChange={(e) => setPaxForm({...paxForm, firstName: e.target.value})}
                      className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Прізвище</label>
                    <input 
                      type="text" 
                      placeholder="Ковалець" 
                      value={paxForm.lastName}
                      onChange={(e) => setPaxForm({...paxForm, lastName: e.target.value})}
                      className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Тип документа</label>
                  <select 
                    value={paxForm.docType}
                    onChange={(e) => setPaxForm({...paxForm, docType: e.target.value})}
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] appearance-none cursor-pointer"
                  >
                    <option>Паспорт</option><option>ID-картка</option><option>Закордонний паспорт</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Серія та Номер</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="АА" 
                        value={paxForm.docSeries}
                        onChange={(e) => setPaxForm({...paxForm, docSeries: e.target.value})}
                        className="w-20 bg-[#121824] border border-white/5 rounded-xl py-3 px-4 text-sm font-medium text-white text-center outline-none focus:border-[#7c5cfc] transition-all" 
                      />
                      <input 
                        type="text" 
                        placeholder="123456" 
                        value={paxForm.docNumber}
                        onChange={(e) => setPaxForm({...paxForm, docNumber: e.target.value})}
                        className="flex-1 bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Дата народження</label>
                    <input 
                      type="date" 
                      value={paxForm.birthDate}
                      onChange={(e) => setPaxForm({...paxForm, birthDate: e.target.value})}
                      className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-8">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1 flex items-center gap-2">
                    Нотатка для перевізника
                    <span className="text-[8px] text-[#4a5c72] lowercase tracking-normal">(опціонально)</span>
                  </label>
                  <textarea 
                    placeholder="Особливі потреби, коментар..." 
                    value={paxForm.note}
                    onChange={(e) => setPaxForm({...paxForm, note: e.target.value})}
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc] transition-all min-h-[80px]" 
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative w-10 h-5">
                    <input type="checkbox" className="sr-only peer" checked={saveToDB} onChange={(e) => setSaveToDB(e.target.checked)} />
                    <div className="w-full h-full bg-[#121824] border border-white/10 rounded-full transition-all peer-checked:bg-[#00d97e]/20 peer-checked:border-[#00d97e33]" />
                    <div className="absolute left-1 top-1 w-3 h-3 bg-[#4a5c72] rounded-full transition-all peer-checked:left-6 peer-checked:bg-[#00d97e]" />
                  </div>
                  <span className="text-xs font-bold text-[#7a8fa8] group-hover:text-white transition-colors">Зберегти пасажира до моєї бази</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-[#7a8fa8] hover:text-white transition-all flex items-center gap-2">
                  <ArrowLeft size={16} /> Назад
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-1 bg-gradient-to-br from-[#7c5cfc] to-[#5533dd] text-white py-3 rounded-2xl font-bold text-sm tracking-wide shadow-xl shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Підтвердити бронювання →
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-6 sticky top-6">
                <h3 className="font-bold text-white uppercase italic tracking-tight mb-6">Спосіб оплати</h3>
                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Оплата</label>
                    <select className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc] appearance-none cursor-pointer">
                      <option>Готівка при посадці</option>
                      <option>Картка онлайн (клієнт)</option>
                      <option>Картка агента</option>
                      <option>IBAN-переказ</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Промокод</label>
                    <input type="text" placeholder="Введіть промокод" className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc]" />
                  </div>
                </div>

                <div className="h-px bg-white/5 mb-6" />

                <h3 className="font-bold text-white uppercase italic tracking-tight mb-6">Підсумок замовлення</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Маршрут', val: 'Київ → Варшава' },
                    { label: 'Дата', val: '22.04.2026 · 08:00' },
                    { label: 'Місце', val: selectedSeat, type: 'purple' },
                    { label: 'Ціна квитка', val: `€${selectedTrip?.price || 0}.00`, type: 'bold' },
                    { label: 'Тип пасажира', val: isOwnPassenger ? 'СВОЇ 10%' : 'BUSNET 5%', badge: true },
                    { label: 'Ваша комісія', val: `€${(selectedTrip?.price * (isOwnPassenger ? 10 : 5) / 100).toFixed(2)}`, type: 'purple-bold' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4a5c72] uppercase font-bold tracking-widest text-[9px]">{item.label}</span>
                      {item.badge ? (
                        <span className={`
                          text-[9px] font-black px-1.5 py-0.5 rounded uppercase
                          ${isOwnPassenger ? 'bg-[#7c5cfc1a] text-[#a28afd]' : 'bg-[#00c4d41a] text-[#00c4d4]'}
                        `}>{item.val}</span>
                      ) : (
                        <span className={`
                          ${item.type === 'purple' ? 'text-[#a28afd] font-black' : ''}
                          ${item.type === 'purple-bold' ? 'text-[#7c5cfc] font-black text-xs' : ''}
                          ${item.type === 'bold' ? 'text-white font-black' : 'text-[#7a8fa8] font-medium'}
                        `}>{item.val}</span>
                      )}
                    </div>
                  ))}
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider italic">Разом до оплати</span>
                    <span className="font-['Syne'] text-2xl font-black text-[#00d97e] italic tracking-tighter">€{selectedTrip?.price || 0}.00</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-[#00d97e]/10 border border-[#00d97e26] flex items-center justify-center text-[#00d97e] mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="font-['Syne'] font-black text-3xl text-white uppercase italic tracking-tighter mb-2">Бронювання підтверджено</h2>
            <p className="text-[#7a8fa8] font-medium mb-6">Квиток {bookingId} · Пасажир: {paxForm.firstName} {paxForm.lastName}</p>
            
            <div className="px-5 py-2 bg-[#7c5cfc1a] text-[#a28afd] border border-[#7c5cfc33] rounded-xl text-xs font-black uppercase tracking-widest mb-10">
              Ваша комісія: €{(selectedTrip?.price * (isOwnPassenger ? 10 : 5) / 100).toFixed(2)}
            </div>

            <div className="w-full max-w-sm bg-[#151c28] border border-white/5 rounded-[32px] p-8 space-y-4 mb-10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#4a5c72] font-black uppercase tracking-widest">Маршрут</span>
                <span className="text-white font-bold">{searchParams.from} → {searchParams.to}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#4a5c72] font-black uppercase tracking-widest">Рейс</span>
                <span className="text-white font-bold">{selectedTrip?.id} · {searchParams.date} {selectedTrip?.dep}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#4a5c72] font-black uppercase tracking-widest">Перевізник</span>
                <span className="text-white font-bold">{selectedTrip?.carrier}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#4a5c72] font-black uppercase tracking-widest">Місце</span>
                <span className="text-[#a28afd] font-black italic">{selectedSeat || '—'}</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <button 
                onClick={() => toast.success('Квиток надіслано')}
                className="px-8 py-3 bg-[#00d97e] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/10 hover:scale-105 active:scale-95 transition-all"
              >
                Надіслати квиток
              </button>
              <button 
                onClick={() => setStep(1)}
                className="px-8 py-3 bg-white/5 border border-white/10 text-[#7a8fa8] rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
              >
                Нове бронювання
              </button>
              <button 
                onClick={() => navigate('/mybookings')}
                className="px-8 py-3 bg-white/5 border border-white/10 text-[#7a8fa8] rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
              >
                Всі бронювання
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTripDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="w-full max-w-2xl bg-[#0d1119] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden relative"
            >
              <button onClick={() => setShowTripDetails(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#4a5c72] hover:text-white transition-all z-10">
                <X size={20} />
              </button>
              
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-['Syne'] font-black text-3xl text-white uppercase italic tracking-tighter leading-none mb-2">Деталі рейсу</h2>
                    <p className="text-[#a28afd] font-black uppercase text-xs tracking-widest">{showTripDetails.carrier} · Рейс {showTripDetails.id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-['Syne'] font-black text-[#00d97e] italic tracking-tighter leading-none mb-1">€{showTripDetails.price}</div>
                    <div className="text-[10px] text-[#4a5c72] font-black uppercase tracking-widest italic">Ціна за 1 місце</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Маршрут та час</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="text-xl font-['Syne'] font-black text-white italic">{showTripDetails.dep}</div>
                        <ArrowRight size={14} className="text-[#4a5c72]" />
                        <div className="text-xl font-['Syne'] font-black text-white italic">{showTripDetails.arr}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-[#7a8fa8]">
                        <Clock size={14} /> {showTripDetails.duration} в дорозі
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Зручності</div>
                    <div className="flex flex-wrap gap-2">
                      {showTripDetails.amenities.map((a: string) => (
                        <div key={a} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                          {React.createElement(AMENITIES_MAP[a].icon, { size: 12, className: "text-[#a28afd]" })}
                          {AMENITIES_MAP[a].label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Про перевізника</div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#7c5cfc] flex items-center justify-center text-white font-black text-lg">
                        {showTripDetails.carrier[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white uppercase italic tracking-tight">{showTripDetails.carrier}</div>
                        <div className="text-xs text-[#00d97e] font-bold">★ {showTripDetails.rating} Рейтинг надійності</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#7a8fa8] leading-relaxed">Надійний перевізник BUSNET UA. Регулярні рейси, сучасний автопарк, страховка пасажирів включена у вартість.</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    handleSelectTrip(showTripDetails);
                    setShowTripDetails(null);
                  }}
                  className="w-full bg-[#7c5cfc] text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Перейти до вибору місця
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
