/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Plus, Filter, 
  MessageSquare, UserPlus, MoreVertical,
  Star, Hash, History, ExternalLink, X,
  Mail, Phone, Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PASSENGERS_DATA } from './constants';

export default function PassengerBase() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPax, setNewPax] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const navigate = useNavigate();

  const handleSavePax = () => {
    if (!newPax.firstName.trim() || !newPax.lastName.trim()) {
      toast.error("Введіть ім'я та прізвище пасажира");
      return;
    }
    toast.success(`${newPax.firstName} ${newPax.lastName} додано до бази`);
    setShowAddModal(false);
    setNewPax({ firstName: '', lastName: '', phone: '', email: '' });
  };

  const filteredPassengers = PASSENGERS_DATA.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'own' && p.type !== 'own') return false;
    if (activeTab === 'busnet' && p.type !== 'busnet') return false;
    if (activeTab === 'inactive' && p.status !== 'inactive') return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto animate-in fade-in duration-500">
      {/* Add Passenger Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0d1119] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-['Syne'] font-black text-sm uppercase italic tracking-tight">Новий пасажир</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#4a5c72]"><X size={18} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Ім'я</label>
                    <input type="text" placeholder="Марія" value={newPax.firstName} onChange={(e) => setNewPax({...newPax, firstName: e.target.value})} className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Прізвище</label>
                    <input type="text" placeholder="Ковалець" value={newPax.lastName} onChange={(e) => setNewPax({...newPax, lastName: e.target.value})} className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Телефон</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a5c72]" size={14} />
                    <input type="tel" placeholder="+380" value={newPax.phone} onChange={(e) => setNewPax({...newPax, phone: e.target.value})} className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 pl-12 pr-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a5c72]" size={14} />
                    <input type="email" placeholder="example@mail.com" value={newPax.email} onChange={(e) => setNewPax({...newPax, email: e.target.value})} className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 pl-12 pr-6 text-sm font-medium text-white outline-none focus:border-[#7c5cfc]" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-[#7a8fa8] hover:text-white">Скасувати</button>
                  <button 
                    onClick={handleSavePax}
                    className="flex-[2] py-3 bg-[#7c5cfc] text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-purple-900/20"
                  >
                    Зберегти в базу
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
            База пасажирів
          </h1>
          <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
            Власні клієнти агента — захищені дані, зв'язок тільки через систему
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a5c72] group-focus-within:text-[#7c5cfc] transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Пошук за ім'ям..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#121824] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc] transition-all w-[240px]"
            />
          </div>
          <button 
            onClick={() => {
              toast.loading('Завантаження бази...', { duration: 1500 });
              setTimeout(() => {
                toast.success('Базу даних пасажирів синхронізовано з хмарою');
              }, 1500);
            }}
            className="px-4 py-2 bg-[#00d97e] text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            Зберегти в базу
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#7c5cfc] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <UserPlus size={14} /> Додати пасажира
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        <div className="bg-[#151c28] border border-white/5 rounded-[24px] p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#7c5cfc] to-[#a28afd]" />
          <div className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest mb-2">Всього пасажирів</div>
          <div className="font-['Syne'] text-2xl font-black text-white italic tracking-tighter leading-none mb-1">54</div>
          <div className="text-[10px] text-[#4a5c72]">у вашій базі</div>
          <Users size={32} className="absolute -right-2 -bottom-2 opacity-5 text-[#7c5cfc]" />
        </div>
        <div className="bg-[#151c28] border border-white/5 rounded-[24px] p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00d97e] to-[#009955]" />
          <div className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest mb-2">Активних (30 днів)</div>
          <div className="font-['Syne'] text-2xl font-black text-white italic tracking-tighter leading-none mb-1">21</div>
          <div className="text-[10px] text-[#4a5c72] font-bold text-[#00d97e]">купили квиток недавно</div>
          <History size={32} className="absolute -right-2 -bottom-2 opacity-5 text-[#00d97e]" />
        </div>
        <div className="bg-[#151c28] border border-white/5 rounded-[24px] p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00c4d4] to-[#007788]" />
          <div className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest mb-2">Власні (10%)</div>
          <div className="font-['Syne'] text-2xl font-black text-white italic tracking-tighter leading-none mb-1">17</div>
          <div className="text-[10px] text-[#4a5c72]">зовнішні клієнти</div>
          <Star size={32} className="absolute -right-2 -bottom-2 opacity-5 text-[#00c4d4]" />
        </div>
        <div className="bg-[#151c28] border border-white/5 rounded-[24px] p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#ff9d00] to-[#cc7700]" />
          <div className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest mb-2">Потребують уваги</div>
          <div className="font-['Syne'] text-2xl font-black text-white italic tracking-tighter leading-none mb-1">3</div>
          <div className="text-[10px] text-[#ff3d5a] font-bold">не їхали 90+ днів</div>
          <Filter size={32} className="absolute -right-2 -bottom-2 opacity-5 text-[#ff9d00]" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#121824] rounded-xl w-fit">
        {[
          { id: 'all', label: 'Всі' },
          { id: 'own', label: 'Власні (10%)', count: 17, type: 'purple' },
          { id: 'busnet', label: 'BUSNET (5%)', count: 37, type: 'green' },
          { id: 'inactive', label: 'Не активні', count: 3, type: 'orange' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2
              ${activeTab === tab.id 
                ? 'bg-[#1a2234] text-white' 
                : 'text-[#7a8fa8] hover:text-white'}
            `}
          >
            {tab.label}
            {tab.count && (
              <span className={`
                text-[8px] font-black px-1.5 py-0.5 rounded-full
                ${tab.type === 'purple' ? 'bg-[#7c5cfc] text-white' : ''}
                ${tab.type === 'green' ? 'bg-[#00d97e] text-black' : ''}
                ${tab.type === 'orange' ? 'bg-[#ff9d00] text-black' : ''}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-[800px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Пасажир</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Поїздок</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Остання поїздка</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Улюблений маршрут</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Тип</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Витрат</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Статус</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredPassengers.map((p, i) => (
                <motion.tr 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-white/[0.015] transition-all"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-[11px] shrink-0 border border-white/5 shadow-inner" style={{ backgroundColor: p.av }}>
                        {p.name[0]}
                      </div>
                      <span className="text-xs font-bold text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-white italic">{p.trips}</td>
                  <td className="px-6 py-4 text-[11px] text-[#7a8fa8] font-medium">{p.last}</td>
                  <td className="px-6 py-4 text-[11px] text-[#7a8fa8] font-bold italic tracking-tighter">{p.route}</td>
                  <td className="px-6 py-4">
                    <span className={`
                      text-[8px] font-black px-1.5 py-0.5 rounded uppercase border
                      ${p.type === 'own' ? 'bg-[#7c5cfc1a] text-[#a28afd] border-[#7c5cfc2b]' : 'bg-[#00c4d41a] text-[#00c4d4] border-[#00c4d42b]'}
                    `}>
                      {p.type === 'own' ? 'СВОЇ 10%' : 'BUSNET 5%'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-[#00d97e] tracking-tight">€{p.spent}</td>
                  <td className="px-6 py-4">
                    <span className={`
                      px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                      ${p.status === 'active' ? 'bg-[#00d97e1a] text-[#00d97e] border-[#00d97e26]' : ''}
                      ${p.status === 'inactive' ? 'bg-[#ff9d001a] text-[#ff9d00] border-[#ff9d0026]' : ''}
                      ${p.status === 'new' ? 'bg-[#00c4d41a] text-[#00c4d4] border-[#00c4d426]' : ''}
                    `}>
                      {p.status === 'active' ? 'Активний' : p.status === 'inactive' ? 'Неактивний' : 'Новий'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2 pr-2">
                      <button onClick={() => navigate('/chat')} className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#4a5c72] hover:text-white hover:bg-[#7c5cfc] transition-all">
                        <MessageSquare size={12} />
                      </button>
                      <button onClick={() => navigate('/book')} className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#4a5c72] hover:text-white hover:bg-[#a28afd] transition-all">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => toast.success('Профіль пасажира')} className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#4a5c72] hover:text-white hover:bg-white/10 transition-all">
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

