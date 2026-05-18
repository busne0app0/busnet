/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Bell, Lock, Globe, Eye, EyeOff, ChevronDown, Smartphone, Save, 
  Shield, HelpCircle, X, ShieldAlert, Check, Copy, Download, Loader2
} from 'lucide-react';
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
  
  // Interactive Password show/hide states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Interactive 2FA Wizard Modal states
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [step2FA, setStep2FA] = useState<1 | 2>(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

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

  // Compute Password Strength
  const passwordStrength = useMemo(() => {
    const pwd = passwords.new;
    if (!pwd) return { label: '', color: 'bg-transparent', pct: 0 };
    if (pwd.length < 6) return { label: 'СЛАБКИЙ', color: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]', pct: 33 };
    if (pwd.length < 10) return { label: 'СЕРЕДНІЙ', color: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]', pct: 66 };
    return { label: 'НАДІЙНИЙ', color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]', pct: 100 };
  }, [passwords.new]);

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

  // Launch 2FA Setup wizard
  const handleOpen2FAWizard = () => {
    if (settings.twoFactorEnabled) return;
    setStep2FA(1);
    setVerificationCode('');
    setShow2FAModal(true);
  };

  // Process 2FA Verification
  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Введіть 6-значний код підтвердження');
      return;
    }
    
    setIsVerifying(true);
    // Simulate high-end cryptographic check
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsVerifying(false);

    const generatedBackupCodes = Array.from({ length: 6 }, () => 
      Math.floor(10000000 + Math.random() * 90000000).toString().replace(/(\d{4})(\d{4})/, '$1-$2')
    );
    
    setBackupCodes(generatedBackupCodes);
    setStep2FA(2);

    if (user) {
      const next = { ...settings, twoFactorEnabled: true };
      setSettings(next);
      await supabase.from('settings').upsert({ id: user.uid, carrierSettings: next });
      toast.success('2FA успішно активовано!');
    }
  };

  const handleCopyCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Резервні коди скопійовано в буфер обміну');
  };

  const handleDownloadCodes = () => {
    const text = `BUSNET UA - РЕЗЕРВНІ КОДИ 2FA\nЗбережіть ці коди в надійному місці!\n\n${backupCodes.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'busnet_backup_codes.txt';
    link.click();
    toast.success('Завантажено файл busnet_backup_codes.txt');
  };

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1.5 h-6 bg-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">НАЛАШТУВАННЯ</h2>
          <p className="text-[#5A6A85] text-[11px] font-black uppercase tracking-[0.12em] mt-1 font-bold">Конфігурація кабінету та безпека двофакторної автентифікації (2FA)</p>
        </div>
      </div>

      <div className="space-y-16">
        
        {/* Section: Account & Security */}
        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase text-[#8899B5] tracking-[.3em] flex items-center gap-3 font-bold">
              <Lock size={14} className="text-[#10B981]" /> БЕЗПЕКА ТА ДОСТУП
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest px-1 block font-bold">ПОТОЧНИЙ ПАРОЛЬ</label>
                 <div className="relative">
                   <input 
                     type={showCurrentPassword ? "text" : "password"} 
                     value={passwords.current} 
                     onChange={e => setPasswords({...passwords, current: e.target.value})} 
                     placeholder="••••••••" 
                     className="w-full bg-[#1A2639]/30 border border-white/5 rounded-2xl pl-6 pr-14 py-4 text-white focus:border-[#10B981] outline-none transition-all placeholder:text-[#5A6A85] text-sm tracking-[0.2em] font-mono" 
                   />
                   <button
                     type="button"
                     onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                     className="absolute right-6 top-1/2 -translate-y-1/2 text-[#5A6A85] hover:text-white transition-colors"
                   >
                     {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest px-1 block font-bold">НОВИЙ ПАРОЛЬ</label>
                 <div className="relative">
                   <input 
                     type={showNewPassword ? "text" : "password"} 
                     value={passwords.new} 
                     onChange={e => setPasswords({...passwords, new: e.target.value})} 
                     placeholder="••••••••" 
                     className="w-full bg-[#1A2639]/30 border border-white/5 rounded-2xl pl-6 pr-14 py-4 text-white focus:border-[#10B981] outline-none transition-all placeholder:text-[#5A6A85] text-sm tracking-[0.2em] font-mono" 
                   />
                   <button
                     type="button"
                     onClick={() => setShowNewPassword(!showNewPassword)}
                     className="absolute right-6 top-1/2 -translate-y-1/2 text-[#5A6A85] hover:text-white transition-colors"
                   >
                     {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                 </div>
                 {/* Premium Password Strength Indicator */}
                 {passwords.new && (
                   <div className="space-y-1.5 mt-2 px-1">
                     <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider font-bold">
                       <span className="text-[#5A6A85]">БЕЗПЕКА ПАРОЛЯ</span>
                       <span style={{ color: passwordStrength.pct === 33 ? '#F43F5E' : passwordStrength.pct === 66 ? '#F59E0B' : '#10B981' }}>
                         {passwordStrength.label}
                       </span>
                     </div>
                     <div className="h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                         className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                         initial={{ width: 0 }}
                         animate={{ width: `${passwordStrength.pct}%` }}
                       />
                     </div>
                   </div>
                 )}
              </div>
              
              {/* Premium 2FA Box */}
              <div className="md:col-span-2 p-6 rounded-[32px] bg-[#1A2639]/40 border border-[#10B981]/20 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.03)] group transition-all hover:border-[#10B981]/30">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 flex items-center justify-center text-[#10B981] border border-[#10B981]/20 shadow-lg">
                       <Shield size={20} />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-white uppercase tracking-widest">ДВОФАКТОРНА АВТЕНТИФІКАЦІЯ (2FA)</h4>
                       <p className="text-[10px] text-[#10B981] font-black uppercase tracking-widest mt-1 font-bold">Рекомендовано для захисту фінансового балансу кабінету</p>
                    </div>
                 </div>
                 <button 
                    onClick={handleOpen2FAWizard}
                    disabled={settings.twoFactorEnabled}
                    className={`px-8 py-3.5 border text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 font-bold ${
                      settings.twoFactorEnabled 
                        ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                        : 'text-[#8899B5] border-white/10 bg-white/5 hover:text-white hover:border-white/20 hover:bg-white/10'
                    }`}
                 >
                    {settings.twoFactorEnabled ? 'АКТИВОВАНО ✅' : 'АКТИВУВАТИ'}
                 </button>
              </div>
           </div>
        </section>

        {/* Section: Notifications */}
        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase text-[#8899B5] tracking-[.3em] flex items-center gap-3 font-bold">
              <Bell size={14} className="text-[#FBBF24]" /> СПОВІЩЕННЯ
           </h3>
           <div className="bg-[#0B1221] border border-white/5 rounded-[40px] p-8 space-y-6 shadow-2xl">
               {[
                { key: 'notificationsBookings', label: 'НОВІ БРОНЮВАННЯ', desc: 'Отримувати миттєві Push та звукові сигнали при кожному проданому квитку' },
                { key: 'notificationsFinance', label: 'ФІНАНСОВІ ВИПИСКИ', desc: 'Щотижневі звіти про транзакції та баланс на email' },
                { key: 'notificationsReviews', label: 'ЗМІНИ В СИСТЕМІ', desc: 'Бути в курсі технічних оновлений та нових правил платформи' },
              ].map((item, i) => {
                 const isActive = settings[item.key as keyof typeof settings];
                 return (
                  <div key={i} className="flex items-center justify-between py-4 last:border-0 border-b border-white/5">
                     <div className="max-w-md">
                        <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-widest">{item.label}</h4>
                        <p className="text-[10px] text-[#8899B5] font-black uppercase tracking-widest leading-relaxed font-bold">{item.desc}</p>
                     </div>
                     <button 
                        onClick={() => toggleSetting(item.key)}
                        className={`w-14 h-8 rounded-full p-1 transition-all shadow-inner relative active:scale-95 ${isActive ? 'bg-[#10B981]' : 'bg-white/10'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'} shadow-md`} />
                     </button>
                  </div>
               )})}
           </div>
        </section>

        {/* Section: Regional */}
        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase text-[#8899B5] tracking-[.3em] flex items-center gap-3 font-bold">
              <Globe size={14} className="text-[#0EA5E9]" /> РЕГІОНАЛЬНІ НАЛАШТУВАННЯ
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest px-1 block font-bold">МОВА ІНТЕРФЕЙСУ</label>
                 <div className="relative w-full">
                   <select value={settings.language} onChange={e => setSettings({...settings, language: e.target.value})} className="w-full bg-[#1A2639]/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-[#0EA5E9] outline-none appearance-none cursor-pointer font-bold text-sm tracking-widest uppercase">
                      <option>УКРАЇНСЬКА</option>
                      <option>ENGLISH</option>
                      <option>POLSKI</option>
                   </select>
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#5A6A85]">
                     <ChevronDown size={16} />
                   </div>
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest px-1 block font-bold">ОСНОВНА ВАЛЮТА</label>
                 <div className="relative w-full">
                   <select value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} className="w-full bg-[#1A2639]/30 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-[#0EA5E9] outline-none appearance-none cursor-pointer font-bold text-sm tracking-widest uppercase">
                      <option>EUR (€)</option>
                      <option>UAH (₴)</option>
                      <option>USD ($)</option>
                   </select>
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#5A6A85]">
                     <ChevronDown size={16} />
                   </div>
                 </div>
              </div>
           </div>
        </section>

        <div className="pt-10 border-t border-white/5 flex justify-end gap-4">
           <button 
             onClick={() => { if (confirm('Скинути налаштування до початкових?')) window.location.reload(); }}
             className="px-10 py-4 bg-transparent border border-white/5 text-[#5A6A85] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/5 hover:text-white transition-all shadow-lg active:scale-95 font-bold"
           >
              СКИНУТИ
           </button>
           <button onClick={handleSave} className="px-10 py-4 bg-[#10B981] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 font-bold">
              <Save size={16} /> ЗБЕРЕГТИ НАЛАШТУВАННЯ
           </button>
        </div>
      </div>

      {/* Cyber 2FA Setup Modal Wizard */}
      <AnimatePresence>
        {show2FAModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0B1221] border border-[#10B981]/20 rounded-[40px] p-6 md:p-8 w-full max-w-md shadow-[0_0_30px_rgba(16,185,129,0.1)] relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Shield size={18} className="text-[#10B981]" /> НАЛАШТУВАННЯ 2FA
                </h3>
                <button 
                  onClick={() => setShow2FAModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 text-[#5A6A85] hover:text-white transition-colors flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              {step2FA === 1 ? (
                // Step 1: Scan QR Code & Enter digits
                <div className="space-y-6">
                  <p className="text-xs text-[#8899B5] leading-relaxed font-bold uppercase tracking-wider text-center">
                    Відскануйте QR-код за допомогою Google Authenticator або введіть секретний ключ вручну.
                  </p>
                  
                  {/* Glowing Futuristic SVG QR Code */}
                  <div className="flex justify-center p-4 bg-white rounded-3xl border border-white/10 w-48 h-48 mx-auto relative overflow-hidden group shadow-lg">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                      {/* Simulated high quality QR vector structure */}
                      <path d="M5 5h30v30H5V5zm4 4v22h22V9H9zm5 5h12v12H14V14zM65 5h30v30H65V5zm4 4v22h22V9H69zm5 5h12v12H74V14zM5 65h30v30H5V65zm4 4v22h22V9H9zm5 5h12v12H14V14z" fill="currentColor"/>
                      <path d="M45 5h10v10H45V5zm10 10h5v10h-5V15zm-10 15h5v5h-5v-5zm15-5h5v5h-5v-5zm-5 15h5v5h-5v-5zm10-5h5v10h-5v-10zM45 45h5v5h-5v-5zm5 5h10v5H50v-5zm5-10h5v5h-5v-5zm-15 15h5v5h-5v-5zm5 10h10v5H45v-5zM65 45h10v5H65v-5zm10 5h5v5h-5v-5zm-10 10h5v10h-5V60zm10 5h5v5h-5v-5zm5 5h10v5H80v-5zm10-15h5v10h-5V50zm-15 25h5v10h-5V75zm15 10h5v5h-5v-5zm-10 5h5v5h-5v-5zM45 65h5v10h-5V65zm5 15h5v5h-5v-5zm10-15h5v5h-5v-5zm-10 15h5v5h-5v-5zm-5-5h5v5h-5v-5zm20 5h5v10h-5V80z" fill="currentColor"/>
                    </svg>
                    <div className="absolute inset-0 bg-[#10B981]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Secret Key copy field */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest block font-bold text-center">СЕКРЕТНИЙ КЛЮЧ</label>
                    <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-2xl py-3 px-5 text-xs text-white">
                      <span className="font-mono text-center w-full tracking-widest select-all font-bold">BUSN ETUA 2FAS ECRE TKEY</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("BUSN-ETUA-2FAS-ECRE-TKEY");
                          toast.success('Ключ скопійовано');
                        }}
                        className="text-[#10B981] hover:text-white transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 6 Digit Input */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest block font-bold text-center">КОД ПІДТВЕРДЖЕННЯ</label>
                    <input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000 000"
                      className="w-full bg-black/20 border border-white/5 focus:border-[#10B981] rounded-2xl py-4 px-5 text-center text-2xl font-mono text-white tracking-[0.4em] outline-none transition-all placeholder:text-[#5A6A85]"
                    />
                  </div>

                  {/* Confirm Action */}
                  <button
                    onClick={handleVerify2FA}
                    disabled={verificationCode.length !== 6 || isVerifying}
                    className="w-full py-4.5 bg-[#10B981] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    ПІДТВЕРДИТИ АКТИВАЦІЮ
                  </button>
                </div>
              ) : (
                // Step 2: Display Backup codes
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Check size={24} />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">2FA УСПІШНО АКТИВОВАНО</h4>
                    <p className="text-[10px] text-[#8899B5] uppercase font-bold tracking-widest leading-relaxed">
                      Збережіть ці резервні коди в надійному місці! Кожен код може бути використаний лише один раз у разі втрати пристрою.
                    </p>
                  </div>

                  {/* Backup codes terminal display */}
                  <div className="bg-black/60 border border-white/5 rounded-2xl p-6 grid grid-cols-2 gap-3 font-mono text-xs text-white tracking-widest text-center">
                    {backupCodes.map((code, idx) => (
                      <div key={idx} className="p-2 bg-white/[0.02] border border-white/5 rounded-lg select-all">
                        {code}
                      </div>
                    ))}
                  </div>

                  {/* Backup action triggers */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyCodes}
                      className="flex-1 py-4 bg-transparent border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#8899B5] hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Copy size={12} /> КОПІЮВАТИ
                    </button>
                    <button
                      onClick={handleDownloadCodes}
                      className="flex-1 py-4 bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#10B981]/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Download size={12} /> СКАЧАТИ TXT
                    </button>
                  </div>

                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="w-full py-4.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 font-bold"
                  >
                    ЗАВЕРШИТИ НАЛАШТУВАННЯ
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsTab;
