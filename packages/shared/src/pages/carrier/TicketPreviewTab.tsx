/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Calendar, Clock, ArrowRight, Bus, User, Zap, AlertTriangle,
  CheckCircle, Edit3, Save, X, ChevronDown, ChevronUp, Eye, Info, Loader2,
  RefreshCw, ExternalLink, DollarSign, AlertCircle, Settings, Copy, Ticket,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';
import { toast } from 'react-hot-toast';
import { isCityMatch } from '@busnet/shared/lib/cityUtils';
import { getUaDayOfWeek, formatISODate, addDays } from '@busnet/shared/lib/dateUtils';
import { getSegmentPrice, formatCurrency } from '@busnet/shared/lib/pricing';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Stop {
  city: string;
  time?: string;
  address?: string;
  dayOffset?: number;
}

interface RouteDir {
  stops?: Stop[];
  days?: string[];
  prices?: Record<string, number>;
  currency?: string;
}

interface RouteRow {
  id: string;
  name?: string;
  carrier_id?: string;
  operator?: string;
  carrier_name?: string;
  status?: string;
  currency?: string;
  seats?: number;
  outbound?: RouteDir;
  inbound?: RouteDir;
}

interface TicketResult {
  routeId: string;
  routeName: string;
  direction: 'outbound' | 'inbound';
  fromStopIdx: number;
  toStopIdx: number;
  fromStop: Stop;
  toStop: Stop;
  allStops: Stop[];
  depDate: string;
  depTime: string;
  arrTime: string;
  price: number | null;
  currency: string;
  priceSource: 'api' | 'manual' | 'none';
  availableSeats: number;
  totalSeats: number;
  status: string;
  days: string[];
  tripKey: string;
  issues: string[];
}

interface InlineEdit {
  field: 'price' | 'dep_time' | 'arr_time' | 'dep_address' | 'arr_address';
  value: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const UA_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];
const todayISO = () => {
  const d = new Date();
  return formatISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

function buildIssues(r: Omit<TicketResult, 'issues'>): string[] {
  const issues: string[] = [];
  if (r.status === 'draft') issues.push('Рейс у чернетках — пасажири не бачать');
  if (r.status === 'pending') issues.push('Рейс на модерації — не відображається в пошуку');
  if (r.status === 'inactive') issues.push('Рейс неактивний');
  if (r.price === null) issues.push('Ціну не вказано — квиток не продається');
  if (r.availableSeats <= 0) issues.push('Немає вільних місць');
  if (!r.depTime || r.depTime === '00:00') issues.push('Час відправлення не вказано');
  if (!r.fromStop.address) issues.push('Адреса посадки не вказана');
  if (!r.toStop.address) issues.push('Адреса висадки не вказана');
  return issues;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TicketPreviewTab() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(todayISO());
  const [results, setResults] = useState<TicketResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<InlineEdit>>({});
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'passenger' | 'edit'>('passenger');
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);

  // Load all carrier city names once
  useEffect(() => {
    if (!user?.uid) return;
    supabase
      .from('routes')
      .select('outbound, inbound')
      .eq('carrier_id', user.uid)
      .then(({ data }) => {
        const cities = new Set<string>();
        (data || []).forEach((r: any) => {
          (r.outbound?.stops || []).forEach((s: Stop) => cities.add(s.city));
          (r.inbound?.stops || []).forEach((s: Stop) => cities.add(s.city));
        });
        setAllCities([...cities].sort());
      });
  }, [user?.uid]);

  const filterSuggestions = (val: string) =>
    val.length < 2 ? [] : allCities.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 6);

  // ─── Search ───────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    setExpanded(null);

    try {
      const { data: rawRoutes } = await supabase
        .from('routes')
        .select('*')
        .eq('carrier_id', user.uid);

      const routes = (rawRoutes || []) as RouteRow[];
      const found: TicketResult[] = [];

      const checkDir = (route: RouteRow, dirName: 'outbound' | 'inbound', dir: RouteDir | undefined) => {
        if (!dir?.stops || !dir?.days || dir.stops.length < 2) return;
        const stops = dir.stops;

        let fromIdx = -1, toIdx = -1;
        if (from && to) {
          fromIdx = stops.findIndex(s => isCityMatch(s.city, from));
          toIdx = stops.findIndex(s => isCityMatch(s.city, to));
          if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return;
        } else if (from) {
          fromIdx = stops.findIndex(s => isCityMatch(s.city, from));
          if (fromIdx === -1) return;
          toIdx = stops.length - 1;
        } else if (to) {
          toIdx = stops.findIndex(s => isCityMatch(s.city, to));
          if (toIdx === -1) return;
          fromIdx = 0;
        } else {
          fromIdx = 0;
          toIdx = stops.length - 1;
        }

        const depStop = stops[fromIdx];
        const arrStop = stops[toIdx];
        const dayOffset = depStop.dayOffset || 0;
        const startDate = addDays(date, -dayOffset);
        const uaDay = getUaDayOfWeek(startDate);

        if (date && !dir.days.includes(uaDay)) return;

        const priceNum = getSegmentPrice(dir, fromIdx, toIdx);
        const priceSource: TicketResult['priceSource'] = priceNum !== null ? 'manual' : 'none';
        const seatsTotal = route.seats ?? 50;
        const tripKey = `${route.id}_${dirName}_${fromIdx}_${toIdx}_${startDate}`;
        const currency = formatCurrency(dir.currency || route.currency);

        const partial: Omit<TicketResult, 'issues'> = {
          routeId: route.id,
          routeName: route.name || `${stops[0].city} – ${stops[stops.length - 1].city}`,
          direction: dirName,
          fromStopIdx: fromIdx,
          toStopIdx: toIdx,
          fromStop: depStop,
          toStop: arrStop,
          allStops: stops,
          depDate: date,
          depTime: depStop.time || '00:00',
          arrTime: arrStop.time || '00:00',
          price: priceNum,
          currency,
          priceSource,
          availableSeats: seatsTotal,
          totalSeats: seatsTotal,
          status: route.status || 'active',
          days: dir.days,
          tripKey,
        };

        found.push({ ...partial, issues: buildIssues(partial) });
      };

      routes.forEach(route => {
        checkDir(route, 'outbound', route.outbound);
        checkDir(route, 'inbound', route.inbound);
      });

      // Enrich: booked seats
      if (found.length > 0) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('trip_id, passengers, status')
          .in('trip_id', found.map(f => f.tripKey))
          .neq('status', 'cancelled');

        const bookedMap: Record<string, number> = {};
        (bookingsData || []).forEach((b: any) => {
          const seats = Array.isArray(b.passengers) ? b.passengers.length : 1;
          bookedMap[b.trip_id] = (bookedMap[b.trip_id] || 0) + seats;
        });

        found.forEach(f => {
          const booked = bookedMap[f.tripKey] || 0;
          f.availableSeats = Math.max(0, f.totalSeats - booked);
          f.issues = buildIssues(f);
        });
      }

      setResults(found);
    } catch (e) {
      console.error(e);
      toast.error('Помилка пошуку');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, from, to, date]);

  // ─── Inline Save ──────────────────────────────────────────────────────────

  const handleSave = async (ticket: TicketResult) => {
    if (!editFields.field) return;
    setSaving(true);
    const toastId = toast.loading('Збереження...');
    try {
      const { data: route } = await supabase
        .from('routes')
        .select('outbound, inbound')
        .eq('id', ticket.routeId)
        .single();

      if (!route) throw new Error('Маршрут не знайдено');

      const dir: RouteDir = { ...(route[ticket.direction] || {}) };
      const stops: Stop[] = [...(dir.stops || [])];

      if (editFields.field === 'price') {
        const newPrice = parseFloat(editFields.value || '0');
        if (isNaN(newPrice)) throw new Error('Невірна ціна');
        const key = `${ticket.fromStopIdx}_${ticket.toStopIdx}`;
        dir.prices = { ...(dir.prices || {}), [key]: newPrice };
      } else if (editFields.field === 'dep_time') {
        stops[ticket.fromStopIdx] = { ...stops[ticket.fromStopIdx], time: editFields.value };
        dir.stops = stops;
      } else if (editFields.field === 'arr_time') {
        stops[ticket.toStopIdx] = { ...stops[ticket.toStopIdx], time: editFields.value };
        dir.stops = stops;
      } else if (editFields.field === 'dep_address') {
        stops[ticket.fromStopIdx] = { ...stops[ticket.fromStopIdx], address: editFields.value };
        dir.stops = stops;
      } else if (editFields.field === 'arr_address') {
        stops[ticket.toStopIdx] = { ...stops[ticket.toStopIdx], address: editFields.value };
        dir.stops = stops;
      }

      const updatePayload = { [ticket.direction]: dir };
      const { error } = await supabase
        .from('routes')
        .update(updatePayload)
        .eq('id', ticket.routeId)
        .eq('carrier_id', user!.uid);

      if (error) throw error;

      toast.success('Зміни збережено!', { id: toastId });
      setEditingId(null);
      setEditFields({});
      handleSearch();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Помилка збереження', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // ─── UI helpers ──────────────────────────────────────────────────────────

  const ResultKey = (t: TicketResult) =>
    `${t.routeId}_${t.direction}_${t.fromStopIdx}_${t.toStopIdx}`;

  const statusColor: Record<string, string> = {
    active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    draft: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    pending: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    inactive: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  };
  const statusLabel: Record<string, string> = {
    active: 'Активний', draft: 'Чернетка', pending: 'Модерація', inactive: 'Неактивний',
  };

  // ─── EditableField sub-component ─────────────────────────────────────────

  const EditableField = ({
    label, field, current, ticket, placeholder, type = 'text',
  }: {
    label: string;
    field: InlineEdit['field'];
    current: string;
    ticket: TicketResult;
    placeholder?: string;
    type?: string;
  }) => {
    const key = ResultKey(ticket);
    const isEditing = editingId === key && editFields.field === field;

    return (
      <div className="flex items-center gap-2 group/field">
        <span className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest min-w-[90px]">{label}</span>
        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              autoFocus
              type={type}
              value={editFields.value || ''}
              onChange={e => setEditFields({ field, value: e.target.value })}
              className="flex-1 bg-[#1A2639] border border-[#00E5FF]/40 rounded-lg px-3 py-1 text-xs text-white outline-none focus:border-[#00E5FF] font-mono"
              placeholder={placeholder || current}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave(ticket);
                if (e.key === 'Escape') { setEditingId(null); setEditFields({}); }
              }}
            />
            <button onClick={() => handleSave(ticket)} disabled={saving}
              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            </button>
            <button onClick={() => { setEditingId(null); setEditFields({}); }}
              className="p-1.5 rounded-lg bg-white/5 text-[#5A6A85] hover:text-white transition-all">
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            className="flex-1 text-left flex items-center gap-2 text-sm font-bold text-white hover:text-[#00E5FF] transition-colors group/btn"
            onClick={() => {
              if (viewMode !== 'edit') return;
              setEditingId(key);
              setEditFields({ field, value: current });
            }}
          >
            <span>{current || <span className="text-rose-400 italic text-xs">Не вказано</span>}</span>
            {viewMode === 'edit' && (
              <Edit3 size={10} className="opacity-0 group-hover/btn:opacity-100 text-[#00E5FF] transition-opacity" />
            )}
          </button>
        )}
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-6 rounded-full bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
              Перегляд Квитків
            </h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">
            Перевірте як ваші квитки виглядають для пасажирів · Редагуйте прямо тут
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 p-1 bg-[#0B1221] rounded-full border border-white/10">
          {(['passenger', 'edit'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === mode
                  ? mode === 'passenger' ? 'bg-[#00E5FF] text-black' : 'bg-[#E879F9] text-black'
                  : 'text-[#5A6A85] hover:text-white'
                }`}
            >
              {mode === 'passenger' ? <Eye size={10} /> : <Edit3 size={10} />}
              {mode === 'passenger' ? 'Вид пасажира' : 'Режим правки'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-[#0B1221] border border-white/10 rounded-[28px] p-5 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3">
          {/* From */}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 bg-[#1A2639] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#00E5FF]/50 transition-all">
              <MapPin size={14} className="text-[#00E5FF] shrink-0" />
              <input type="text" placeholder="Звідки..." value={from}
                onChange={e => { setFrom(e.target.value); setFromSuggestions(filterSuggestions(e.target.value)); }}
                onBlur={() => setTimeout(() => setFromSuggestions([]), 200)}
                className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder-[#5A6A85]" />
              {from && <button onClick={() => setFrom('')}><X size={12} className="text-[#5A6A85] hover:text-white" /></button>}
            </div>
            <AnimatePresence>
              {fromSuggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full mt-1 left-0 right-0 bg-[#0B1221] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                  {fromSuggestions.map(c => (
                    <button key={c} className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#1A2639] transition-colors flex items-center gap-2"
                      onMouseDown={() => { setFrom(c); setFromSuggestions([]); }}>
                      <MapPin size={10} className="text-[#00E5FF]" />{c}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Swap */}
          <button onClick={() => { const t = from; setFrom(to); setTo(t); }}
            className="hidden md:flex w-10 h-10 my-auto items-center justify-center rounded-full bg-[#1A2639] border border-white/10 text-[#5A6A85] hover:text-[#00E5FF] hover:border-[#00E5FF]/30 transition-all">
            <ArrowRight size={16} />
          </button>

          {/* To */}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 bg-[#1A2639] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#E879F9]/50 transition-all">
              <MapPin size={14} className="text-[#E879F9] shrink-0" />
              <input type="text" placeholder="Куди..." value={to}
                onChange={e => { setTo(e.target.value); setToSuggestions(filterSuggestions(e.target.value)); }}
                onBlur={() => setTimeout(() => setToSuggestions([]), 200)}
                className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder-[#5A6A85]" />
              {to && <button onClick={() => setTo('')}><X size={12} className="text-[#5A6A85] hover:text-white" /></button>}
            </div>
            <AnimatePresence>
              {toSuggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full mt-1 left-0 right-0 bg-[#0B1221] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                  {toSuggestions.map(c => (
                    <button key={c} className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-[#1A2639] transition-colors flex items-center gap-2"
                      onMouseDown={() => { setTo(c); setToSuggestions([]); }}>
                      <MapPin size={10} className="text-[#E879F9]" />{c}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 bg-[#1A2639] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#FBBF24]/50 transition-all">
            <Calendar size={14} className="text-[#FBBF24] shrink-0" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-transparent text-white text-sm font-bold outline-none [color-scheme:dark]" />
          </div>

          {/* Search */}
          <button onClick={handleSearch} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-black font-black text-[11px] uppercase tracking-widest rounded-2xl hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Знайти
          </button>
        </div>

        {/* City chips */}
        {allCities.length > 0 && !from && !to && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest self-center">Ваші міста:</span>
            {allCities.slice(0, 10).map(c => (
              <button key={c} onClick={() => setFrom(c)}
                className="px-3 py-1 rounded-full bg-[#1A2639] text-[#8899B5] text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-[#00E5FF]/10 transition-all border border-white/5">
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit mode banner */}
      <AnimatePresence>
        {viewMode === 'edit' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-[#E879F9]/10 border border-[#E879F9]/30 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Edit3 size={14} className="text-[#E879F9] shrink-0" />
            <p className="text-[#E879F9] text-[10px] font-black uppercase tracking-widest">
              Режим правки: натисніть на будь-яке поле квитка, щоб відредагувати. Зміни застосуються до всіх майбутніх рейсів маршруту.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-[#5A6A85] uppercase tracking-widest">
                Знайдено: <span className="text-white">{results.length}</span>
              </span>
              {results.filter(r => r.issues.length > 0).length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                  <AlertTriangle size={10} />
                  {results.filter(r => r.issues.length > 0).length} проблем
                </span>
              )}
            </div>
            <button onClick={handleSearch}
              className="flex items-center gap-1 text-[#5A6A85] hover:text-[#00E5FF] text-[10px] font-black uppercase tracking-widest transition-colors">
              <RefreshCw size={11} /> Оновити
            </button>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-32 bg-[#0B1221] rounded-[24px] animate-pulse" />)}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="bg-[#0B1221] border border-white/5 rounded-[28px] p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-[20px] bg-[#1A2639] border border-white/5 flex items-center justify-center mx-auto">
                <Ticket size={28} className="text-[#5A6A85]" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-black text-lg uppercase tracking-widest">Квитків не знайдено</p>
                <div className="text-[10px] text-[#5A6A85] font-bold uppercase tracking-widest flex flex-col items-center gap-1">
                  {from && to ? (
                    <>
                      <p className="mb-1">Можливі причини:</p>
                      {[
                        '• Рейс не ходить у цей день тижня',
                        '• Маршрут без цієї пари зупинок',
                        '• Всі рейси в чернетках або неактивні',
                        '• Міста написані інакше, ніж у маршруті',
                      ].map(s => <span key={s}>{s}</span>)}
                    </>
                  ) : <span>Введіть міста або оберіть дату</span>}
                </div>
                <button onClick={() => navigate('/trips')}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[10px] font-black uppercase tracking-widest hover:bg-[#00E5FF]/20 transition-all">
                  <ExternalLink size={12} /> Перейти до маршрутів
                </button>
              </div>
            </div>
          )}

          {!loading && results.map((ticket) => {
            const key = ResultKey(ticket);
            const isExpanded = expanded === key;
            const hasIssues = ticket.issues.length > 0;

            return (
              <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-[#0B1221] border rounded-[28px] overflow-hidden shadow-xl transition-all ${hasIssues ? 'border-amber-500/20' : 'border-white/5'}`}>

                {/* Issues strip */}
                {hasIssues && (
                  <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center gap-2">
                    <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                      {ticket.issues.map((issue, i) => (
                        <span key={i} className="text-amber-300 text-[9px] font-bold uppercase tracking-widest">{issue}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main card */}
                <div className="p-5">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded-full">
                          {ticket.direction === 'outbound' ? '→' : '←'} {ticket.routeName}
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${statusColor[ticket.status] || 'text-[#8899B5] bg-white/5 border-white/10'}`}>
                          {statusLabel[ticket.status] || ticket.status}
                        </span>
                        {ticket.priceSource === 'none' && (
                          <span className="text-[8px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full text-rose-400 bg-rose-500/10 border-rose-500/20">
                            Без ціни
                          </span>
                        )}
                      </div>

                      {/* Journey line */}
                      <div className="flex items-center gap-3 mt-2">
                        <div>
                          <p className="text-xl font-black text-white leading-none">{ticket.depTime}</p>
                          <p className="text-[11px] font-bold text-[#8899B5] mt-0.5">{ticket.fromStop.city}</p>
                        </div>
                        <div className="flex-1 flex items-center gap-1 min-w-0">
                          <div className="h-px flex-1 bg-gradient-to-r from-[#00E5FF]/30 to-[#E879F9]/30" />
                          <Bus size={14} className="text-[#5A6A85] shrink-0" />
                          <div className="h-px flex-1 bg-gradient-to-r from-[#E879F9]/30 to-[#00E5FF]/30" />
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-white leading-none">{ticket.arrTime}</p>
                          <p className="text-[11px] font-bold text-[#8899B5] mt-0.5">{ticket.toStop.city}</p>
                        </div>
                      </div>

                      {/* Days */}
                      <div className="flex items-center gap-1 mt-3">
                        {UA_DAYS.map(d => (
                          <span key={d} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${ticket.days.includes(d)
                            ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30'
                            : 'bg-transparent text-[#2A3A55]'}`}>{d}</span>
                        ))}
                      </div>
                    </div>

                    {/* Price + buttons */}
                    <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2 shrink-0">
                      <div className="text-right">
                        {ticket.price !== null ? (
                          <p className="text-2xl font-black text-white">
                            {ticket.price.toLocaleString('uk-UA')}
                            <span className="text-sm font-bold text-[#5A6A85] ml-1">{ticket.currency}</span>
                          </p>
                        ) : (
                          <p className="text-rose-400 font-black text-sm uppercase tracking-widest">Ціна відсутня</p>
                        )}
                        <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest">
                          {ticket.availableSeats} / {ticket.totalSeats} місць
                        </p>
                      </div>

                      <div className="flex gap-2 flex-wrap justify-end">
                        {viewMode === 'edit' && (
                          <button onClick={() => {
                            setEditingId(key);
                            setEditFields({ field: 'price', value: String(ticket.price ?? '') });
                            setExpanded(key);
                          }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E879F9]/10 border border-[#E879F9]/30 text-[#E879F9] text-[9px] font-black uppercase tracking-widest hover:bg-[#E879F9]/20 transition-all">
                            <DollarSign size={11} /> Ціна
                          </button>
                        )}
                        <button onClick={() => setExpanded(isExpanded ? null : key)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[#8899B5] text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          {isExpanded ? 'Згорнути' : 'Деталі'}
                        </button>
                        <button onClick={() => navigate('/trips')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[9px] font-black uppercase tracking-widest hover:bg-[#00E5FF]/20 transition-all">
                          <ExternalLink size={11} /> Маршрут
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-white/5">
                      <div className="p-5 grid md:grid-cols-2 gap-6">
                        {/* Left: edit fields */}
                        <div className="space-y-4">
                          <p className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest flex items-center gap-2">
                            {viewMode === 'edit' ? (
                              <><Edit3 size={10} className="text-[#E879F9]" /> Редагування (натисніть поле)</>
                            ) : <><Info size={10} /> Деталі квитка</>}
                          </p>
                          <div className="space-y-3 bg-[#1A2639]/50 rounded-2xl p-4 border border-white/5">
                            <EditableField label="Час відпр." field="dep_time" current={ticket.depTime} ticket={ticket} type="time" />
                            <EditableField label="Час прибуття" field="arr_time" current={ticket.arrTime} ticket={ticket} type="time" />
                            <EditableField label="Адреса посадки" field="dep_address" current={ticket.fromStop.address || ''} ticket={ticket} placeholder="вул. Прикладна, 1" />
                            <EditableField label="Адреса висадки" field="arr_address" current={ticket.toStop.address || ''} ticket={ticket} placeholder="вул. Прикладна, 1" />
                            <EditableField label="Ціна" field="price" current={ticket.price !== null ? String(ticket.price) : ''} ticket={ticket} placeholder="напр. 85" type="number" />
                          </div>
                        </div>

                        {/* Right: stops + issues */}
                        <div className="space-y-4">
                          <p className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={10} /> Зупинки маршруту ({ticket.allStops.length})
                          </p>
                          <div className="bg-[#1A2639]/50 rounded-2xl p-4 border border-white/5 space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
                            {ticket.allStops.map((stop, idx) => {
                              const isFrom = idx === ticket.fromStopIdx;
                              const isTo = idx === ticket.toStopIdx;
                              const inRange = idx >= ticket.fromStopIdx && idx <= ticket.toStopIdx;
                              return (
                                <div key={idx} className={`flex items-center gap-2 py-1 ${inRange ? '' : 'opacity-30'}`}>
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${isFrom ? 'bg-[#00E5FF] shadow-[0_0_6px_rgba(0,229,255,0.8)]'
                                      : isTo ? 'bg-[#E879F9] shadow-[0_0_6px_rgba(232,121,249,0.8)]'
                                        : 'bg-[#2A3A55]'}`} />
                                  <span className={`text-[10px] font-bold ${isFrom ? 'text-[#00E5FF]' : isTo ? 'text-[#E879F9]' : 'text-[#8899B5]'}`}>{stop.city}</span>
                                  {stop.time && <span className="ml-auto text-[9px] text-[#5A6A85] font-mono">{stop.time}</span>}
                                </div>
                              );
                            })}
                          </div>

                          {ticket.issues.length > 0 ? (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                              <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={10} /> Що виправити
                              </p>
                              {ticket.issues.map((issue, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                  <p className="text-amber-300 text-[10px] font-bold">{issue}</p>
                                </div>
                              ))}
                              {ticket.issues.some(i => i.includes('Ціну')) && viewMode === 'edit' && (
                                <button onClick={() => { setEditingId(key); setEditFields({ field: 'price', value: '' }); }}
                                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all">
                                  <DollarSign size={10} /> Задати ціну
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-2">
                              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                              <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                                Квиток готовий до продажу
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!searched && (
        <div className="bg-[#0B1221] border border-white/5 rounded-[28px] p-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#00E5FF]/10 to-[#E879F9]/10 border border-white/10 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,229,255,0.1)]">
            <Search size={36} className="text-[#00E5FF]" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <p className="text-white font-black text-xl uppercase tracking-widest">Перевірте ваші квитки</p>
            <p className="text-[#5A6A85] text-sm font-bold leading-relaxed">
              Введіть міста та дату вище, щоб побачити як ваші рейси відображаються для пасажирів.
              Перемкніть у режим правки, щоб редагувати час, адреси та ціни прямо тут.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[10px] font-black text-[#5A6A85] uppercase tracking-widest">
            {[
              { icon: Eye, text: 'Вид пасажира' },
              { icon: Edit3, text: 'Правка на місці' },
              { icon: AlertTriangle, text: 'Діагностика проблем' },
              { icon: CheckCircle, text: 'Перевірка готовності' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 bg-[#1A2639] px-3 py-2 rounded-full border border-white/5">
                <Icon size={10} className="text-[#00E5FF]" />
                {text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
