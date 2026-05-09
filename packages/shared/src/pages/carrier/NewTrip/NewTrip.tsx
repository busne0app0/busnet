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
  Navigation
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
  priceManuallySet?: boolean;   // FIX #2
  cityStatus?: CityConfirmStatus; // FIX #10
}

// FIX #6: schema version — bump when TripState shape changes
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

// FIX #3: safe ID generation (works on HTTP without crypto.randomUUID)
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

// FIX #10: City status indicator dot
const CityStatusDot = ({ status }: { status?: CityConfirmStatus }) => {
  if (!status || status === 'pending')
    return <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse inline-block" title="Перевірка..." />;
  if (status === 'confirmed')
    return <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" title="Місто підтверджено" />;
  return <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" title="Місто не знайдено в базі" />;
};

// FIX #8: Reset confirmation modal (replaces window.confirm)
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

// --- UA Cities for Detection ---
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
  "У випадку непідтвердження поїздки перевізник залишає за собою право продати дане місце без грошової компенсації пасажиру.",
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
      // FIX #6: reset draft if schema changed
      if (parsed.__version !== SCHEMA_VERSION) {
        localStorage.removeItem('busnet_trip_draft');
        return defaults;
      }
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  });

  // Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem('busnet_trip_draft', JSON.stringify(trip));
  }, [trip]);

  useEffect(() => {
    localStorage.setItem('busnet_current_step', currentStep.toString());
  }, [currentStep]);

  // Conflict Detection Logic
  const conflicts = useMemo(() => {
    const issues: { step: number; message: string; severity: 'warning' | 'error' }[] = [];

    // Step 1: General Info
    if (trip.routeName.length > 0 && trip.routeName.length < 3) {
      issues.push({ step: 1, message: 'Назва маршруту занадто коротка', severity: 'warning' });
    }

    // Step 2 & 3: Routes
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

    // Step 4: Prices
    const allStops = [...trip.outbound.stops, ...trip.inbound.stops];
    if (allStops.some(s => s.price === 0)) {
      issues.push({ step: 4, message: 'Є зупинки з нульовою ціною', severity: 'warning' });
    }

    return issues;
  }, [trip]);

  const toggleRule = (rule: string) => {
    setTrip(prev => ({
      ...prev,
      rules: prev.rules.includes(rule) 
        ? prev.rules.filter(r => r !== rule)
        : [...prev.rules, rule]
    }));
  };

  const addCustomRule = () => {
    setTrip(prev => ({
      ...prev,
      customRules: [...prev.customRules, '']
    }));
  };

  const updateCustomRule = (index: number, val: string) => {
    setTrip(prev => {
      const newRules = [...prev.customRules];
      newRules[index] = val;
      return { ...prev, customRules: newRules };
    });
  };

  const removeCustomRule = (index: number) => {
    setTrip(prev => ({
      ...prev,
      customRules: prev.customRules.filter((_, i) => i !== index)
    }));
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const resetApp = useCallback(() => {
    localStorage.removeItem('busnet_trip_draft');
    localStorage.removeItem('busnet_current_step');
    localStorage.removeItem('busnet_editing_route_id');
    setTrip(prev => ({ ...prev,
      __version: SCHEMA_VERSION,
      routeName: '', operator: '', seats: 50, amenities: ['wifi','ac'],
      isTransfer: false, transferType: 'direct', currency: 'ГРН',
      discounts: { child04: false, child412: false },
      customDiscounts: [], rules: [], customRules: [],
      outbound: { stops: [], days: ['ПТ'] },
      inbound:  { stops: [], days: ['НД'] }
    }));
    setCurrentStep(1);
  }, []);

  const [smartInput, setSmartInput] = useState('');
  const [smartPriceInput, setSmartPriceInput] = useState('');
  const [smartInputStep1, setSmartInputStep1] = useState('');
  const [priceMemory, setPriceMemory] = useState<Record<string, number>>({});
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  // Edit mode: ID of the route being edited (set by Schedule.tsx)
  const [editingRouteId] = useState<string | null>(
    () => localStorage.getItem('busnet_editing_route_id')
  );
  const [previewCollapsed, setPreviewCollapsed] = useState({
    outbound: false,
    inbound: false,
    pricing: false,
    rules: false,
    discounts: false
  });
  const [editorCollapsed, setEditorCollapsed] = useState({
    outboundSmart: false,
    outboundDays: false,
    outboundStops: false,
    inboundSmart: false,
    inboundDays: false,
    inboundStops: false
  });
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

  const toggleEditorSection = (section: keyof typeof editorCollapsed) => {
    setEditorCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const togglePreviewSection = (section: keyof typeof previewCollapsed) => {
    setPreviewCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // FIX #1 & #9: unified dayOffset recalculation — no setTimeout, uses ref to skip unchanged
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
      const same = JSON.stringify(newOut) === JSON.stringify(prev.outbound.stops)
                && JSON.stringify(newIn)  === JSON.stringify(prev.inbound.stops);
      if (same) return prev;
      return {
        ...prev,
        outbound: { ...prev.outbound, stops: newOut },
        inbound:  { ...prev.inbound,  stops: newIn  },
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    trip.outbound.stops.map(s => s.time).join(','),
    trip.inbound.stops.map(s => s.time).join(','),
  ]);

  // Real-time price recalculation when exchange rate changes
  useEffect(() => {
    if (!exchangeRate || exchangeRate <= 0) return;

    setTrip(prev => {
      // 1. Update Inbound (EUR) from Outbound (UAH) - Primary logic
      const newInboundStops = prev.inbound.stops.map(inStop => {
        const outStop = prev.outbound.stops.find(s => s.city === inStop.city);
        if (outStop && outStop.price > 0) {
          const newPrice = Math.round(outStop.price / exchangeRate);
          if (inStop.price !== newPrice) return { ...inStop, price: newPrice };
        }
        return inStop;
      });

      // 2. Update Outbound (UAH) from Inbound (EUR) - Fallback logic
      const newOutboundStops = prev.outbound.stops.map(outStop => {
        const inStop = prev.inbound.stops.find(s => s.city === outStop.city);
        if (inStop && inStop.price > 0 && !outStop.price) {
          const newPrice = Math.round(inStop.price * exchangeRate);
          if (outStop.price !== newPrice) return { ...outStop, price: newPrice };
        }
        return outStop;
      });

      const hasInboundChanges = JSON.stringify(prev.inbound.stops) !== JSON.stringify(newInboundStops);
      const hasOutboundChanges = JSON.stringify(prev.outbound.stops) !== JSON.stringify(newOutboundStops);
      
      if (!hasInboundChanges && !hasOutboundChanges) return prev;
      
      return {
        ...prev,
        outbound: { ...prev.outbound, stops: newOutboundStops },
        inbound: { ...prev.inbound, stops: newInboundStops }
      };
    });
  }, [exchangeRate, JSON.stringify(trip.outbound.stops.map(s => ({ city: s.city, price: s.price })))]);

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
          setIsSaving(false);
          return;
        }
        const separatorIndex = trip.operator.indexOf('::');
        if (separatorIndex === -1) {
          targetCarrierId = trip.operator;
          finalOperator = trip.operator;
        } else {
          targetCarrierId = trip.operator.substring(0, separatorIndex);
          finalOperator = trip.operator.substring(separatorIndex + 2);
        }
      }

      if (!finalOperator) {
        toast.error('Не вказано перевізника!');
        setIsSaving(false);
        return;
      }

      const dayMap: Record<string, number> = { 'НД': 0, 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
      const activeDays = trip.outbound.days.map(d => dayMap[d]).filter(d => d !== undefined);

      // Застосовуємо ціни з priceMemory до зупинок
      const applyPrices = (stops: Stop[]) => stops.map(stop => ({
        ...stop,
        price: priceMemory[stop.city.toLowerCase()] !== undefined
          ? priceMemory[stop.city.toLowerCase()]
          : stop.price
      }));

      const outboundWithPrices = {
        ...trip.outbound,
        stops: applyPrices(trip.outbound.stops)
      };

      const inboundWithPrices = {
        ...trip.inbound,
        stops: applyPrices(trip.inbound.stops)
      };

      const routeData = {
        name: trip.routeName,
        operator: finalOperator,
        carrier_id: targetCarrierId,
        seats: trip.seats,
        amenities: trip.amenities,
        is_transfer: trip.isTransfer,
        transfer_type: trip.transferType,
        transfer_city: trip.transferCity,
        currency: trip.currency,
        discounts: trip.discounts,
        custom_discounts: trip.customDiscounts,
        rules: trip.rules,
        custom_rules: trip.customRules,
        outbound: outboundWithPrices,
        inbound: inboundWithPrices,
        status: 'pending'  // Goes to admin for approval
      };

      let dbError;
      if (editingRouteId) {
        // UPDATE existing route
        const { error } = await supabase
          .from('routes')
          .update({ ...routeData, status: 'pending' })
          .eq('id', editingRouteId);
        dbError = error;
      } else {
        // INSERT new route
        const { error } = await supabase.from('routes').insert(routeData);
        dbError = error;
      }

      if (dbError) throw dbError;

      toast.success(
        editingRouteId
          ? 'Маршрут оновлено та надіслано на повторну перевірку!'
          : 'Маршрут надіслано на перевірку адміністратором!'
      );
      localStorage.removeItem('busnet_trip_draft');
      localStorage.removeItem('busnet_current_step');
      localStorage.removeItem('busnet_editing_route_id');
      
      // Navigate back to dashboard (relative to base /carrier/)
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err: any) {
      console.error('Error saving route:', err);
      toast.error('Помилка збереження маршруту');
    } finally {
      setIsSaving(false);
    }
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
    } catch (error) {
      console.error('PDF export failed:', error);
    }
    setIsSaving(false);
  };

  const handleSmartPriceParse = () => {
    if (!smartPriceInput) return;
    const lines = smartPriceInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const text = smartPriceInput.toLowerCase();
    
    // 1. Extract Price and Currency
    const priceLine = lines.find(l => l.match(/\d+/) && (l.toLowerCase().includes('грн') || l.includes('€') || l.toLowerCase().includes('eur')));
    if (!priceLine) return;
    
    const priceValue = parseInt(priceLine.replace(/\D/g, '')) || 0;
    const isUah = priceLine.toLowerCase().includes('грн');

    // 2. Identify relevant cities from the text
    const allStopCities = Array.from(new Set([...trip.outbound.stops, ...trip.inbound.stops].map(s => s.city.toLowerCase()))).filter(Boolean);
    const foundCitiesInText = allStopCities.filter(city => text.includes(city));
    
    if (foundCitiesInText.length < 2) return;
    
    // Target the first and second cities mentioned roughly
    const fromCity = foundCitiesInText[0];
    const toCity = foundCitiesInText[1];
    
    if (fromCity && toCity) {
      const keyForward = `${fromCity}_${toCity}`;
      const keyBackward = `${toCity}_${fromCity}`;
      
      // If user inputs UAH, calculate EUR for the reverse direction. If EUR, calculate UAH.
      const mirroredValue = isUah ? Math.round(priceValue / exchangeRate) : Math.round(priceValue * exchangeRate);

      setPriceMemory(prev => ({
        ...prev,
        [keyForward]: priceValue,
        [keyBackward]: mirroredValue
      }));

      // Also update any matching stops currently in the lists to reflect this change
      setTrip(prev => ({
        ...prev,
        outbound: {
          ...prev.outbound,
          stops: prev.outbound.stops.map(s => {
             // If we found a city matching 'toCity', and input was UAH, update it.
             if (s.city.toLowerCase() === toCity && isUah) return { ...s, price: priceValue };
             // If we found a city matching 'fromCity' (arrival in reverse), and input was EUR, update it?
             // Actually, usually UA is the departure.
             return s;
          })
        },
        inbound: {
          ...prev.inbound,
          stops: prev.inbound.stops.map(s => {
             // Inbound mirrored: if toCity is the destination (was destination in outbound), mirroring applies.
             if (s.city.toLowerCase() === toCity && !isUah) return { ...s, price: priceValue };
             if (s.city.toLowerCase() === toCity && isUah) return { ...s, price: mirroredValue };
             return s;
          })
        }
      }));
    }
    
    setSmartPriceInput('');
  };

  // FIX #9: uses same recalc logic as the useEffect above
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

  // Helper to save prices to memory
  const savePricesToMemory = (stops: Stop[]) => {
    const newMemory = { ...priceMemory };
    stops.forEach(stop => {
      if (stop.city && stop.price) {
        newMemory[stop.city.toLowerCase()] = stop.price;
      }
    });
    setPriceMemory(newMemory);
  };

  const addCustomDiscount = () => {
    setTrip(prev => ({
      ...prev,
      customDiscounts: [...prev.customDiscounts, { id: generateId(), label: '', value: 0 }] // FIX #3
    }));
  };

  const updateCustomDiscount = (id: string, updates: Partial<{ label: string; value: number }>) => {
    setTrip(prev => ({
      ...prev,
      customDiscounts: prev.customDiscounts.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  const removeCustomDiscount = (id: string) => {
    setTrip(prev => ({
      ...prev,
      customDiscounts: prev.customDiscounts.filter(d => d.id !== id)
    }));
  };

  const DAY_MAP: Record<string, string> = {
    'понеділок': 'ПН',
    'вівторок': 'ВТ',
    'середа': 'СР',
    'четвер': 'ЧТ',
    "п'ятниця": 'ПТ',
    'п’ятниця': 'ПТ',
    'субота': 'СБ',
    'неділя': 'НД'
  };

  const getDayIndex = (text: string) => {
    if (!text) return -1;
    // Normalize string: remove all kinds of quotes and extra spaces
    const lower = text.toLowerCase().replace(/[’‘'`’]/g, "").trim();
    const order = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];
    
    const searchMap: Record<string, string> = {
      'понеділок': 'ПН',
      'вівторок': 'ВТ',
      'середа': 'СР',
      'четвер': 'ЧТ',
      'п\'ятниця': 'ПТ',
      'пятниця': 'ПТ',
      'субота': 'СБ',
      'неділя': 'НД'
    };
    
    // Check full names
    for (const [name, short] of Object.entries(searchMap)) {
      if (lower.includes(name.replace(/[’‘'`’]/g, ""))) return order.indexOf(short);
    }
    
    // Check short names
    for (const short of order) {
      if (lower.includes(short.toLowerCase())) return order.indexOf(short);
    }
    
    return -1;
  };

  // --- Handlers ---
  const handleSmartParse = () => {
    if (!smartInput) return;
    const lines = smartInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const timeRegex = /([01]?\d|2[0-3])[:.]([0-5]\d)/;

    const newOutboundStops: Stop[] = [];
    const newInboundStops: Stop[] = [];

    // Advanced window parser for the 4-line block structure
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Potential block detected if current line has time
        const timeMatch1 = line.match(timeRegex);
        if (timeMatch1) {
            const outboundTime = timeMatch1[0];
            const city = lines[i+1] || 'Місто';
            
            // The address is usually the line starting with '(', but let's be flexible
            let address = '';
            let inboundTimeLine = '';
            let k = -1;

            // Scan next lines for the mirrored time (return leg)
            for(let scan = 1; scan <= 4; scan++) {
               const scanLine = lines[i + scan];
               if (!scanLine) continue;
               
               if (scanLine.startsWith('(')) {
                  address = scanLine;
               } else if (timeRegex.test(scanLine) && scanLine !== line) {
                  inboundTimeLine = scanLine;
                  k = i + scan;
                  break;
               }
            }

            if (k !== -1) {
                const inboundTimeMatch = inboundTimeLine.match(timeRegex);
                if (inboundTimeMatch) {
                    const inboundTime = inboundTimeMatch[0];
                    const cleanCity = city.replace(/[(),]/g, '').trim();
                    
                    if (cleanCity) {
                      const uahPrice = priceMemory[cleanCity.toLowerCase()] || 0;
                      const outDayIdx = getDayIndex(line);
                      const inDayIdx = getDayIndex(inboundTimeLine);

                      newOutboundStops.push({
                         id: crypto.randomUUID(),
                         city: cleanCity,
                         address: address || '',
                         time: outboundTime,
                         price: uahPrice,
                         dayOffset: outDayIdx 
                      });

                      newInboundStops.push({
                         id: crypto.randomUUID(),
                         city: cleanCity,
                         address: address || '',
                         time: inboundTime,
                         price: 0, // Will be calculated after pairing or from memory
                         dayOffset: inDayIdx
                      });
                    }
                }
                i = k; // Jump to the end of this block
                continue;
            }
        }
    }

    if (newOutboundStops.length > 0) {
      // Outbound logic: offsets relative to the first stop's day
      const firstOutDay = newOutboundStops[0].dayOffset;
      const finalOutbound = newOutboundStops.map(s => ({
        ...s,
        dayOffset: s.dayOffset !== -1 && firstOutDay !== -1 ? (s.dayOffset - firstOutDay + 7) % 7 : 0
      }));

      // Inbound logic: the user's list is Odessa -> ... -> Salerno.
      // But the return leg starts from Salerno. 
      // Salerno block has outbound time (arrival) and inbound time (departure).
      // We reverse the collected stops to get Salerno -> ... -> Odessa for the inbound leg.
      const reversedInbound = [...newInboundStops].reverse();
      const firstInDay = reversedInbound[0].dayOffset;
      
      const finalInbound = reversedInbound.map(s => {
        const uahPrice = priceMemory[s.city.toLowerCase()] || 0;
        return {
          ...s,
          price: trip.currency === 'ГРН' ? Math.round(uahPrice / exchangeRate) : uahPrice,
          dayOffset: s.dayOffset !== -1 && firstInDay !== -1 ? (s.dayOffset - firstInDay + 7) % 7 : 0
        };
      });

      setTrip(prev => ({
        ...prev,
        outbound: { ...prev.outbound, stops: finalOutbound },
        inbound: { ...prev.inbound, stops: finalInbound }
      }));
      setSmartInput('');
    }
  };

  const addStop = (type: 'outbound' | 'inbound') => {
    setTrip(prev => {
      const stops = prev[type].stops;
      const last = stops[stops.length - 1];
      const newStop: Stop = {
        id: generateId(), // FIX #3
        city: '',
        address: '',
        time: '12:00',
        dayOffset: last?.dayOffset ?? 0,
        price: last?.price ?? 0,
        priceManuallySet: false, // FIX #2
        cityStatus: 'pending',   // FIX #10
      };
      return { ...prev, [type]: { ...prev[type], stops: [...stops, newStop] } };
    });
  };

  const removeStop = (type: 'outbound' | 'inbound', id: string) => {
    setTrip(prev => ({
      ...prev,
      [type]: { ...prev[type], stops: prev[type].stops.filter(s => s.id !== id) }
    }));
  };

  const insertStop = (type: 'outbound' | 'inbound', index: number) => {
    setTrip(prev => {
      const newStop: Stop = {
        id: generateId(), // FIX #3
        city: '', address: '', time: '', price: 0, dayOffset: 0,
        priceManuallySet: false, cityStatus: 'pending',
      };
      const newStops = [...prev[type].stops];
      newStops.splice(index, 0, newStop);
      return { ...prev, [type]: { ...prev[type], stops: newStops } };
    });
  };

  const handleReorder = (type: 'outbound' | 'inbound', newStops: Stop[]) => {
    setTrip(prev => ({
      ...prev,
      [type]: { ...prev[type], stops: newStops }
    }));
  };

  const updateStop = (type: 'outbound' | 'inbound', id: string, updates: Partial<Stop>) => {
    setTrip(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        stops: prev[type].stops.map(s => {
          if (s.id !== id) return s;
          // FIX #2: flag manual price edits to prevent exchange rate overwrite
          const priceManuallySet = updates.price !== undefined ? true : s.priceManuallySet;
          return { ...s, ...updates, priceManuallySet };
        })
      }
    }));
  };

  const toggleDay = (type: 'outbound' | 'inbound', day: string) => {
    setTrip(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        days: prev[type].days.includes(day) 
          ? prev[type].days.filter(d => d !== day)
          : [...prev[type].days, day]
      }
    }));
  };

  const generateReturnStops = () => {
    const outbound = trip.outbound.stops;
    if (outbound.length === 0) return;
    const reversed = [...outbound].reverse().map(s => ({
      ...s,
      id: generateId(), // FIX #3
      time: '',
      dayOffset: 0,
      priceManuallySet: false,
      cityStatus: s.cityStatus,
      price: exchangeRate > 0 ? Math.round(s.price / exchangeRate) : 0
    }));
    setTrip(prev => ({ ...prev, inbound: { ...prev.inbound, stops: reversed } }));
  };

  const getDurationText = (stops: Stop[], index: number) => {
    if (index === 0 || stops.length === 0) return null;
    const current = stops[index];
    const prev = stops[index - 1];
    
    const [ch, cm] = current.time.split(':').map(Number);
    const [ph, pm] = prev.time.split(':').map(Number);
    
    const currentTotal = (current.dayOffset * 1440) + (ch * 60) + cm;
    const prevTotal = (prev.dayOffset * 1440) + (ph * 60) + pm;
    
    const diff = currentTotal - prevTotal;
    if (diff < 1) return null;
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}г ${minutes}хв`;
  };

  // FIX #3: memoized — computed once, not on every render
  const allSegments = useMemo(() => {
    const outboundStops = trip.outbound.stops;
    if (outboundStops.length < 2) return [];

    // 1. Calculate UA/EU border using max time gap
    const stopMinutes = outboundStops.map(s => {
      const [h, m] = s.time.split(':').map(Number);
      return (s.dayOffset * 1440) + (h * 60) + m;
    });

    let maxGapIndex = -1;
    let maxDist = 0;
    for (let i = 0; i < stopMinutes.length - 1; i++) {
        const gap = stopMinutes[i+1] - stopMinutes[i];
        if (gap > maxDist) {
            maxDist = gap;
            maxGapIndex = i;
        }
    }

    const isUA = (idx: number) => idx <= maxGapIndex;
    const segments: { from: string; to: string; price: number; currency: string; key: string }[] = [];

    // 2. Generate all cross-border pairs
    for (let i = 0; i < outboundStops.length; i++) {
      for (let j = 0; j < outboundStops.length; j++) {
        if (i === j) continue;
        const fromIsUA = isUA(i);
        const toIsUA = isUA(j);

        if (fromIsUA && !toIsUA) {
          // Outbound UA -> EU (UAH)
          const from = outboundStops[i].city;
          const to = outboundStops[j].city;
          if (from && to) {
            const key = `${from.toLowerCase()}_${to.toLowerCase()}`;
            segments.push({
              from,
              to,
              price: priceMemory[key] || 0,
              currency: 'ГРН',
              key
            });
          }
        } else if (!fromIsUA && toIsUA) {
          // Inbound EU -> UA (EUR)
          // Note: The inbound list is mirrored/reversed, but for pricing memory we use city pairs
          const from = outboundStops[i].city;
          const to = outboundStops[j].city;
          if (from && to) {
            const key = `${from.toLowerCase()}_${to.toLowerCase()}`;
            segments.push({
              from,
              to,
              price: priceMemory[key] || 0,
              currency: 'EUR',
              key
            });
          }
        }
      }
    }

    return segments;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.outbound.stops, priceMemory]);

  const updateSegmentPrice = (key: string, priceValue: number) => {
    const [from, to] = key.split('_');
    const mirroredKey = `${to}_${from}`;
    
    setPriceMemory(prev => ({
        ...prev,
        [key]: priceValue,
        [mirroredKey]: priceValue // Mirroring
    }));
  };

  const handleSmartParseStep1 = () => {
    if (!smartInputStep1) return;
    const lines = smartInputStep1.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;

    // 1. Look for route name (usually first line with dashes)
    const routeLine = lines.find(l => l.includes(' - ')) || lines[0];
    
    // 2. Look for operator name
    let operator = '';
    const operatorKeywords = ['перевізник', 'оператор', 'company', 'транс', 'trans'];
    const operatorLine = lines.find(l => operatorKeywords.some(kw => l.toLowerCase().includes(kw)));
    if (operatorLine) {
      operator = operatorLine.replace(/.*:\s*/, '').trim();
    }

    // 3. Detect Days
    const detectedOutboundDays: string[] = [];
    const detectedInboundDays: string[] = [];

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      Object.keys(DAY_MAP).forEach(day => {
        if (lowerLine.includes(day)) {
          const shortDay = DAY_MAP[day];
          if (lowerLine.includes('відправлення') || lowerLine.includes('туди')) {
             if (!detectedOutboundDays.includes(shortDay)) detectedOutboundDays.push(shortDay);
          } else if (lowerLine.includes('повернення') || lowerLine.includes('назад')) {
             if (!detectedInboundDays.includes(shortDay)) detectedInboundDays.push(shortDay);
          } else {
             const parts = line.split(/[–-]/);
             if (parts.length === 2) {
                const d1 = DAY_MAP[parts[0].trim().toLowerCase()];
                const d2 = DAY_MAP[parts[1].trim().toLowerCase()];
                if (d1 && !detectedOutboundDays.includes(d1)) detectedOutboundDays.push(d1);
                if (d2 && !detectedInboundDays.includes(d2)) detectedInboundDays.push(d2);
             }
          }
        }
      });
    });

    setTrip(prev => ({
      ...prev,
      routeName: routeLine.trim(),
      operator: operator || prev.operator,
      outbound: { ...prev.outbound, days: detectedOutboundDays.length > 0 ? detectedOutboundDays : prev.outbound.days },
      inbound: { ...prev.inbound, days: detectedInboundDays.length > 0 ? detectedInboundDays : prev.inbound.days }
    }));
    setSmartInputStep1('');
  };

  const getTotalDuration = (stops: Stop[]) => {
    if (stops.length < 2) return null;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const [fh, fm] = first.time.split(':').map(Number);
    const [lh, lm] = last.time.split(':').map(Number);
    
    const firstTotal = (first.dayOffset * 1440) + (fh * 60) + fm;
    const lastTotal = (last.dayOffset * 1440) + (lh * 60) + lm;
    
    const diff = lastTotal - firstTotal;
    if (diff < 1) return null;
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}г ${minutes}хв`;
  };

  const getDayName = (type: 'outbound' | 'inbound', offset: number) => {
    const days = trip[type].days;
    if (days.length === 0) return '';
    // Use the first selected day as base
    const startIdx = DAYS_OF_WEEK.indexOf(days[0]);
    if (startIdx === -1) return '';
    const dayNames = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];
    return dayNames[(startIdx + offset) % 7];
  };

  // FIX #10: block navigation on errors; FIX #7: last step triggers save
  const nextStep = () => {
    if (currentStep === 7) { syncToSupabase(); return; }
    const hasErrors = conflicts.some(c => c.step === currentStep && c.severity === 'error');
    if (hasErrors) { toast.error('Виправте помилки перед переходом'); return; }
    setCurrentStep(prev => Math.min(prev + 1, 7));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="flex flex-col font-sans h-full bg-[#050B14] overflow-hidden">
      {/* FIX #8: Reset modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <ResetConfirmModal
            onConfirm={() => { setShowResetConfirm(false); resetApp(); }}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>
      {/* Header */}
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
        
        {/* Visual Stepper - High Fidelity Architecture */}
        <div className="hidden lg:flex items-center gap-1 bg-[#0B1221]/80 backdrop-blur-xl px-6 py-2.5 rounded-[24px] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          {[
            { id: 1, icon: Settings2, label: 'Старт' },
            { id: 2, icon: MapPin, label: 'Туди' },
            { id: 3, icon: MapPin, label: 'Назад' },
            { id: 4, icon: CreditCard, label: 'Ціни' },
            { id: 5, icon: Zap, label: 'Умови' },
            { id: 6, icon: FileText, label: 'Експорт' },
            { id: 7, icon: Save, label: 'Фініш' }
          ].map((step, idx, arr) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const hasConflict = conflicts.some(c => c.step === step.id);
            const StepIcon = step.icon;

            return (
              <React.Fragment key={step.id}>
                <button 
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all relative group ${isActive ? 'bg-blue-600/10 text-blue-500' : isCompleted ? 'text-emerald-400' : 'text-[#5A6A85] hover:text-white'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(59,130,246,0.4)] rotate-3' : isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 border border-white/5'}`}>
                    <StepIcon size={16} strokeWidth={isActive ? 3 : 2} />
                  </div>
                  <div className="flex flex-col items-start xl:flex hidden">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'text-blue-500 opacity-100' : 'text-slate-600 opacity-60'}`}>КРОК 0{step.id}</span>
                    <span className={`text-[10px] font-black uppercase tracking-tight transition-all ${isActive ? 'text-white' : 'text-[#5A6A85] group-hover:text-white'}`}>
                      {step.label}
                    </span>
                  </div>
                  {hasConflict && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-[#0B1221] shadow-[0_0_10px_rgba(220,38,38,0.5)] z-20"
                    />
                  )}
                  {isActive && (
                    <motion.div 
                      layoutId="active-step-glow"
                      className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-lg -z-10"
                    />
                  )}
                </button>
                {idx < arr.length - 1 && (
                  <div className="px-1 flex items-center">
                    <div className={`w-3 h-0.5 rounded-full ${isCompleted ? 'bg-emerald-500/20' : 'bg-white/5'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-[#0B1221] px-6 py-2.5 rounded-[20px] border border-white/5 shadow-inner group hover:border-blue-500/30 transition-all">
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Rate</span>
            <div className="flex items-center gap-1.5">
               <span className="text-blue-500 font-black text-xs">€</span>
               <input 
                type="text"
                inputMode="decimal"
                value={exchangeRate}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (!isNaN(parseFloat(val)) || val === '') {
                    setExchangeRate(parseFloat(val) || 0);
                  }
                }}
                className="bg-transparent border-none outline-none text-sm text-white font-black w-10 text-center placeholder-slate-700 focus:text-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-600 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-90 group"
            title="Скинути прогрес"
          >
            <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </div>
      </header>

      <main id="scroll-area" className="flex-1 p-3 md:p-6 overflow-x-hidden">
        <div className="max-w-4xl mx-auto pb-20 md:pb-0">
          {/* Active Conflicts Panel */}
          <AnimatePresence>
            {conflicts.some(c => c.step === currentStep) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={16} className="text-red-400" />
                  <span className="text-xs font-black text-red-300 uppercase tracking-widest">Виявлені зауваження до поточного кроку</span>
                </div>
                <div className="space-y-1">
                  {conflicts.filter(c => c.step === currentStep).map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
                      <div className={`w-1 h-1 rounded-full ${issue.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                      {issue.message}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* STEP 1: GENERAL INFO - Mission Control Hub */}
            {currentStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between gap-6 pt-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[24px] bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                      <Settings2 size={32} className="relative z-10 group-hover:rotate-90 transition-transform duration-700" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Конфігурація рейсу</h2>
                      <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.3em] font-bold mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Базові параметри маршруту
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:block">
                     <div className="bg-[#0B1221] px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
                        <div className="text-right">
                           <p className="text-[8px] text-[#5A6A85] font-black uppercase tracking-widest">Статус заповнення</p>
                           <p className="text-[12px] text-white font-black uppercase tracking-tight">Готовий до аналізу</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                           <Zap size={20} />
                        </div>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left side: Smart AI Input */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#0B1221] rounded-[40px] p-8 border-2 border-white/5 flex flex-col h-full shadow-2xl relative overflow-hidden group min-h-[450px]">
                      <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-700 group-hover:scale-110">
                        <Zap size={180} className="text-blue-500 fill-blue-500" />
                      </div>
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-3">
                          <Zap size={16} className="fill-blue-500" /> SMART ANALYZER
                        </h3>
                        <p className="text-[10px] text-[#5A6A85] mb-6 font-bold uppercase tracking-widest leading-relaxed">Вставте опис рейсу для миттєвого автозаповнення параметрів</p>
                        
                        <div className="flex-1 relative group/text">
                          <textarea 
                            value={smartInputStep1}
                            onChange={(e) => setSmartInputStep1(e.target.value)}
                            className="w-full h-full bg-black/40 border-2 border-white/5 rounded-[32px] p-6 text-white font-medium text-[12px] leading-relaxed outline-none focus:border-blue-500/30 focus:bg-black/60 transition-all placeholder-slate-700 resize-none shadow-inner"
                            placeholder="Наприклад: Одеса-Краків, Пн-Ср-Пт, Neoplan, 45 місць, Wi-Fi, Туалет..."
                          />
                          <div className="absolute bottom-4 right-6 text-[9px] font-black text-slate-800 uppercase tracking-widest">Buffer ready</div>
                        </div>

                        <motion.button 
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSmartParseStep1}
                          className="w-full mt-6 bg-blue-600 text-white hover:bg-blue-500 py-6 rounded-[28px] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_-10px_rgba(59,130,246,0.4)] flex items-center justify-center gap-3"
                        >
                          <RefreshCcw size={18} className={smartInputStep1 ? 'animate-spin-slow' : ''} />
                          АНАЛІЗУВАТИ ДАНІ
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Manual Tuning */}
                  <div className="lg:col-span-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Column 1: Core Specs */}
                      <div className="space-y-8">
                        <div className="group">
                          <label className="text-[10px] text-[#5A6A85] font-black uppercase tracking-[0.2em] block mb-3 ml-2">Назва маршруту</label>
                          <div className="relative">
                            <input 
                              value={trip.routeName}
                              onChange={(e) => setTrip({...trip, routeName: e.target.value})}
                              placeholder="Наприклад: Одеса — Салерно"
                              className="w-full bg-[#0B1221] border-2 border-white/5 rounded-[24px] px-8 py-5 text-[14px] text-white font-bold outline-none focus:border-blue-500/50 focus:bg-[#0F172A] transition-all shadow-xl placeholder-slate-800"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500/30 group-focus-within:bg-blue-500 transition-colors" />
                          </div>
                        </div>

                        {activeRole !== 'carrier' && (
                          <div className="group">
                            <label className="text-[10px] text-[#5A6A85] font-black uppercase tracking-[0.2em] block mb-3 ml-2">Вибір перевізника</label>
                            <div className="relative">
                              <select 
                                value={trip.operator}
                                onChange={(e) => setTrip({...trip, operator: e.target.value})}
                                className="w-full bg-[#0B1221] border-2 border-white/5 rounded-[24px] px-8 py-5 text-[14px] text-white font-bold outline-none focus:border-blue-500/50 appearance-none cursor-pointer transition-all"
                              >
                                <option value="" className="bg-[#0B1221]">Оберіть зі списку</option>
                                {carriers.map(c => (
                                  <option key={c.uid} value={`${c.uid}::${c.companyName || c.email}`} className="bg-[#0B1221] text-white">
                                    {c.companyName || c.email}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-hover:text-blue-500 transition-colors" size={20} />
                            </div>
                          </div>
                        )}

                        <div className="group">
                          <label className="text-[10px] text-[#5A6A85] font-black uppercase tracking-[0.2em] block mb-3 ml-2">Кількість місць</label>
                          <div className="relative flex items-center">
                            <div className="absolute left-8 text-blue-500">
                              <Users size={20} />
                            </div>
                            <input 
                              type="text"
                              inputMode="numeric"
                              value={trip.seats || ''}
                              onChange={(e) => setTrip({...trip, seats: parseInt(e.target.value.replace(/\D/g, '')) || 0})}
                              className="w-full bg-[#0B1221] border-2 border-white/5 rounded-[24px] pl-16 pr-8 py-5 text-[14px] text-white font-bold outline-none focus:border-blue-500/50 transition-all"
                              placeholder="0"
                            />
                            <div className="absolute right-8 text-[10px] font-black text-slate-700 uppercase">МIСЦЬ</div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#5A6A85] font-black uppercase tracking-[0.2em] block mb-3 ml-2">Тип рейсу</label>
                          <div className="flex p-2 bg-[#0B1221] rounded-[24px] border-2 border-white/5 gap-2">
                            <button
                              onClick={() => setTrip({...trip, isTransfer: false, transferType: 'direct'})}
                              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!trip.isTransfer ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-[#5A6A85] hover:text-slate-300'}`}
                            >
                              Прямий
                            </button>
                            <button
                              onClick={() => setTrip({...trip, isTransfer: true, transferType: 'transfer'})}
                              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${trip.isTransfer ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-[#5A6A85] hover:text-slate-300'}`}
                            >
                              Пересадка
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Amenities & Logic */}
                      <div className="space-y-8">
                        <div>
                          <label className="text-[10px] text-[#5A6A85] font-black uppercase tracking-[0.2em] block mb-3 ml-2">Комфорт на борту</label>
                          <div className="grid grid-cols-2 gap-3">
                            {AMENITIES_CONFIG.map(amenity => {
                              const isSelected = trip.amenities.includes(amenity.id);
                              return (
                                <motion.button
                                  key={amenity.id}
                                  whileHover={{ y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setTrip(prev => ({
                                      ...prev,
                                      amenities: isSelected 
                                        ? prev.amenities.filter(a => a !== amenity.id)
                                        : [...prev.amenities, amenity.id]
                                    }));
                                  }}
                                  className={`flex items-center gap-3 px-5 py-4 rounded-[20px] border-2 text-[10px] font-black uppercase tracking-tight transition-all relative overflow-hidden group ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-[#0B1221] border-white/5 text-slate-500 hover:border-white/20'}`}
                                >
                                  {isSelected && <div className="absolute top-0 right-0 p-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /></div>}
                                  <amenity.icon size={18} strokeWidth={isSelected ? 3 : 2} className={isSelected ? 'text-white' : 'text-slate-700 group-hover:text-blue-500 transition-colors'} /> 
                                  <span className="truncate">{amenity.label}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-[#0B1221]/60 p-8 rounded-[40px] border-2 border-white/5 shadow-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-6 opacity-[0.02]">
                             <TrendingUp size={80} />
                           </div>
                           <div className="relative z-10">
                              <div className="flex items-center justify-between mb-8">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                   <Zap size={14} className="text-blue-500 fill-blue-500" /> Тарифи та знижки
                                </h4>
                                <button 
                                  onClick={addCustomDiscount}
                                  className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                                  title="Додати свій тариф"
                                >
                                  <Plus size={20} />
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-3">
                                {[
                                  { id: 'child04', label: 'Діти до 4 років', desc: 'Знижка 50%', state: trip.discounts.child04 },
                                  { id: 'child412', label: 'Діти 4-12 років', desc: 'Знижка 30%', state: trip.discounts.child412 }
                                ].map((d) => (
                                  <button
                                    key={d.id}
                                    onClick={() => setTrip(prev => ({ ...prev, discounts: { ...prev.discounts, [d.id]: !prev.discounts[d.id] } }))}
                                    className={`p-5 rounded-[24px] border-2 transition-all flex items-center justify-between group ${d.state ? 'bg-blue-600/10 border-blue-600' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                                  >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${trip.discounts.child04 ? 'bg-[#00E5FF] border-[#00E5FF]' : 'border-[#1A2639]'}`}>
                              {trip.discounts.child04 && <CheckCircle size={14} className="text-black" strokeWidth={4} />}
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setTrip(prev => ({ ...prev, discounts: { ...prev.discounts, child412: !prev.discounts.child412 } }))}
                            className={`p-5 rounded-[24px] border transition-all flex items-center justify-between group active:scale-95 ${trip.discounts.child412 ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 shadow-[0_0_20px_rgba(0,229,255,0.05)]' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                          >
                            <div className="text-left">
                              <p className={`text-[12px] font-black tracking-tight ${trip.discounts.child412 ? 'text-[#00E5FF]' : 'text-white'}`}>Діти 4-12 років</p>
                              <p className="text-[9px] text-[#5A6A85] uppercase font-black tracking-widest mt-0.5">Знижка 30%</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${trip.discounts.child412 ? 'bg-[#00E5FF] border-[#00E5FF]' : 'border-[#1A2639]'}`}>
                              {trip.discounts.child412 && <CheckCircle size={14} className="text-black" strokeWidth={4} />}
                            </div>
                          </button>
                        </div>

                        {trip.customDiscounts.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                             {trip.customDiscounts.map((discount) => (
                               <div key={discount.id} className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5 group hover:border-[#00E5FF]/20 transition-all">
                                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#5A6A85] shrink-0">
                                     <Tag size={14} />
                                  </div>
                                  <input 
                                    value={discount.label}
                                    onChange={(e) => updateCustomDiscount(discount.id, { label: e.target.value })}
                                    placeholder="Назва тарифу (н-р: Пенсійний)"
                                    className="flex-1 bg-transparent border-none text-[12px] text-white font-bold outline-none placeholder-[#3A4A65]"
                                  />
                                  <div className="flex items-center gap-2 bg-[#0B1221] px-4 py-2 rounded-xl border border-white/5">
                                    <input 
                                      type="text"
                                      value={discount.value === 0 ? '' : discount.value}
                                      onChange={(e) => updateCustomDiscount(discount.id, { value: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                                      className="w-8 bg-transparent border-none text-[12px] text-[#00E5FF] font-black text-center outline-none"
                                      placeholder="0"
                                    />
                                    <span className="text-[10px] text-[#5A6A85] font-black">%</span>
                                  </div>
                                  <button onClick={() => removeCustomDiscount(discount.id)} className="text-[#5A6A85] hover:text-red-500 transition-colors p-2">
                                    <Trash2 size={16} />
                                  </button>
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SCHEDULE (ТУДИ ТА НАЗАД) - Redesigned Timeline */}
            {currentStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Графік маршруту</h2>
                    <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] font-bold">Налаштуйте зупинки та дні виїзду для обох напрямків</p>
                  </div>
                  <button 
                    onClick={generateReturnStops}
                    className="group bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00E5FF] hover:text-black transition-all active:scale-95 flex items-center gap-2 shadow-lg"
                  >
                    <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                    Авто-реверс (Туди → Назад)
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  {/* Outbound Column */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <ArrowRight size={18} /> Україна → Європа
                      </h3>
                      <div className="flex items-center gap-1 bg-[#0B1221] p-1 rounded-xl border border-white/5">
                        {DAYS_OF_WEEK.map(day => {
                          const isSelected = trip.outbound.days.includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => toggleDay('outbound', day)}
                              className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all ${isSelected ? 'bg-blue-500 text-white shadow-lg' : 'text-[#5A6A85] hover:bg-white/5'}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="bg-[#0B1221]/50 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 space-y-6 shadow-2xl">
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <h4 className="text-[9px] font-black text-[#5A6A85] uppercase mb-3 tracking-widest flex items-center gap-2">
                          <Sparkles size={12} className="text-blue-400" /> РОЗУМНИЙ ІМПОРТ
                        </h4>
                        <textarea 
                          value={smartInput}
                          onChange={(e) => setSmartInput(e.target.value)}
                          placeholder="Вставте розклад одним текстом..."
                          className="w-full h-24 bg-transparent border-none text-[10px] text-[#8899B5] outline-none resize-none font-mono placeholder-[#2A3A55] leading-relaxed"
                        />
                        <button 
                          onClick={handleSmartParse}
                          className="w-full mt-2 bg-blue-500/10 text-blue-400 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                        >
                          ОБРОБИТИ ТЕКСТ
                        </button>
                      </div>

                      <div className="space-y-6 relative">
                         {trip.outbound.stops.length > 0 && (
                            <div className="absolute left-[19px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-blue-500/50 via-blue-500/10 to-blue-500/50" />
                         )}
                         
                        <Reorder.Group 
                          axis="y" 
                          values={trip.outbound.stops} 
                          onReorder={(newStops) => handleReorder('outbound', newStops)}
                          className="space-y-4"
                        >
                          {trip.outbound.stops.map((stop, idx) => (
                            <Reorder.Item key={stop.id} value={stop} className="relative z-10">
                              <div className="flex gap-4 items-start group">
                                <div className="flex flex-col items-center mt-5">
                                   <div className="w-10 h-10 rounded-full bg-[#0B1221] border-2 border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl group-hover:border-blue-500 transition-all">
                                      <MapPin size={14} />
                                   </div>
                                </div>
                                <div className="flex-1 bg-black/30 border border-white/5 p-4 rounded-2xl group-hover:border-blue-500/30 transition-all">
                                  <div className="flex items-center gap-3 mb-3">
                                    <input 
                                      value={stop.city} 
                                      onChange={(e) => updateStop('outbound', stop.id, { city: e.target.value })}
                                      className="flex-1 bg-transparent text-sm font-black text-white outline-none placeholder-[#2A3A55]"
                                      placeholder="Місто"
                                    />
                                    <div className="flex items-center gap-2 bg-[#0B1221] rounded-lg px-3 py-1.5 border border-white/5">
                                      <Clock size={12} className="text-blue-400" />
                                      <input 
                                        type="time" 
                                        value={stop.time} 
                                        onChange={(e) => updateStop('outbound', stop.id, { time: e.target.value })}
                                        className="text-[10px] text-white bg-transparent outline-none w-[55px] font-black"
                                      />
                                    </div>
                                    <button onClick={() => removeStop('outbound', stop.id)} className="text-[#5A6A85] hover:text-red-500 transition-all p-1"><Trash2 size={14}/></button>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                                      <Navigation size={10} className="text-[#5A6A85]" />
                                      <input 
                                        value={stop.address}
                                        onChange={(e) => updateStop('outbound', stop.id, { address: e.target.value })}
                                        className="w-full bg-transparent text-[10px] text-[#8899B5] outline-none font-bold"
                                        placeholder="Адреса зупинки..."
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                                      <span className="text-[8px] text-[#5A6A85] font-black uppercase">День</span>
                                      <input 
                                        type="text"
                                        value={stop.dayOffset || 0}
                                        onChange={(e) => updateStop('outbound', stop.id, { dayOffset: parseInt(e.target.value) || 0 })}
                                        className="text-[10px] text-blue-400 bg-transparent outline-none w-4 font-black text-center"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                        <button onClick={() => addStop('outbound')} className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black text-[#5A6A85] uppercase tracking-widest hover:border-blue-500/30 hover:text-blue-400 transition-all">+ Додати нову зупинку</button>
                      </div>
                    </div>
                  </div>

                  {/* Inbound Column */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <ArrowLeft size={18} /> Європа → Україна
                      </h3>
                      <div className="flex items-center gap-1 bg-[#0B1221] p-1 rounded-xl border border-white/5">
                        {DAYS_OF_WEEK.map(day => {
                          const isSelected = trip.inbound.days.includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => toggleDay('inbound', day)}
                              className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-lg' : 'text-[#5A6A85] hover:bg-white/5'}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-[#0B1221]/50 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 space-y-6 shadow-2xl">
                       {/* Reverse Helper */}
                       <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[24px] flex flex-col items-center justify-center text-center group cursor-pointer" onClick={generateReturnStops}>
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                             <RefreshCcw size={20} />
                          </div>
                          <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Використати авто-реверс</p>
                          <p className="text-[9px] text-[#5A6A85] font-bold mt-1 max-w-[200px]">Система автоматично створить зворотний маршрут з ваших зупинок</p>
                       </div>

                      <div className="space-y-6 relative">
                         {trip.inbound.stops.length > 0 && (
                            <div className="absolute left-[19px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-emerald-500/50 via-emerald-500/10 to-emerald-500/50" />
                         )}
                         
                        <Reorder.Group 
                          axis="y" 
                          values={trip.inbound.stops} 
                          onReorder={(newStops) => handleReorder('inbound', newStops)}
                          className="space-y-4"
                        >
                          {trip.inbound.stops.map((stop, idx) => (
                            <Reorder.Item key={stop.id} value={stop} className="relative z-10">
                              <div className="flex gap-4 items-start group">
                                <div className="flex flex-col items-center mt-5">
                                   <div className="w-10 h-10 rounded-full bg-[#0B1221] border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl group-hover:border-emerald-500 transition-all">
                                      <MapPin size={14} />
                                   </div>
                                </div>
                                <div className="flex-1 bg-black/30 border border-white/5 p-4 rounded-2xl group-hover:border-emerald-500/30 transition-all">
                                  <div className="flex items-center gap-3 mb-3">
                                    <input 
                                      value={stop.city} 
                                      onChange={(e) => updateStop('inbound', stop.id, { city: e.target.value })}
                                      className="flex-1 bg-transparent text-sm font-black text-white outline-none placeholder-[#2A3A55]"
                                      placeholder="Місто"
                                    />
                                    <div className="flex items-center gap-2 bg-[#0B1221] rounded-lg px-3 py-1.5 border border-white/5">
                                      <Clock size={12} className="text-emerald-400" />
                                      <input 
                                        type="time" 
                                        value={stop.time} 
                                        onChange={(e) => updateStop('inbound', stop.id, { time: e.target.value })}
                                        className="text-[10px] text-white bg-transparent outline-none w-[55px] font-black"
                                      />
                                    </div>
                                    <button onClick={() => removeStop('inbound', stop.id)} className="text-[#5A6A85] hover:text-red-500 transition-all p-1"><Trash2 size={14}/></button>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                                      <Navigation size={10} className="text-[#5A6A85]" />
                                      <input 
                                        value={stop.address}
                                        onChange={(e) => updateStop('inbound', stop.id, { address: e.target.value })}
                                        className="w-full bg-transparent text-[10px] text-[#8899B5] outline-none font-bold"
                                        placeholder="Адреса зупинки..."
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                                      <span className="text-[8px] text-[#5A6A85] font-black uppercase">День</span>
                                      <input 
                                        type="text"
                                        value={stop.dayOffset || 0}
                                        onChange={(e) => updateStop('inbound', stop.id, { dayOffset: parseInt(e.target.value) || 0 })}
                                        className="text-[10px] text-emerald-400 bg-transparent outline-none w-4 font-black text-center"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                        <button onClick={() => addStop('inbound')} className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black text-[#5A6A85] uppercase tracking-widest hover:border-emerald-500/30 hover:text-emerald-400 transition-all">+ Додати нову зупинку</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SEGMENTS & PRICING - Redesigned */}
            {currentStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] border border-[#00E5FF]/20 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                      <Coins size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Налаштування цін</h2>
                      <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] font-bold">Тарифікація маршруту та керування курсом валют</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-[#0B1221] p-1.5 rounded-2xl border border-white/5 shadow-xl">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[8px] text-[#5A6A85] uppercase font-black tracking-widest mb-0.5">Поточний курс</p>
                      <p className="text-sm font-black text-[#00E5FF]">1 EUR = {exchangeRate} UAH</p>
                    </div>
                    <button 
                      onClick={() => expandAllCities(!Array.from(expandedPricingCities).length)}
                      className="px-6 py-2 bg-[#00E5FF] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all active:scale-95"
                    >
                      {Array.from(expandedPricingCities).length > 0 ? 'Згорнути все' : 'Розгорнути все'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left: Smart Pricing Import */}
                  <div className="lg:col-span-4">
                    <div className="bg-[#0B1221]/80 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
                      <h3 className="text-[10px] font-black text-[#00E5FF] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles size={14} className="text-[#00E5FF]" /> РОЗУМНА ЦІНА
                      </h3>
                      <p className="text-[10px] text-[#5A6A85] mb-4 font-bold leading-relaxed">Вставте список міст та цін (наприклад: "Львів 1500, Краків 50"), і система оновить все автоматично.</p>
                      <textarea 
                        value={smartPriceInput}
                        onChange={(e) => setSmartPriceInput(e.target.value)}
                        placeholder="Львів 2000&#10;Берлін 100..."
                        className="w-full h-40 bg-white/5 border border-white/5 rounded-2xl p-4 text-[#8899B5] resize-none font-mono text-[10px] leading-relaxed outline-none focus:border-[#00E5FF]/30 transition-all"
                      />
                      <button 
                        onClick={handleSmartPriceParse}
                        className="w-full mt-4 bg-white/5 text-[#00E5FF] border border-[#00E5FF]/20 hover:bg-[#00E5FF] hover:text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        ОНОВИТИ ПРАЙС
                      </button>
                    </div>
                  </div>

                  {/* Right: Detailed Pricing Grid */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Outbound Column (UAH) */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                          <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Виїзд (ГРИВНЯ)</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {Object.entries(
                            allSegments.filter(s => s.currency === 'ГРН').reduce((acc, s) => {
                              if (!acc[s.to]) acc[s.to] = [];
                              acc[s.to].push(s);
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([city, citySegments]) => {
                            const isExpanded = expandedPricingCities.has(`out-${city}`);
                            return (
                              <div key={`out-${city}`} className={`rounded-[24px] border transition-all duration-300 ${isExpanded ? 'bg-white/[0.03] border-blue-500/30 shadow-2xl' : 'bg-[#0B1221] border-white/5 hover:border-white/10'}`}>
                                <button 
                                  onClick={() => togglePricingCity(`out-${city}`)}
                                  className="w-full flex items-center justify-between p-4"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-blue-500 text-white' : 'bg-white/5 text-[#5A6A85]'}`}>
                                      <MapPin size={14} />
                                    </div>
                                    <span className="text-[12px] font-black text-white uppercase tracking-tight">{city}</span>
                                    <span className="text-[10px] text-[#5A6A85] font-bold">({citySegments.length})</span>
                                  </div>
                                  <ChevronDown size={16} className={`text-[#5A6A85] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-400' : ''}`} />
                                </button>
                                
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-4">
                                        {citySegments.map((seg, idx) => (
                                          <div key={`${seg.from}-${idx}`} className="flex items-center justify-between bg-black/40 px-4 py-3 rounded-xl border border-white/5 group hover:border-blue-500/20 transition-all">
                                            <span className="text-[10px] font-black text-[#5A6A85] uppercase tracking-widest group-hover:text-white transition-all">{seg.from}</span>
                                            <div className="flex items-center gap-2 bg-[#0B1221] rounded-lg px-3 py-1.5 border border-white/5">
                                              <input 
                                                type="number"
                                                value={seg.price || ''}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                  const newVal = parseInt(e.target.value) || 0;
                                                  const mirrVal = Math.round(newVal / exchangeRate);
                                                  const mirrorKey = `${seg.to.toLowerCase()}_${seg.from.toLowerCase()}`;
                                                  setPriceMemory(prev => ({ ...prev, [seg.key]: newVal, [mirrorKey]: mirrVal }));
                                                  setTrip(prev => ({
                                                    ...prev,
                                                    outbound: { ...prev.outbound, stops: prev.outbound.stops.map(s => (s.city === seg.to ? { ...s, price: newVal } : s)) },
                                                    inbound: { ...prev.inbound, stops: prev.inbound.stops.map(s => (s.city === seg.to ? { ...s, price: mirrVal } : s)) }
                                                  }));
                                                }}
                                                className="bg-transparent w-20 text-xs font-black text-[#00E5FF] outline-none text-right"
                                              />
                                              <span className="text-[10px] font-black text-[#00E5FF]/40 uppercase">грн</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Inbound Column (EUR) */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Назад (ЄВРО)</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {Object.entries(
                            allSegments.filter(s => s.currency === 'EUR').reduce((acc, s) => {
                              if (!acc[s.to]) acc[s.to] = [];
                              acc[s.to].push(s);
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([city, citySegments]) => {
                            const isExpanded = expandedPricingCities.has(`in-${city}`);
                            return (
                              <div key={`in-${city}`} className={`rounded-[24px] border transition-all duration-300 ${isExpanded ? 'bg-white/[0.03] border-emerald-500/30 shadow-2xl' : 'bg-[#0B1221] border-white/5 hover:border-white/10'}`}>
                                <button 
                                  onClick={() => togglePricingCity(`in-${city}`)}
                                  className="w-full flex items-center justify-between p-4"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-emerald-500 text-white' : 'bg-white/5 text-[#5A6A85]'}`}>
                                      <MapPin size={14} />
                                    </div>
                                    <span className="text-[12px] font-black text-white uppercase tracking-tight">{city}</span>
                                    <span className="text-[10px] text-[#5A6A85] font-bold">({citySegments.length})</span>
                                  </div>
                                  <ChevronDown size={16} className={`text-[#5A6A85] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-400' : ''}`} />
                                </button>
                                
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-4">
                                        {citySegments.map((seg, idx) => (
                                          <div key={`${seg.from}-${idx}`} className="flex items-center justify-between bg-black/40 px-4 py-3 rounded-xl border border-white/5 group hover:border-emerald-500/20 transition-all">
                                            <span className="text-[10px] font-black text-[#5A6A85] uppercase tracking-widest group-hover:text-white transition-all">{seg.from}</span>
                                            <div className="flex items-center gap-2 bg-[#0B1221] rounded-lg px-3 py-1.5 border border-white/5">
                                              <input 
                                                type="number"
                                                value={seg.price || ''}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                  const newVal = parseInt(e.target.value) || 0;
                                                  const mirrVal = Math.round(newVal * exchangeRate);
                                                  const mirrorKey = `${seg.to.toLowerCase()}_${seg.from.toLowerCase()}`;
                                                  setPriceMemory(prev => ({ ...prev, [seg.key]: newVal, [mirrorKey]: mirrVal }));
                                                  setTrip(prev => ({
                                                    ...prev,
                                                    inbound: { ...prev.inbound, stops: prev.inbound.stops.map(s => (s.city === seg.to ? { ...s, price: newVal } : s)) },
                                                    outbound: { ...prev.outbound, stops: prev.outbound.stops.map(s => (s.city === seg.to ? { ...s, price: mirrVal } : s)) }
                                                  }));
                                                }}
                                                className="bg-transparent w-20 text-xs font-black text-emerald-400 outline-none text-right"
                                              />
                                              <span className="text-[10px] font-black text-emerald-400/40 uppercase">eur</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PREVIEW - Digital Ticket Visual */}
            {currentStep === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between gap-6 pt-6">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Попередній перегляд</h2>
                    <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] font-bold">Перевірте всі дані перед публікацією рейсу</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0B1221] px-4 py-2 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Готово до запуску</span>
                  </div>
                </div>

                <div id="full-preview-area" className="bg-[#F8FAFC] rounded-[48px] text-[#0F172A] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  {/* Ticket Header Decor */}
                  <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />
                  <div className="absolute top-10 right-[-50px] w-[200px] h-[200px] bg-blue-500/5 rounded-full blur-3xl" />
                  
                  <div className="p-10 md:p-16">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16 pb-12 border-b border-slate-200/60">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{trip.operator}</span>
                          {trip.isTransfer && <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Транзитний рейс</span>}
                        </div>
                        <h2 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase leading-none mb-4">{trip.routeName}</h2>
                        <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl text-slate-600"><Bus size={14} className="text-blue-600" /> {trip.seats} Місць</span>
                          <div className="flex gap-3 items-center bg-slate-100 px-4 py-2 rounded-2xl">
                            {trip.amenities.map(a => {
                              const cfg = AMENITIES_CONFIG.find(c => c.id === a);
                              return cfg?.icon && <cfg.icon key={a} size={14} className="text-blue-500" />;
                            })}
                            <span className="text-slate-600 ml-1">Зручності</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border-2 border-slate-100 p-6 rounded-[32px] shadow-sm flex flex-col items-center justify-center min-w-[140px]">
                         <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                            <QrCode size={32} className="text-slate-300" />
                         </div>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                      {/* Outbound Timeline */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-10">
                          <h3 className="text-sm font-black uppercase text-blue-600 tracking-[0.2em] flex items-center gap-3">
                            <ArrowRight size={20} /> ВИЇЗД В ЄВРОПУ
                          </h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Σ {getTotalDuration(trip.outbound.stops)}</span>
                             <button onClick={() => autoCalculateDayOffsets('outbound')} className="p-2 hover:bg-blue-50 rounded-xl text-blue-400 transition-colors"><RefreshCcw size={14}/></button>
                          </div>
                        </div>
                        
                        <div className="relative pl-12 space-y-12">
                          <div className="absolute left-[20px] top-4 bottom-4 w-[2px] bg-dashed border-l-2 border-slate-200" />
                          {trip.outbound.stops.map((stop, idx) => (
                            <div key={stop.id} className="relative group">
                              <div className={`absolute -left-[45px] top-1 w-11 h-11 rounded-2xl border-4 border-white flex items-center justify-center shadow-md transition-all group-hover:scale-110 z-10 ${idx === 0 ? 'bg-emerald-500 text-white' : idx === trip.outbound.stops.length - 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {idx === 0 ? <MapPin size={18} /> : idx === trip.outbound.stops.length - 1 ? <Navigation size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                              </div>
                              <div className="flex items-center justify-between gap-6">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-black text-[#0F172A] text-xl uppercase tracking-tighter">{stop.city}</h4>
                                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg uppercase">{getDayName('outbound', stop.dayOffset)}</span>
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stop.address}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-2xl font-black text-[#0F172A] tabular-nums tracking-tighter">{stop.time}</p>
                                   {idx > 0 && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">День {stop.dayOffset || 0}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Inbound Timeline */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-10">
                          <h3 className="text-sm font-black uppercase text-emerald-600 tracking-[0.2em] flex items-center gap-3">
                            <ArrowLeft size={20} /> ПОВЕРНЕННЯ В УКРАЇНУ
                          </h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Σ {getTotalDuration(trip.inbound.stops)}</span>
                             <button onClick={() => autoCalculateDayOffsets('inbound')} className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-400 transition-colors"><RefreshCcw size={14}/></button>
                          </div>
                        </div>
                        
                        <div className="relative pl-12 space-y-12">
                          <div className="absolute left-[20px] top-4 bottom-4 w-[2px] bg-dashed border-l-2 border-slate-200" />
                          {trip.inbound.stops.map((stop, idx) => (
                            <div key={stop.id} className="relative group">
                              <div className={`absolute -left-[45px] top-1 w-11 h-11 rounded-2xl border-4 border-white flex items-center justify-center shadow-md transition-all group-hover:scale-110 z-10 ${idx === 0 ? 'bg-emerald-500 text-white' : idx === trip.inbound.stops.length - 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {idx === 0 ? <MapPin size={18} /> : idx === trip.inbound.stops.length - 1 ? <Navigation size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                              </div>
                              <div className="flex items-center justify-between gap-6">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-black text-[#0F172A] text-xl uppercase tracking-tighter">{stop.city}</h4>
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase">{getDayName('inbound', stop.dayOffset)}</span>
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stop.address}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-2xl font-black text-[#0F172A] tabular-nums tracking-tighter">{stop.time}</p>
                                   {idx > 0 && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">День {stop.dayOffset || 0}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price Summary Section */}
                    <div className="mt-20 pt-16 border-t-2 border-dashed border-slate-200 relative">
                       <div className="absolute -left-[16px] top-[-16px] w-8 h-8 bg-[#0B1221] rounded-full" />
                       <div className="absolute -right-[16px] top-[-16px] w-8 h-8 bg-[#0B1221] rounded-full" />
                       
                       <div className="flex items-center gap-4 mb-10">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                             <Coins size={20} />
                          </div>
                          <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">Тарифікація маршруту</h3>
                       </div>

                       <div className="bg-slate-50 rounded-[32px] p-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             {allSegments.slice(0, 8).map((seg, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                   <div className="flex items-center justify-between mb-2">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{seg.from} →</span>
                                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{seg.currency}</span>
                                   </div>
                                   <div className="flex items-baseline justify-between">
                                      <span className="text-sm font-black text-[#0F172A] uppercase">{seg.to}</span>
                                      <span className="text-lg font-black text-[#0F172A]">{seg.price}</span>
                                   </div>
                                </div>
                             ))}
                             {allSegments.length > 8 && (
                                <div className="bg-slate-200/50 p-4 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center">
                                   <span className="text-[10px] font-black text-slate-500 uppercase">Ще {allSegments.length - 8} напрямків...</span>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: RULES - Mission Control Selection */}
            {currentStep === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between gap-6 pt-6">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Правила перевезень</h2>
                    <p className="text-[10px] text-[#5A6A85] uppercase tracking-[0.2em] font-bold">Оберіть умови, які будуть відображатися пасажиру в квитку</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0B1221] px-4 py-2 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Обрано: {trip.rules.length + trip.customRules.length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRESET_RULES.map((rule, idx) => {
                    const isSelected = trip.rules.includes(rule);
                    return (
                      <motion.button 
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => toggleRule(rule)}
                        className={`text-left p-6 rounded-[24px] border-2 transition-all flex gap-5 relative overflow-hidden group ${isSelected ? 'bg-blue-600/10 border-blue-500 shadow-[0_15px_40px_-15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'}`}
                      >
                         <div className={`mt-1 w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800/50 text-slate-600 group-hover:text-slate-400'}`}>
                           <CheckCircle size={14} strokeWidth={isSelected ? 4 : 2} />
                         </div>
                         <p className={`text-[12px] leading-relaxed font-bold tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                           {rule}
                         </p>
                         {isSelected && (
                           <div className="absolute top-0 right-0 p-1">
                             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                           </div>
                         )}
                      </motion.button>
                    )
                  })}
                </div>

                <div className="bg-[#0B1221] rounded-[32px] p-8 border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                    <FileText size={120} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                     <div>
                        <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-3">
                          <PlusCircle size={18} className="text-blue-500" /> Власні правила
                        </h3>
                        <p className="text-[9px] text-[#5A6A85] uppercase tracking-widest font-bold mt-1">Додайте специфічні умови для вашого рейсу</p>
                     </div>
                     <button 
                       onClick={addCustomRule}
                       className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-2xl text-[10px] text-white font-black uppercase hover:bg-blue-500 transition-all shadow-[0_10px_20px_-5px_rgba(59,130,246,0.3)]"
                     >
                       <Plus size={14} /> Додати правило
                     </button>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <AnimatePresence mode="popLayout">
                      {trip.customRules.map((rule, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex gap-4 group"
                        >
                          <div className="flex-1 relative">
                            <textarea 
                              value={rule}
                              onChange={(e) => updateCustomRule(idx, e.target.value)}
                              className="w-full bg-black/40 border-2 border-white/5 rounded-2xl p-4 text-[12px] text-white outline-none focus:border-blue-500 focus:bg-black/60 transition-all min-h-[80px] font-medium leading-relaxed resize-none"
                              placeholder="Наприклад: Багаж понад 20кг оплачується додатково..."
                            />
                            <div className="absolute bottom-3 right-3 text-[9px] font-black text-slate-700 uppercase">{rule.length} / 250</div>
                          </div>
                          <button 
                            onClick={() => removeCustomRule(idx)}
                            className="self-center p-3 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {trip.customRules.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[24px]">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-700">
                          <FileText size={20} />
                        </div>
                        <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Немає власних правил</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: EXPORT/SYNC - Mission Control Success */}
            {currentStep === 6 && (
              <motion.div 
                key="step6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10"
              >
                <div className="bg-[#0B1221] rounded-[48px] p-12 text-center border border-white/5 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)]">
                   {/* Background Glow */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                   <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]" />

                   <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                    className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(59,130,246,0.5)] rotate-6"
                   >
                    <CheckCircle2 size={48} className="text-white" />
                   </motion.div>

                   <h2 className="text-4xl font-black text-white uppercase mb-4 tracking-tighter leading-none">Маршрут сформовано!</h2>
                   <p className="text-[#5A6A85] text-sm mb-12 max-w-sm mx-auto uppercase tracking-widest font-bold">Ваш маршрут готовий до експорту або синхронізації з системою</p>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                     <motion.button 
                       whileHover={{ y: -5 }}
                       onClick={downloadPDF}
                       disabled={isSaving}
                       className="flex items-center justify-center gap-5 bg-white/5 border-2 border-white/5 hover:border-white/20 hover:bg-white/10 text-white p-6 rounded-[32px] transition-all group relative overflow-hidden"
                     >
                       <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                         <FileDown size={24} className="text-blue-500" />
                       </div>
                       <div className="text-left">
                         <span className="block text-[10px] uppercase text-[#5A6A85] font-black tracking-widest mb-1">Документація</span>
                         <span className="text-lg font-black tracking-tight">Скачати PDF</span>
                       </div>
                     </motion.button>

                     <motion.button 
                       whileHover={{ y: -5 }}
                       onClick={() => setCurrentStep(7)}
                       className="flex items-center justify-center gap-5 bg-blue-600 text-white p-6 rounded-[32px] hover:bg-blue-500 transition-all group relative overflow-hidden shadow-[0_20px_40px_rgba(59,130,246,0.3)]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <div className="w-14 h-14 bg-black/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ChevronRight size={28} />
                        </div>
                        <div className="text-left">
                          <span className="block text-[10px] uppercase text-white/50 font-black tracking-widest mb-1">Завершення</span>
                          <span className="text-lg font-black tracking-tight">Фінальний крок</span>
                        </div>
                     </motion.button>
                   </div>

                   <div className="mt-16 pt-12 border-t border-white/5">
                     <button 
                       onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                       className="flex items-center gap-6 mx-auto bg-white/[0.02] p-5 rounded-[32px] border-2 border-white/5 hover:border-blue-500/30 transition-all group"
                     >
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isArchiveOpen ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-800/50 text-[#5A6A85]'}`}>
                         <FolderOpen size={24} />
                       </div>
                       <div className="text-left pr-4">
                         <h4 className="text-white font-black text-sm uppercase tracking-tight">Сховище квитків</h4>
                         <p className="text-[10px] text-[#5A6A85] uppercase font-bold tracking-widest mt-1">Доступно {allSegments.length} напрямків</p>
                       </div>
                       <ChevronDown size={20} className={`text-slate-600 transition-transform duration-500 ${isArchiveOpen ? 'rotate-180' : ''}`} />
                     </button>
                   </div>
                </div>

                <AnimatePresence>
                  {isArchiveOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {allSegments.map((seg, idx) => {
                          const isForward = seg.currency === 'ГРН';
                          return (
                            <motion.div 
                              key={idx}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white rounded-[32px] p-6 shadow-2xl relative overflow-hidden group"
                            >
                              <div className={`absolute top-0 left-0 w-full h-1.5 ${isForward ? 'bg-blue-600' : 'bg-emerald-500'}`} />
                              
                              <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isForward ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {isForward ? 'UA → EU' : 'EU → UA'}
                                  </span>
                                  <h4 className="text-base font-black text-[#0F172A] uppercase flex items-center gap-2">
                                    {seg.from} <ArrowRight size={12} className="text-slate-300" /> {seg.to}
                                  </h4>
                                </div>
                                <div className="text-right">
                                   <div className="text-lg font-black text-[#0F172A] leading-none">{seg.price.toLocaleString()}</div>
                                   <span className="text-[9px] font-black text-[#5A6A85] uppercase">{seg.currency}</span>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                      <Clock size={14} />
                                   </div>
                                   <span className="text-[10px] font-black text-[#0F172A]">КВИТОК #{idx + 100}</span>
                                </div>
                                <button className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors">
                                   <Eye size={14} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* STEP 7: FINAL SAVE - Immersive Terminal */}
            {currentStep === 7 && (
              <motion.div 
                key="step7"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-10"
              >
                <div className="bg-[#0B1221] rounded-[56px] p-16 text-center border-4 border-white/5 relative overflow-hidden shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)]">
                  {/* Visual Decor */}
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
                  <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
                  
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-28 h-28 bg-gradient-to-br from-blue-600 to-blue-400 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-[0_25px_60px_-15px_rgba(59,130,246,0.6)] rotate-3"
                  >
                    <Save size={56} className="text-white" />
                  </motion.div>
                  
                  <h2 className="text-5xl font-black text-white uppercase mb-6 tracking-tighter leading-none">Готово до збереження</h2>
                  <p className="text-[#5A6A85] text-base mb-16 max-w-md mx-auto uppercase tracking-widest font-bold leading-relaxed">
                    Підтвердіть створення маршруту для завершення процесу налаштування
                  </p>

                  <div className="max-w-md mx-auto relative z-10">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={syncToSupabase}
                      disabled={isSaving}
                      className={`w-full group relative overflow-hidden bg-white text-[#0B1221] py-8 rounded-[36px] font-black text-2xl uppercase tracking-tighter shadow-[0_30px_70px_rgba(255,255,255,0.1)] hover:shadow-[0_40px_100px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-6 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCcw size={32} className="animate-spin text-blue-600" />
                          <span className="animate-pulse">Зберігаємо...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={32} className="text-blue-600" />
                          <span>Завершити та зберегти</span>
                        </>
                      )}
                    </motion.button>
                    
                    <div className="mt-10 flex items-center justify-center gap-4 text-[11px] font-black text-[#5A6A85] uppercase tracking-[0.3em]">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      СИСТЕМА ГОТОВА ДО ІНТЕГРАЦІЇ
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pr-2">
                  {[
                    { icon: Layout, title: 'Портал перевізника', desc: 'Рейс з\'явиться у пошуку', color: 'text-blue-400' },
                    { icon: FileText, title: 'Відомість пасажирів', desc: 'Генерація списків', color: 'text-cyan-400' },
                    { icon: Zap, title: 'BUSNET API', desc: 'Миттєва синхронізація', color: 'text-emerald-400' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#0B1221] p-8 rounded-[40px] border border-white/5 hover:border-white/10 transition-all group">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <item.icon size={28} className={item.color} />
                      </div>
                      <h4 className="text-white font-black text-sm uppercase tracking-tight mb-2">{item.title}</h4>
                      <p className="text-[10px] text-[#5A6A85] uppercase font-bold tracking-widest">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Wizard Navigation - Premium Control Deck */}
          <div className="sticky bottom-6 z-50 mt-12 mb-8 w-full max-w-4xl mx-auto px-4">
            <div className="bg-[#0B1221]/80 backdrop-blur-2xl p-3 rounded-[32px] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex justify-between items-center relative overflow-hidden group/footer">
              {/* Progress Glow Line */}
              <div className="absolute bottom-0 left-0 h-[3px] bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${(currentStep / 7) * 100}%` }} />
              
              <motion.button 
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black text-[#5A6A85] hover:text-white disabled:opacity-10 transition-all uppercase tracking-[0.2em] group/back"
              >
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover/back:bg-white/10 transition-colors">
                  <ChevronLeft size={18} />
                </div>
                <span className="hidden sm:inline">Назад</span>
              </motion.button>

              <div className="flex flex-col items-center">
                 <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Архiтектор</div>
                 <div className="flex gap-1.5">
                    {[1,2,3,4,5,6,7].map(s => (
                       <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${s === currentStep ? 'bg-blue-500 w-6 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : s < currentStep ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                    ))}
                 </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className={`flex items-center gap-4 px-10 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden ${currentStep === 7 ? 'bg-emerald-500 text-white shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)]' : 'bg-blue-600 text-white shadow-[0_15px_30px_-5px_rgba(59,130,246,0.4)] hover:bg-blue-500'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/footer:translate-x-full transition-transform duration-1500" />
                <span>{currentStep === 7 ? 'Завершити' : 'Наступний'}</span>
                <div className="w-8 h-8 rounded-xl bg-black/10 flex items-center justify-center">
                  {currentStep === 7 ? <Save size={18} /> : <ChevronRight size={18} />}
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-10 bg-black/80 border-t border-white/5 px-6 flex items-center justify-between text-[10px] text-slate-600 uppercase tracking-[4px] font-bold shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> СИСТЕМА: СТАБІЛЬНА</span>
          <span className="opacity-40">|</span>
          <span className="text-slate-700 text-[8px] tracking-normal">КУРС: 1 EUR = {exchangeRate} ГРН</span>
        </div>
        <div className="hidden sm:flex gap-8">
          <span>З'єднання: Зашифровано</span>
          <span>Затримка: 8МС</span>
        </div>
      </footer>

          <AnimatePresence>
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => {
                const container = document.getElementById('scroll-area');
                if (container) {
                  container.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="fixed bottom-20 right-6 w-14 h-14 bg-[#00e5ff] text-[#0a0b10] shadow-[0_0_30px_rgba(0,229,255,0.5)] rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border border-[#00e5ff]/50"
              title="Нагору"
            >
              <ArrowDownToLine size={28} className="rotate-180 group-hover:-translate-y-1 transition-transform" />
            </motion.button>
          </AnimatePresence>
    </div>
  );
}
