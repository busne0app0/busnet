import React from 'react';
import { User as UserIcon, Phone, Mail, Calendar, Camera, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { User } from '@busnet/shared/types';

const ProfileTab: React.FC = () => {
  const { user, updateUserProfile } = useAuthStore();
  const [formData, setFormData] = React.useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '+380 00 000 00 00',
    birthDate: user?.birthDate || '',
    gender: user?.gender || 'Не вказано',
    address: (user as any)?.address || ''
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        birthDate: formData.birthDate,
        gender: formData.gender as User['gender'],
        address: (formData as any).address
      });
      toast.success('Профіль успішно оновлено!');
    } catch (error) {
      toast.error('Помилка оновлення профілю');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = () => {
    const fakeAvatars = [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo'
    ];
    const newAvatar = fakeAvatars[Math.floor(Math.random() * fakeAvatars.length)];
    
    toast.promise(
      updateUserProfile({ avatar: newAvatar }),
      {
        loading: 'Завантаження фото...',
        success: 'Фото профілю оновлено!',
        error: 'Помилка завантаження фото',
      }
    );
  };

  const userAvatarName = (formData.firstName[0] + (formData.lastName?.[0] || '')).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Мій профіль</h2>
        <p className="text-sm text-[#7a9ab5]">Особисті дані та акаунт</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-3xl p-8 sticky top-8 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00c8ff] to-transparent" />
            
            <div className="flex flex-col items-center">
              <div className="relative group/avatar">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00c8ff] to-[#0099cc] flex items-center justify-center text-4xl font-black mb-6 shadow-[0_0_50px_rgba(0,200,255,0.3)] border-4 border-[#0a0e1a]">
                  {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : userAvatarName}
                </div>
                <button 
                  onClick={handleAvatarUpload}
                  className="absolute bottom-6 right-0 p-2 bg-white text-black rounded-full shadow-xl opacity-0 group-hover/avatar:opacity-100 transition-all hover:scale-110 active:scale-90"
                >
                  <Camera size={16} />
                </button>
              </div>

              <h4 className="text-2xl font-black text-white italic tracking-tight">{formData.firstName} {formData.lastName}</h4>
              <p className="text-xs text-[#00c8ff] mt-1 tracking-[0.3em] font-black uppercase italic">
                {(user?.loyaltyPoints || 0) > 2000 ? 'Gold Member' : 'Silver Member'}
              </p>
              
              <div className="mt-8 pt-8 border-t border-white/5 w-full space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#4a6a85]">
                    <span>Статус перевірки</span>
                    <span className="flex items-center gap-1 text-green-400">
                      <ShieldCheck size={12} /> Підтверджено
                    </span>
                 </div>
                 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#4a6a85]">
                    <span>Приєдналася</span>
                    <span className="text-white capitalize">
                      {user?.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }) 
                        : 'Червень 2024'}
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-3xl p-8 shadow-xl">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'firstName', label: "Ім'я", val: formData.firstName, icon: <UserIcon size={14} /> },
                  { name: 'lastName', label: "Прізвище", val: formData.lastName, icon: <UserIcon size={14} /> },
                  { name: 'email', label: "Email", val: formData.email, icon: <Mail size={14} />, disabled: true },
                  { name: 'phone', label: "Телефон", val: formData.phone, icon: <Phone size={14} /> },
                  { name: 'birthDate', label: "Дата народження", val: formData.birthDate, icon: <Calendar size={14} /> },
                  { name: 'gender', label: "Стать", val: formData.gender, icon: <UserIcon size={14} /> },
                ].map((field, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-[#4a6a85] tracking-[0.2em] pl-1 flex items-center gap-2">
                      {field.icon} {field.label}
                    </label>
                    {field.name === 'gender' ? (
                       <select 
                        name="gender"
                        value={formData.gender} 
                        onChange={handleChange}
                        className="w-full bg-[#0a0e1a]/80 border border-[#1e3a5f] rounded-xl px-4 py-3 text-sm text-white focus:border-[#00c8ff] outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="Не вказано">Не вказано</option>
                        <option value="Чоловік">Чоловік</option>
                        <option value="Жінка">Жінка</option>
                        <option value="Інше">Інше</option>
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        name={field.name}
                        value={field.val} 
                        onChange={handleChange}
                        disabled={field.disabled}
                        className={`w-full bg-[#0a0e1a]/80 border border-[#1e3a5f] rounded-xl px-4 py-3 text-sm text-white focus:border-[#00c8ff] outline-none transition-all ${field.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20'}`} 
                      />
                    )}
                  </div>
                ))}
             </div>

             <div className="mt-8 space-y-2">
                <label className="text-[10px] uppercase font-black text-[#4a6a85] tracking-[0.2em] pl-1">Адреса проживання (необов'язково)</label>
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Вулиця, будинок, місто..."
                  className="w-full h-24 bg-[#0a0e1a]/50 border border-[#1e3a5f] rounded-xl px-4 py-3 text-sm text-white focus:border-[#00c8ff] outline-none transition-all resize-none"
                />
             </div>

             <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                 <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-[#00c8ff] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95 shadow-[0_10px_30px_rgba(0,200,255,0.2)] disabled:opacity-50"
                >
                  {isSaving ? 'Збереження...' : 'Зберегти профіль'}
                </button>
                <button 
                  onClick={() => toast('Зміни не збережено')}
                  className="px-8 py-4 border border-[#1e3a5f] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Скасувати
                </button>
             </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl p-6 flex items-center gap-4">
             <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
               <ShieldCheck size={24} />
             </div>
             <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Двофакторна автентифікація</h4>
                <p className="text-xs text-[#7a9ab5]">Захистіть свій акаунт додатковим рівнем безпеки. <span className="text-[#00c8ff] cursor-pointer hover:underline">Налаштувати</span></p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
