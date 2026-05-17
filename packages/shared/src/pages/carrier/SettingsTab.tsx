import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Lock, Globe, Eye, Smartphone, Save, Shield, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';

const SettingsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState({
    notificationsBookings: true,
    notificationsFinance: true,
    notificationsReviews: false,
    language: 'УКРАЇНСЬКА',
    currency: 'EUR (€)',
    twoFactorEnabled: false
  });
  const [passwords, setPasswords] = useState({ current: '', new: '' });

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', user.uid)
        .single();
      
      if (!error && data && data.carrierSettings) {
        setSettings({ ...settings, ...data.carrierSettings });
      }
    };
    fetchSettings();
  }, [user]);

  const toggleSetting = async (key: string) => {
    if (!user) return;
    const next = { ...settings, [key]: !settings[key as keyof typeof settings] };
    setSettings(next);
    toast.success('Налаштування оновлено');
    await supabase.from('settings').upsert({ id: user.uid, carrierSettings: next });
  };

  const handleSave = async () => {
    if (!user) return;
    const toastId = toast.loading('Збереження налаштувань...');
    try {
      if (passwords.new) {
        const { error: pwdError } = await supabase.auth.updateUser({ password: passwords.new });
        if (pwdError) throw pwdError;
      }
      
      const { error: settingsError } = await supabase.from('settings').upsert({ id: user.uid, carrierSettings: settings });
      if (settingsError) throw settingsError;

      setPasswords({ current: '', new: '' });
      toast.success('Налаштування успішно збережено', { id: toastId });
    } catch (error) {
      toast.error('Помилка при збереженні', { id: toastId });
    }
  };

  const handle2FA = async () => {
    if (!user) return;
    const next = { ...settings, twoFactorEnabled: true };
    setSettings(next);
    toast.success('2FA активовано (демо)');
    await supabase.from('settings').upsert({ id: user.uid, carrierSettings: next });
  };

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1.5 h-6 bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">НАЛАШТУВАННЯ</h2>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest mt-1">Конфігурація кабінету та безпеки</p>
        </div>
      </div>

      <div className="space-y-16">
        {/* Section: Account & Security */}
        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase text-[#5A6A85] tracking-[.3em] flex items-center gap-3">
              <Lock size={14} className="text-[#10B981]" /> БЕЗПЕКА ТА ДОСТУП
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest px-1">ПОТОЧНИЙ ПАРОЛЬ</label>
                 <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" className="w-full bg-[#1A2639]/30 border border-white/5 rounded-full px-6 py-4 text-white focus:border-[#10B981] outline-none transition-all placeholder:text-[#5A6A85] text-sm tracking-[0.2em]" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest px-1">НОВИЙ ПАРОЛЬ</label>
                 <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••" className="w-full bg-[#1A2639]/30 border border-white/5 rounded-full px-6 py-4 text-white focus:border-[#10B981] outline-none transition-all placeholder:text-[#5A6A85] text-sm tracking-[0.2em]" />
              </div>
              <div className="md:col-span-2 p-6 rounded-[32px] bg-[#1A2639]/50 border border-[#10B981]/20 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] border border-[#10B981]/20 shadow-lg">
                       <Shield size={20} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-white uppercase tracking-widest">ДВОФАКТОРНА АВТЕНТИФІКАЦІЯ</h4>
                       <p className="text-[9px] text-[#10B981] font-black uppercase tracking-widest mt-1">Рекомендовано для захисту балансу</p>
                    </div>
                 </div>
                 <button 
                    onClick={handle2FA}
                    disabled={settings.twoFactorEnabled}
                    className={`px-8 py-3 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-white/10 transition-all shadow-lg ${settings.twoFactorEnabled ? 'text-[#10B981] border-[#10B981]/50 bg-[#10B981]/10' : 'text-[#8899B5] hover:text-white'}`}
                 >
                    {settings.twoFactorEnabled ? 'АКТИВОВАНО' : 'АКТИВУВАТИ'}
                 </button>
              </div>
           </div>
        </section>

        {/* Section: Notifications */}
        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase text-[#5A6A85] tracking-[.3em] flex items-center gap-3">
              <Bell size={14} className="text-[#FBBF24]" /> СПОВІЩЕННЯ
           </h3>
           <div className="bg-[#1A2639]/30 border border-white/5 rounded-[40px] p-10 space-y-8">
               {[
                { key: 'notificationsBookings', label: 'НОВІ БРОНЮВАННЯ', desc: 'Отримувати миттєві Push та SMS при кожному проданому квитку' },
                { key: 'notificationsFinance', label: 'ФІНАНСОВІ ВИПИСКИ', desc: 'Щотижневі звіти про транзакції та баланс на email' },
                { key: 'notificationsReviews', label: 'ЗМІНИ В СИСТЕМІ', desc: 'Бути в курсі технічних оновлень та нових правил' },
              ].map((item, i) => {
                 const isActive = settings[item.key as keyof typeof settings];
                 return (
                 <div key={i} className="flex items-center justify-between py-4 last:border-0 border-b border-white/5">
                    <div className="max-w-md">
                       <h4 className="text-[12px] font-bold text-white mb-2 uppercase tracking-widest">{item.label}</h4>
                       <p className="text-[9px] text-[#8899B5] font-black uppercase tracking-widest leading-relaxed">{item.desc}</p>
                    </div>
                    <button 
                       onClick={() => toggleSetting(item.key)}
                       className={`w-14 h-7 rounded-full p-1 transition-colors shadow-inner ${isActive ? 'bg-[#10B981]' : 'bg-white/10'}`}
                    >
                       <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-7' : 'translate-x-0'} shadow-md`} />
                    </button>
                 </div>
              )})}
           </div>
        </section>

        {/* Section: Regional */}
        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase text-[#5A6A85] tracking-[.3em] flex items-center gap-3">
              <Globe size={14} className="text-[#0EA5E9]" /> РЕГІОНАЛЬНІ НАЛАШТУВАННЯ
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest px-1">МОВА ІНТЕРФЕЙСУ</label>
                 <select value={settings.language} onChange={e => setSettings({...settings, language: e.target.value})} className="w-full bg-[#1A2639]/30 border border-white/5 rounded-full px-6 py-4 text-white focus:border-[#0EA5E9] outline-none appearance-none cursor-pointer font-bold text-sm tracking-widest uppercase">
                    <option>УКРАЇНСЬКА</option>
                    <option>ENGLISH</option>
                    <option>POLSKI</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest px-1">ОСНОВНА ВАЛЮТА</label>
                 <select value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} className="w-full bg-[#1A2639]/30 border border-white/5 rounded-full px-6 py-4 text-white focus:border-[#0EA5E9] outline-none appearance-none cursor-pointer font-bold text-sm tracking-widest uppercase">
                    <option>EUR (€)</option>
                    <option>UAH (₴)</option>
                    <option>USD ($)</option>
                 </select>
              </div>
           </div>
        </section>

        <div className="pt-10 border-t border-white/5 flex justify-end gap-4">
           <button 
             onClick={() => { if (confirm('Скинути налаштування до початкових?')) window.location.reload(); }}
             className="px-10 py-4 bg-transparent border border-white/5 text-[#5A6A85] text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-white/5 hover:text-white transition-all shadow-lg"
           >
              СКИНУТИ
           </button>
           <button onClick={handleSave} className="px-10 py-4 bg-[#10B981] text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2">
              <Save size={16} /> ЗБЕРЕГТИ ЗМІНИ
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
