/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Calendar, Bus, User, Plus,
  Eye, Edit, XCircle, Map, Loader2, X,
  MapPin, Clock, Coins, ArrowRight, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '@busnet/shared/hooks/useTrips';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  active:    { label: '● Активний',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]' },
  pending:   { label: '⌛ Модерація', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.15)]' },
  completed: { label: '✓ Архів',     color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30', glow: 'shadow-[0_0_12px_rgba(34,211,238,0.15)]' },
  cancelled: { label: '✕ Скасовано',  color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.15)]' },
};

// ─── View Modal ───────────────────────────────────────────────────────────────
function RouteViewModal({ route, onClose, onEdit }: { route: any; onClose: () => void; onEdit: () => void }) {
  const [tab, setTab] = useState<'outbound' | 'inbound'>('outbound');
  const outStops: any[] = route.stops || [];
  const inStops: any[] = route._raw?.inbound?.stops || [];
  const status = STATUS_MAP[route.status] || STATUS_MAP.pending;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-[#111827] border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${status.bg} ${status.color} ${status.border} ${status.glow || ''}`}>
                  {status.label}
                </span>
                <span className="text-[10px] text-[#5a6a85] font-mono">
                  ID: {route.routeId?.substring(0, 8) || route.id?.substring(0, 8)}
                </span>
              </div>
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter truncate">
                {route.name || `${route.from} → ${route.to}`}
              </h2>
              <p className="text-xs text-[#5a6a85] mt-1 font-medium">{route.operator || route.carrierName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-[#ff6b35] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#cc3300] transition-all flex items-center gap-2"
              >
                <Edit size={12} /> Редагувати
              </button>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-[#5a6a85] hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Info Row */}
          <div className="px-6 py-4 flex flex-wrap gap-4 bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-2 text-xs text-[#8899b5]">
              <Bus size={14} className="text-[#ff6b35]" />
              <span className="font-bold">Місць: <span className="text-white">{route.totalSeats || route.seatsTotal || 50}</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8899b5]">
              <Coins size={14} className="text-emerald-400" />
              <span className="font-bold">Валюта: <span className="text-white">{route._raw?.currency || 'ГРН'}</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8899b5]">
              <Calendar size={14} className="text-cyan-400" />
              <span className="font-bold">Дні виїзду:&nbsp;
                <span className="text-white">{(route._raw?.outbound?.days || []).join(', ') || '—'}</span>
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 flex gap-2">
            {(['outbound', 'inbound'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t ? 'bg-[#ff6b35] text-white' : 'bg-white/5 text-[#5a6a85] hover:text-white'
                }`}
              >
                {t === 'outbound' ? '→ Туди' : '← Назад'}
              </button>
            ))}
          </div>

          {/* Stops List */}
          <div className="p-6 overflow-y-auto max-h-[40vh] space-y-2">
            {(tab === 'outbound' ? outStops : inStops).length === 0 ? (
              <p className="text-center text-[#5a6a85] text-xs uppercase font-black tracking-widest py-8">Зупинок не знайдено</p>
            ) : (
              (tab === 'outbound' ? outStops : inStops).map((stop: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-[#ff6b35]/10 border border-[#ff6b35]/20 flex items-center justify-center text-[10px] font-black text-[#ff6b35] shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{stop.city}</p>
                    {stop.address && (
                      <p className="text-[10px] text-[#5a6a85] truncate">{stop.address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 bg-black/20 rounded-lg px-2.5 py-1.5 border border-white/5">
                      <Clock size={10} className="text-[#5a6a85]" />
                      <span className="text-[11px] font-black text-white">{stop.time}</span>
                      {stop.dayOffset > 0 && (
                        <span className="text-[9px] text-amber-400 font-black">+{stop.dayOffset}д</span>
                      )}
                    </div>
                    {stop.price > 0 && (
                      <div className="flex items-center gap-1 bg-emerald-500/10 rounded-lg px-2.5 py-1.5 border border-emerald-500/20">
                        <Coins size={10} className="text-emerald-400" />
                        <span className="text-[11px] font-black text-emerald-400">{stop.price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Schedule() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { trips, loading, fetchCarrierTrips } = useTrips();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [viewRoute, setViewRoute] = useState<any | null>(null);
  // raw routes data for modal
  const [rawRoutes, setRawRoutes] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchCarrierTrips(user.uid);
      // Also fetch raw routes for the modal (full JSONB data)
      supabase
        .from('routes')
        .select('*')
        .eq('carrier_id', user.uid)
        .then(({ data }) => setRawRoutes(data || []));
    }
  }, [user, fetchCarrierTrips]);

  const handleCancel = async (routeId: string) => {
    if (!confirm('Ви впевнені, що хочете скасувати цей маршрут? Всі пасажири отримають сповіщення.')) return;
    setCancelling(routeId);
    const toastId = toast.loading('Скасування...');
    try {
      const { error } = await supabase
        .from('routes')
        .update({ status: 'cancelled' })
        .eq('id', routeId);
      if (error) throw error;
      if (user) await fetchCarrierTrips(user.uid);
      setRawRoutes(prev => prev.map(r => r.id === routeId ? { ...r, status: 'cancelled' } : r));
      toast.success('Маршрут скасовано', { id: toastId });
    } catch (err) {
      toast.error('Помилка при скасуванні', { id: toastId });
    } finally {
      setCancelling(null);
    }
  };

  const handleView = (trip: any) => {
    const raw = rawRoutes.find(r => r.id === trip.routeId) || null;
    setViewRoute({ ...trip, _raw: raw });
  };

  const handleEdit = (trip: any) => {
    // Save current route data to localStorage so NewTrip can load it
    const raw = rawRoutes.find(r => r.id === trip.routeId);
    if (raw) {
      const clonedRaw = JSON.parse(JSON.stringify(raw));
      const draftData = {
        __version: 4,
        routeName: clonedRaw.name || '',
        operator: clonedRaw.operator || '',
        seats: clonedRaw.seats || 50,
        amenities: clonedRaw.amenities || ['wifi', 'ac'],
        isTransfer: clonedRaw.is_transfer || false,
        transferType: clonedRaw.transfer_type || 'direct',
        transferCity: clonedRaw.transfer_city || '',
        currency: clonedRaw.currency || 'ГРН',
        discounts: clonedRaw.discounts || { child04: false, child412: false },
        customDiscounts: clonedRaw.custom_discounts || [],
        rules: clonedRaw.rules || [],
        customRules: clonedRaw.custom_rules || [],
        outbound: clonedRaw.outbound || { stops: [], days: [] },
        inbound: clonedRaw.inbound || { stops: [], days: [] },
        // Store editing route ID
        _editingRouteId: clonedRaw.id,
      };
      localStorage.setItem('busnet_trip_draft', JSON.stringify(draftData));
      localStorage.setItem('busnet_current_step', '1');
      localStorage.setItem('busnet_editing_route_id', raw.id);
    }
    setViewRoute(null);
    navigate('/newtrip');
    toast.success('Маршрут завантажено для редагування');
  };

  const filteredTrips = trips.filter(trip => {
    const routeName = trip.name || '';
    const tripId = trip.id || trip.routeId || '';
    const matchesSearch =
      routeName.toLowerCase().includes(search.toLowerCase()) ||
      tripId.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || trip.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Title + New Button */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="font-syne font-black text-3xl italic tracking-tighter uppercase text-white">РОЗКЛАД РЕЙСІВ</h2>
          <p className="text-[#5a6a85] text-[10px] font-bold mt-1.5 uppercase tracking-widest">УПРАВЛІННЯ ВСІМА РЕЙСАМИ ВАШОЇ КОМПАНІЇ</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[#8899B5] text-[10px] font-mono tracking-widest">
            {new Date().toLocaleDateString('uk-UA')} {new Date().toLocaleTimeString('uk-UA')}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem('busnet_editing_route_id');
              navigate('/newtrip');
            }}
            className="px-6 py-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(255,107,53,0.3)] transition-all flex items-center gap-2"
          >
            <Plus size={16} /> НОВИЙ РЕЙС
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0B1221] rounded-full w-fit border border-white/5">
        {[
          { id: 'all',       label: 'ВСІ РЕЙСИ' },
          { id: 'active',    label: 'АКТИВНІ' },
          { id: 'pending',   label: 'НА МОДЕРАЦІЇ' },
          { id: 'completed', label: 'АРХІВ' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-[#1A2639] text-[#ff6b35] shadow-lg'
                : 'text-[#5a6a85] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-center gap-2 bg-[#0B1221] border border-white/5 rounded-full p-2 pl-6 shadow-sm">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="text-[#5a6a85]" size={18} />
          <input
            type="text"
            placeholder="Пошук маршруту або ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent border-none py-2 px-4 text-xs font-bold text-white placeholder:text-[#4a5a75] focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <select disabled title="В розробці" className="appearance-none bg-[#1A2639] border border-transparent rounded-full py-2.5 pl-6 pr-10 text-[10px] font-black uppercase tracking-widest text-[#5a6a85] outline-none hover:bg-white/5 transition-all cursor-not-allowed opacity-50">
              {/* TODO: connect directions filter */}
              <option>Всі напрямки</option>
              <option>UA → EU</option>
              <option>EU → UA</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a6a85] pointer-events-none opacity-50" />
          </div>
          <button className="p-2.5 bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#ff6b35] rounded-full hover:bg-[#ff6b35]/20 hover:shadow-[0_0_10px_rgba(255,107,53,0.3)] transition-all">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0B1221] border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-[900px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A2639]/40 border-b border-white/5">
                <th className="px-8 py-5 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">ID / Маршрут</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">Дата & Час</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">Транспорт / Водій</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">Заповн.</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">Дохід</th>
                <th className="px-6 py-5 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">Статус</th>
                <th className="px-8 py-5 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className="animate-spin text-[#ff6b35] mx-auto" size={40} />
                    <p className="text-[#5a6a85] text-[10px] uppercase font-black tracking-widest mt-4">Завантаження рейсів...</p>
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#5a6a85] mb-4">
                      <Search size={24} />
                    </div>
                    <p className="text-white font-black uppercase tracking-tight text-sm">Рейсів не знайдено</p>
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip, idx) => {
                  const fill = (trip.seatsTotal ?? 0) > 0
                    ? Math.round(((trip.seatsBooked ?? 0) / (trip.seatsTotal ?? 1)) * 100)
                    : 0;
                  const status = STATUS_MAP[trip.status] || STATUS_MAP.pending;
                  const isCancellable = trip.status !== 'cancelled' && trip.status !== 'completed';

                  return (
                    <motion.tr
                      key={trip.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* ID / Route */}
                      <td className="px-8 py-5">
                        <div className="space-y-1.5">
                          <span className="text-[12px] font-black text-[#ff6b35] uppercase tracking-[0.2em] italic font-syne opacity-80">
                            BUSNET{(trip.routeId || trip.id).substring(0, 4).toUpperCase()}
                          </span>
                          <h4 className="text-[11px] font-black text-white tracking-widest uppercase">
                            {trip.name || `${trip.from} - ${trip.to}`}
                          </h4>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-[#5a6a85]" />
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-black text-white tracking-widest uppercase">
                              {trip.departureDate ? new Date(trip.departureDate).toLocaleDateString() : 'Регулярний'}
                            </p>
                            <p className="text-[9px] font-black text-[#8899b5] uppercase tracking-widest">
                              {trip.departureTime || '20:00'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Bus / Driver */}
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest text-[#8899b5]">
                            <Bus size={12} className="text-[#ff6b35]" />
                            {trip.busId || 'НЕ ПРИЗНАЧЕНО'}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest text-[#5a6a85]">
                            <User size={12} />
                            {trip.driverId || 'НЕ ПРИЗНАЧЕНО'}
                          </div>
                        </div>
                      </td>

                      {/* Seats fill */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                          <div className="w-full h-1 bg-[#1A2639] rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-1000 bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-500"
                              style={{ width: `${fill}%` }}
                            />
                          </div>
                          <span className="text-[8px] font-black text-white tracking-widest text-center">
                            {trip.seatsBooked ?? 0}/{trip.seatsTotal ?? trip.totalSeats ?? 50} <span className="text-[#5a6a85]">({fill}%)</span>
                          </span>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <Coins size={14} className="text-emerald-400" />
                          <span className="text-[11px] font-black text-emerald-400 tracking-widest">
                            €{(((trip.seatsBooked ?? 0) * (trip.price ?? (trip as any)._raw?.outbound?.stops?.[(trip as any)._raw?.outbound?.stops?.length - 1]?.price ?? 0))).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${status.bg} ${status.color} ${status.border} ${status.glow || ''}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {/* 👁 View */}
                          <button
                            onClick={() => handleView(trip)}
                            title="Переглянути маршрут"
                            className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-[#8899b5] hover:text-white hover:bg-white/[0.06] hover:border-white/20 transition-all"
                          >
                            <Eye size={14} />
                          </button>

                          {/* ✏️ Edit */}
                          <button
                            onClick={() => handleEdit(trip)}
                            title="Редагувати маршрут"
                            className="p-2 rounded-lg bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#ff6b35] hover:bg-[#ff6b35]/20 hover:border-[#ff6b35]/40 transition-all shadow-[0_0_10px_rgba(255,107,53,0)] hover:shadow-[0_0_10px_rgba(255,107,53,0.3)]"
                          >
                            <Edit size={14} />
                          </button>

                          {/* 🗺 Live (Book icon in screenshot?) */}
                          <button
                            onClick={() => navigate('/livetrips?route=' + (trip.routeId || trip.id))}
                            title="Live трекінг"
                            className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-[0_0_10px_rgba(16,185,129,0)] hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          >
                            <MapPin size={14} />
                          </button>

                          {/* ❌ Cancel */}
                          {isCancellable && (
                            <button
                              onClick={() => handleCancel(trip.routeId || trip.id)}
                              disabled={cancelling === (trip.routeId || trip.id)}
                              title="Скасувати маршрут"
                              className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all shadow-[0_0_10px_rgba(244,63,94,0)] hover:shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                            >
                              {cancelling === (trip.routeId || trip.id)
                                ? <Loader2 size={14} className="animate-spin" />
                                : <XCircle size={14} />
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewRoute && (
        <RouteViewModal
          route={viewRoute}
          onClose={() => setViewRoute(null)}
          onEdit={() => handleEdit(viewRoute)}
        />
      )}
    </div>
  );
}
