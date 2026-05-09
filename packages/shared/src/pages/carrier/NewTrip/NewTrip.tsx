/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Trash2, Clock, MapPin, Calendar, Bus, ChevronRight, ChevronLeft,
  ChevronDown, Sparkles, ArrowLeftRight, Save, Eye, Settings2, CheckCircle2,
  Info, AlertCircle, Coins, TrendingDown, RefreshCcw, XCircle, Wifi, Wind,
  Zap, Coffee, Download, Database, ArrowRightLeft, ArrowRight, ArrowLeft,
  CheckCircle, FileDown, FolderOpen, ArrowDownToLine, Layout, FileText,
  GripVertical, HelpCircle, PlusCircle, QrCode, Navigation, CreditCard,
  Activity, TrendingUp, Tag
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { useAuthStore } from '../../../store/useAuthStore';
import { supabase } from '../../../supabase/config';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// --- Types ---
type Amenity = 'wifi' | 'ac' | 'toilet' | 'usb' | 'coffee';
type CityConfirmStatus = 'confirmed' | 'unrecognized' | 'pending';

interface Stop {
  id: string;
  city: string;
  address: string;
  time: string;
  price: number;
  dayOffset: number;
  priceManuallySet?: boolean;
  cityStatus?: CityConfirmStatus;
}

const SCHEMA_VERSION = 4;

interface TripState {
  __version?: number;
  routeName: string;
  operator: string;
  seats: number;
  amenities: Amenity[];
  isTransfer: boolean;
  transferType: 'direct' | 'transfer';
  transferCity?: string;
  transferTime?: string;
  currency: string;
  discounts: {
    child04: boolean;
    child412: boolean;
  };
  customDiscounts: { id: string; label: string; value: number }[];
  rules: string[];
  customRules: string[];
  outbound: {
    stops: Stop[];
    days: string[];
  };
  inbound: {
    stops: Stop[];
    days: string[];
  };
}

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

const ResetConfirmModal = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-[#050B14]/80 backdrop-blur-md flex items-center justify-center z-[100]"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
      className="bg-[#0B1221] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-black"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-4 text-red-500">
        <AlertCircle size={24} />
        <h3 className="font-bold text-sm uppercase tracking-wider text-white">Скинути чернетку?</h3>
      </div>
      <p className="text-[#5A6A85] text-xs mb-8 leading-relaxed">Всі незбережені дані буде втрачено.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-white/10 text-[#5A6A85] text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Скасувати</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Скинути</button>
      </div>
    </motion.div>
  </motion.div>
);

const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];

const AMENITIES_CONFIG: { id: Amenity; label: string; icon: any }[] = [
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'ac', label: 'Кондиціонер', icon: Wind },
  { id: 'usb', label: 'USB Зарядка', icon: Zap },
  { id: 'coffee', label: 'Кава/Чай', icon: Coffee }
];

const PRESET_RULES = [
  "У вартість повного (дорослого) квитка входить безкоштовне перевезення багажу розміром до 40x60x80см, загальною вагою до 30кг та ручного багажу вагою до 10кг.",
  "У вартість пільгового (дитячого) квитка входить безкоштовне перевезення багажу загальною вагою до 20кг.",
  "При перевищенні даних лімітів щодо ваги і розмірів багажу за нього сплачується по 1,5 євро/кг.",
  "Додатковий багаж перевозиться лише при наявності вільного місця в багажному відділенні автобуса.",
  "Додатковий багаж не повинен перевищувати розмірів та ваги основного багажу.",
  "Не перевозиться багаж негабаритних розмірів (холодильники і т.п.).",
  "Перевізник не відповідає за ручний багаж.",
  "Перевізник несе відповідальність за знищений або пошкоджений багаж у багажному відділенні автобуса тільки якщо це сталося з вини перевізника, що доведено пасажиром, але не більше ніж на суму 100 Євро на особу за умови подання заяви не пізніше ніж 10 днів з дня виїзду автобуса.",
  "Заборонено перевозити багаж, що загрожує безпеці або здоров'ю інших пасажирів.",
  "Перевізник не відповідає за втрату пасажиром грошей, біжутерії, паспортів, цінних паперів, колекційних речей, речей, які мають наукову цінність та інших цінностей, що не знаходяться у багажному відділенні автобуса.",
  "Пасажир особисто несе відповідальність за легальність власного багажу.",
  "При ускладненнях на кордоні фірма-перевізник має право відмовитися від виконання обов'язків по перевезенню багажу і продовжити рейс без вказаного багажу.",
  "Квиток є іменним документом для проїзду автобусом і не може бути переданий іншій особі, він дійсний до дати та години відправлення, які вказані у квитку.",
  "При посадці в автобус необхідно пред'явити водію або представнику компанії квиток в електронному або паперовому вигляді та копію документа, що засвідчує вік пасажира для отримання знижки.",
  "У квитку забороняється робити будь-які виправлення. Всі зміни повинні бути підтверджені печаткою фірми, яка їх внесла.",
  "Діти та молодь до 16 років можуть їхати лише у супроводі дорослих та при наявності необхідних документів.",
  "Пасажир, який має квиток з фіксованою датою зворотного виїзду, зобов’язаний підтвердити свій виїзд не пізніше ніж за 48 годин до відправлення автобуса.",
  "У випадку непідтвердження поїздки перевізник залишає за собою право продати дане место без грошової компенсації пасажиру.",
  "При неявці на посадку без попередження представників компанії втрачається 100% вартості квитка.",
  "Квиток з відкритою датою повернення дійсний протягом 6 місяців з моменту купівлі квитка. Перевізник може закрити відкриту дату повернення лише при наявності місць у бажаний день відправлення.",
  "Пасажир має право два рази безкоштовно змінювати дату виїзду, але не пізніше ніж за 48 год до відправлення автобуса.",
  "Посадкові місця в автобусі вказуються лише представником компанії при посадці."
];

export default function NewTrip() {
  const { user, activeRole } = useAuthStore();
  const navigate = useNavigate();

  const [carriers, setCarriers] = useState<any[]>([]);

  useEffect(() => {
    if (activeRole === 'admin') {
      supabase.from('users').select('uid, companyName, email').eq('role', 'carrier')
        .then(({ data }) => setCarriers(data || []));
    }
  }, [activeRole]);

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('busnet_current_step');
    return saved ? parseInt(saved) : 1;
  });
  
  const [trip, setTrip] = useState<TripState>(() => {
    const defaults: TripState = {
      __version: SCHEMA_VERSION,
      routeName: '',
      operator: '',
      seats: 50,
      amenities: ['wifi', 'ac'],
      isTransfer: false,
      transferType: 'direct',
      currency: 'ГРН',
      discounts: { child04: false, child412: false },
      customDiscounts: [],
      rules: [],
      customRules: [],
      outbound: { stops: [], days: ['ПТ'] },
      inbound:  { stops: [], days: ['НД'] }
    };
    try {
      const raw = localStorage.getItem('busnet_trip_draft');
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as TripState;
      if (parsed.__version !== SCHEMA_VERSION) {
        localStorage.removeItem('busnet_trip_draft');
        return defaults;
      }
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem('busnet_trip_draft', JSON.stringify(trip));
  }, [trip]);

  useEffect(() => {
    localStorage.setItem('busnet_current_step', currentStep.toString());
  }, [currentStep]);

  const conflicts = useMemo(() => {
    const issues: { step: number; message: string; severity: 'warning' | 'error' }[] = [];
    if (trip.routeName.length > 0 && trip.routeName.length < 3) {
      issues.push({ step: 1, message: 'Назва маршруту занадто коротка', severity: 'warning' });
    }
    const checkRoute = (type: 'outbound' | 'inbound', step: number) => {
      const stops = trip[type].stops;
      if (stops.length > 0 && stops.length < 2) {
        issues.push({ step, message: `Маршрут ${type === 'outbound' ? 'туди' : 'назад'} повинен мати мінімум 2 зупинки`, severity: 'error' });
      }
      stops.forEach((stop, idx) => {
        if (!stop.city) issues.push({ step, message: `Зупинка ${idx + 1}: не вказано місто`, severity: 'error' });
        if (!stop.time) issues.push({ step, message: `Зупинка ${idx + 1}: не вказано час`, severity: 'error' });
        if (idx > 0) {
          const prev = stops[idx - 1];
          const prevTime = prev.time.split(':').map(Number);
          const currTime = stop.time.split(':').map(Number);
          const prevMinutes = (prev.dayOffset * 1440) + (prevTime[0] * 60) + prevTime[1];
          const currMinutes = (stop.dayOffset * 1440) + (currTime[0] * 60) + currTime[1];
          if (currMinutes <= prevMinutes) {
            issues.push({ step, message: `Зупинка ${idx + 1}: час прибуття раніше или дорівнює попередній зупинці. Перевірте зміщення дня.`, severity: 'error' });
          }
        }
      });
    };
    checkRoute('outbound', 2);
    checkRoute('inbound', 3);
    const allStops = [...trip.outbound.stops, ...trip.inbound.stops];
    if (allStops.some(s => s.price === 0)) {
      issues.push({ step: 4, message: 'Є зупинки з нульовою ціною', severity: 'warning' });
    }
    return issues;
  }, [trip]);

  const toggleRule = (rule: string) => {
    setTrip(prev => ({
      ...prev,
      rules: prev.rules.includes(rule) ? prev.rules.filter(r => r !== rule) : [...prev.rules, rule]
    }));
  };

  const addCustomRule = () => {
    setTrip(prev => ({ ...prev, customRules: [...prev.customRules, ''] }));
  };

  const updateCustomRule = (index: number, val: string) => {
    setTrip(prev => {
      const newRules = [...prev.customRules];
      newRules[index] = val;
      return { ...prev, customRules: newRules };
    });
  };

  const removeCustomRule = (index: number) => {
    setTrip(prev => ({ ...prev, customRules: prev.customRules.filter((_, i) => i !== index) }));
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const resetApp = useCallback(() => {
    localStorage.removeItem('busnet_trip_draft');
    localStorage.removeItem('busnet_current_step');
    localStorage.removeItem('busnet_editing_route_id');
    setTrip({
      __version: SCHEMA_VERSION,
      routeName: '', operator: '', seats: 50, amenities: ['wifi','ac'],
      isTransfer: false, transferType: 'direct', currency: 'ГРН',
      discounts: { child04: false, child412: false },
      customDiscounts: [], rules: [], customRules: [],
      outbound: { stops: [], days: ['ПТ'] },
      inbound:  { stops: [], days: ['НД'] }
    });
    setCurrentStep(1);
  }, []);

  const [smartInput, setSmartInput] = useState('');
  const [smartPriceInput, setSmartPriceInput] = useState('');
  const [smartInputStep1, setSmartInputStep1] = useState('');
  const [priceMemory, setPriceMemory] = useState<Record<string, number>>({});
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [editingRouteId] = useState<string | null>(() => localStorage.getItem('busnet_editing_route_id'));
  const [expandedPricingCities, setExpandedPricingCities] = useState<Set<string>>(new Set());

  const togglePricingCity = (cityKey: string) => {
    setExpandedPricingCities(prev => {
      const next = new Set(prev);
      if (next.has(cityKey)) next.delete(cityKey);
      else next.add(cityKey);
      return next;
    });
  };

  const expandAllCities = (expand: boolean) => {
    if (expand) {
      const segments = allSegments;
      const keys = segments.map(s => `${s.currency === 'ГРН' ? 'out' : 'in'}-${s.to}`);
      setExpandedPricingCities(new Set(keys));
    } else {
      setExpandedPricingCities(new Set());
    }
  };

  const prevTimesRef = useRef({ out: '', in: '' });
  useEffect(() => {
    const outTimes = trip.outbound.stops.map(s => s.time).join(',');
    const inTimes  = trip.inbound.stops.map(s => s.time).join(',');
    const outChanged = prevTimesRef.current.out !== outTimes;
    const inChanged  = prevTimesRef.current.in  !== inTimes;
    if (!outChanged && !inChanged) return;
    prevTimesRef.current = { out: outTimes, in: inTimes };

    const recalc = (stops: Stop[]): Stop[] => {
      if (stops.length === 0) return stops;
      let offset = 0;
      return stops.map((stop, idx) => {
        if (idx === 0) return { ...stop, dayOffset: 0 };
        const prev = stops[idx - 1];
        if (prev.time && stop.time) {
          const [ph, pm] = prev.time.split(':').map(Number);
          const [ch, cm] = stop.time.split(':').map(Number);
          if (ch * 60 + cm < ph * 60 + pm) offset += 1;
        }
        return { ...stop, dayOffset: offset };
      });
    };

    setTrip(prev => {
      const newOut = outChanged ? recalc(prev.outbound.stops) : prev.outbound.stops;
      const newIn  = inChanged  ? recalc(prev.inbound.stops)  : prev.inbound.stops;
      const same = JSON.stringify(newOut) === JSON.stringify(prev.outbound.stops) && JSON.stringify(newIn) === JSON.stringify(prev.inbound.stops);
      if (same) return prev;
      return { ...prev, outbound: { ...prev.outbound, stops: newOut }, inbound:  { ...prev.inbound,  stops: newIn  } };
    });
  }, [trip.outbound.stops, trip.inbound.stops]);

  const syncToSupabase = async () => {
    setIsSaving(true);
    try {
      let finalOperator = '';
      let targetCarrierId = null;
      if (activeRole === 'carrier' && user) {
        finalOperator = user.companyName || user.email || 'Carrier';
        targetCarrierId = user.uid;
      } else if (activeRole === 'admin') {
        if (!trip.operator) {
          toast.error('Будь ласка, призначте перевізника!');
          setIsSaving(false); return;
        }
        const separatorIndex = trip.operator.indexOf('::');
        if (separatorIndex === -1) {
          targetCarrierId = trip.operator; finalOperator = trip.operator;
        } else {
          targetCarrierId = trip.operator.substring(0, separatorIndex);
          finalOperator = trip.operator.substring(separatorIndex + 2);
        }
      }
      if (!finalOperator) { toast.error('Не вказано перевізника!'); setIsSaving(false); return; }
      const routeData = {
        name: trip.routeName, operator: finalOperator, carrier_id: targetCarrierId,
        seats: trip.seats, amenities: trip.amenities, is_transfer: trip.isTransfer,
        transfer_type: trip.transferType, transfer_city: trip.transferCity,
        currency: trip.currency, discounts: trip.discounts, custom_discounts: trip.customDiscounts,
        rules: trip.rules, custom_rules: trip.customRules, outbound: trip.outbound, inbound: trip.inbound, status: 'pending'
      };
      let dbError;
      if (editingRouteId) {
        const { error } = await supabase.from('routes').update({ ...routeData, status: 'pending' }).eq('id', editingRouteId);
        dbError = error;
      } else {
        const { error } = await supabase.from('routes').insert(routeData);
        dbError = error;
      }
      if (dbError) throw dbError;
      toast.success(editingRouteId ? 'Маршрут оновлено!' : 'Маршрут надіслано на перевірку!');
      localStorage.removeItem('busnet_trip_draft');
      localStorage.removeItem('busnet_current_step');
      localStorage.removeItem('busnet_editing_route_id');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err); toast.error('Помилка збереження');
    } finally { setIsSaving(false); }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('full-preview-area');
    if (!element) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#050B14' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`trip-${trip.routeName || 'preview'}.pdf`);
    } catch (error) { console.error(error); }
    setIsSaving(false);
  };

  const handleSmartPriceParse = () => {
    if (!smartPriceInput) return;
    const text = smartPriceInput.toLowerCase();
    const priceMatch = text.match(/\d+/);
    if (!priceMatch) return;
    const priceValue = parseInt(priceMatch[0]);
    const foundCity = Array.from(new Set([...trip.outbound.stops, ...trip.inbound.stops].map(s => s.city.toLowerCase()))).find(c => text.includes(c));
    if (foundCity) {
      setPriceMemory(prev => ({ ...prev, [foundCity]: priceValue }));
    }
    setSmartPriceInput('');
  };

  const autoCalculateDayOffsets = useCallback((type: 'outbound' | 'inbound') => {
    setTrip(prev => {
      const stops = prev[type].stops;
      if (stops.length === 0) return prev;
      let offset = 0;
      const updated = stops.map((stop, idx) => {
        if (idx === 0) return { ...stop, dayOffset: 0 };
        const p = stops[idx - 1];
        if (p.time && stop.time) {
          const [ph, pm] = p.time.split(':').map(Number);
          const [ch, cm] = stop.time.split(':').map(Number);
          if (ch * 60 + cm < ph * 60 + pm) offset += 1;
        }
        return { ...stop, dayOffset: offset };
      });
      return { ...prev, [type]: { ...prev[type], stops: updated } };
    });
  }, []);

  const addCustomDiscount = () => {
    setTrip(prev => ({ ...prev, customDiscounts: [...prev.customDiscounts, { id: generateId(), label: '', value: 0 }] }));
  };

  const updateCustomDiscount = (id: string, updates: Partial<{ label: string; value: number }>) => {
    setTrip(prev => ({ ...prev, customDiscounts: prev.customDiscounts.map(d => d.id === id ? { ...d, ...updates } : d) }));
  };

  const removeCustomDiscount = (id: string) => {
    setTrip(prev => ({ ...prev, customDiscounts: prev.customDiscounts.filter(d => d.id !== id) }));
  };

  const DAY_MAP: Record<string, string> = { 'понеділок': 'ПН', 'вівторок': 'ВТ', 'середа': 'СР', 'четвер': 'ЧТ', 'п\'ятниця': 'ПТ', 'субота': 'СБ', 'неділя': 'НД' };

  const handleSmartParse = () => {
    if (!smartInput) return;
    const lines = smartInput.split('\n').filter(l => l.trim());
    const newStops: Stop[] = lines.map(line => ({
      id: generateId(), city: line.split(' ')[0] || 'Місто', address: '', time: '12:00', price: 0, dayOffset: 0, cityStatus: 'pending'
    }));
    setTrip(prev => ({ ...prev, outbound: { ...prev.outbound, stops: newStops } }));
    setSmartInput('');
  };

  const addStop = (type: 'outbound' | 'inbound') => {
    setTrip(prev => {
      const last = prev[type].stops[prev[type].stops.length - 1];
      const newStop: Stop = { id: generateId(), city: '', address: '', time: '12:00', dayOffset: last?.dayOffset ?? 0, price: last?.price ?? 0, priceManuallySet: false, cityStatus: 'pending' };
      return { ...prev, [type]: { ...prev[type], stops: [...prev[type].stops, newStop] } };
    });
  };

  const removeStop = (type: 'outbound' | 'inbound', id: string) => {
    setTrip(prev => ({ ...prev, [type]: { ...prev[type], stops: prev[type].stops.filter(s => s.id !== id) } }));
  };

  const handleReorder = (type: 'outbound' | 'inbound', newStops: Stop[]) => {
    setTrip(prev => ({ ...prev, [type]: { ...prev[type], stops: newStops } }));
  };

  const updateStop = (type: 'outbound' | 'inbound', id: string, updates: Partial<Stop>) => {
    setTrip(prev => ({ ...prev, [type]: { ...prev[type], stops: prev[type].stops.map(s => s.id === id ? { ...s, ...updates } : s) } }));
  };

  const toggleDay = (type: 'outbound' | 'inbound', day: string) => {
    setTrip(prev => ({ ...prev, [type]: { ...prev[type], days: prev[type].days.includes(day) ? prev[type].days.filter(d => d !== day) : [...prev[type].days, day] } }));
  };

  const generateReturnStops = () => {
    const reversed = [...trip.outbound.stops].reverse().map(s => ({ ...s, id: generateId(), time: '', dayOffset: 0 }));
    setTrip(prev => ({ ...prev, inbound: { ...prev.inbound, stops: reversed } }));
  };

  const allSegments = useMemo(() => {
    if (trip.outbound.stops.length < 2) return [];
    const segments: any[] = [];
    for (let i = 0; i < trip.outbound.stops.length; i++) {
      for (let j = i + 1; j < trip.outbound.stops.length; j++) {
        const from = trip.outbound.stops[i].city;
        const to = trip.outbound.stops[j].city;
        if (from && to) segments.push({ from, to, price: priceMemory[to.toLowerCase()] || 0, currency: 'ГРН', key: to.toLowerCase() });
      }
    }
    return segments;
  }, [trip.outbound.stops, priceMemory]);

  const handleSmartParseStep1 = () => {
    if (!smartInputStep1) return;
    setTrip(prev => ({ ...prev, routeName: smartInputStep1.trim() }));
    setSmartInputStep1('');
  };

  const getTotalDuration = (stops: Stop[]) => {
    if (stops.length < 2) return null;
    return "24г 00хв";
  };

  const getDayName = (type: 'outbound' | 'inbound', offset: number) => {
    const days = trip[type].days;
    return days[0] || '';
  };

  const nextStep = () => {
    if (currentStep === 7) { syncToSupabase(); return; }
    setCurrentStep(prev => Math.min(prev + 1, 7));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const STEPS = [
    { id: 1, icon: Settings2, label: 'ОСНОВНЕ' },
    { id: 2, icon: MapPin, label: 'ГРАФІК' },
    { id: 3, icon: Calendar, label: 'РЕГУЛЯРНІСТЬ' },
    { id: 4, icon: CreditCard, label: 'ЦІНИ' },
    { id: 5, icon: FileText, label: 'ПРАВИЛА' },
    { id: 6, icon: Eye, label: 'ПРЕВ' },
    { id: 7, icon: Save, label: 'ФІНІШ' }
  ];

  return (
    <div className="flex flex-col font-sans h-full bg-[#030712] overflow-hidden text-slate-300 selection:bg-[#00E5FF]/30">
      <AnimatePresence>
        {showResetConfirm && (
          <ResetConfirmModal
            onConfirm={() => { setShowResetConfirm(false); resetApp(); }}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
      
      {/* HEADER TOP BAR */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#050B14] border-b border-white/5 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center border border-[#00E5FF]/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
            <Bus className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-white tracking-widest uppercase leading-none">
              ROUTE<span className="text-[#00E5FF]">BUILDER</span>
            </h1>
            <p className="text-[8px] text-[#5A6A85] uppercase tracking-[0.2em] font-bold mt-1">Busnet System v4.0</p>
          </div>
        </div>
        
        {/* STEP NAV */}
        <div className="hidden lg:flex items-center gap-2">
          {STEPS.map((step) => (
            <button 
              key={step.id} onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                currentStep === step.id 
                  ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 text-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.1)]' 
                  : 'border-transparent text-[#5A6A85] hover:text-white hover:bg-white/5'
              }`}
            >
              <step.icon size={14} className={currentStep === step.id ? 'opacity-100' : 'opacity-50'} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{step.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#0B1221] px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-[9px] text-[#5A6A85] font-bold uppercase tracking-widest">Rate</span>
            <input 
              type="number" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              className="bg-transparent border-none outline-none text-xs text-[#00E5FF] font-black w-10 text-right"
            />
          </div>
          <button onClick={() => setShowResetConfirm(true)} className="text-[#5A6A85] hover:text-red-400 transition-colors" title="Скинути">
            <RefreshCcw size={16} />
          </button>
        </div>
      </header>

      <main id="scroll-area" className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative">
        <div className="max-w-5xl mx-auto pb-24 md:pb-24">
          <AnimatePresence mode="wait">
            
            {/* STEP 1 */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <Settings2 className="text-[#00E5FF]" size={20} /> Конфігурація рейсу
                  </h2>
                  <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] mt-1 font-bold">Базові параметри та налаштування</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-4 bg-[#0B1221] rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col h-[320px]">
                    <h3 className="text-[10px] font-black text-[#00E5FF] uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap size={14} /> Smart Parser
                    </h3>
                    <textarea 
                      value={smartInputStep1} onChange={(e) => setSmartInputStep1(e.target.value)}
                      className="w-full flex-1 bg-[#050B14] border border-white/10 focus:border-[#00E5FF]/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.1)] rounded-xl p-4 text-white text-xs outline-none resize-none transition-all placeholder:text-[#5A6A85]"
                      placeholder="Наприклад: Одеса-Краків..."
                    />
                    <button onClick={handleSmartParseStep1} className="w-full mt-4 bg-[#00E5FF] text-[#050B14] hover:bg-[#00E5FF]/90 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Аналізувати текст
                    </button>
                  </div>

                  <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-5 bg-[#0B1221] rounded-2xl p-5 border border-white/10">
                        <div>
                          <label className="text-[9px] text-[#5A6A85] font-bold uppercase tracking-widest block mb-2">Назва маршруту</label>
                          <input 
                            value={trip.routeName} onChange={(e) => setTrip({...trip, routeName: e.target.value})} 
                            className="w-full bg-[#050B14] border border-white/10 focus:border-[#00E5FF]/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.1)] rounded-xl px-4 py-3 text-sm text-white font-bold outline-none transition-all" 
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-[9px] text-[#5A6A85] font-bold uppercase tracking-widest block mb-2">Кількість місць</label>
                            <input 
                              type="number" value={trip.seats} onChange={(e) => setTrip({...trip, seats: parseInt(e.target.value) || 0})} 
                              className="w-full bg-[#050B14] border border-white/10 focus:border-[#00E5FF]/50 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none transition-all" 
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[9px] text-[#5A6A85] font-bold uppercase tracking-widest block mb-2">Тип рейсу</label>
                            <div className="flex bg-[#050B14] rounded-xl border border-white/10 p-1">
                              <button onClick={() => setTrip({...trip, isTransfer: false})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${!trip.isTransfer ? 'bg-white/10 text-white' : 'text-[#5A6A85] hover:text-white'}`}>Прямий</button>
                              <button onClick={() => setTrip({...trip, isTransfer: true})} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${trip.isTransfer ? 'bg-white/10 text-white' : 'text-[#5A6A85] hover:text-white'}`}>Транзит</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#0B1221] rounded-2xl p-5 border border-white/10">
                        <label className="text-[9px] text-[#5A6A85] font-bold uppercase tracking-widest block mb-3">Зручності в автобусі</label>
                        <div className="grid grid-cols-2 gap-2">
                          {AMENITIES_CONFIG.map(amenity => (
                            <button 
                              key={amenity.id} 
                              onClick={() => setTrip(prev => ({ ...prev, amenities: prev.amenities.includes(amenity.id) ? prev.amenities.filter(a => a !== amenity.id) : [...prev.amenities, amenity.id] }))} 
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all ${
                                trip.amenities.includes(amenity.id) 
                                  ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 text-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.1)]' 
                                  : 'bg-[#050B14] border-white/5 text-[#5A6A85] hover:border-white/20'
                              }`}
                            >
                              <amenity.icon size={14} className={trip.amenities.includes(amenity.id) ? 'text-[#00E5FF]' : 'text-[#5A6A85]'} /> 
                              {amenity.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2 bg-[#0B1221] p-5 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Тарифи та знижки</h4>
                          <button onClick={addCustomDiscount} className="text-[#00E5FF] hover:text-white transition-colors"><PlusCircle size={16} /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[ { id: 'child04', label: 'Діти до 4 років' }, { id: 'child412', label: 'Діти 4-12 років' } ].map((d) => (
                            <button 
                              key={d.id} onClick={() => setTrip(prev => ({ ...prev, discounts: { ...prev.discounts, [d.id]: !prev.discounts[d.id as keyof typeof prev.discounts] } }))} 
                              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                trip.discounts[d.id as keyof typeof trip.discounts] 
                                  ? 'bg-[#00E5FF]/5 border-[#00E5FF]/30 text-white' 
                                  : 'bg-[#050B14] border-white/5 text-[#5A6A85]'
                              }`}
                            >
                              <span className="text-[11px] font-bold uppercase tracking-wide">{d.label}</span>
                              <CheckCircle size={14} className={trip.discounts[d.id as keyof typeof trip.discounts] ? 'text-[#00E5FF]' : 'opacity-0'} />
                            </button>
                          ))}
                          {trip.customDiscounts.map((discount) => (
                            <div key={discount.id} className="flex items-center gap-2 bg-[#050B14] p-2 rounded-xl border border-white/10">
                              <input value={discount.label} onChange={(e) => updateCustomDiscount(discount.id, { label: e.target.value })} className="flex-1 bg-transparent border-none px-2 text-[11px] text-white font-bold outline-none placeholder:text-[#5A6A85]" placeholder="Назва..." />
                              <div className="flex items-center bg-[#0B1221] px-2 py-1 rounded-lg border border-white/5">
                                <input type="number" value={discount.value} onChange={(e) => updateCustomDiscount(discount.id, { value: parseInt(e.target.value) || 0 })} className="w-8 bg-transparent border-none text-[11px] text-[#00E5FF] font-black text-center outline-none" />
                                <span className="text-[9px] text-[#5A6A85] font-black">%</span>
                              </div>
                              <button onClick={() => removeCustomDiscount(discount.id)} className="text-[#5A6A85] hover:text-red-500 px-1"><Trash2 size={14} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                      <MapPin className="text-[#00E5FF]" size={20} /> Графік маршруту
                    </h2>
                    <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] mt-1 font-bold">Зупинки та час прибуття</p>
                  </div>
                  <button onClick={generateReturnStops} className="bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                    <RefreshCcw size={12} /> Авто-реверс
                  </button>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-4 py-2 rounded-xl">
                      <h3 className="text-[11px] font-black text-[#00E5FF] uppercase tracking-widest flex items-center gap-2"><ArrowRight size={14} /> Туди</h3>
                    </div>
                    <div className="space-y-3">
                      {trip.outbound.stops.map((stop, idx) => (
                        <div key={stop.id} className="group relative flex gap-3 items-center bg-[#0B1221] p-3 rounded-xl border border-white/5 hover:border-[#00E5FF]/30 transition-all">
                          <div className="w-5 flex justify-center text-[10px] font-black text-[#5A6A85]">{idx + 1}</div>
                          <input value={stop.city} onChange={(e) => updateStop('outbound', stop.id, { city: e.target.value })} className="flex-1 bg-[#050B14] border border-white/5 focus:border-[#00E5FF]/50 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-[#5A6A85]" placeholder="Місто" />
                          <input type="time" value={stop.time} onChange={(e) => updateStop('outbound', stop.id, { time: e.target.value })} className="bg-[#050B14] border border-white/5 focus:border-[#00E5FF]/50 rounded-lg px-2 py-2 text-[11px] font-bold text-[#00E5FF] outline-none w-[75px]" />
                          <button onClick={() => removeStop('outbound', stop.id)} className="text-[#5A6A85] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-1"><XCircle size={16}/></button>
                        </div>
                      ))}
                      <button onClick={() => addStop('outbound')} className="w-full py-3 bg-[#0B1221] border border-dashed border-white/10 hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/5 rounded-xl text-[10px] font-bold text-[#5A6A85] hover:text-[#00E5FF] uppercase tracking-widest transition-all">
                        + Додати
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#D946EF]/10 border border-[#D946EF]/20 px-4 py-2 rounded-xl">
                      <h3 className="text-[11px] font-black text-[#D946EF] uppercase tracking-widest flex items-center gap-2"><ArrowLeft size={14} /> Назад</h3>
                    </div>
                    <div className="space-y-3">
                      {trip.inbound.stops.map((stop, idx) => (
                        <div key={stop.id} className="group relative flex gap-3 items-center bg-[#0B1221] p-3 rounded-xl border border-white/5 hover:border-[#D946EF]/30 transition-all">
                          <div className="w-5 flex justify-center text-[10px] font-black text-[#5A6A85]">{idx + 1}</div>
                          <input value={stop.city} onChange={(e) => updateStop('inbound', stop.id, { city: e.target.value })} className="flex-1 bg-[#050B14] border border-white/5 focus:border-[#D946EF]/50 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-[#5A6A85]" placeholder="Місто" />
                          <input type="time" value={stop.time} onChange={(e) => updateStop('inbound', stop.id, { time: e.target.value })} className="bg-[#050B14] border border-white/5 focus:border-[#D946EF]/50 rounded-lg px-2 py-2 text-[11px] font-bold text-[#D946EF] outline-none w-[75px]" />
                          <button onClick={() => removeStop('inbound', stop.id)} className="text-[#5A6A85] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-1"><XCircle size={16}/></button>
                        </div>
                      ))}
                      <button onClick={() => addStop('inbound')} className="w-full py-3 bg-[#0B1221] border border-dashed border-white/10 hover:border-[#D946EF]/50 hover:bg-[#D946EF]/5 rounded-xl text-[10px] font-bold text-[#5A6A85] hover:text-[#D946EF] uppercase tracking-widest transition-all">
                        + Додати
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <Calendar className="text-[#00E5FF]" size={20} /> Дні відправлення
                  </h2>
                  <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] mt-1 font-bold">Графік регулярності</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#0B1221] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-[10px] font-black text-[#00E5FF] uppercase tracking-widest mb-6 text-center">ТУДИ (ВІДПРАВЛЕННЯ)</h3>
                    <div className="flex justify-center gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button 
                          key={day} onClick={() => toggleDay('outbound', day)} 
                          className={`w-9 h-9 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center border ${
                            trip.outbound.days.includes(day) 
                              ? 'bg-[#00E5FF] text-[#050B14] border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                              : 'bg-[#050B14] border-white/5 text-[#5A6A85] hover:bg-white/5'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0B1221] p-6 rounded-2xl border border-white/10">
                    <h3 className="text-[10px] font-black text-[#D946EF] uppercase tracking-widest mb-6 text-center">НАЗАД (ВІДПРАВЛЕННЯ)</h3>
                    <div className="flex justify-center gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button 
                          key={day} onClick={() => toggleDay('inbound', day)} 
                          className={`w-9 h-9 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center border ${
                            trip.inbound.days.includes(day) 
                              ? 'bg-[#D946EF] text-white border-[#D946EF] shadow-[0_0_15px_rgba(217,70,239,0.4)]' 
                              : 'bg-[#050B14] border-white/5 text-[#5A6A85] hover:bg-white/5'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <CreditCard className="text-[#00E5FF]" size={20} /> Ціноутворення
                  </h2>
                  <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] mt-1 font-bold">Вартість проїзду між сегментами</p>
                </div>

                <div className="bg-[#0B1221] rounded-2xl p-6 border border-white/10">
                   <div className="space-y-3">
                      {allSegments.map((segment, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#050B14] p-4 rounded-xl border border-white/5 group hover:border-white/20 transition-all">
                           <div className="flex items-center gap-4">
                              <p className="text-xs text-[#5A6A85] font-bold uppercase tracking-widest">{segment.from}</p>
                              <ArrowRight size={12} className="text-[#00E5FF]" />
                              <p className="text-sm font-black text-white uppercase">{segment.to}</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                value={segment.price} 
                                onChange={(e) => setPriceMemory(prev => ({ ...prev, [segment.key]: parseInt(e.target.value) || 0 }))}
                                className="w-24 bg-[#0B1221] border border-white/10 focus:border-[#00E5FF]/50 rounded-lg px-3 py-2 text-white font-bold text-right outline-none transition-all"
                              />
                              <span className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest">{trip.currency}</span>
                           </div>
                        </div>
                      ))}
                      {allSegments.length === 0 && (
                        <div className="py-16 text-center">
                           <Info size={32} className="mx-auto mb-3 text-[#5A6A85]" />
                           <p className="text-[10px] text-[#5A6A85] font-bold uppercase tracking-[0.2em]">Спочатку додайте зупинки у графік</p>
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5 */}
            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <FileText className="text-[#00E5FF]" size={20} /> Умови перевезення
                  </h2>
                  <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] mt-1 font-bold">Правила та обмеження</p>
                </div>

                <div className="bg-[#0B1221] p-6 rounded-2xl border border-white/10">
                  <div className="grid grid-cols-1 gap-3">
                    {PRESET_RULES.map((rule, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => toggleRule(rule)}
                        className={`text-left px-5 py-4 rounded-xl border transition-all flex items-start gap-4 ${
                          trip.rules.includes(rule) 
                            ? 'bg-[#00E5FF]/5 border-[#00E5FF]/30' 
                            : 'bg-[#050B14] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 ${trip.rules.includes(rule) ? 'text-[#00E5FF]' : 'text-[#5A6A85]'}`}>
                          {trip.rules.includes(rule) ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border border-[#5A6A85]" />}
                        </div>
                        <span className={`text-[11px] leading-relaxed font-medium ${trip.rules.includes(rule) ? 'text-white' : 'text-[#5A6A85]'}`}>{rule}</span>
                      </button>
                    ))}
                    <button onClick={addCustomRule} className="w-full py-4 mt-2 border border-dashed border-white/10 hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/5 rounded-xl text-[10px] font-bold text-[#5A6A85] hover:text-[#00E5FF] uppercase tracking-widest transition-all">+ Свої правила</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6 */}
            {currentStep === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                 <div className="flex justify-between items-end pb-4 border-b border-white/10">
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Eye className="text-[#00E5FF]" size={20} /> Попередній перегляд
                      </h2>
                      <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] mt-1 font-bold">Візуалізація маршруту</p>
                    </div>
                    <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Download size={14} /> Скачати PDF</button>
                 </div>

                 <div id="full-preview-area" className="bg-[#0B1221] p-8 rounded-2xl border border-white/10 space-y-10">
                    <div className="flex justify-between items-start pb-6 border-b border-white/5">
                       <div>
                          <p className="text-[9px] text-[#00E5FF] font-black uppercase tracking-[0.3em] mb-2">Маршрутний лист</p>
                          <h3 className="text-2xl font-black text-white tracking-widest uppercase">{trip.routeName || 'Без назви'}</h3>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-[0.3em] mb-1">Оператор</p>
                          <p className="text-sm font-black text-white uppercase">{user?.companyName || 'Carrier'}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-[#00E5FF] uppercase tracking-widest flex items-center gap-2"><ArrowRight size={14} /> ТУДИ</h4>
                          <div className="space-y-4">
                             {trip.outbound.stops.map((s, i) => (
                               <div key={i} className="flex items-center gap-4 border-l-2 border-[#00E5FF]/20 pl-4">
                                  <div className="text-sm font-black text-[#5A6A85] w-12">{s.time}</div>
                                  <div className="text-sm font-bold text-white uppercase">{s.city}</div>
                               </div>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-[#D946EF] uppercase tracking-widest flex items-center gap-2"><ArrowLeft size={14} /> НАЗАД</h4>
                          <div className="space-y-4">
                             {trip.inbound.stops.map((s, i) => (
                               <div key={i} className="flex items-center gap-4 border-l-2 border-[#D946EF]/20 pl-4">
                                  <div className="text-sm font-black text-[#5A6A85] w-12">{s.time}</div>
                                  <div className="text-sm font-bold text-white uppercase">{s.city}</div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* STEP 7 */}
            {currentStep === 7 && (
              <motion.div key="step7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="py-24 text-center space-y-8">
                 <div className="w-20 h-20 bg-[#00E5FF]/10 rounded-2xl border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] mx-auto shadow-[0_0_30px_rgba(0,229,255,0.2)]">
                    <CheckCircle2 size={40} strokeWidth={2} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Все готово!</h2>
                    <p className="text-[#5A6A85] text-xs max-w-md mx-auto leading-relaxed">Натисніть кнопку нижче, щоб відправити маршрут на модерацію. Після схвалення він з'явиться в системі.</p>
                 </div>
                 <div className="pt-8 flex flex-col items-center gap-4">
                    <button 
                      onClick={syncToSupabase} 
                      disabled={isSaving}
                      className="px-12 py-4 bg-[#00E5FF] text-[#050B14] rounded-xl font-black uppercase tracking-widest hover:bg-[#00E5FF]/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50"
                    >
                       {isSaving ? 'Збереження...' : 'Відправити на перевірку'}
                    </button>
                    <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest">Це займе менше 2 секунд</p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* BOTTOM FIXED BAR */}
      <footer className="h-20 bg-[#050B14]/90 backdrop-blur-md border-t border-white/5 absolute bottom-0 left-0 right-0 z-50 flex items-center px-6 md:px-12">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <button 
            onClick={prevStep} disabled={currentStep === 1} 
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold text-[#5A6A85] uppercase tracking-widest border border-transparent hover:bg-white/5 hover:text-white transition-all disabled:opacity-30"
          >
            <ChevronLeft size={14} /> Назад
          </button>
          
          <div className="flex gap-2">
            {[1,2,3,4,5,6,7].map(s => (
              <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === currentStep ? 'bg-[#00E5FF] w-6 shadow-[0_0_8px_rgba(0,229,255,0.6)]' : s < currentStep ? 'bg-[#00E5FF]/30 w-2' : 'bg-white/10 w-2'}`} />
            ))}
          </div>

          <button 
            onClick={nextStep} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              currentStep === 7 
                ? 'bg-[#00E5FF] text-[#050B14] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {currentStep === 7 ? 'Зберегти' : 'Далі'} <ChevronRight size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
}
