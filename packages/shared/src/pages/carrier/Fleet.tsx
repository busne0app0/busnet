/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus as BusIcon, Settings, Wrench, Plus, 
  Trash2, Edit3, ChevronRight, X,
  CheckCircle2, AlertCircle, Info,
  Wifi, Battery, Wind, Coffee, Tv, Loader2
} from 'lucide-react';
import { useFleet, Bus } from '@busnet/shared/hooks/useFleet';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function Fleet() {
  const { user } = useAuthStore();
  const { buses, loading, fetchFleet, addBus, updateBus, deleteBus } = useFleet();
  
  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    model: '',
    number: '',
    capacity: 50,
    amenities: ['ac', 'usb'] as string[]
  });

  useEffect(() => {
    if (user) {
      fetchFleet(user.uid);
    }
  }, [user, fetchFleet]);

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id) 
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id]
    }));
  };

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAdding(true);
    const toastId = toast.loading('Додавання автобуса...');
    try {
      await addBus({
        carrierId: user.uid,
        number: formData.number,
        model: formData.model,
        capacity: Number(formData.capacity),
        status: 'active',
        amenities: formData.amenities,
        lastMaintenance: new Date().toISOString().split('T')[0]
      });
      toast.success('Автобус успішно додано!', { id: toastId });
      setIsAddingModalOpen(false);
      setFormData({ model: '', number: '', capacity: 50, amenities: ['ac', 'usb'] });
    } catch (error) {
      toast.error('Помилка при додаванні', { id: toastId });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBus = async (id: string, model: string) => {
    if (!user || !confirm(`Видалити ${model} з автопарку?`)) return;
    const toastId = toast.loading('Видалення...');
    try {
      await deleteBus(id, user.uid);
      toast.success('Транспортний засіб видалено', { id: toastId });
    } catch (error) {
      toast.error('Помилка при видаленні', { id: toastId });
    }
  };

  const handleToggleStatus = async (bus: Bus) => {
    if (!user) return;
    const newStatus = bus.status === 'active' ? 'maintenance' : 'active';
    const toastId = toast.loading('Оновлення статусу...');
    try {
      await updateBus(bus.id, user.uid, { status: newStatus });
      toast.success(`Статус змінено на ${newStatus === 'active' ? 'Активний' : 'ТО'}`, { id: toastId });
    } catch (error) {
      toast.error('Помилка при оновленні', { id: toastId });
    }
  };

  const activeCount = buses.filter(b => b.status === 'active').length;
  const maintenanceCount = buses.filter(b => b.status === 'maintenance').length;
  
  return (
    <div className="space-y-8 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-syne font-black text-3xl italic tracking-tighter uppercase text-white">Мій автопарк</h2>
          <p className="text-[#5a6a85] text-sm font-medium mt-1 uppercase tracking-widest">Управління транспортними засобами вашої компанії</p>
        </div>
        <button 
          onClick={() => setIsAddingModalOpen(true)}
          className="px-6 py-2 bg-gradient-to-r from-[#ff6b35] to-[#cc3300] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> 
          Додати автобус
        </button>
      </div>

      {/* AMENITIES MODAL */}
      <AnimatePresence>
        {isAddingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#1a2235] border border-white/10 rounded-[32px] p-8 relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setIsAddingModalOpen(false)}
                className="absolute top-6 right-6 text-[#5a6a85] hover:text-white transition-colors"
              >
                 <X size={24} />
              </button>
              <h3 className="text-xl font-black italic uppercase text-white mb-6">Новий Автобус</h3>
              
              <form onSubmit={handleAddBus} className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">Марка та модель (напр. Setra S 517)</label>
                    <input 
                      required
                      value={formData.model}
                      onChange={e => setFormData({...formData, model: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff6b35] outline-none transition-colors" 
                      placeholder="Mercedes Tourismo"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">Держ. номер</label>
                      <input 
                        required
                        value={formData.number}
                        onChange={e => setFormData({...formData, number: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff6b35] outline-none transition-colors uppercase" 
                        placeholder="АА 1234 КА"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">Кількість місць</label>
                      <input 
                        required
                        type="number"
                        min="1"
                        max="100"
                        value={formData.capacity}
                        onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff6b35] outline-none transition-colors" 
                      />
                    </div>
                 </div>

                 <div className="space-y-2 pt-2">
                    <label className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">Зручності</label>
                    <div className="flex flex-wrap gap-2">
                       {[
                         { id: 'wifi', label: 'Wi-Fi' },
                         { id: 'usb', label: 'USB' },
                         { id: 'ac', label: 'Клімат' },
                         { id: 'wc', label: 'Туалет' },
                         { id: 'coffee', label: 'Кава' },
                         { id: 'tv', label: 'Мультимедіа' }
                       ].map(amenity => {
                         const isSelected = formData.amenities.includes(amenity.id);
                         return (
                           <button
                             type="button"
                             key={amenity.id}
                             onClick={() => toggleAmenity(amenity.id)}
                             className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                               isSelected ? 'bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/50' : 'bg-black/30 text-[#5a6a85] border-white/5 hover:border-white/20'
                             }`}
                           >
                             {amenity.label}
                           </button>
                         )
                       })}
                    </div>
                 </div>

                 <button 
                  type="submit"
                  disabled={isAdding}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-[#ff6b35] to-[#cc3300] text-white rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                 >
                   {isAdding ? <Loader2 size={16} className="animate-spin" /> : 'Зберегти автобус'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всього автобусів', val: buses.length.toString(), icon: BusIcon, color: 'text-orange-500' },
          { label: 'Активних', val: activeCount.toString(), icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'На техобслуговуванні', val: maintenanceCount.toString(), icon: Wrench, color: 'text-amber-500' },
          { label: 'Справність парку', val: buses.length > 0 ? `${Math.round((activeCount / buses.length) * 100)}%` : '0%', icon: Settings, color: 'text-cyan-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1a2235] border border-white/5 rounded-[32px] p-6 relative overflow-hidden">
             <p className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">{stat.label}</p>
             <h3 className="font-syne font-black text-2xl text-white italic tracking-tighter mt-1">{stat.val}</h3>
             <stat.icon size={48} className={`absolute -right-2 -bottom-2 opacity-[0.03] ${stat.color}`} />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center">
             <Loader2 size={48} className="animate-spin text-[#ff6b35] mx-auto mb-4" />
             <p className="text-[#5a6a85] text-xs font-black uppercase tracking-widest">Завантаження автопарку...</p>
          </div>
        ) : buses.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
             <BusIcon size={48} className="text-[#5a6a85] mx-auto mb-4 opacity-20" />
             <p className="text-[#5a6a85] text-xs font-black uppercase tracking-widest">Автопарк порожній</p>
          </div>
        ) : buses.map((bus, idx) => (
          <motion.div
            key={bus.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#1a2235] border border-white/5 rounded-[32px] p-8 flex flex-col lg:flex-row lg:items-center gap-8 group hover:border-[#ff6b35]/20 transition-all"
          >
            <div className="w-16 h-16 rounded-[24px] bg-black/30 border border-white/5 flex items-center justify-center text-[#ff6b35] shrink-0 group-hover:bg-[#ff6b35]/10 transition-colors">
              <BusIcon size={32} />
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">{bus.model}</h3>
                <div className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[10px] font-black text-[#ff6b35] uppercase tracking-widest">{bus.number}</div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                  bus.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {bus.status === 'active' ? '● Активний' : '🔧 На ТО'}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { l: 'Місць', v: bus.capacity },
                  { l: 'Клас', v: 'Комфорт' },
                  { l: 'Пробіг', v: `124,000 км` },
                  { l: 'Статус', v: bus.status === 'active' ? 'Готовий' : 'В черзі' },
                ].map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-[9px] text-[#5a6a85] font-black uppercase tracking-widest">{item.l}</p>
                    <p className="text-sm font-bold text-white italic uppercase tracking-tighter">{item.v}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.02]">
                <div className="px-3 py-1 rounded-lg bg-black/20 text-[#5a6a85] text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Wrench size={10} /> Наступне ТО: <span className="text-white">{bus.lastMaintenance || '—'}</span>
                </div>
                <div className="flex items-center gap-4 ml-auto text-[#5a6a85]">
                   <Wifi size={14} />
                   <Battery size={14} />
                   <Wind size={14} />
                   <Tv size={14} />
                </div>
              </div>
            </div>

            <div className="flex lg:flex-col gap-2 shrink-0">
               <button className="flex-1 lg:flex-none p-3 bg-white/[0.03] border border-white/5 text-[#8899b5] rounded-2xl hover:text-white hover:bg-white/[0.07] transition-all">
                  <Edit3 size={18} />
               </button>
               <button 
                 onClick={() => handleToggleStatus(bus)}
                 title={bus.status === 'active' ? 'Відправити на ТО' : 'Повернути в роботу'}
                 className="flex-1 lg:flex-none p-3 bg-white/[0.03] border border-white/5 text-[#8899b5] rounded-2xl hover:text-cyan-400 hover:bg-cyan-500/10 transition-all font-bold"
               >
                  <Wrench size={18} />
               </button>
               <button 
                 onClick={() => handleDeleteBus(bus.id, bus.model)}
                 title="Видалити"
                 className="flex-1 lg:flex-none p-3 bg-rose-500/5 border border-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500/10 transition-all"
               >
                  <Trash2 size={18} />
               </button>
            </div>
          </motion.div>
        ))}

        <button 
          onClick={handleAddBus}
          disabled={isAdding}
          className="w-full py-8 border-2 border-dashed border-white/5 rounded-[32px] text-[#5a6a85] hover:text-[#ff6b35] hover:border-[#ff6b35]/20 hover:bg-[#ff6b35]/5 transition-all text-xs font-black uppercase tracking-widest flex flex-col items-center gap-3 group disabled:opacity-50"
        >
           <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center group-hover:scale-110 transition-transform">
              {isAdding ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
           </div>
           Додати ще один транспортний засіб
        </button>
      </div>
    </div>
  );
}
