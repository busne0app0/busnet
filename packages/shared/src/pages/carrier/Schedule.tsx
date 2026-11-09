/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bus, User, Plus, Eye, Edit, XCircle, MapPin, Loader2, X,
  Clock, Coins, Calendar, Save, Zap, ChevronDown, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '@busnet/shared/hooks/useTrips';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { getSegmentPrice, getPriceRange, formatCurrency } from '@busnet/shared/lib/pricing';

const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: 'Активний', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  pending: { label: 'Модерація', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  draft: { label: 'Чернетка', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
  completed: { label: 'Архів', cls: 'text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/30' },
  cancelled: { label: 'Скасовано', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
};

const pj = (f: any, d: any) => {
  if (typeof f === 'string') { try { return JSON.parse(f); } catch { return d; } }
  return f ?? d;
};

const recalcOffsets = (stops: any[]) => {
  let offset = 0;
  return stops.map((s, i) => {
    if (i === 0) return { ...s, dayOffset: 0 };
    const p = stops[i - 1];
    if (p.time && s.time) {
      const [ph, pm] = p.time.split(':').map(Number);
      const [ch, cm] = s.time.split(':').map(Number);
      if (ch * 60 + cm < ph * 60 + pm) offset += 1;
    }
    return { ...s, dayOffset: offset };
  });
};

const DayBadges = ({ days }: { days: string[] }) => (
  <div className="flex flex-wrap gap-1">
    {DAYS.map(d => (
      <span
        key={d}
        className={`w-7 h-6 rounded-md text-[9px] font-black flex items-center justify-center border ${days.includes(d)
            ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-[#00E5FF]'
            : 'bg-transparent border-white/5 text-[#3a4a65]'
          }`}
      >
        {d}
      </span>
    ))}
  </div>
);

// ─── Inline select (bus / driver) ─────────────────────────────────────────────
function InlineSelect({
  icon: Icon, value, options, placeholder, onChange,
}: {
  icon: any; value: string | null; options: { id: string; label: string }[];
  placeholder: string; onChange: (id: string | null) => void;
}) {
  return (
    <div className="relative">
      <Icon size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${value ? 'text-[#00E5FF]' : 'text-[#5A6A85]'}`} />
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        className={`w-full appearance-none rounded-xl border pl-8 pr-8 py-2 text-[11px] font-bold outline-none cursor-pointer transition-all bg-[#050B14] ${value ? 'border-[#00E5FF]/30 text-white' : 'border-white/10 text-[#5A6A85] hover:border-[#00E5FF]/30'
          }`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6A85] pointer-events-none" />
    </div>
  );
}

// ─── View / Quick edit modal ──────────────────────────────────────────────────
function RouteViewModal({
  route, buses, drivers, onClose, onFullEdit, onSaved,
}: {
  route: any; buses: any[]; drivers: any[];
  onClose: () => void; onFullEdit: () => void; onSaved: (raw: any) => void;
}) {
  const raw = route._raw || {};
  const [tab, setTab] = useState<'outbound' | 'inbound'>('outbound');
  const [quick, setQuick] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fromIdx, setFromIdx] = useState(0);

  const [draft, setDraft] = useState(() => ({
    outbound: pj(raw.outbound, { stops: [], days: [] }),
    inbound: pj(raw.inbound, { stops: [], days: [] }),
    bus_id: raw.bus_id || null,
    driver_id: raw.driver_id || null,
  }));

  const dir = draft[tab];
  const stops: any[] = Array.isArray(dir.stops) ? dir.stops : [];
  const cur = formatCurrency(dir.currency || raw.currency || (tab === 'outbound' ? 'ГРН' : 'EUR'));
  const range = getPriceRange(dir);
  const status = STATUS_MAP[route.status] || STATUS_MAP.pending;
  const isAlTrans = /al[\s-]?trans/i.test(route.operator || raw.operator || '');

  useEffect(() => setFromIdx(0), [tab]);

  const setDir = (patch: any) => setDraft(d => ({ ...d, [tab]: { ...d[tab], ...patch } }));
  const toggleDay = (day: string) =>
    setDir({ days: dir.days?.includes(day) ? dir.days.filter((x: string) => x !== day) : [...(dir.days || []), day] });
  const setTime = (i: number, time: string) =>
    setDir({ stops: recalcOffsets(stops.map((s, k) => (k === i ? { ...s, time } : s))) });

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        outbound: draft.outbound,
        inbound: draft.inbound,
        bus_id: draft.bus_id,
        driver_id: draft.driver_id,
      };
      const { data, error } = await supabase.from('routes').update(payload).eq('id', raw.id).select('*');
      if (error || !data?.length) throw error ?? new Error('Не вдалося зберегти');
      toast.success('Збережено');
      onSaved(data[0]);
      setQuick(false);
    } catch (e: any) {
      toast.error(e?.message || 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const busOpts = buses.map(b => ({ id: b.id, label: `${b.number}${b.capacity ? ` · ${b.capacity} місць` : ''}` }));
  const drvOpts = drivers.map(d => ({ id: d.id, label: `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.id }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#050B14]/85 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 26 }}
          className="bg-[#0B1221] border border-white/10 rounded-[28px] w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${status.cls}`}>{status.label}</span>
                <span className="text-[10px] text-[#5A6A85] font-mono">#{(raw.id || route.id || '').substring(0, 6)}</span>
                {raw.operator && <span className="text-[10px] text-[#5A6A85] font-bold uppercase tracking-widest">· {raw.operator}</span>}
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide truncate">
                {route.name || raw.name || `${route.from} — ${route.to}`}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!quick ? (
                <button onClick={() => setQuick(true)} className="h-10 px-4 rounded-xl bg-[#00E5FF] text-[#050B14] text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2">
                  <Zap size={14} /> Швидке редагування
                </button>
              ) : (
                <button onClick={save} disabled={saving} className="h-10 px-4 rounded-xl bg-[#00E5FF] text-[#050B14] text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Зберегти
                </button>
              )}
              <button onClick={onFullEdit} className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                <Edit size={14} /> Повне
              </button>
              <button onClick={onClose} className="h-10 w-10 rounded-xl bg-white/5 text-[#5A6A85] hover:text-white transition-all flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] border-b border-white/5">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">Дні відправлення</p>
              {quick ? (
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => toggleDay(d)}
                      className={`w-9 h-8 rounded-lg text-[10px] font-black border transition-all ${dir.days?.includes(d) ? 'bg-[#00E5FF] text-[#050B14] border-[#00E5FF]' : 'bg-[#050B14] border-white/10 text-[#5A6A85] hover:bg-white/5'
                        }`}>{d}</button>
                  ))}
                </div>
              ) : <DayBadges days={dir.days || []} />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">Автобус</p>
                <InlineSelect icon={Bus} value={draft.bus_id} options={busOpts} placeholder="Не призначено"
                  onChange={id => { setDraft(d => ({ ...d, bus_id: id })); if (!quick) setQuick(true); }} />
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">Водій</p>
                <InlineSelect icon={User} value={draft.driver_id} options={drvOpts} placeholder="Не призначено"
                  onChange={id => { setDraft(d => ({ ...d, driver_id: id })); if (!quick) setQuick(true); }} />
              </div>
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-4 text-xs text-[#8899B5]">
              <span className="flex items-center gap-1.5"><Bus size={13} className="text-[#00E5FF]" /> Місць: <b className="text-white">{raw.seats || route.seatsTotal || 50}</b></span>
              <span className="flex items-center gap-1.5"><Coins size={13} className="text-[#00E5FF]" /> Валюта: <b className="text-white">{cur}</b></span>
              {range && (
                <span className="flex items-center gap-1.5">
                  Тариф: <b className="text-emerald-400">{range.min.toLocaleString('uk-UA')}–{range.max.toLocaleString('uk-UA')} {cur}</b>
                  <span className="text-[10px] text-[#5A6A85]">({range.priced}/{range.total} пар)</span>
                </span>
              )}
            </div>
          </div>

          {/* Direction tabs */}
          <div className="px-6 pt-4 flex gap-2">
            {(['outbound', 'inbound'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${tab === t ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-[#00E5FF]' : 'bg-transparent border-white/5 text-[#5A6A85] hover:text-white'
                  }`}>
                {t === 'outbound' ? <><ArrowRight size={13} /> Туди</> : <><ArrowLeft size={13} /> Назад</>}
              </button>
            ))}
            {!quick && stops.length > 1 && (
              <p className="ml-auto self-center text-[10px] text-[#5A6A85] font-bold">Натисніть на зупинку, щоб побачити ціни від неї</p>
            )}
          </div>

          {/* Stops */}
          <div className="p-6 overflow-y-auto space-y-2 flex-1">
            {stops.length === 0 ? (
              <p className="text-center text-[#5A6A85] text-xs uppercase font-black tracking-widest py-8">Зупинок не знайдено</p>
            ) : stops.map((stop, idx) => {
              const p = !quick && idx > fromIdx ? getSegmentPrice(dir, fromIdx, idx) : null;
              const isFrom = !quick && idx === fromIdx;
              return (
                <div key={stop.id || idx}
                  onClick={() => !quick && setFromIdx(idx)}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3 border transition-all ${isFrom ? 'bg-[#00E5FF]/5 border-[#00E5FF]/30' : 'bg-white/[0.02] border-white/5'
                    } ${!quick ? 'cursor-pointer hover:border-[#00E5FF]/20' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border ${isFrom ? 'bg-[#00E5FF] text-[#050B14] border-[#00E5FF]' : 'bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF]'
                    }`}>{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{stop.city}</p>
                    {stop.address && <p className="text-[10px] text-[#5A6A85] truncate">{stop.address}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {quick ? (
                      <input type="time" value={stop.time || ''} onChange={e => setTime(idx, e.target.value)}
                        className="bg-[#050B14] border border-white/10 focus:border-[#00E5FF]/50 rounded-lg px-2 py-1.5 text-[11px] font-black text-[#00E5FF] outline-none w-[88px]" />
                    ) : (
                      <div className="flex items-center gap-1.5 bg-[#050B14] rounded-lg px-2.5 py-1.5 border border-white/5">
                        <Clock size={11} className="text-[#5A6A85]" />
                        <span className="text-[11px] font-black text-white">{stop.time}</span>
                        {stop.dayOffset > 0 && <span className="text-[9px] text-amber-400 font-black">+{stop.dayOffset}д</span>}
                      </div>
                    )}
                    {!quick && idx > fromIdx && (
                      p ? (
                        <div className="flex items-center gap-1 bg-emerald-500/10 rounded-lg px-2.5 py-1.5 border border-emerald-500/20">
                          <span className="text-[11px] font-black text-emerald-400">{p.toLocaleString('uk-UA')} {cur}</span>
                        </div>
                      ) : isAlTrans ? (
                        <span className="text-[9px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-1.5 rounded-lg border border-[#00E5FF]/20">API тариф</span>
                      ) : (
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20">Без ціни</span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Schedule() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { trips, loading, fetchCarrierTrips } = useTrips();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [viewRoute, setViewRoute] = useState<any | null>(null);
  const [rawRoutes, setRawRoutes] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchCarrierTrips(user.uid);
    supabase.from('routes').select('*').eq('carrier_id', user.uid).then(({ data }) => setRawRoutes(data || []));
    supabase.from('buses').select('*').eq('carrier_id', user.uid).then(({ data }) => setBuses(data || []));
    supabase.from('drivers').select('*').eq('carrier_id', user.uid).then(({ data }) => setDrivers(data || []));
  }, [user, fetchCarrierTrips]);

  const rawById = useMemo(() => {
    const m: Record<string, any> = {};
    rawRoutes.forEach(r => { m[r.id] = r; });
    return m;
  }, [rawRoutes]);

  const busOpts = useMemo(() => buses.map(b => ({ id: b.id, label: b.number })), [buses]);
  const drvOpts = useMemo(
    () => drivers.map(d => ({ id: d.id, label: `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.id })),
    [drivers]
  );

  const assign = async (routeId: string, patch: { bus_id?: string | null; driver_id?: string | null }) => {
    const prev = rawRoutes;
    setRawRoutes(rs => rs.map(r => (r.id === routeId ? { ...r, ...patch } : r)));
    const { data, error } = await supabase.from('routes').update(patch).eq('id', routeId).select('id');
    if (error || !data?.length) {
      setRawRoutes(prev);
      toast.error(error?.message || 'Не вдалося призначити');
    } else {
      toast.success('Призначено');
    }
  };

  const handleCancel = async (routeId: string) => {
    if (!confirm('Ви впевнені, що хочете скасувати цей маршрут?')) return;
    setCancelling(routeId);
    const toastId = toast.loading('Скасування...');
    try {
      const { data, error } = await supabase.from('routes').update({ status: 'cancelled' }).eq('id', routeId).select('id');
      if (error || !data?.length) throw error ?? new Error('Не вдалося скасувати маршрут');
      if (user) await fetchCarrierTrips(user.uid);
      setRawRoutes(prev => prev.map(r => (r.id === routeId ? { ...r, status: 'cancelled' } : r)));
      toast.success('Маршрут скасовано', { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || 'Помилка при скасуванні', { id: toastId });
    } finally {
      setCancelling(null);
    }
  };

  const handleView = (trip: any) => {
    const raw = rawById[trip.routeId || trip.id] || trip._raw || null;
    setViewRoute({ ...trip, _raw: raw });
  };

  const handleEdit = (trip: any) => {
    const routeId = trip.routeId || trip.id;
    ['busnet_trip_draft', 'busnet_current_step'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('busnet_editing_route_id', routeId);
    const raw = rawById[routeId];
    if (raw?.status) localStorage.setItem('busnet_editing_route_status', raw.status);
    setViewRoute(null);
    // Дані завантажуються в NewTrip за id з Supabase (працює і після F5)
    navigate(`/newtrip?edit=${routeId}`);
  };

  const filteredTrips = trips.filter(trip => {
    const q = search.toLowerCase();
    const matchesSearch = (trip.name || '').toLowerCase().includes(q) || (trip.id || trip.routeId || '').toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || trip.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const iconBtn = 'h-10 w-10 rounded-xl border flex items-center justify-center transition-all';

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-syne font-black text-3xl uppercase tracking-tight text-white">Розклад рейсів</h2>
          <p className="text-[#5A6A85] text-[10px] font-bold mt-1.5 uppercase tracking-widest">Управління всіма рейсами вашої компанії</p>
        </div>
        <button
          onClick={() => {
            ['busnet_trip_draft', 'busnet_current_step', 'busnet_editing_route_id', 'busnet_editing_route_status'].forEach(k => localStorage.removeItem(k));
            navigate('/newtrip');
          }}
          className="h-11 px-6 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] text-[11px] font-black uppercase tracking-widest hover:bg-[#00E5FF]/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.25)] transition-all flex items-center gap-2 w-fit"
        >
          <Plus size={16} /> Новий рейс
        </button>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#0B1221] rounded-full border border-white/5 w-fit overflow-x-auto">
          {[
            { id: 'all', label: 'Всі' }, { id: 'active', label: 'Активні' }, { id: 'pending', label: 'Модерація' },
            { id: 'draft', label: 'Чернетки' }, { id: 'completed', label: 'Архів' }, { id: 'cancelled', label: 'Скасовані' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30' : 'text-[#5A6A85] hover:text-white border border-transparent'
                }`}>{tab.label}</button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-3 bg-[#0B1221] border border-white/5 rounded-full px-5 focus-within:border-[#00E5FF]/30 transition-all">
          <Search className="text-[#5A6A85]" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук маршруту або ID..."
            className="w-full bg-transparent border-none py-3 text-xs font-bold text-white placeholder:text-[#4a5a75] focus:outline-none" />
        </div>
      </div>

      {/* List */}
      <div className="bg-[#0B1221]/80 border border-white/5 rounded-[28px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#1A2639]/30">
                {['Маршрут', 'Дні курсування', 'Автобус / Водій', 'Тариф', 'Статус', ''].map((h, i) => (
                  <th key={i} className="px-6 py-4 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center">
                  <Loader2 className="animate-spin text-[#00E5FF] mx-auto" size={36} />
                  <p className="text-[#5A6A85] text-[10px] uppercase font-black tracking-widest mt-4">Завантаження рейсів...</p>
                </td></tr>
              ) : filteredTrips.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#5A6A85] mb-4"><Search size={22} /></div>
                  <p className="text-white font-black uppercase text-sm">Рейсів не знайдено</p>
                </td></tr>
              ) : filteredTrips.map((trip, idx) => {
                const rid = trip.routeId || trip.id;
                const raw = rawById[rid] || trip._raw;
                const out = pj(raw?.outbound, {});
                const firstStop = out.stops?.[0];
                const lastStop = out.stops?.[out.stops.length - 1];
                const range = getPriceRange(out);
                const cur = formatCurrency(out.currency || raw?.currency || 'ГРН');
                const isAlTrans = /al[\s-]?trans/i.test(trip.operator || trip.carrierName || raw?.operator || '');
                const status = STATUS_MAP[trip.status] || STATUS_MAP.pending;
                const isCancellable = trip.status !== 'cancelled' && trip.status !== 'completed';

                return (
                  <motion.tr key={trip.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    className="hover:bg-[#00E5FF]/[0.03] transition-colors">
                    {/* Route */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide">{trip.name || `${trip.from} — ${trip.to}`}</h4>
                        <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-mono text-[#5A6A85]">#{String(rid).substring(0, 4).toUpperCase()}</span>
                      </div>
                      <p className="text-[10px] text-[#5A6A85] font-bold">
                        {firstStop ? `${firstStop.time} ${firstStop.city}` : '—'}
                        {lastStop && lastStop !== firstStop ? ` → ${lastStop.city}` : ''}
                        {out.stops?.length ? ` · ${out.stops.length} зуп.` : ''}
                      </p>
                    </td>

                    {/* Days */}
                    <td className="px-6 py-5">
                      <DayBadges days={out.days || []} />
                    </td>

                    {/* Bus / driver */}
                    <td className="px-6 py-5">
                      <div className="space-y-2 w-[210px]">
                        <InlineSelect icon={Bus} value={raw?.bus_id || null} options={busOpts} placeholder="Призначити автобус"
                          onChange={id => assign(rid, { bus_id: id })} />
                        <InlineSelect icon={User} value={raw?.driver_id || null} options={drvOpts} placeholder="Призначити водія"
                          onChange={id => assign(rid, { driver_id: id })} />
                      </div>
                    </td>

                    {/* Tariff */}
                    <td className="px-6 py-5">
                      {range ? (
                        <>
                          <p className="text-sm font-black text-emerald-400">
                            {range.min === range.max
                              ? `${range.min.toLocaleString('uk-UA')} ${cur}`
                              : `${range.min.toLocaleString('uk-UA')}–${range.max.toLocaleString('uk-UA')} ${cur}`}
                          </p>
                          <p className="text-[9px] text-[#5A6A85] font-bold mt-0.5">{range.priced}/{range.total} пар</p>
                        </>
                      ) : isAlTrans ? (
                        <span className="text-[9px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-1 rounded-md border border-[#00E5FF]/20">API тариф</span>
                      ) : (
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">Без ціни</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${status.cls}`}>{status.label}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleView(trip)}
                          className="h-10 px-4 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[10px] font-black uppercase tracking-widest hover:bg-[#00E5FF]/20 transition-all flex items-center gap-2">
                          <Eye size={14} /> Деталі
                        </button>
                        <button onClick={() => handleEdit(trip)} title="Повне редагування"
                          className={`${iconBtn} bg-white/5 border-white/10 text-[#8899B5] hover:text-white hover:bg-white/10`}><Edit size={15} /></button>
                        <button onClick={() => navigate('/livetrips?route=' + rid)} title="Live трекінг"
                          className={`${iconBtn} bg-white/5 border-white/10 text-[#8899B5] hover:text-[#00E5FF] hover:border-[#00E5FF]/30`}><MapPin size={15} /></button>
                        {isCancellable && (
                          <button onClick={() => handleCancel(rid)} disabled={cancelling === rid} title="Скасувати"
                            className={`${iconBtn} bg-white/5 border-white/10 text-[#8899B5] hover:text-rose-400 hover:border-rose-500/30`}>
                            {cancelling === rid ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewRoute && (
        <RouteViewModal
          key={viewRoute.routeId || viewRoute.id}
          route={viewRoute}
          buses={buses}
          drivers={drivers}
          onClose={() => setViewRoute(null)}
          onFullEdit={() => handleEdit(viewRoute)}
          onSaved={raw => {
            setRawRoutes(prev => prev.map(r => (r.id === raw.id ? raw : r)));
            if (user) fetchCarrierTrips(user.uid);
          }}
        />
      )}
    </div>
  );
}