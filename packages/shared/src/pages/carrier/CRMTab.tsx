import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Mail, Phone, Star, ArrowUpRight, MessageSquare,
  ChevronDown, X, Copy, Download, LayoutGrid, Table, Bus, Ticket,
  Globe, RotateCw
} from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { isAltransCarrier, fetchAltransLiveBookings } from '../../services/altransLiveService';

const EUR_TO_UAH_RATE = 44.6;

interface PassengerItem {
  id: string;
  source: 'busnet' | 'altrans';
  name: string;
  email: string;
  phone: string;
  tripsCount: number;
  lastTripDate: string;
  route: string;
  seatNumber?: string;
  rating: number;
  priceEur: number;
  priceUah: number;
  status: string;
}

const CRMTab: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [passengers, setPassengers] = useState<PassengerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncingAltrans, setIsSyncingAltrans] = useState(false);
  const [activeFolder, setActiveFolder] = useState<'busnet' | 'altrans' | 'all'>('busnet');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'tripsCount' | 'priceEur'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Швидке завантаження з Supabase за 0.2 секунди
  const loadCRMData = async () => {
    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.warn('Supabase CRM fetch error:', error);

      const itemsMap = new Map<string, PassengerItem>();

      (bookings || []).forEach((b: any) => {
        let pList = b.passengers || [];
        if (typeof pList === 'string') {
          try { pList = JSON.parse(pList); } catch { pList = []; }
        }
        if (!Array.isArray(pList) || pList.length === 0) {
          pList = [{ firstName: b.passenger_name || 'Пасажир' }];
        }

        const rawPrice = Number(b.total_price || b.totalPrice || 0);
        const isUah = b.currency === 'UAH' || b.currency === 'грн';
        const priceEur = isUah ? Math.round(rawPrice / EUR_TO_UAH_RATE) : rawPrice;
        const priceUah = isUah ? rawPrice : Math.round(rawPrice * EUR_TO_UAH_RATE);

        const contactObj = typeof b.contact === 'string'
          ? (() => { try { return JSON.parse(b.contact); } catch { return {}; } })()
          : (b.contact || {});

        const route = b.route_name || (b.route_from && b.route_to ? `${b.route_from} ➔ ${b.route_to}` : 'Рейс');

        pList.forEach((p: any) => {
          const rawName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || b.passenger_name || 'Пасажир';
          const realPhone = (p.phone || p.tel || contactObj.phone || b.phone || '').trim();
          const realEmail = (p.email || contactObj.email || b.email || '').trim();

          const isAltransMock = b.id?.startsWith('altrans_') || rawName.includes('Місце');
          const source: 'busnet' | 'altrans' = isAltransMock ? 'altrans' : 'busnet';

          const key = `${source}_${b.id}_${rawName}`;

          itemsMap.set(key, {
            id: b.id,
            source,
            name: rawName,
            email: realEmail || '—',
            phone: realPhone || '—',
            tripsCount: 1,
            lastTripDate: b.departure_date || (b.created_at ? new Date(b.created_at).toLocaleDateString('uk-UA') : 'Нещодавно'),
            route,
            seatNumber: p.seat || b.seat || undefined,
            rating: 4.9,
            priceEur,
            priceUah,
            status: b.status || 'confirmed',
          });
        });
      });

      setPassengers(Array.from(itemsMap.values()));
    } catch (err) {
      console.error('CRM load error:', err);
    } finally {
      setLoading(false); // Знімає сірі рамки одразу!
    }
  };

  useEffect(() => {
    loadCRMData();
  }, [user]);

  // Ручна синхронізація з Al-Trans (тільки якщо ти сама натиснеш кнопку)
  const handleManualAltransSync = async () => {
    setIsSyncingAltrans(true);
    const toastId = toast.loading('Опитуємо сервери Al-Trans...');
    try {
      const live = await fetchAltransLiveBookings();
      toast.success(`Отримано ${live.length} касових місць!`, { id: toastId });
      loadCRMData();
    } catch (e) {
      toast.error('Сервер Al-Trans не відповідає', { id: toastId });
    } finally {
      setIsSyncingAltrans(false);
    }
  };

  const busnetCount = useMemo(() => passengers.filter(p => p.source === 'busnet').length, [passengers]);
  const altransCount = useMemo(() => passengers.filter(p => p.source === 'altrans').length, [passengers]);

  const filtered = useMemo(() => {
    let list = passengers;

    if (activeFolder === 'busnet') {
      list = list.filter(p => p.source === 'busnet');
    } else if (activeFolder === 'altrans') {
      list = list.filter(p => p.source === 'altrans');
    }

    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;

    const digits = q.replace(/\D/g, '');
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.route.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (digits.length >= 3 && p.phone.replace(/\D/g, '').includes(digits))
    );
  }, [passengers, activeFolder, searchTerm]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDirection]);

  const handleCopy = (text: string, label: string) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} скопійовано!`);
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('Немає даних для експорту');
      return;
    }
    const headers = ['Джерело', 'Пасажир', 'Телефон', 'Email', 'Маршрут', 'Поїздок', 'Остання поїздка', 'Ціна (EUR)', 'Ціна (UAH)'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(p => `"${p.source}","${p.name}","${p.phone}","${p.email}","${p.route}",${p.tripsCount},"${p.lastTripDate}",${p.priceEur},${p.priceUah}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `busnet_crm_${activeFolder}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Експорт завершено');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-12">
      {/* Заголовок */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-7 bg-[#00E5FF] rounded-full shadow-[0_0_12px_rgba(0,229,255,0.6)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
              Клієнтська база та CRM
            </h2>
          </div>
          <p className="text-slate-400 text-xs font-semibold ml-5">
            Пасажири платформи Busnet та касові місця перевізника
          </p>
        </div>

        {/* Перемикач: Картки / Таблиця */}
        <div className="flex items-center gap-2 bg-[#0B1221] border border-white/10 p-1 rounded-2xl shadow-xl">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'cards'
                ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <LayoutGrid size={15} /> Картки
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'table'
                ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <Table size={15} /> Таблиця
          </button>
        </div>
      </div>

      {/* Папки */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveFolder('busnet')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${activeFolder === 'busnet'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                : 'bg-[#0B1221] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
          >
            <Globe size={16} className={activeFolder === 'busnet' ? 'text-cyan-400' : 'text-slate-500'} />
            <span>Клієнти Busnet (З сайту)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${activeFolder === 'busnet' ? 'bg-cyan-400 text-black' : 'bg-white/10 text-slate-300'
              }`}>
              {busnetCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFolder('altrans')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${activeFolder === 'altrans'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                : 'bg-[#0B1221] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
          >
            <Bus size={16} className={activeFolder === 'altrans' ? 'text-purple-400' : 'text-slate-500'} />
            <span>Каса Al-Trans (API)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${activeFolder === 'altrans' ? 'bg-purple-400 text-black' : 'bg-white/10 text-slate-300'
              }`}>
              {altransCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFolder('all')}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${activeFolder === 'all'
                ? 'bg-white/15 text-white border-white/40'
                : 'bg-[#0B1221] text-slate-400 border-white/5 hover:text-white'
              }`}
          >
            <Users size={16} />
            <span>Усі ({passengers.length})</span>
          </button>
        </div>

        {/* Кнопка ручного оновлення каси Al-Trans */}
        <button
          onClick={handleManualAltransSync}
          disabled={isSyncingAltrans}
          className="bg-purple-600/20 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white rounded-2xl px-4 py-3 text-xs font-bold transition-all flex items-center gap-2 shrink-0"
        >
          <RotateCw size={14} className={isSyncingAltrans ? 'animate-spin' : ''} />
          {isSyncingAltrans ? 'Синхронізація...' : 'Оновити касу Al-Trans'}
        </button>
      </div>

      {/* Пошук та Експорт */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 bg-[#0B1221] border border-white/5 p-3 rounded-2xl shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Пошук за ім'ям, телефоном, email, маршрутом або квитком..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A2639]/50 border border-transparent rounded-xl pl-11 pr-10 py-3 text-xs text-white focus:border-[#00E5FF]/40 outline-none transition-all placeholder-slate-500 font-medium"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-[#00E5FF] hover:bg-white text-black rounded-xl px-6 py-3 text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,229,255,0.25)] flex items-center gap-2 shrink-0"
        >
          <Download size={14} /> Експорт CSV
        </button>
      </div>

      {/* ВМІСТ: КАРТКИ ЧИ ТАБЛИЦЯ */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-[#0B1221] border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4 bg-[#0B1221] border border-white/5 rounded-3xl">
          <Users className="text-slate-700" size={60} />
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Пасажирів не знайдено</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sorted.map((p, idx) => {
              const isBusnet = p.source === 'busnet';
              return (
                <motion.div
                  key={p.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between group shadow-xl ${isBusnet
                      ? 'bg-gradient-to-b from-[#0F1A2E] to-[#0B1221] border-cyan-500/30 hover:border-cyan-400'
                      : 'bg-[#0B1221] border-white/10 hover:border-purple-400/50'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isBusnet
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      }`}>
                      {isBusnet ? <Globe size={11} /> : <Bus size={11} />}
                      {isBusnet ? 'Клієнт сайту Busnet' : 'Каса Al-Trans API'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {p.lastTripDate}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                          <Ticket size={12} className="text-cyan-400 shrink-0" />
                          <span className="truncate">{p.route}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-[#00E5FF] font-mono block">
                          €{p.priceEur}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          ≈ {p.priceUah.toLocaleString('uk-UA')} грн
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-1.5 border-t border-white/5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-2 text-slate-400">
                          <Phone size={13} className="text-cyan-400" />
                          {p.phone !== '—' ? (
                            <span className="font-mono font-bold text-white">{p.phone}</span>
                          ) : (
                            <span className="text-slate-600 italic">Телефон не вказано</span>
                          )}
                        </span>
                        {p.phone !== '—' && (
                          <button onClick={() => handleCopy(p.phone, 'Телефон')} className="text-slate-500 hover:text-cyan-400 p-1">
                            <Copy size={12} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-2 text-slate-400 truncate">
                          <Mail size={13} className="text-purple-400 shrink-0" />
                          {p.email !== '—' ? (
                            <span className="font-medium text-slate-300 truncate">{p.email}</span>
                          ) : (
                            <span className="text-slate-600 italic">Email відсутній</span>
                          )}
                        </span>
                        {p.email !== '—' && (
                          <button onClick={() => handleCopy(p.email, 'Email')} className="text-slate-500 hover:text-cyan-400 p-1">
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Квиток #{p.id.slice(-8)}
                    </span>

                    <div className="flex items-center gap-2">
                      {p.phone !== '—' && (
                        <>
                          <a
                            href={`https://wa.me/${p.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 transition-all"
                            title="WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </a>
                          <a
                            href={`tel:${p.phone}`}
                            className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-500/20 transition-all"
                            title="Дзвінок"
                          >
                            <Phone size={14} />
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => toast(`Пасажир: ${p.name}\nКвиток: ${p.id}\nМаршрут: ${p.route}\nСума: €${p.priceEur}`, { icon: '🎫' })}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-[#0B1221] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left min-w-[750px]">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white/[0.02]">
                <th className="py-4 px-6">Пасажир</th>
                <th className="py-4 px-6">Джерело</th>
                <th className="py-4 px-6">Контакти</th>
                <th className="py-4 px-6">Маршрут / Дата</th>
                <th className="py-4 px-6">Сума (LTV)</th>
                <th className="py-4 px-6 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {sorted.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 px-6">
                    <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{p.name}</p>
                    <span className="text-[10px] text-slate-500 font-mono">Квиток {p.id.slice(-8)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${p.source === 'busnet' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                      }`}>
                      {p.source === 'busnet' ? 'Busnet Web' : 'Al-Trans API'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-mono text-white">{p.phone}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.email}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-slate-200">{p.route}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{p.lastTripDate}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-black text-cyan-400 font-mono">€{p.priceEur}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">≈ {p.priceUah.toLocaleString('uk-UA')} грн</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.phone !== '—' && (
                        <a
                          href={`https://wa.me/${p.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all"
                        >
                          <MessageSquare size={13} />
                        </a>
                      )}
                      <button
                        onClick={() => toast(`Пасажир: ${p.name}\nКвиток: ${p.id}\nСума: €${p.priceEur}`, { icon: '🎫' })}
                        className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all"
                      >
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CRMTab;