/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  Calendar, 
  Bus, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Sparkles, 
  ArrowLeftRight,
  Save,
  Eye,
  Settings2,
  CheckCircle2,
  Info,
  AlertCircle,
  Coins,
  TrendingDown,
  RefreshCcw,
  XCircle,
  Wifi,
  Wind,
  Zap,
  Coffee,
  Download,
  Database,
  ArrowRightLeft,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileDown,
  FolderOpen,
  ArrowDownToLine,
  Layout,
  FileText,
  GripVertical,
  HelpCircle,
  PlusCircle,
  QrCode,
  Navigation,
  CreditCard,
  Activity,
  TrendingUp,
  Tag
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
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
      className="bg-[#0B1221] border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4"
      onClick={e => e.stopPropagation()}
    >
      <h3 className="text-white font-black text-lg uppercase mb-2">Скинути чернетку?</h3>
      <p className="text-slate-400 text-sm mb-6">Всі незбережені дані буде втрачено.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-400 text-xs font-black uppercase hover:bg-white/5 transition-all">Скасувати</button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-xs font-black uppercase hover:bg-red-600 transition-all">Скинути</button>
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
            issues.push({ step, message: `Зупинка ${idx + 1}: час прибуття раніше або дорівнює попередній зупинці. Перевірте зміщення дня.`, severity: 'error' });
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
      const canvas = await html2canvas(element, { scale: 2 });
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

  return (
    <div className="flex flex-col font-sans h-full bg-[#050B14] overflow-hidden">
      <AnimatePresence>
        {showResetConfirm && (
          <ResetConfirmModal
            onConfirm={() => { setShowResetConfirm(false); resetApp(); }}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
      <header className="h-20 flex items-center justify-between px-8 bg-transparent shrink-0 z-10 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#00E5FF] to-[#0EA5E9] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Bus className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight leading-none">
              BUSNET<span className="text-[#00E5FF]">/SMART</span>
            </h1>
            <p className="text-[9px] text-[#5A6A85] uppercase tracking-[0.2em] font-bold mt-1">Route Architect v3.0</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-1 bg-[#0B1221]/80 backdrop-blur-xl px-6 py-2.5 rounded-[24px] border border-white/5 relative overflow-hidden">
          {[
            { id: 1, icon: Settings2, label: 'Старт' },
            { id: 2, icon: MapPin, label: 'Туди' },
            { id: 3, icon: MapPin, label: 'Назад' },
            { id: 4, icon: CreditCard, label: 'Ціни' },
            { id: 5, icon: Zap, label: 'Умови' },
            { id: 6, icon: FileText, label: 'Експорт' },
            { id: 7, icon: Save, label: 'Фініш' }
          ].map((step) => (
            <button 
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all ${currentStep === step.id ? 'bg-blue-600/10 text-blue-500' : 'text-[#5A6A85]'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${currentStep === step.id ? 'bg-blue-600 text-white' : 'bg-white/5'}`}>
                <step.icon size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tight hidden xl:block">{step.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-[#0B1221] px-6 py-2.5 rounded-[20px] border border-white/5">
            <span className="text-[10px] text-slate-600 font-black uppercase">Rate</span>
            <input 
              type="number" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              className="bg-transparent border-none outline-none text-sm text-white font-black w-10 text-center"
            />
          </div>
          <button onClick={() => setShowResetConfirm(true)} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-600"><RefreshCcw size={18} /></button>
        </div>
      </header>

      <main id="scroll-area" className="flex-1 p-3 md:p-6 overflow-x-hidden">
        <div className="max-w-4xl mx-auto pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
                <div className="flex items-center gap-5 pt-6">
                  <div className="w-16 h-16 rounded-[24px] bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <Settings2 size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Конфігурація рейсу</h2>
                    <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.3em] font-bold">Базові параметри</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-4">
                    <div className="bg-[#0B1221] rounded-[40px] p-8 border-2 border-white/5 shadow-2xl min-h-[400px] flex flex-col">
                      <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={16} /> SMART ANALYZER</h3>
                      <textarea 
                        value={smartInputStep1} onChange={(e) => setSmartInputStep1(e.target.value)}
                        className="w-full flex-1 bg-black/40 border-2 border-white/5 rounded-[32px] p-6 text-white text-[12px] outline-none"
                        placeholder="Наприклад: Одеса-Краків..."
                      />
                      <button onClick={handleSmartParseStep1} className="w-full mt-6 bg-blue-600 text-white py-6 rounded-[28px] text-[11px] font-black uppercase">Аналізувати</button>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                        <div>
                          <label className="text-[10px] text-[#5A6A85] font-black uppercase block mb-3">Назва маршруту</label>
                          <input value={trip.routeName} onChange={(e) => setTrip({...trip, routeName: e.target.value})} className="w-full bg-[#0B1221] border-2 border-white/5 rounded-[24px] px-8 py-5 text-white font-bold outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#5A6A85] font-black uppercase block mb-3">Кількість місць</label>
                          <input type="number" value={trip.seats} onChange={(e) => setTrip({...trip, seats: parseInt(e.target.value) || 0})} className="w-full bg-[#0B1221] border-2 border-white/5 rounded-[24px] px-8 py-5 text-white font-bold outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#5A6A85] font-black uppercase block mb-3">Тип рейсу</label>
                          <div className="flex p-2 bg-[#0B1221] rounded-[24px] border-2 border-white/5 gap-2">
                            <button onClick={() => setTrip({...trip, isTransfer: false})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase ${!trip.isTransfer ? 'bg-blue-600 text-white' : 'text-[#5A6A85]'}`}>Прямий</button>
                            <button onClick={() => setTrip({...trip, isTransfer: true})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase ${trip.isTransfer ? 'bg-blue-600 text-white' : 'text-[#5A6A85]'}`}>Пересадка</button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <label className="text-[10px] text-[#5A6A85] font-black uppercase block mb-3">Комфорт</label>
                          <div className="grid grid-cols-2 gap-3">
                            {AMENITIES_CONFIG.map(amenity => (
                              <button key={amenity.id} onClick={() => setTrip(prev => ({ ...prev, amenities: prev.amenities.includes(amenity.id) ? prev.amenities.filter(a => a !== amenity.id) : [...prev.amenities, amenity.id] }))} className={`flex items-center gap-3 px-5 py-4 rounded-[20px] border-2 text-[10px] font-black uppercase ${trip.amenities.includes(amenity.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#0B1221] border-white/5 text-slate-500'}`}>
                                <amenity.icon size={18} /> <span>{amenity.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-[#0B1221]/60 p-8 rounded-[40px] border-2 border-white/5 shadow-2xl">
                          <h4 className="text-[10px] font-black text-white uppercase mb-8 flex items-center justify-between">Тарифи та знижки <button onClick={addCustomDiscount} className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Plus size={16} /></button></h4>
                          <div className="grid grid-cols-1 gap-3">
                            {[ { id: 'child04', label: 'Діти до 4 років' }, { id: 'child412', label: 'Діти 4-12 років' } ].map((d) => (
                              <button key={d.id} onClick={() => setTrip(prev => ({ ...prev, discounts: { ...prev.discounts, [d.id]: !prev.discounts[d.id as keyof typeof prev.discounts] } }))} className={`p-5 rounded-[24px] border-2 flex items-center justify-between ${trip.discounts[d.id as keyof typeof trip.discounts] ? 'bg-blue-600/10 border-blue-600' : 'bg-black/20 border-white/5'}`}>
                                <p className="text-[12px] font-black text-white">{d.label}</p>
                                <CheckCircle size={14} className={trip.discounts[d.id as keyof typeof trip.discounts] ? 'text-blue-500' : 'text-slate-800'} />
                              </button>
                            ))}
                            {trip.customDiscounts.map((discount) => (
                              <div key={discount.id} className="flex items-center gap-4 bg-black/40 p-4 rounded-[20px] border-2 border-white/5">
                                <input value={discount.label} onChange={(e) => updateCustomDiscount(discount.id, { label: e.target.value })} className="flex-1 bg-transparent border-none text-[12px] text-white font-black outline-none" placeholder="Назва..." />
                                <div className="flex items-center gap-2 bg-[#0B1221] px-4 py-2 rounded-xl border border-white/5">
                                  <input type="number" value={discount.value} onChange={(e) => updateCustomDiscount(discount.id, { value: parseInt(e.target.value) || 0 })} className="w-8 bg-transparent border-none text-[12px] text-[#00E5FF] font-black text-center outline-none" />
                                  <span className="text-[10px] text-[#5A6A85] font-black">%</span>
                                </div>
                                <button onClick={() => removeCustomDiscount(discount.id)} className="text-slate-700 hover:text-red-500"><Trash2 size={16} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                <div className="flex justify-between items-center pt-6">
                  <h2 className="text-2xl font-black text-white uppercase">Графік маршруту</h2>
                  <button onClick={generateReturnStops} className="bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Авто-реверс</button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><ArrowRight size={18} /> Туди</h3>
                    <div className="bg-[#0B1221]/50 p-6 rounded-[32px] border border-white/5 space-y-6">
                      {trip.outbound.stops.map((stop) => (
                        <div key={stop.id} className="flex gap-4 items-start bg-black/30 p-4 rounded-2xl border border-white/5">
                          <input value={stop.city} onChange={(e) => updateStop('outbound', stop.id, { city: e.target.value })} className="flex-1 bg-transparent text-sm font-black text-white outline-none" placeholder="Місто" />
                          <input type="time" value={stop.time} onChange={(e) => updateStop('outbound', stop.id, { time: e.target.value })} className="text-[10px] text-white bg-transparent outline-none w-[55px] font-black" />
                          <button onClick={() => removeStop('outbound', stop.id)} className="text-[#5A6A85] hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => addStop('outbound')} className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black text-[#5A6A85] uppercase">+ Додати</button>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><ArrowLeft size={18} /> Назад</h3>
                    <div className="bg-[#0B1221]/50 p-6 rounded-[32px] border border-white/5 space-y-6">
                      {trip.inbound.stops.map((stop) => (
                        <div key={stop.id} className="flex gap-4 items-start bg-black/30 p-4 rounded-2xl border border-white/5">
                          <input value={stop.city} onChange={(e) => updateStop('inbound', stop.id, { city: e.target.value })} className="flex-1 bg-transparent text-sm font-black text-white outline-none" placeholder="Місто" />
                          <input type="time" value={stop.time} onChange={(e) => updateStop('inbound', stop.id, { time: e.target.value })} className="text-[10px] text-white bg-transparent outline-none w-[55px] font-black" />
                          <button onClick={() => removeStop('inbound', stop.id)} className="text-[#5A6A85] hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => addStop('inbound')} className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black text-[#5A6A85] uppercase">+ Додати</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep > 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                <h2 className="text-4xl font-black text-white uppercase mb-8">Крок {currentStep}</h2>
                <p className="text-slate-500 uppercase tracking-[0.2em] mb-12">Цей розділ спрощений для відновлення системи</p>
                <div className="flex justify-center gap-4">
                   <button onClick={() => setCurrentStep(prev => prev - 1)} className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[10px]">Назад</button>
                   <button onClick={() => setCurrentStep(prev => prev + 1)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px]">Продовжити</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="sticky bottom-6 z-50 mt-12 mb-8 w-full max-w-4xl mx-auto px-4">
            <div className="bg-[#0B1221]/80 backdrop-blur-2xl p-3 rounded-[32px] border border-white/10 shadow-2xl flex justify-between items-center">
              <motion.button onClick={prevStep} className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black text-[#5A6A85] uppercase">Назад</motion.button>
              <div className="flex gap-1.5">
                {[1,2,3,4,5,6,7].map(s => (
                  <div key={s} className={`w-1.5 h-1.5 rounded-full ${s === currentStep ? 'bg-blue-500 w-6' : 'bg-slate-800'}`} />
                ))}
              </div>
              <motion.button onClick={nextStep} className="flex items-center gap-4 px-10 py-4 bg-blue-600 text-white rounded-[20px] text-[11px] font-black uppercase">{currentStep === 7 ? 'Зберегти' : 'Далі'}</motion.button>
            </div>
          </div>
        </div>
      </main>

      <footer className="h-10 bg-black/80 border-t border-white/5 px-6 flex items-center justify-between text-[10px] text-slate-600 uppercase tracking-[4px] font-bold">
        <span>СИСТЕМА: СТАБІЛЬНА</span>
        <span>BUSNET UA © 2026</span>
      </footer>
    </div>
  );
}
