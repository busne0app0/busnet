/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, MoreHorizontal, MessageSquare, 
  Calendar, MapPin, Users, Briefcase,
  CheckCircle2, Clock, Check, X,
  DollarSign, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CRM_DEALS, TASKS as INITIAL_TASKS } from './constants';

export default function CRM() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [newDeal, setNewDeal] = useState({ name: '', route: '', price: '', note: '' });
  const navigate = useNavigate();

  const handleCreateDeal = () => {
    if (!newDeal.name || !newDeal.route) return;
    toast.success(`Угоду для ${newDeal.name} створено!`);
    setShowNewDealModal(false);
    setNewDeal({ name: '', route: '', price: '', note: '' });
  };

  const toggleTask = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].done = !newTasks[index].done;
    setTasks(newTasks);
    if (newTasks[index].done) {
      toast.success('Завдання виконано!', { icon: '👏' });
    }
  };

  const deleteTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    toast.error('Завдання видалено');
  };

  const DealCard = ({ d, closed = false }: { d: any, closed?: boolean }) => (
    <div className="bg-[#121824] border border-white/5 rounded-2xl p-4 group hover:border-white/10 transition-all cursor-pointer">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#7c5cfc] flex items-center justify-center font-bold text-white text-[10px] shrink-0">
          {d.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white truncate">{d.name}</div>
          {closed && <div className="text-[10px] font-black text-[#00d97e] mt-0.5">+{d.comm}</div>}
        </div>
        <button className="text-[#4a5c72] hover:text-white transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-[10px] text-[#7a8fa8] font-bold tracking-tight">
          <MapPin size={10} className="text-[#4a5c72]" /> {d.route}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#7a8fa8] font-bold tracking-tight">
          <Calendar size={10} className="text-[#4a5c72]" /> {d.date} {d.pax ? `· ${d.pax} пас.` : ''}
        </div>
      </div>
      {d.note && (
        <div className="bg-black/20 p-2 rounded-lg text-[9px] text-[#4a5c72] leading-relaxed mb-4 italic">
          {d.note}
        </div>
      )}
      {!closed && (
        <div className="flex gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/book');
            }} 
            className="flex-1 py-1.5 bg-[#00d97e1a] text-[#00d97e] border border-[#00d97e26] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#00d97e2e] transition-all"
          >
            Забронювати
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toast.success(`Чат з ${d.name}`);
              navigate('/chat');
            }} 
            className="flex-1 py-1.5 bg-[#7c5cfc1a] text-[#a28afd] border border-[#7c5cfc26] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#7c5cfc2e] transition-all"
          >
            Написати
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1280px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
            CRM / Угоди
          </h1>
          <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
            Управління клієнтами та воронкою продажів
          </p>
        </div>
        <button 
          onClick={() => setShowNewDealModal(true)}
          className="px-4 py-2 bg-[#7c5cfc] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={14} /> Нова угода
        </button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 pt-2 border-t-2 border-[#ff9d00]">
            <h3 className="text-[10px] font-black text-[#ff9d00] uppercase tracking-widest">Нові ліди</h3>
            <span className="bg-[#ff9d001a] text-[#ff9d00] px-2 py-0.5 rounded-full text-[10px] font-black">3</span>
          </div>
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-4 space-y-3 min-h-[400px]">
            {CRM_DEALS.new.map((d, i) => <DealCard key={i} d={d} />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 pt-2 border-t-2 border-[#7c5cfc]">
            <h3 className="text-[10px] font-black text-[#a28afd] uppercase tracking-widest">В роботі</h3>
            <span className="bg-[#7c5cfc1a] text-[#a28afd] px-2 py-0.5 rounded-full text-[10px] font-black">5</span>
          </div>
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-4 space-y-3 min-h-[400px]">
            {CRM_DEALS.inProgress.map((d, i) => <DealCard key={i} d={d} />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 pt-2 border-t-2 border-[#00d97e]">
            <h3 className="text-[10px] font-black text-[#00d97e] uppercase tracking-widest">Закрито (цей місяць)</h3>
            <span className="bg-[#00d97e1a] text-[#00d97e] px-2 py-0.5 rounded-full text-[10px] font-black">14</span>
          </div>
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-4 space-y-3 min-h-[400px]">
            {CRM_DEALS.closed.map((d, i) => <DealCard key={i} d={d} closed />)}
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <h3 className="font-['Syne'] font-bold text-sm tracking-tight flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#00d97e]" /> Завдання та нагадування
          </h3>
          <button 
            onClick={() => toast.success('Нове завдання...')}
            className="text-[10px] text-[#7a8fa8] hover:text-white uppercase font-black transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Завдання
          </button>
        </div>
        <div className="p-2">
          {tasks.map((t, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 transition-all group border-b border-white/[0.02] last:border-0 overflow-hidden">
              <button 
                onClick={() => toggleTask(i)}
                className={`
                w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
                ${t.done ? 'bg-[#00d97e] border-[#00d97e] text-black' : 'border-white/10 hover:border-[#a28afd]'}
              `}>
                {t.done && <Check size={14} />}
              </button>
              <div className={`flex-1 min-w-0 ${t.done ? 'opacity-40 grayscale line-through' : ''}`}>
                <div className="text-sm font-bold text-white truncate">{t.text}</div>
                <div className="text-[10px] text-[#4a5c72] font-black uppercase tracking-widest mt-1 italic">Дедлайн: {t.deadline}</div>
              </div>
              <span className={`
                px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] shrink-0
                ${t.priority === 'urgent' ? 'bg-[#ff3d5a1a] text-[#ff3d5a] border border-[#ff3d5a33]' : ''}
                ${t.priority === 'high' ? 'bg-[#ff9d001a] text-[#ff9d00] border border-[#ff9d0033]' : ''}
                ${t.priority === 'normal' ? 'bg-[#121824] text-[#4a5c72] border border-white/10' : ''}
              `}>
                {t.priority === 'urgent' ? 'Терміново' : t.priority === 'high' ? 'Важливо' : 'Звичайний'}
              </span>
              <button onClick={() => {
                const newTasks = tasks.filter((_, idx) => idx !== i);
                setTasks(newTasks);
                toast.success('Завдання видалено');
              }} className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 bg-[#ff3d5a12] text-[#ff3d5a] flex items-center justify-center transition-all hover:bg-[#ff3d5a24]">
                <Plus size={16} className="rotate-45" />
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* New Deal Modal */}
      <AnimatePresence>
        {showNewDealModal && (
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
              className="w-full max-w-md bg-[#0d1119] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-['Syne'] font-black text-sm uppercase italic tracking-tight">Нова угода</h3>
                <button onClick={() => setShowNewDealModal(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#4a5c72]"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Контактна особа</label>
                  <input 
                    type="text" 
                    value={newDeal.name}
                    onChange={(e) => setNewDeal({...newDeal, name: e.target.value})}
                    placeholder="Ім'я та Прізвище" 
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-4 font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Маршрут</label>
                  <input 
                    type="text" 
                    value={newDeal.route}
                    onChange={(e) => setNewDeal({...newDeal, route: e.target.value})}
                    placeholder="Напр. Київ — Берлін" 
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-4 font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Сума (€)</label>
                    <input 
                      type="number" 
                      value={newDeal.price}
                      onChange={(e) => setNewDeal({...newDeal, price: e.target.value})}
                      placeholder="0.00" 
                      className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-4 font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Джерело</label>
                    <select className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc]">
                      <option>Месенджер</option><option>Дзвінок</option><option>Сайт</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Примітка</label>
                  <textarea 
                    value={newDeal.note}
                    onChange={(e) => setNewDeal({...newDeal, note: e.target.value})}
                    placeholder="Деталі запиту..." 
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-4 font-bold text-white outline-none focus:border-[#7c5cfc] transition-all min-h-[80px]" 
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setShowNewDealModal(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#7a8fa8] hover:text-white transition-all">Скасувати</button>
                  <button 
                    onClick={handleCreateDeal}
                    className="flex-1 py-3 bg-[#7c5cfc] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Створити
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
