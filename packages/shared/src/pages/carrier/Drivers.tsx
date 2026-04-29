/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle2, Star, Plus, X,
  Phone, Mail, Calendar, 
  MapPin, ShieldCheck, ChevronRight,
  UserCheck2, Clock, MoreVertical, Loader2, Search, Trash2
} from 'lucide-react';
import { useDrivers, Driver } from '@busnet/shared/hooks/useDrivers';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function Drivers() {
  const { user } = useAuthStore();
  const { drivers, loading, fetchDrivers, addDriver, updateDriver, deleteDriver } = useDrivers();
  
  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    licenseNumber: ''
  });

  useEffect(() => {
    if (user) {
      fetchDrivers(user.uid);
    }
  }, [user, fetchDrivers]);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAdding(true);
    const toastId = toast.loading('Додавання водія...');
    try {
      await addDriver({
        carrierId: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        rating: 5.0,
        status: 'active'
      });
      toast.success('Водія успішно додано!', { id: toastId });
      setIsAddingModalOpen(false);
      setFormData({ firstName: '', lastName: '', phone: '', licenseNumber: '' });
    } catch (error) {
      toast.error('Помилка при додаванні', { id: toastId });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteDriver = async (id: string, name: string) => {
    if (!user || !confirm(`Видалити водія ${name}?`)) return;
    const toastId = toast.loading('Видалення...');
    try {
      await deleteDriver(id, user.uid);
      toast.success('Водія видалено з системи', { id: toastId });
    } catch (error) {
      toast.error('Помилка при видаленні', { id: toastId });
    }
  };

  const handleToggleStatus = async (driver: Driver) => {
    if (!user) return;
    const nextStatus: Driver['status'][] = ['active', 'resting', 'inactive'];
    const currentIdx = nextStatus.indexOf(driver.status);
    const newStatus = nextStatus[(currentIdx + 1) % nextStatus.length];
    
    const toastId = toast.loading('Зміна статусу...');
    try {
      await updateDriver(driver.id, user.uid, { status: newStatus });
      toast.success('Статус оновлено', { id: toastId });
    } catch (error) {
      toast.error('Помилка оновлення статусу', { id: toastId });
    }
  };

  const activeCount = drivers.filter(d => d.status === 'active' || d.status === 'on_trip').length;
  const avgRating = drivers.length > 0 
    ? (drivers.reduce((acc, d) => acc + d.rating, 0) / drivers.length).toFixed(1)
    : '5.0';
    
  return (
    <div className="space-y-8 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-syne font-black text-3xl italic tracking-tighter uppercase text-white">Водії</h2>
          <p className="text-[#5a6a85] text-sm font-medium mt-1 uppercase tracking-widest">Управління командою професіоналів</p>
        </div>
        <button 
          onClick={() => setIsAddingModalOpen(true)}
          className="px-6 py-2 bg-gradient-to-r from-[#ff6b35] to-[#cc3300] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> 
          Додати водія
        </button>
      </div>

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
              <h3 className="text-xl font-black italic uppercase text-white mb-6">Новий Водій</h3>
              
              <form onSubmit={handleAddDriver} className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">Ім'я</label>
                       <input 
                         required
                         value={formData.firstName}
                         onChange={e => setFormData({...formData, firstName: e.target.value})}
                         className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff6b35] outline-none transition-colors" 
                         placeholder="Олександр"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">Прізвище</label>
                       <input 
                         required
                         value={formData.lastName}
                         onChange={e => setFormData({...formData, lastName: e.target.value})}
                         className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff6b35] outline-none transition-colors" 
                         placeholder="Коваль"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">Номер телефону</label>
                    <input 
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff6b35] outline-none transition-colors" 
                      placeholder="+380 50 123 45 67"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">Номер посвідчення (Серія та номер)</label>
                    <input 
                      required
                      value={formData.licenseNumber}
                      onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff6b35] outline-none transition-colors uppercase" 
                      placeholder="ДЕ №123456"
                    />
                 </div>

                 <button 
                  type="submit"
                  disabled={isAdding}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-[#ff6b35] to-[#cc3300] text-white rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                 >
                   {isAdding ? <Loader2 size={16} className="animate-spin" /> : 'Зберегти водія'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всього водіїв', val: drivers.length.toString(), icon: UserCircle2, color: 'text-orange-500' },
          { label: 'На зміні', val: activeCount.toString(), icon: UserCheck2, color: 'text-emerald-500' },
          { label: 'Середній рейтинг', val: avgRating, icon: Star, color: 'text-amber-500' },
          { label: 'Перевірено', val: '100%', icon: ShieldCheck, color: 'text-cyan-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1a2235] border border-white/5 rounded-[32px] p-6 relative overflow-hidden">
             <p className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">{stat.label}</p>
             <h3 className="font-syne font-black text-2xl text-white italic tracking-tighter mt-1">{stat.val}</h3>
             <stat.icon size={48} className={`absolute -right-2 -bottom-2 opacity-[0.03] ${stat.color}`} />
          </div>
        ))}
      </div>

      <div className="bg-[#1a2235] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-[800px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Водій</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Посвідчення</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Стаж / Рейси</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Рейтинг</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Поточний рейс</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Статус</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#5a6a85] uppercase tracking-widest text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 size={48} className="animate-spin text-[#ff6b35] mx-auto mb-4" />
                    <p className="text-[#5a6a85] text-xs font-black uppercase tracking-widest">Завантаження...</p>
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                   <td colSpan={7} className="py-20 text-center">
                      <Search size={48} className="text-[#5a6a85] mx-auto mb-4 opacity-20" />
                      <p className="text-[#5a6a85] text-xs font-black uppercase tracking-widest">Команда порожня</p>
                   </td>
                </tr>
              ) : drivers.map((driver, idx) => (
                <motion.tr 
                  key={driver.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-white/[0.01] transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-700/20 flex items-center justify-center text-orange-500 font-bold border border-orange-500/20">
                        {driver.firstName.charAt(0)}
                      </div>
                      <div className="max-w-[200px]">
                        <h4 className="text-sm font-bold text-white tracking-tight leading-tight">{driver.firstName} {driver.lastName}</h4>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-xs text-[#8899b5] font-medium uppercase tracking-wider">{driver.licenseNumber}</td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white italic">12 р. стажу</p>
                      <p className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">284 рейсів</p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 w-fit">
                       <Star size={12} className="text-amber-400 fill-amber-400" />
                       <span className="text-xs font-black text-amber-400">{driver.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">—</span>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                      driver.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      driver.status === 'resting' ? 'bg-white/[0.05] text-[#5a6a85] border-white/5' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {driver.status === 'active' ? '● В роботі' : driver.status === 'resting' ? 'Вихідний' : 'Відпустка'}
                    </span>
                  </td>
                   <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => handleToggleStatus(driver)}
                         className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[#8899b5] hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all"
                         title="Змінити статус"
                       >
                          <UserCheck2 size={16} />
                       </button>
                       <button className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[#8899b5] hover:text-white transition-all">
                          <Phone size={16} />
                       </button>
                       <button 
                         onClick={() => handleDeleteDriver(driver.id, `${driver.firstName} ${driver.lastName}`)}
                         className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                         title="Видалити водія"
                       >
                          <Trash2 size={16} />
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

