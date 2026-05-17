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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="w-12 h-1 bg-[#0EA5E9] mb-4 shadow-[0_0_10px_rgba(14,165,233,0.5)] rounded-full" />
          <h2 className="text-3xl font-black uppercase tracking-widest text-white">ВОДІЇ</h2>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest mt-2">Управління командою професіоналів</p>
        </div>
        <button 
          onClick={() => setIsAddingModalOpen(true)}
          className="px-6 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#0EA5E9] hover:text-white hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} strokeWidth={2.5} /> 
          ДОДАТИ ВОДІЯ
        </button>
      </div>

      <AnimatePresence>
        {isAddingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              className="w-full max-w-lg bg-[#0B1221] border border-[#0EA5E9]/20 rounded-[32px] p-8 relative z-10 shadow-[0_0_30px_rgba(14,165,233,0.1)]"
            >
              <button 
                onClick={() => setIsAddingModalOpen(false)}
                className="absolute top-6 right-6 text-[#5a6a85] hover:text-white transition-colors"
              >
                 <X size={24} />
              </button>
              <h3 className="text-xl font-black uppercase tracking-widest text-white mb-6">НОВИЙ ВОДІЙ</h3>
              
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
                  className="w-full mt-6 py-4 bg-[#0EA5E9] text-white rounded-full text-[11px] font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all disabled:opacity-50"
                 >
                   {isAdding ? <Loader2 size={16} className="animate-spin" /> : 'ЗБЕРЕГТИ ВОДІЯ'}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ВСЬОГО ВОДІЇВ', val: drivers.length.toString(), icon: UserCircle2, color: 'text-[#0EA5E9]' },
          { label: 'НА ЗМІНІ', val: activeCount.toString(), icon: UserCheck2, color: 'text-[#10B981]' },
          { label: 'СЕРЕДНІЙ РЕЙТИНГ', val: avgRating, icon: Star, color: 'text-[#FBBF24]' },
          { label: 'ПЕРЕВІРЕНО', val: '100%', icon: ShieldCheck, color: 'text-[#E879F9]' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1A2639]/30 border border-white/5 rounded-[32px] p-6 relative overflow-hidden h-[120px] flex flex-col justify-between group hover:bg-[#1A2639]/50 transition-colors">
             <p className="text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">{stat.label}</p>
             <h3 className="font-black text-3xl text-white tracking-widest">{stat.val}</h3>
             <stat.icon size={64} className={`absolute -right-4 -bottom-4 opacity-[0.03] ${stat.color} group-hover:scale-110 transition-transform duration-500`} />
          </div>
        ))}
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-[900px] w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-[#1A2639]/30">
              <th className="px-6 py-4 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest rounded-l-full">ВОДІЙ</th>
              <th className="px-6 py-4 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">ПОСВІДЧЕННЯ</th>
              <th className="px-6 py-4 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">СТАЖ / РЕЙСИ</th>
              <th className="px-6 py-4 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">РЕЙТИНГ</th>
              <th className="px-6 py-4 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">ПОТОЧНИЙ РЕЙС</th>
              <th className="px-6 py-4 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">СТАТУС</th>
              <th className="px-6 py-4 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest text-right rounded-r-full">ДІЇ</th>
            </tr>
          </thead>
          <tbody>
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
                  className="bg-[#1A2639]/30 hover:bg-[#1A2639]/50 transition-colors group"
                >
                  <td className="px-6 py-4 rounded-l-[16px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9] font-black border border-[#0EA5E9]/20">
                        {driver.firstName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white tracking-widest uppercase">{driver.firstName} {driver.lastName}</h4>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-[#8899b5] font-bold uppercase tracking-widest">{driver.licenseNumber}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-white uppercase tracking-widest">12 Р. СТАЖУ</p>
                      <p className="text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">284 РЕЙСИ</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBBF24]/10 border border-[#FBBF24]/20 w-fit">
                       <Star size={12} className="text-[#FBBF24] fill-[#FBBF24]" />
                       <span className="text-[10px] font-black text-[#FBBF24]">{driver.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">—</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                      driver.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                      driver.status === 'resting' ? 'bg-white/[0.05] text-[#5a6a85] border-white/5' :
                      'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20'
                    }`}>
                      {driver.status === 'active' ? '● В РОБОТІ' : driver.status === 'resting' ? 'ВИХІДНИЙ' : 'ВІДПУСТКА'}
                    </span>
                  </td>
                   <td className="px-6 py-4 text-right rounded-r-[16px]">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => handleToggleStatus(driver)}
                         className="p-2.5 rounded-full bg-white/[0.03] border border-white/5 text-[#8899b5] hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10 hover:border-[#0EA5E9]/20 transition-all shadow-lg"
                         title="Змінити статус"
                       >
                          <UserCheck2 size={14} />
                       </button>
                       <button className="p-2.5 rounded-full bg-white/[0.03] border border-white/5 text-[#8899b5] hover:text-white hover:bg-white/10 transition-all shadow-lg">
                          <Phone size={14} />
                       </button>
                       <button 
                         onClick={() => handleDeleteDriver(driver.id, `${driver.firstName} ${driver.lastName}`)}
                         className="p-2.5 rounded-full bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                         title="Видалити водія"
                       >
                          <Trash2 size={14} />
                       </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}

