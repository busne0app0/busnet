/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Download, MoreHorizontal, 
  ExternalLink, Mail, Trash2, ChevronRight,
  User, MapPin, Calendar, Clock, History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BOOKINGS_DATA, PASSENGERS_DATA } from './constants';

const TABS = [
  { id: 'all', label: 'Всі', count: 12, type: 'green' },
  { id: 'active', label: 'Активні', count: 8, type: 'green' },
  { id: 'own', label: 'Власні', count: 4, type: 'purple' },
  { id: 'done', label: 'Завершені' },
  { id: 'cancelled', label: 'Скасовано' },
];

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const DYNAMIC_TABS = [
    { id: 'all', label: 'Всі', count: BOOKINGS_DATA.length, type: 'green' },
    { id: 'active', label: 'Активні', count: BOOKINGS_DATA.filter(b => ['onboard', 'booked'].includes(b.status)).length, type: 'green' },
    { id: 'own', label: 'Власні', count: BOOKINGS_DATA.filter(b => b.type === 'own').length, type: 'purple' },
    { id: 'done', label: 'Завершені' },
    { id: 'cancelled', label: 'Скасовано' },
  ];

  const handleCancel = (id: string) => {
    if (window.confirm(`Ви впевнені, що хочете скасувати бронювання ${id}?`)) {
      toast.success(`Запит на скасування ${id} надіслано диспетчеру`);
    }
  };

  const STATUS_MAP: Record<string, { label: string, color: string, bg: string }> = {
    onboard: { label: 'В дорозі', color: 'text-[#00d97e]', bg: 'bg-[#00d97e1a] border-[#00d97e26]' },
    booked: { label: 'Заброньовано', color: 'text-[#a28afd]', bg: 'bg-[#7c5cfc1a] border-[#7c5cfc2b]' },
    completed: { label: 'Завершено', color: 'text-[#00c4d4]', bg: 'bg-[#00c4d41a] border-[#00c4d42b]' },
    cancelled: { label: 'Скасовано', color: 'text-[#ff3d5a]', bg: 'bg-[#ff3d5a1a] border-[#ff3d5a2b]' },
  };

  const filteredBookings = BOOKINGS_DATA.filter(b => {
    if (searchQuery && !b.pax.toLowerCase().includes(searchQuery.toLowerCase()) && !b.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeTab === 'own' && b.type !== 'own') return false;
    if (activeTab === 'active' && !['onboard', 'booked'].includes(b.status)) return false;
    if (activeTab === 'done' && b.status !== 'completed') return false;
    if (activeTab === 'cancelled' && b.status !== 'cancelled') return false;
    
    if (filterType === 'own' && b.type !== 'own') return false;
    if (filterType === 'busnet' && b.type !== 'busnet') return false;
    
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white">
            Мої бронювання
          </h1>
          <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
            Всі квитки оформлені вами
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a5c72] group-focus-within:text-[#7c5cfc] transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Пошук за пасажиром, рейсом..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#121824] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc] transition-all w-[240px]"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-[#121824] border border-white/5 rounded-xl py-2 px-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc] appearance-none cursor-pointer">
            <option value="all">Всі типи</option><option value="own">Власні (10%)</option><option value="busnet">BUSNET (5%)</option>
          </select>
          <button 
            onClick={() => {
              const headers = ['ID','Пасажир','Маршрут','Рейс','Дата','Тип','Статус','Комісія'];
              const rows = filteredBookings.map(b => [b.id, b.pax, b.route, b.trip, b.date, b.type === 'own' ? 'Власні 10%' : 'BUSNET 5%', b.status, `€${b.comm.toFixed(2)}`]);
              const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `bookings_${new Date().toISOString().slice(0,10)}.csv`;
              a.click(); URL.revokeObjectURL(url);
              toast.success('CSV файл завантажено');
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#7a8fa8] hover:text-white transition-all flex items-center gap-2"
          >
            <Download size={14} /> Експорт
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#121824] rounded-xl w-fit">
        {DYNAMIC_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2
              ${activeTab === tab.id 
                ? 'bg-[#1a2234] text-white shadow-xl shadow-black/40' 
                : 'text-[#7a8fa8] hover:text-white'}
            `}
          >
            {tab.label}
            {tab.count && (
              <span className={`
                text-[8px] font-black px-1.5 py-0.5 rounded-full
                ${tab.type === 'green' ? 'bg-[#00d97e] text-black' : 'bg-[#7c5cfc] text-white'}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Бронювання</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Пасажир</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Маршрут</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Рейс</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Дата</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Тип</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Статус</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5 text-right">Комісія</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredBookings.map((b, i) => {
                const status = STATUS_MAP[b.status];
                const pax = PASSENGERS_DATA.find(p => p.name === b.pax);
                return (
                  <motion.tr 
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-white/[0.015] transition-all"
                  >
                    <td className="px-6 py-4">
                      <span className="font-['Syne'] font-black text-[#a28afd] text-xs tracking-tight">{b.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shrink-0" style={{ backgroundColor: pax?.av || '#7c5cfc' }}>
                          {b.pax[0]}
                        </div>
                        <span className="text-xs font-bold text-white">{b.pax}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-[#7a8fa8] font-medium italic">{b.route}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-[#7c5cfc] italic tracking-tighter">{b.trip}</span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-[#7a8fa8] font-bold">{b.date}</td>
                    <td className="px-6 py-4">
                      <span className={`
                        text-[8px] font-black px-1.5 py-0.5 rounded uppercase border
                        ${b.type === 'own' ? 'bg-[#7c5cfc1a] text-[#a28afd] border-[#7c5cfc2b]' : 'bg-[#00c4d41a] text-[#00c4d4] border-[#00c4d42b]'}
                      `}>
                        {b.type === 'own' ? 'СВОЇ 10%' : 'BUSNET 5%'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-xs font-black text-[#a28afd] tracking-tight">€{b.comm.toFixed(2)}</div>
                      <div className="text-[9px] font-bold text-[#4a5c72] mt-0.5">€{b.price} квиток</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 pr-2">
                        <button onClick={() => setSelectedBooking(b)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#4a5c72] hover:text-white hover:bg-[#7c5cfc] transition-all">
                          <ExternalLink size={12} />
                        </button>
                        <button onClick={() => toast.success('Квиток надіслано')} className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#4a5c72] hover:text-white hover:bg-[#a28afd] transition-all">
                          <Mail size={12} />
                        </button>
                        {b.status === 'booked' && (
                          <button onClick={() => handleCancel(b.id)} className="w-7 h-7 rounded-lg bg-[#ff3d5a0a] border border-[#ff3d5a1f] flex items-center justify-center text-[#ff3d5a] hover:bg-[#ff3d5a] hover:text-white transition-all">
                            <Trash2 size={12} />
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
        {filteredBookings.length === 0 && (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[#4a5c72] mb-4">
              <History size={32} />
            </div>
            <div className="text-sm font-bold text-[#7a8fa8] uppercase tracking-widest">Нічого не знайдено</div>
            <p className="text-xs text-[#4a5c72] mt-1">Спробуйте змінити параметри пошуку або вкладку</p>
          </div>
        )}
      </div>
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="w-full max-w-md bg-[#0d1119] border border-white/10 rounded-[32px] shadow-2xl p-8 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-['Syne'] font-black text-[#a28afd] text-lg italic">{selectedBooking.id}</span>
              <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#4a5c72]">✕</button>
            </div>
            {[
              { label: 'Пасажир', val: selectedBooking.pax },
              { label: 'Маршрут', val: selectedBooking.route },
              { label: 'Рейс', val: selectedBooking.trip },
              { label: 'Дата', val: selectedBooking.date },
              { label: 'Місце', val: selectedBooking.seat },
              { label: 'Ціна квитка', val: `€${selectedBooking.price}` },
              { label: 'Тип / Комісія', val: `${selectedBooking.type === 'own' ? 'Власні 10%' : 'BUSNET 5%'} → €${selectedBooking.comm.toFixed(2)}` },
              { label: 'Статус', val: selectedBooking.status },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-[#4a5c72] font-black uppercase tracking-widest text-[9px]">{item.label}</span>
                <span className="text-white font-bold">{item.val}</span>
              </div>
            ))}
            <button onClick={() => setSelectedBooking(null)} className="w-full mt-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-[#7a8fa8] hover:text-white transition-all">
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

