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
    notificationsReviews: false
  });

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

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-2 h-6 bg-[#ff6b35] rounded-full shadow-[0_0_10px_#ff6b35]" />
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">Налаштування</h2>
          <p className="text-[#5a6a85] text-sm font-black uppercase tracking-widest mt-1">Конфігурація кабінету та безпеки</p>
        </div>
      </div>

      <div className="space-y-16">
        {/* Section: Account & Security */}
        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase text-[#5a6a85] tracking-[.3em] flex items-center gap-3">
              <Lock size={14} className="text-[#ff6b35]" /> Безпека та Доступ
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-white uppercase tracking-widest px-1">Поточний пароль</label>
                 <input type="password" placeholder="••••••••" className="w-full bg-[#111520] border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-[#ff6b35] outline-none transition-all placeholder:text-[#3d5670]" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-white uppercase tracking-widest px-1">Новий пароль</label>
                 <input type="password" placeholder="••••••••" className="w-full bg-[#111520] border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none transition-all placeholder:text-[#3d5670]" />
              </div>
              <div className="md:col-span-2 p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                       <Shield size={24} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-white uppercase italic">Двофакторна автентифікація</h4>
                       <p className="text-[10px] text-cyan-500/70 font-black uppercase tracking-widest mt-1">Рекомендовано для захисту балансу</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => toast.success('Запит на активацію 2FA надіслано')}
                    className="px-6 py-2 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all"
                 >
                    Активувати
                 </button>
              </div>
           </div>
        </section>

        {/* Section: Notifications */}
        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase text-[#5a6a85] tracking-[.3em] flex items-center gap-3">
              <Bell size={14} className="text-amber-500" /> Сповіщення
           </h3>
           <div className="bg-[#111520] border border-white/5 rounded-[40px] p-8 space-y-6">
               {[
                { key: 'notificationsBookings', label: 'Нові бронювання', desc: 'Отримувати миттєві Push та SMS при кожному проданому квитку' },
                { key: 'notificationsFinance', label: 'Фінансові виписки', desc: 'Щотижневі звіти про транзакції та баланс на email' },
                { key: 'notificationsReviews', label: 'Зміни в системі', desc: 'Бути в курсі технічних оновлень та нових правил' },
              ].map((item, i) => {
                 const isActive = settings[item.key as keyof typeof settings];
                 return (
                 <div key={i} className="flex items-center justify-between py-2 last:border-0 border-b border-white/5">
                    <div className="max-w-md">
                       <h4 className="text-sm font-bold text-white mb-1 uppercase italic tracking-tight">{item.label}</h4>
                       <p className="text-[10px] text-[#5a6a85] font-medium leading-relaxed uppercase tracking-wider">{item.desc}</p>
                    </div>
                    <button 
                       onClick={() => toggleSetting(item.key)}
                       className={`w-12 h-6 rounded-full p-1 transition-colors ${isActive ? 'bg-[#00e676]' : 'bg-white/10'}`}
                    >
                       <div className={`w-4 h-4 rounded-full bg-black transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>
              )})}
           </div>
        </section>

        {/* Section: Regional */}
        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase text-[#5a6a85] tracking-[.3em] flex items-center gap-3">
              <Globe size={14} className="text-cyan-400" /> Регіональні налаштування
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-white uppercase tracking-widest px-1">Мова інтерфейсу</label>
                 <select className="w-full bg-[#111520] border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none appearance-none cursor-pointer font-bold text-sm">
                    <option>Українська</option>
                    <option>English</option>
                    <option>Polski</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-white uppercase tracking-widest px-1">Основна валюта</label>
                 <select className="w-full bg-[#111520] border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none appearance-none cursor-pointer font-bold text-sm">
                    <option>EUR (€)</option>
                    <option>UAH (₴)</option>
                    <option>USD ($)</option>
                 </select>
              </div>
           </div>
        </section>

        <div className="pt-10 border-t border-white/5 flex justify-end gap-4">
           <button className="px-10 py-4 bg-white/5 text-[#5a6a85] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all">
              Скинути
           </button>
           <button className="px-12 py-4 bg-[#ff6b35] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white hover:text-black transition-all shadow-[0_10px_30px_rgba(255,107,53,0.3)] flex items-center gap-2">
              <Save size={16} /> Зберегти зміни
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
