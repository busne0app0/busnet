/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
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
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../supabase/config';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// --- Types ---
type Amenity = 'wifi' | 'ac' | 'toilet' | 'usb' | 'coffee';

interface Stop {
  id: string;
  city: string;
  address: string;
  time: string;
  price: number;
  dayOffset: number;
}

interface TripState {
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
    const saved = localStorage.getItem('busnet_trip_draft');
    const defaults: TripState = {
      routeName: '',
      operator: '',
      seats: 50,
      amenities: ['wifi', 'ac'],
      isTransfer: false,
      transferType: 'direct',
      currency: 'ГРН',
      discounts: {
        child04: false,
        child412: false
      },
      customDiscounts: [],
      rules: [],
      customRules: [],
      outbound: {
        stops: [],
        days: ['ПТ']
      },
      inbound: {
        stops: [],
        days: ['НД']
      }
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) {
        console.error("Failed to parse saved trip", e);
      }
    }
    return defaults;
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

  const resetApp = () => {
    localStorage.removeItem('busnet_trip_draft');
    localStorage.removeItem('busnet_current_step');
    window.location.reload();
  };

  const [smartInput, setSmartInput] = useState('');
  const [smartPriceInput, setSmartPriceInput] = useState('');
  const [smartInputStep1, setSmartInputStep1] = useState('');
  const [priceMemory, setPriceMemory] = useState<Record<string, number>>({});
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
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
      const segments = getAllSegments();
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

  useEffect(() => {
    const calculateForType = (type: 'outbound' | 'inbound') => {
      const stops = trip[type].stops;
      if (stops.length < 2) return;
      
      let currentOffset = 0;
      let hasChanges = false;
      const newStops = stops.map((stop, idx) => {
        if (idx === 0) {
          if (stop.dayOffset !== 0) {
            hasChanges = true;
            return { ...stop, dayOffset: 0 };
          }
          return stop;
        }

        const prevTime = stops[idx - 1].time;
        const currTime = stop.time;
        
        if (prevTime && currTime) {
          const [ph, pm] = prevTime.split(':').map(Number);
          const [ch, cm] = currTime.split(':').map(Number);
          
          const prevTotalMinutes = ph * 60 + pm;
          const currTotalMinutes = ch * 60 + cm;

          // If current time is earlier than previous, it's next day
          // Or if it's the same time, we assume same day unless specifically marked
          if (currTotalMinutes < prevTotalMinutes) {
            currentOffset += 1;
          }

          // Gap-preserving logic: If current stop has a higher offset than calculated, 
          // assume it was manually set or parsed and update our tracker.
          if (stop.dayOffset > currentOffset) {
            currentOffset = stop.dayOffset;
          }
        }
        
        if (stop.dayOffset !== currentOffset) {
          hasChanges = true;
          return { ...stop, dayOffset: currentOffset };
        }
        return stop;
      });

      if (hasChanges) {
        setTrip(prev => ({
          ...prev,
          [type]: { ...prev[type], stops: newStops }
        }));
      }
    };

    // Use a small timeout to avoid immediate recursive loops during state batching
    const timer = setTimeout(() => {
      calculateForType('outbound');
      calculateForType('inbound');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [JSON.stringify(trip.outbound.stops.map(s => s.time)), JSON.stringify(trip.inbound.stops.map(s => s.time))]);

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
        outbound: trip.outbound,
        inbound: trip.inbound,
        status: 'active'
      };

      const { error } = await supabase.from('routes').insert(routeData);

      if (error) throw error;

      toast.success('Маршрут успішно збережено!');
      localStorage.removeItem('busnet_trip_draft');
      localStorage.removeItem('busnet_current_step');
      
      // Повертаємось на дашборд
      setTimeout(() => {
        navigate(`/${activeRole}/`);
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

  const autoCalculateDayOffsets = (type: 'outbound' | 'inbound') => {
    setTrip(prev => {
      const stops = [...prev[type].stops];
      if (stops.length === 0) return prev;

      let currentOffset = 0;
      const updatedStops = stops.map((stop, idx) => {
        if (idx === 0) {
          return { ...stop, dayOffset: 0 };
        }
        
        const prevTime = stops[idx - 1].time;
        const currTime = stop.time;
        
        if (prevTime && currTime) {
          const [ph, pm] = prevTime.split(':').map(Number);
          const [ch, cm] = currTime.split(':').map(Number);
          
          if ((ch * 60 + cm) < (ph * 60 + pm)) {
            currentOffset += 1;
          }
        }
        
        return { ...stop, dayOffset: currentOffset };
      });

      return {
        ...prev,
        [type]: { ...prev[type], stops: updatedStops }
      };
    });
  };

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
      customDiscounts: [...prev.customDiscounts, { id: crypto.randomUUID(), label: '', value: 0 }]
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
    const stops = type === 'outbound' ? trip.outbound.stops : trip.inbound.stops;
    const lastStop = stops[stops.length - 1];
    const newStop: Stop = {
      id: crypto.randomUUID(),
      city: '',
      address: '',
      time: '12:00',
      dayOffset: lastStop ? lastStop.dayOffset : 0,
      price: lastStop ? lastStop.price : 0
    };
    setTrip(prev => ({
      ...prev,
      [type]: { ...prev[type], stops: [...prev[type].stops, newStop] }
    }));
  };

  const removeStop = (type: 'outbound' | 'inbound', id: string) => {
    setTrip(prev => ({
      ...prev,
      [type]: { ...prev[type], stops: prev[type].stops.filter(s => s.id !== id) }
    }));
  };

  const insertStop = (type: 'outbound' | 'inbound', index: number) => {
    const newStop: Stop = {
      id: crypto.randomUUID(),
      city: '',
      address: '',
      time: '',
      price: 0,
      dayOffset: 0
    };
    setTrip(prev => {
      const newStops = [...prev[type].stops];
      newStops.splice(index, 0, newStop);
      return {
        ...prev,
        [type]: { ...prev[type], stops: newStops }
      };
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
      [type]: { ...prev[type], stops: prev[type].stops.map(s => s.id === id ? { ...s, ...updates } : s) }
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
      id: crypto.randomUUID(),
      time: '', // Clear times as outbound times are not valid for inbound
      dayOffset: 0,
      price: trip.currency === 'ГРН' ? Math.round(s.price / exchangeRate) : Math.round(s.price * exchangeRate)
    }));
    
    setTrip(prev => ({
      ...prev,
      inbound: { ...prev.inbound, stops: reversed }
    }));
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

  const getAllSegments = () => {
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
  };

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

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 7));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="flex flex-col font-sans h-full bg-[#030712] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <header className="h-14 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-xl shrink-0 z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#00e5ff] to-[#016f7c] flex items-center justify-center shadow-lg shadow-[#00e5ff]/10">
            <Bus className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-black text-white italic tracking-tighter leading-none">
              BUSNET<span className="text-[#00e5ff]">/</span>SMART
            </h1>
            <p className="text-[7px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mt-0.5">Route Architect v3.0</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(step => {
            const hasConflict = conflicts.some(c => c.step === step);
            const severity = hasConflict && conflicts.find(c => c.step === step)?.severity === 'error' ? 'error' : 'warning';

            return (
              <button 
                key={step} 
                onClick={() => setCurrentStep(step)}
                className="flex items-center group cursor-pointer relative"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${currentStep === step ? 'bg-[#00e5ff] text-[#0a0b10] glow-cyan' : currentStep > step ? 'bg-green-500 text-white' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                  {currentStep > step ? <CheckCircle2 size={16} /> : step}
                </div>

                {hasConflict && (
                  <div className={`absolute -top-1 -right-px w-3 h-3 rounded-full flex items-center justify-center shadow-lg z-10 ${severity === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}>
                    <AlertCircle size={8} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-2 md:px-4 py-1.5 rounded-full border border-white/10">
            <span className="text-[8px] text-slate-500 font-bold uppercase whitespace-nowrap">EUR:</span>
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
              className="bg-transparent border-none outline-none text-xs text-[#00e5ff] font-bold w-10 md:w-12"
            />
          </div>

          {conflicts.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
              <AlertCircle size={10} className="text-red-400" />
              <span className="text-[8px] md:text-[9px] font-black text-red-300 uppercase tracking-wider">{conflicts.length}</span>
            </div>
          )}
          
          <button 
            onClick={() => {
              if (window.confirm('Ви впевнені, що хочете очистити всі дані? Це дію неможливо скасувати.')) {
                resetApp();
              }
            }}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-500 hover:text-red-400 transition-all active:scale-95"
            title="Очистити чернетку"
          >
            <RefreshCcw size={18} />
            <span className="hidden lg:inline text-[9px] font-black uppercase tracking-wider">Скинути</span>
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
            {/* STEP 1: GENERAL INFO */}
            {currentStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="immersive-card p-6">
                  <h2 className="text-sm font-black text-[#00e5ff] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Settings2 size={16} /> Основна Інформація
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    {/* Smart Input for Step 1 */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="bg-black/20 p-4 md:p-5 rounded-2xl border border-white/5">
                        <h3 className="text-[10px] font-bold text-[#00e5ff] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Zap size={14} className="fill-[#00e5ff]" /> Швидке заповнення
                        </h3>
                        <textarea 
                          value={smartInputStep1}
                          onChange={(e) => setSmartInputStep1(e.target.value)}
                          placeholder="Вставте текст для назви та перевізника..."
                          className="w-full h-32 md:h-40 bg-transparent border-none focus:ring-0 text-slate-300 placeholder-slate-600 resize-none font-mono text-[11px] leading-relaxed outline-none"
                        />
                        <button 
                          onClick={handleSmartParseStep1}
                          className="w-full mt-2 bg-[#00e5ff]/10 text-[#00e5ff] py-3 rounded-xl text-[10px] font-black uppercase hover:bg-[#00e5ff] hover:text-black transition-all active:scale-95"
                        >
                          Витягнути дані
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1 px-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Назва рейсу</label>
                            <div className="group/hint relative">
                              <HelpCircle size={14} className="text-slate-600 cursor-help" />
                              <div className="absolute bottom-full mb-2 right-0 w-48 p-2 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-medium invisible group-hover/hint:visible opacity-0 group-hover/hint:opacity-100 transition-all z-50 shadow-2xl leading-tight">
                                Наприклад: <span className="text-[#00e5ff]">Київ — Варшава</span>. Це заголовок маршруту в кабінеті.
                              </div>
                            </div>
                          </div>
                          <input 
                            value={trip.routeName}
                            onChange={(e) => setTrip({...trip, routeName: e.target.value})}
                            placeholder="Місто - Місто"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-[#00e5ff]/50 transition-colors"
                          />
                        </div>
                        <div className={`grid ${activeRole === 'carrier' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                          {activeRole !== 'carrier' && (
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider px-1">Призначити Перевізника</label>
                              <select 
                                value={trip.operator}
                                onChange={(e) => setTrip({...trip, operator: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-[#00e5ff]/50 transition-colors appearance-none"
                              >
                                <option value="" className="bg-slate-900">Оберіть перевізника</option>
                                {carriers.map(c => (
                                  <option key={c.uid} value={`${c.uid}::${c.companyName || c.email}`} className="bg-slate-900 text-white">
                                    {c.companyName || c.email}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider px-1">Кількість місць</label>
                            <input 
                              type="text"
                              inputMode="numeric"
                              value={trip.seats || ''}
                              onChange={(e) => setTrip({...trip, seats: parseInt(e.target.value.replace(/\D/g, '')) || 0})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-[#00e5ff]/50 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] text-slate-500 font-bold uppercase block mb-2">Переваги</label>
                          <div className="grid grid-cols-2 gap-2">
                            {AMENITIES_CONFIG.map(amenity => (
                              <button
                                key={amenity.id}
                                onClick={() => {
                                  setTrip(prev => ({
                                    ...prev,
                                    amenities: prev.amenities.includes(amenity.id) 
                                      ? prev.amenities.filter(a => a !== amenity.id)
                                      : [...prev.amenities, amenity.id]
                                  }));
                                }}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] font-bold transition-all ${trip.amenities.includes(amenity.id) ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 text-[#00e5ff]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                              >
                                <amenity.icon size={14} /> {amenity.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pt-2 space-y-6">
                          <div>
                            <label className="text-[9px] text-slate-500 font-bold uppercase block mb-2">Тип рейсу</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setTrip({...trip, isTransfer: false, transferType: 'direct'})}
                                className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${!trip.isTransfer ? 'bg-[#00e5ff] text-[#0a0b10] border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                              >
                                Прямий рейс
                              </button>
                              <button
                                onClick={() => setTrip({...trip, isTransfer: true, transferType: 'transfer'})}
                                className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${trip.isTransfer ? 'bg-[#00e5ff] text-[#0a0b10] border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                              >
                                Можлива пересадка
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[9px] text-slate-500 font-bold uppercase block">Система знижок</label>
                              <button 
                                onClick={addCustomDiscount}
                                className="text-[8px] font-black text-[#00e5ff] uppercase flex items-center gap-1 hover:opacity-80"
                              >
                                + Додати власну знижку
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setTrip(prev => ({ ...prev, discounts: { ...prev.discounts, child04: !prev.discounts.child04 } }))}
                                className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${trip.discounts.child04 ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 text-[#00e5ff]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                              >
                                <span>Дітям до 4 р.</span>
                                <span className="text-[8px] opacity-70 underline decoration-[#00e5ff]/30">-50% ЗНИЖКА</span>
                              </button>
                              <button
                                onClick={() => setTrip(prev => ({ ...prev, discounts: { ...prev.discounts, child412: !prev.discounts.child412 } }))}
                                className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${trip.discounts.child412 ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 text-[#00e5ff]' : 'bg-white/5 border-white/5 text-slate-500'}`}
                              >
                                <span>Дітям 4-12 р.</span>
                                <span className="text-[8px] opacity-70 underline decoration-[#00e5ff]/30">-30% ЗНИЖКА</span>
                              </button>
                            </div>
                            
                            <div className="mt-3 space-y-2">
                              {trip.customDiscounts.map((discount) => (
                                <div key={discount.id} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-1">
                                  <input 
                                    placeholder="Назва знижки (напр. Студент)"
                                    value={discount.label}
                                    onChange={(e) => updateCustomDiscount(discount.id, { label: e.target.value })}
                                    className="flex-1 bg-transparent text-[10px] text-white outline-none font-bold placeholder:text-slate-600"
                                  />
                                  <div className="flex items-center gap-1 bg-black/40 rounded px-2 py-1">
                                    <input 
                                      type="text"
                                      inputMode="numeric"
                                      value={discount.value === 0 ? '' : discount.value}
                                      onChange={(e) => updateCustomDiscount(discount.id, { value: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                                      className="bg-transparent text-[#00e5ff] text-xs font-black outline-none w-8 text-center"
                                    />
                                    <span className="text-[10px] text-[#00e5ff] font-black">%</span>
                                  </div>
                                  <button 
                                    onClick={() => removeCustomDiscount(discount.id)}
                                    className="text-slate-700 hover:text-red-500 transition-colors p-1"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SCHEDULE (ТУДИ ТА НАЗАД) - SIDE-BY-SIDE */}
            {currentStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Налаштування графіку</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Налаштуйте зупинки та дні виїзду для обох напрямків</p>
                  </div>
                  <button 
                    onClick={generateReturnStops}
                    className="bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-[#00e5ff] hover:text-black transition-all active:scale-95"
                  >
                    Авто-реверс (Туди → Назад)
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Outbound Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[12px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <ArrowRight size={14} /> Україна → Європа
                      </h3>
                    </div>
                    
                    <div className="immersive-card p-4 space-y-4">
                      <div className="flex flex-wrap gap-1.5 p-3 bg-black/20 rounded-xl border border-white/5">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day}
                            onClick={() => toggleDay('outbound', day)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${trip.outbound.days.includes(day) ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 text-slate-600'}`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>

                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <h4 className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                          <Sparkles size={10} /> Розумний ввід тексту
                        </h4>
                        <textarea 
                          value={smartInput}
                          onChange={(e) => setSmartInput(e.target.value)}
                          placeholder="Вставте текст розкладу..."
                          className="w-full h-24 bg-transparent border-none text-[10px] text-white outline-none resize-none font-mono placeholder:text-slate-700"
                        />
                        <button 
                          onClick={handleSmartParse}
                          className="w-full mt-2 bg-blue-500/10 text-blue-400 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all"
                        >
                          Парсити дані
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Зупинки ({trip.outbound.stops.length})</span>
                          <button onClick={() => addStop('outbound')} className="text-[#00e5ff] text-[9px] font-black uppercase hover:underline">+ Додати</button>
                        </div>
                        
                        <Reorder.Group 
                          axis="y" 
                          values={trip.outbound.stops} 
                          onReorder={(newStops) => handleReorder('outbound', newStops)}
                          className="space-y-3"
                        >
                          {trip.outbound.stops.map((stop, idx) => (
                            <Reorder.Item key={stop.id} value={stop} className="relative group">
                              <div className="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/5 hover:border-blue-500/20 transition-all">
                                <div className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-blue-500 p-1">
                                  <GripVertical size={14} />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      value={stop.city || ''} 
                                      onChange={(e) => updateStop('outbound', stop.id, { city: e.target.value })}
                                      className="flex-1 bg-transparent text-xs font-bold text-white outline-none border-b border-white/5 focus:border-blue-500 py-0.5"
                                      placeholder="Місто"
                                    />
                                    <div className="flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5 border border-white/5">
                                      <Clock size={10} className="text-slate-500" />
                                      <input 
                                        type="time" 
                                        value={stop.time || '12:00'} 
                                        onChange={(e) => updateStop('outbound', stop.id, { time: e.target.value })}
                                        className="text-[10px] text-white bg-transparent outline-none w-[55px] font-bold"
                                      />
                                    </div>
                                    <button onClick={() => removeStop('outbound', stop.id)} className="text-slate-700 hover:text-red-500 transition-colors p-1"><Trash2 size={12}/></button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-1.5 bg-black/20 rounded-lg px-2 py-0.5 border border-white/5">
                                      <MapPin size={10} className="text-slate-600" />
                                      <input 
                                        value={stop.address || ''}
                                        onChange={(e) => updateStop('outbound', stop.id, { address: e.target.value })}
                                        className="w-full bg-transparent text-[9px] text-slate-500 outline-none placeholder:text-slate-700"
                                        placeholder="Адреса..."
                                      />
                                    </div>
                                    <div className="flex items-center gap-1 bg-black/20 rounded px-1.5 py-0.5 border border-white/5">
                                      <span className="text-[8px] text-slate-600 font-bold">ДН</span>
                                      <input 
                                        type="text"
                                        inputMode="numeric"
                                        value={stop.dayOffset || 0}
                                        onChange={(e) => updateStop('outbound', stop.id, { dayOffset: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                                        className="text-[10px] text-blue-400 bg-transparent outline-none w-4 font-black text-center"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-center -my-1.5 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                                <button 
                                  onClick={() => insertStop('outbound', idx + 1)}
                                  className="bg-blue-500 text-white rounded-full p-1 hover:scale-125 transition-all"
                                >
                                  <Plus size={8} strokeWidth={3} />
                                </button>
                              </div>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </div>
                    </div>
                  </div>

                  {/* Inbound Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[12px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <ArrowLeft size={14} /> Європа → Україна
                      </h3>
                    </div>

                    <div className="immersive-card p-4 space-y-4">
                      <div className="flex flex-wrap gap-1.5 p-3 bg-black/20 rounded-xl border border-white/5">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day}
                            onClick={() => toggleDay('inbound', day)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${trip.inbound.days.includes(day) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-600'}`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center flex flex-col items-center justify-center min-h-[80px]">
                           <RefreshCcw size={20} className="text-slate-700 mb-2" />
                           <p className="text-[9px] text-slate-600 uppercase font-black">Спробуйте авто-реверс для економії часу</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Зупинки ({trip.inbound.stops.length})</span>
                          <button onClick={() => addStop('inbound')} className="text-[#00e5ff] text-[9px] font-black uppercase hover:underline">+ Додати</button>
                        </div>
                        
                        <Reorder.Group 
                          axis="y" 
                          values={trip.inbound.stops} 
                          onReorder={(newStops) => handleReorder('inbound', newStops)}
                          className="space-y-3"
                        >
                          {trip.inbound.stops.map((stop, idx) => (
                            <Reorder.Item key={stop.id} value={stop} className="relative group">
                              <div className="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all">
                                <div className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-emerald-500 p-1">
                                  <GripVertical size={14} />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      value={stop.city || ''} 
                                      onChange={(e) => updateStop('inbound', stop.id, { city: e.target.value })}
                                      className="flex-1 bg-transparent text-xs font-bold text-white outline-none border-b border-white/5 focus:border-emerald-500 py-0.5"
                                      placeholder="Місто"
                                    />
                                    <div className="flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5 border border-white/5">
                                      <Clock size={10} className="text-slate-500" />
                                      <input 
                                        type="time" 
                                        value={stop.time || '12:00'} 
                                        onChange={(e) => updateStop('inbound', stop.id, { time: e.target.value })}
                                        className="text-[10px] text-white bg-transparent outline-none w-[55px] font-bold"
                                      />
                                    </div>
                                    <button onClick={() => removeStop('inbound', stop.id)} className="text-slate-700 hover:text-red-500 transition-colors p-1"><Trash2 size={12}/></button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-1.5 bg-black/20 rounded-lg px-2 py-0.5 border border-white/5">
                                      <MapPin size={10} className="text-slate-600" />
                                      <input 
                                        value={stop.address || ''}
                                        onChange={(e) => updateStop('inbound', stop.id, { address: e.target.value })}
                                        className="w-full bg-transparent text-[9px] text-slate-500 outline-none placeholder:text-slate-700"
                                        placeholder="Адреса..."
                                      />
                                    </div>
                                    <div className="flex items-center gap-1 bg-black/20 rounded px-1.5 py-0.5 border border-white/5">
                                      <span className="text-[8px] text-slate-600 font-bold">ДН</span>
                                      <input 
                                        type="text"
                                        inputMode="numeric"
                                        value={stop.dayOffset || 0}
                                        onChange={(e) => updateStop('inbound', stop.id, { dayOffset: parseInt(e.target.value.replace(/\D/g, '')) || 0 })}
                                        className="text-[10px] text-emerald-400 bg-transparent outline-none w-4 font-black text-center"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-center -my-1.5 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                                <button 
                                  onClick={() => insertStop('inbound', idx + 1)}
                                  className="bg-emerald-500 text-white rounded-full p-1 hover:scale-125 transition-all"
                                >
                                  <Plus size={8} strokeWidth={3} />
                                </button>
                              </div>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SEGMENTS & PRICING (ВАРІАЦІЇ) */}
            {currentStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="immersive-card p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    <div className="lg:col-span-4">
                      <div className="bg-black/20 p-4 md:p-5 rounded-2xl border border-white/5 lg:sticky lg:top-24">
                        <h3 className="text-[10px] font-bold text-[#00e5ff] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Zap size={14} className="fill-[#00e5ff]" /> Розумна ціна
                        </h3>
                        <p className="text-[9px] text-slate-500 mb-4 leading-relaxed">
                          Вставте блок тексту з ціною (напр. "Кассіно ... 8160грн"). Система сама визначить місто та напрямок.
                        </p>
                        <textarea 
                          value={smartPriceInput}
                          onChange={(e) => setSmartPriceInput(e.target.value)}
                          placeholder="Місто... ціна..."
                          className="w-full h-32 md:h-40 bg-transparent border-none focus:ring-0 text-slate-300 placeholder-slate-600 resize-none font-mono text-[11px] leading-relaxed outline-none"
                        />
                        <button 
                          onClick={handleSmartPriceParse}
                          className="w-full mt-2 bg-[#00e5ff]/10 text-[#00e5ff] py-3 rounded-xl text-[10px] font-black uppercase hover:bg-[#00e5ff] hover:text-black transition-all active:scale-95"
                        >
                          Оновити ціну
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-8">
                      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <h2 className="text-sm font-black text-[#00e5ff] uppercase tracking-widest flex items-center gap-2">
                              <Coins size={16} /> Тарифікація (UA ↔ EU)
                          </h2>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase">Редагування за містами призначення</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => expandAllCities(!Array.from(expandedPricingCities).length)}
                            className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-all"
                          >
                            {Array.from(expandedPricingCities).length > 0 ? 'Згорнути все' : 'Розгорнути все'}
                          </button>
                          <div className="text-[10px] font-black text-slate-600 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest">
                            Курс: {exchangeRate}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Outbound Column */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Виїзд (ГРН)</h3>
                          </div>
                          {Object.entries(
                            getAllSegments().filter(s => s.currency === 'ГРН').reduce((acc, s) => {
                              if (!acc[s.to]) acc[s.to] = [];
                              acc[s.to].push(s);
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([city, citySegments]) => (
                            <div key={`out-${city}`} className={`rounded-2xl border transition-all ${expandedPricingCities.has(`out-${city}`) ? 'bg-white/[0.03] border-blue-500/20 shadow-lg shadow-blue-500/5' : 'bg-white/5 border-white/5'}`}>
                              <button 
                                onClick={() => togglePricingCity(`out-${city}`)}
                                className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors text-left"
                              >
                                <span className="text-[11px] font-black text-white uppercase tracking-tight flex items-center gap-2">
                                  <MapPin size={10} className={expandedPricingCities.has(`out-${city}`) ? "text-blue-400" : "text-blue-500"} /> {city}
                                  <span className="text-[9px] text-slate-600 font-medium">({citySegments.length})</span>
                                </span>
                                <motion.div animate={{ rotate: expandedPricingCities.has(`out-${city}`) ? 0 : -90 }}>
                                  <ChevronDown size={14} className="text-slate-600" />
                                </motion.div>
                              </button>
                              
                              {expandedPricingCities.has(`out-${city}`) && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="px-3 pb-3 space-y-1.5 border-t border-white/5 pt-3"
                                >
                                  {citySegments.map((seg, idx) => (
                                    <div key={`${seg.from}-${idx}`} className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group/item">
                                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight group-hover/item:text-white">{seg.from}</span>
                                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1 border border-white/5">
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
                                          className="bg-transparent w-16 text-[11px] font-black text-[#00e5ff] outline-none text-right"
                                        />
                                        <span className="text-[8px] font-bold text-[#00e5ff]/40">₴</span>
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Inbound Column */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Назад (EUR)</h3>
                          </div>
                          {Object.entries(
                            getAllSegments().filter(s => s.currency === 'EUR').reduce((acc, s) => {
                              if (!acc[s.to]) acc[s.to] = [];
                              acc[s.to].push(s);
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([city, citySegments]) => (
                            <div key={`in-${city}`} className={`rounded-2xl border transition-all ${expandedPricingCities.has(`in-${city}`) ? 'bg-white/[0.03] border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-white/5 border-white/5'}`}>
                              <button 
                                onClick={() => togglePricingCity(`in-${city}`)}
                                className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors text-left"
                              >
                                <span className="text-[11px] font-black text-white uppercase tracking-tight flex items-center gap-2">
                                  <MapPin size={10} className={expandedPricingCities.has(`in-${city}`) ? "text-emerald-400" : "text-emerald-500"} /> {city}
                                  <span className="text-[9px] text-slate-600 font-medium">({citySegments.length})</span>
                                </span>
                                <motion.div animate={{ rotate: expandedPricingCities.has(`in-${city}`) ? 0 : -90 }}>
                                  <ChevronDown size={14} className="text-slate-600" />
                                </motion.div>
                              </button>
                              
                              {expandedPricingCities.has(`in-${city}`) && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="px-3 pb-3 space-y-1.5 border-t border-white/5 pt-3"
                                >
                                  {citySegments.map((seg, idx) => (
                                    <div key={`${seg.from}-${idx}`} className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group/item">
                                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight group-hover/item:text-white">{seg.from}</span>
                                      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1 border border-white/5">
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
                                          className="bg-transparent w-12 text-[11px] font-black text-[#00e5ff] outline-none text-right"
                                        />
                                        <span className="text-[8px] font-bold text-[#00e5ff]/40">€</span>
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PREVIEW (OLD STEP 5) */}
            {currentStep === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div id="full-preview-area" className="bg-white rounded-[40px] p-8 text-black shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-700 via-cyan-500 to-blue-700"></div>
                  
                      <div className="flex justify-between items-start mb-12">
                        <div>
                          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-2">{trip.routeName}</h2>
                          <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full">{trip.operator}</span>
                            <span className="flex items-center gap-1"><Bus size={12} /> {trip.seats} Місць</span>
                            <div className="flex gap-2 items-center">
                              {trip.amenities.map(a => {
                                const cfg = AMENITIES_CONFIG.find(c => c.id === a);
                                return cfg?.icon && <cfg.icon key={a} size={12} className="text-blue-500" />;
                              })}
                            </div>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl border text-center ${trip.isTransfer ? 'bg-yellow-50 border-yellow-100' : 'bg-blue-50 border-blue-100'}`}>
                          <span className={`text-[8px] font-black uppercase block mb-0.5 ${trip.isTransfer ? 'text-yellow-600' : 'text-blue-600'}`}>
                            {trip.isTransfer ? 'Транзит' : 'Статус'}
                          </span>
                          <span className="text-xs font-bold text-gray-900">
                            {trip.isTransfer ? 'Рейс з пересадкою' : 'Прямий рейс'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Outbound */}
                        <div>
                          <div 
                            onClick={() => togglePreviewSection('outbound')}
                            className="flex items-center justify-between mb-6 cursor-pointer hover:opacity-70 transition-opacity"
                          >
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: previewCollapsed.outbound ? -90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown size={16} className="text-blue-600" />
                              </motion.div>
                              <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Виїзд (Туда)</h3>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => autoCalculateDayOffsets('outbound')}
                                className="p-1 hover:bg-blue-50 rounded-full text-blue-400 hover:text-blue-600 transition-colors"
                                title="Перерахувати час"
                              >
                                <RefreshCcw size={10} />
                              </button>
                              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">Σ {getTotalDuration(trip.outbound.stops)}</span>
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {!previewCollapsed.outbound && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="relative pl-6 space-y-8 border-l border-gray-100 pb-4">
                                  {trip.outbound.stops.map((stop, idx) => (
                                    <div key={stop.id} className="relative">
                                      <div className={`absolute -left-[30px] top-1 w-3 h-3 rounded-full border-2 border-white shadow ${idx === 0 ? 'bg-green-500' : idx === trip.outbound.stops.length - 1 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                      <div className="flex items-baseline justify-between gap-4">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-black text-gray-900 text-sm uppercase">{stop.city}</h4>
                                            <span className="text-[9px] font-black text-blue-400">{getDayName('outbound', stop.dayOffset)}</span>
                                          </div>
                                          <span className="text-[10px] text-gray-400 block truncate max-w-[150px]">{stop.address}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-950 tabular-nums">{stop.time}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Inbound */}
                        <div>
                          <div 
                            onClick={() => togglePreviewSection('inbound')}
                            className="flex items-center justify-between mb-6 cursor-pointer hover:opacity-70 transition-opacity"
                          >
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: previewCollapsed.inbound ? -90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown size={16} className="text-blue-600" />
                              </motion.div>
                              <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Назад (Reverse)</h3>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => autoCalculateDayOffsets('inbound')}
                                className="p-1 hover:bg-blue-50 rounded-full text-blue-400 hover:text-blue-600 transition-colors"
                                title="Перерахувати час"
                              >
                                <RefreshCcw size={10} />
                              </button>
                              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">Σ {getTotalDuration(trip.inbound.stops)}</span>
                            </div>
                          </div>

                          <AnimatePresence>
                            {!previewCollapsed.inbound && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="relative pl-6 space-y-8 border-l border-gray-100 pb-4">
                                  {trip.inbound.stops.map((stop, idx) => (
                                    <div key={stop.id} className="relative">
                                      <div className={`absolute -left-[30px] top-1 w-3 h-3 rounded-full border-2 border-white shadow ${idx === 0 ? 'bg-red-500' : idx === trip.inbound.stops.length - 1 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                      <div className="flex items-baseline justify-between gap-4">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-black text-gray-900 text-sm uppercase">{stop.city}</h4>
                                            <span className="text-[9px] font-black text-blue-400">{getDayName('inbound', stop.dayOffset)}</span>
                                          </div>
                                          <span className="text-[10px] text-gray-400 block truncate max-w-[150px]">{stop.address}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-950 tabular-nums">{stop.time}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Price Table Section in Preview */}
                      {getAllSegments().length > 0 && (
                        <div className="mt-12 pt-8 border-t border-gray-100">
                           <div 
                             onClick={() => togglePreviewSection('pricing')}
                             className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-70 transition-opacity"
                           >
                            <motion.div
                              animate={{ rotate: previewCollapsed.pricing ? -90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown size={14} className="text-blue-600" />
                            </motion.div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Тарифікація проїзду:</span>
                          </div>

                          <AnimatePresence>
                            {!previewCollapsed.pricing && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                  {/* Outbound Prices Filtered */}
                                  <div>
                                     <h4 className="text-[9px] font-black text-blue-600 uppercase mb-3 bg-blue-50 px-2 py-1 rounded inline-block">↔ Вартість Туди (ГРН)</h4>
                                     <div className="space-y-2">
                                       {getAllSegments().filter(s => s.currency === 'ГРН').map(seg => (
                                         <div key={`${seg.from}-${seg.to}-${seg.currency}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded px-2 transition-colors">
                                            <span className="text-[10px] font-bold text-gray-700">{seg.from} — {seg.to}</span>
                                            <span className="text-xs font-black text-gray-900">{seg.price.toLocaleString()} ГРН</span>
                                         </div>
                                       ))}
                                     </div>
                                  </div>
                                  {/* Inbound Prices Filtered */}
                                  <div>
                                     <h4 className="text-[9px] font-black text-emerald-600 uppercase mb-3 bg-emerald-50 px-2 py-1 rounded inline-block">↔ Вартість Назад (EUR)</h4>
                                     <div className="space-y-2">
                                       {getAllSegments().filter(s => s.currency === 'EUR').map(seg => (
                                         <div key={`${seg.from}-${seg.to}-${seg.currency}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded px-2 transition-colors">
                                            <span className="text-[10px] font-bold text-gray-700">{seg.from} — {seg.to}</span>
                                            <span className="text-xs font-black text-gray-900">{seg.price} €</span>
                                         </div>
                                       ))}
                                     </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Discounts Section in Preview */}
                      {(trip.discounts.child04 || trip.discounts.child412 || trip.customDiscounts.length > 0) && (
                        <div className="mt-12 pt-8 border-t border-gray-100">
                          <div 
                            onClick={() => togglePreviewSection('discounts')}
                            className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-70 transition-opacity"
                          >
                            <motion.div
                              animate={{ rotate: previewCollapsed.discounts ? -90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown size={14} className="text-blue-600" />
                            </motion.div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Діючі знижки:</span>
                          </div>

                          <AnimatePresence>
                            {!previewCollapsed.discounts && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="flex flex-wrap gap-2">
                                  {trip.discounts.child04 && (
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[9px] font-bold border border-blue-100">
                                      Діти до 4 р. (-50%)
                                    </span>
                                  )}
                                  {trip.discounts.child412 && (
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[9px] font-bold border border-blue-100">
                                      Діти 4-12 р. (-30%)
                                    </span>
                                  )}
                                  {trip.customDiscounts.map(discount => (
                                    <span key={discount.id} className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-[9px] font-bold border border-cyan-100">
                                      {discount.label || 'Спец. знижка'} (-{discount.value}%)
                                    </span>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Rules Section in Preview */}
                      {(trip.rules.length > 0 || trip.customRules.length > 0) && (
                        <div className="mt-12 pt-8 border-t border-gray-100">
                          <div 
                            onClick={() => togglePreviewSection('rules')}
                            className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-70 transition-opacity"
                          >
                            <motion.div
                              animate={{ rotate: previewCollapsed.rules ? -90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown size={14} className="text-blue-600" />
                            </motion.div>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Правила перевезень:</span>
                          </div>

                          <AnimatePresence>
                            {!previewCollapsed.rules && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {[...trip.rules, ...trip.customRules.filter(r => r.trim())].map((rule, idx) => (
                                    <div key={idx} className="flex gap-2">
                                      <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                      <p className="text-[10px] text-gray-600 leading-relaxed italic">{rule}</p>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                </div>
              </motion.div>
            )}

            {/* STEP 5: RULES (OLD STEP 6) */}
            {currentStep === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6 pb-20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Правила перевезень</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Оберіть умови, які будуть відображатися пасажиру</p>
                  </div>
                  <div className="bg-[#00e5ff]/10 px-3 py-1 rounded-full border border-[#00e5ff]/20">
                    <span className="text-[#00e5ff] text-[10px] font-black uppercase">Обрано: {trip.rules.length + trip.customRules.length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
                  {PRESET_RULES.map((rule, idx) => {
                    const isSelected = trip.rules.includes(rule);
                    return (
                      <button 
                        key={idx}
                        onClick={() => toggleRule(rule)}
                        className={`text-left p-4 rounded-2xl border transition-all relative group flex gap-4 ${isSelected ? 'bg-[#00e5ff] border-[#00e5ff] shadow-[0_10px_30px_rgba(0,229,255,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                      >
                         <div className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-white border-white' : 'border-slate-700 bg-black/20'}`}>
                           {isSelected && <CheckCircle size={12} className="text-[#00e5ff]" strokeWidth={4} />}
                         </div>
                         <p className={`text-[11px] leading-relaxed font-medium ${isSelected ? 'text-black' : 'text-slate-400 opacity-80'}`}>
                           {rule}
                         </p>
                      </button>
                    )
                  })}
                </div>

                <div className="immersive-card p-6 border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                       <Zap size={14} className="text-[#00e5ff]" /> Власні правила
                     </h3>
                     <button 
                       onClick={addCustomRule}
                       className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg text-[9px] text-[#00e5ff] font-black uppercase hover:bg-white/10 transition-all border border-[#00e5ff]/20"
                     >
                       <Plus size={10} /> Додати правило
                     </button>
                  </div>
                  
                  <div className="space-y-3">
                    {trip.customRules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 group">
                        <textarea 
                          value={rule}
                          onChange={(e) => updateCustomRule(idx, e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white outline-none focus:border-[#00e5ff] transition-all min-h-[60px] resize-none"
                          placeholder="Введіть ваше власне правило..."
                        />
                        <button 
                          onClick={() => removeCustomRule(idx)}
                          className="self-start mt-2 p-2 text-slate-700 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {trip.customRules.length === 0 && (
                      <p className="text-[10px] text-slate-600 uppercase font-black text-center py-4">Немає власних правил</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: EXPORT/SYNC (OLD STEP 7) */}
            {currentStep === 6 && (
              <motion.div 
                key="step6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="immersive-card p-10 text-center">
                  <div className="w-20 h-20 bg-[#00e5ff]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-[#00e5ff]" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase mb-2 leading-none tracking-tighter">Маршрут сформовано!</h2>
                  <p className="text-slate-400 text-xs mb-10 max-w-sm mx-auto uppercase">Ваш маршрут готовий до експорту або синхронізації з базою даних.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <button 
                      onClick={downloadPDF}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all group"
                    >
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileDown size={20} className="text-blue-400" />
                      </div>
                      <div className="text-left">
                        <span className="block text-[10px] uppercase text-slate-500 font-black">Експорт</span>
                        <span className="text-sm">Скачати PDF-файл</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setCurrentStep(7)}
                      className={`flex items-center justify-center gap-3 bg-[#00e5ff] text-[#0a0b10] py-4 rounded-2xl font-bold hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all group`}
                    >
                      <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ChevronRight size={20} />
                      </div>
                      <div className="text-left">
                        <span className="block text-[10px] uppercase text-black/40 font-black">Наступний крок</span>
                        <span className="text-sm">Фінальне збереження</span>
                      </div>
                    </button>
                  </div>

                  <div className="mt-12 pt-12 border-t border-white/5">
                    <button 
                      onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                      className="flex items-center gap-4 mx-auto bg-white/5 p-4 rounded-3xl border border-white/10 hover:border-[#00e5ff]/30 transition-all group"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isArchiveOpen ? 'bg-[#00e5ff] text-black' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                        <FolderOpen size={24} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-white font-bold text-sm">Сховище квитків</h4>
                        <p className="text-xs text-slate-500">Переглянути всі доступні комбінації ({getAllSegments().length})</p>
                      </div>
                      <ChevronRight size={20} className={`text-slate-600 transition-transform ${isArchiveOpen ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isArchiveOpen && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        {getAllSegments().map((seg, idx) => {
                          const isForward = seg.currency === 'ГРН';
                          const stops = isForward ? trip.outbound.stops : trip.inbound.stops;
                          const fromIdx = stops.findIndex(s => s.city.toLowerCase() === seg.from.toLowerCase());
                          const toIdx = stops.findIndex(s => s.city.toLowerCase() === seg.to.toLowerCase());
                          const segmentStops = (fromIdx !== -1 && toIdx !== -1 && toIdx > fromIdx) ? stops.slice(fromIdx, toIdx + 1) : [];

                          if (segmentStops.length < 2) return null;

                          return (
                            <div key={`${seg.from}-${seg.to}-${seg.currency}-${idx}`} className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 overflow-hidden relative group">
                              <div className={`absolute top-0 left-0 w-2 h-full ${isForward ? 'bg-blue-600' : 'bg-emerald-600'}`}></div>
                              
                              <div className="flex justify-between items-start mb-6 pl-4">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block mb-1">
                                    {isForward ? 'Україна → Європа' : 'Європа → Україна'}
                                  </span>
                                  <h4 className="text-lg font-black uppercase text-gray-900 leading-tight">
                                    {seg.from} <ArrowRight size={14} className="inline mx-1 text-gray-300" /> {seg.to}
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-black text-gray-900">{seg.price.toLocaleString()} {seg.currency === 'ГРН' ? 'ГРН' : '€'}</div>
                                  <span className="text-[8px] font-bold text-gray-400 uppercase">Тариф: Стандарт</span>
                                </div>
                              </div>

                              <div className="pl-4 space-y-4">
                                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase pb-4 border-b border-gray-50">
                                   <div className="flex items-center gap-2">
                                     <Clock size={12} className="text-blue-500" />
                                     <span>{segmentStops[0]?.time} — {segmentStops[segmentStops.length-1]?.time}</span>
                                   </div>
                                   <div className="px-3 py-1 bg-gray-50 rounded-full text-gray-700">
                                      {getTotalDuration(segmentStops)}
                                   </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                  <div className="flex gap-4">
                                     <div className="flex flex-col items-center gap-1.5 pt-1">
                                        <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-600 bg-white"></div>
                                        <div className="w-0.5 flex-1 bg-dashed border-l-2 border-gray-200 min-h-[30px]"></div>
                                        <div className="w-2.5 h-2.5 rounded-full border-2 border-red-600 bg-white"></div>
                                     </div>
                                     <div className="flex-1 space-y-6">
                                        <div>
                                           <div className="text-[12px] font-black text-gray-900 uppercase leading-none">{segmentStops[0]?.city}</div>
                                           <div className="text-[9px] text-gray-400 mt-1">{segmentStops[0]?.address}</div>
                                        </div>
                                        <div>
                                           <div className="text-[12px] font-black text-gray-900 uppercase leading-none">{segmentStops[segmentStops.length-1]?.city}</div>
                                           <div className="text-[9px] text-gray-400 mt-1">{segmentStops[segmentStops.length-1]?.address}</div>
                                        </div>
                                     </div>
                                  </div>
                                </div>

                                <div className="pt-6 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex -space-x-1">
                                      {trip.amenities.slice(0, 3).map(a => {
                                        const cfg = AMENITIES_CONFIG.find(c => c.id === a);
                                        return (
                                          <div key={a} className="w-6 h-6 rounded-full bg-gray-50 border border-white flex items-center justify-center">
                                            {cfg?.icon && <cfg.icon size={10} className="text-gray-400" />}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <span className="text-[14px] font-bold text-gray-900">1 <span className="text-[10px] text-gray-400">дорослий</span></span>
                                  </div>
                                  <button className="bg-gray-900 text-white text-[9px] font-black uppercase px-6 py-2.5 rounded-xl hover:bg-blue-600 transition-colors shadow-lg">Вибрати</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* STEP 7: FINAL SAVE (OLD STEP 8) */}
            {currentStep === 7 && (
              <motion.div 
                key="step7"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="immersive-card p-12 text-center bg-gradient-to-br from-[#0a0b10] to-[#1a1b26]">
                  <div className="w-24 h-24 bg-[#00e5ff] rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-[0_0_50px_rgba(0,229,255,0.3)]">
                    <Save size={48} className="text-[#0a0b10]" />
                  </div>
                  
                  <h2 className="text-3xl font-black text-white uppercase mb-4 tracking-tighter">Готово до збереження</h2>
                  <p className="text-slate-400 text-sm mb-12 max-w-md mx-auto uppercase tracking-wide leading-relaxed">
                    Натисніть кнопку нижче, щоб зберегти цей маршрут у вашій системі. 
                    Наразі це демо-функція, яка в майбутньому дозволить автоматично публікувати рейси на вашому сайті.
                  </p>

                  <div className="max-w-md mx-auto">
                    <button 
                      onClick={syncToSupabase}
                      disabled={isSaving}
                      className={`w-full group relative overflow-hidden bg-[#00e5ff] text-[#0a0b10] py-6 rounded-[2rem] font-black text-xl uppercase tracking-tighter shadow-[0_20px_50px_rgba(0,229,255,0.3)] hover:shadow-[0_30px_80px_rgba(0,229,255,0.5)] hover:-translate-y-2 transition-all active:scale-95 flex items-center justify-center gap-4 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      {isSaving ? (
                        <>
                          <RefreshCcw size={24} className="animate-spin" />
                          <span>Зберігаємо...</span>
                        </>
                      ) : (
                        <>
                          <Save size={28} />
                          <span>Зберегти маршрут</span>
                        </>
                      )}
                    </button>
                    
                    <p className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
                      Система автоматично підготувала {getAllSegments().length} квитків для продажу
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="immersive-card p-6 border-blue-500/10">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                      <Layout size={20} className="text-blue-400" />
                    </div>
                    <h4 className="text-white font-bold text-xs uppercase mb-1">Сайт перевізника</h4>
                    <p className="text-[10px] text-slate-500 uppercase">Рейс з'явиться у пошуку</p>
                  </div>
                  <div className="immersive-card p-6 border-cyan-500/10">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                      <FileText size={20} className="text-cyan-400" />
                    </div>
                    <h4 className="text-white font-bold text-xs uppercase mb-1">Відомість</h4>
                    <p className="text-[10px] text-slate-500 uppercase">Генерація посадкового листа</p>
                  </div>
                  <div className="immersive-card p-6 border-purple-500/10">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                      <Zap size={20} className="text-purple-400" />
                    </div>
                    <h4 className="text-white font-bold text-xs uppercase mb-1">API Інтеграція</h4>
                    <p className="text-[10px] text-slate-500 uppercase">Синхронізація з BUSNET</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wizard Navigation */}
          <div className="flex justify-between items-center mt-12 bg-black/40 p-4 rounded-2xl border border-white/10">
            <button 
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-white disabled:opacity-20 transition-all uppercase tracking-widest"
            >
              <ChevronLeft size={16} /> Назад
            </button>
            <div className="text-[10px] font-black text-[#00e5ff] uppercase tracking-[0.3em]">
               Етап {currentStep} з 7
            </div>
            <button 
              onClick={nextStep}
              className={`flex items-center gap-2 px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentStep === 7 ? 'bg-green-500 text-white glow-green' : 'bg-[#00e5ff] text-black glow-cyan hover:scale-105'}`}
            >
              {currentStep === 7 ? 'Завершити' : 'Далі'} <ChevronRight size={16} />
            </button>
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
