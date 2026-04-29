import React from 'react';
import { Lock, MessageSquare, Bell, Globe, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';

interface SettingsTabProps {
  notifs: { email: boolean; sms: boolean; push: boolean; marketing: boolean };
  setNotifs: React.Dispatch<React.SetStateAction<{ email: boolean; sms: boolean; push: boolean; marketing: boolean }>>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ notifs, setNotifs }) => {
  const [newPass, setNewPass] = React.useState('');
  const [confirmPass, setConfirmPass] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handlePasswordChange = async () => {
    if (!newPass || newPass.length < 6) {
      toast.error('Пароль має бути не менше 6 символів');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('Паролі не співпадають');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      
      toast.success('Пароль успішно змінено!');
      setNewPass('');
      setConfirmPass('');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Помилка зміни пароля');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleNotif = (id: keyof typeof notifs) => {
    setNotifs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Налаштування</h2>
        <p className="text-sm text-[#7a9ab5]">Безпека та налаштування акаунту</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Security */}
          <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-2xl p-8 shadow-xl">
            <h3 className="text-[11px] font-black text-[#7a9ab5] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                 <Lock size={16} />
              </div>
              Безпека та пароль
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2 text-white italic text-[10px] mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
                Примітка: Для зміни пароля може знадобитись повторна авторизація.
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-bold text-[#4a6a85] tracking-widest pl-1">Новий пароль</label>
                 <input 
                   type="password" 
                   value={newPass}
                   onChange={(e) => setNewPass(e.target.value)}
                   placeholder="Мінімум 6 символів" 
                   className="w-full bg-[#0a0e1a]/50 border border-[#1e3a5f] rounded-xl px-4 py-3 text-sm focus:border-[#00c8ff] outline-none transition-all text-white" 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-bold text-[#4a6a85] tracking-widest pl-1">Підтвердіть новий пароль</label>
                 <input 
                   type="password" 
                   value={confirmPass}
                   onChange={(e) => setConfirmPass(e.target.value)}
                   placeholder="••••••••" 
                   className="w-full bg-[#0a0e1a]/50 border border-[#1e3a5f] rounded-xl px-4 py-3 text-sm focus:border-[#00c8ff] outline-none transition-all text-white" 
                 />
              </div>
              <button 
                disabled={isUpdating}
                onClick={handlePasswordChange}
                className="w-full py-4 rounded-xl border border-[#1e3a5f] text-sm font-black uppercase tracking-widest hover:bg-[#00c8ff] hover:text-black hover:border-transparent transition-all mt-4 active:scale-95 disabled:opacity-50"
              >
                {isUpdating ? 'Оновлення...' : 'Змінити пароль'}
              </button>
            </div>
          </div>

          {/* Email & Nickname */}
          <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-2xl p-8 shadow-xl">
            <h3 className="text-[11px] font-black text-[#7a9ab5] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                 <MessageSquare size={16} />
              </div>
              Email та логін
            </h3>
            
            <div className="space-y-6">
               <div className="p-4 rounded-xl bg-[#0a0e1a]/30 border border-[#1e3a5f]/50">
                  <p className="text-[10px] text-[#4a6a85] font-bold uppercase tracking-widest mb-1">Ваш email:</p>
                  <p className="text-sm font-bold text-[#00c8ff]">olena.koval@gmail.com</p>
                  <p className="text-[9px] text-[#4a6a85] mt-2 italic">Для зміни email зверніться до підтримки</p>
               </div>
               <div className="p-4 rounded-xl bg-[#0a0e1a]/30 border border-[#1e3a5f]/50">
                  <p className="text-[10px] text-[#4a6a85] font-bold uppercase tracking-widest mb-1">Ваш нікнейм:</p>
                  <p className="text-sm font-bold text-[#e8f4ff]">@olena_k</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
           {/* Notifications */}
           <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-2xl p-8 shadow-xl">
              <h3 className="text-[11px] font-black text-[#7a9ab5] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                   <Bell size={16} />
                </div>
                Сповіщення
              </h3>

              <div className="space-y-4">
                {(Object.keys(notifs) as Array<keyof typeof notifs>).map((key) => (
                  <div key={key} className="flex items-center justify-between p-2">
                    <div>
                       <p className="text-sm font-bold text-white uppercase tracking-tighter">
                         {key === 'email' ? 'Email-сповіщення' : 
                          key === 'sms' ? 'SMS-сповіщення' : 
                          key === 'push' ? 'Push-сповіщення' : 'Маркетингові листи'}
                       </p>
                       <p className="text-[10px] text-[#4a6a85]">
                         {key === 'email' ? 'Підтвердження, квитки' : 
                          key === 'sms' ? 'Нагадування про рейс' : 
                          key === 'push' ? 'Акції та новини' : 'Пропозиції та акції'}
                       </p>
                    </div>
                    <button 
                      onClick={() => toggleNotif(key)}
                      className={`w-12 h-6 rounded-full relative transition-all duration-300 ${notifs[key] ? 'bg-[#00c8ff]' : 'bg-[#1e3a5f]'}`}
                    >
                      <motion.div 
                        animate={{ x: notifs[key] ? 26 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" 
                      />
                    </button>
                  </div>
                ))}
              </div>
           </div>

           {/* Language & Currency */}
           <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-2xl p-8 shadow-xl">
              <h3 className="text-[11px] font-black text-[#7a9ab5] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                   <Globe size={16} />
                </div>
                Мова та регіон
              </h3>

              <div className="space-y-6">
                 <div className="flex items-center justify-between transition-colors hover:bg-white/5 p-2 rounded-lg">
                    <span className="text-sm font-bold text-white">Мова інтерфейсу</span>
                    <select className="bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00c8ff]">
                       <option>Українська</option>
                       <option>English</option>
                       <option>Polski</option>
                    </select>
                 </div>
                 <div className="flex items-center justify-between transition-colors hover:bg-white/5 p-2 rounded-lg">
                    <span className="text-sm font-bold text-white">Валюта</span>
                    <select className="bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00c8ff]">
                       <option>₴ UAH</option>
                       <option>€ EUR</option>
                       <option>$ USD</option>
                    </select>
                 </div>
              </div>
           </div>

           {/* Danger Zone */}
           <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-[11px] font-black text-red-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                   <Info size={16} />
                </div>
                Небезпечна зона
              </h3>
              
              <div className="p-6 rounded-xl border border-red-500/10 bg-red-500/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 blur-[80px] opacity-10 pointer-events-none" />
                 <h4 className="text-sm font-bold text-white mb-2 relative z-10">Видалення акаунту</h4>
                 <p className="text-xs text-[#7a9ab5] leading-relaxed mb-6 relative z-10">
                   Ця дія незворотна. Всі ваші дані, історія поїздок та бонусні бали будуть видалені назавжди.
                 </p>
                 <button 
                    onClick={() => { if(confirm('Ви впевнені? Це неможливо скасувати.')) toast.error('Запит на видалення надіслано'); }}
                    className="w-full py-3 rounded-xl border border-red-500/30 text-[11px] font-black uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] active:scale-95"
                 >
                    Видалити акаунт
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
