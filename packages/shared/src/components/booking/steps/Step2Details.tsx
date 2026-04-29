import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useAdminStore } from '../../../store/useAdminStore';
import { supabase } from '@busnet/shared/supabase/config';
import { Plus, Trash2, Mail, Phone, ShieldCheck, UserCheck, X as XIcon, AlertCircle } from 'lucide-react';

export default function Step2Details() {
  const { 
    passengers, 
    mainContact, 
    selectedTrip, 
    addPassenger, 
    removePassenger,
    updatePassenger, 
    updateContact, 
    setStep,
    generatePassword,
    confirmBooking,
    loading: bookingLoading
  } = useBookingStore();
  const { registerFromBooking, login, isAuthenticated, loading: authLoading } = useAuthStore();

  const [isNewUser, setIsNewUser] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPass);
      setLoginError(false);
      // Auto-fill first passenger if possible
      const user = useAuthStore.getState().user;
      if (user) {
        updatePassenger(0, { firstName: user.firstName, lastName: user.lastName });
        updateContact({ email: user.email });
      }
    } catch {
      setLoginError(true);
    }
  };

  // Логіка розрахунку фінальної ціни зі знижками
  const calculateTotal = () => {
    // НЕ використовуємо fallback ціну — якщо price відсутня, показуємо помилку
    const basePrice = selectedTrip?.price ?? null;
    if (basePrice === null) return 0;
    return passengers.reduce((total, p) => {
      let price = basePrice;
      if (p.discountType === 'child') price *= 0.5;   // -50%
      if (p.discountType === 'student') price *= 0.8; // -20%
      return total + price;
    }, 0);
  };

  const handleNext = async () => {
    if (isNewUser) {
      // Basic validation
      if (!passengers[0].firstName || !passengers[0].lastName || !mainContact.email) {
        setFormError("Будь ласка, заповніть всі дані: Ім'я, Прізвище, Email");
        return;
      }
      
      // Auto-generate password
      const pass = generatePassword();
      
      // Register the user automatically
      try {
        await registerFromBooking({
          email: mainContact.email,
          firstName: passengers[0].firstName,
          lastName: passengers[0].lastName,
          loyaltyPoints: 0
        }, pass);
      } catch (err: any) {
        setFormError('Помилка реєстрації: ' + err.message);
        return;
      }
    } else {
      if (!isAuthenticated) {
        setFormError('Будь ласка, увійдіть у свій акаунт або оберіть "Новий пасажир"');
        return;
      }
    }

    // Actual Supabase persistence
    setFormError(null);
    await confirmBooking();

    // Create a real-time notification for the passenger
    const { user } = useAuthStore.getState();
    if (user) {
      const { error } = await supabase
        .from('notifications')
        .insert({
          id: `NTF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          userId: user.uid,
          title: 'Бронювання підтверджено',
          message: `Ваше бронювання ${selectedTrip?.departureCity} → ${selectedTrip?.arrivalCity} успішно підтверджено!`,
          read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    }

    // Push to Admin Store for "Mission Control" sync
    if (selectedTrip) {
      const adminBooking = {
        id: "BK-" + Math.floor(Math.random() * 9000 + 1000),
        passengerName: passengers[0].firstName + " " + passengers[0].lastName,
        route: `${selectedTrip.departureCity} → ${selectedTrip.arrivalCity}`,
        date: selectedTrip.departureDate,
        seats: passengers.length,
        // Відображаємо в UAH, без фіксованого курсу EUR
        amount: `${calculateTotal()} грн`,
        status: 'active' as const,
        timestamp: new Date().toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      };

      // Статичний імпорт — не dynamic import
      useAdminStore.getState().addBooking(adminBooking);
      useAdminStore.getState().addLog({
        id: Date.now().toString(),
        time: adminBooking.timestamp,
        actor: passengers[0].firstName,
        role: 'passenger',
        action: 'CREATE',
        obj: `Бронювання ${adminBooking.id} (${adminBooking.route})`,
        icon: '✅'
      });
    }
  };

  return (
    <div className="space-y-8">
      {(authLoading || bookingLoading) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-white font-black uppercase tracking-widest italic animate-pulse">Опрацювання транзакції...</p>
          </div>
        </div>
      )}
      {/* 0. AUTH / LOGIN TOGGLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
         <button 
           onClick={() => setIsNewUser(true)}
           className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${isNewUser ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
         >
            <div className={`p-2 rounded-xl shrink-0 ${isNewUser ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-500'}`}>
               <Plus size={18} />
            </div>
            <div className="text-left">
               <p className="text-[10px] font-black uppercase tracking-widest">Новий пасажир</p>
               <p className="text-[10px] font-bold uppercase italic text-slate-500">Купити та зареєструватися</p>
            </div>
         </button>

         <button 
           onClick={() => setIsNewUser(false)}
           className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${!isNewUser ? 'bg-violet-500/10 border-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
         >
            <div className={`p-2 rounded-xl shrink-0 ${!isNewUser ? 'bg-violet-500 text-white' : 'bg-white/5 text-slate-500'}`}>
               <UserCheck size={18} />
            </div>
            <div className="text-left">
               <p className="text-[10px] font-black uppercase tracking-widest">Вже є акаунт</p>
               <p className="text-[10px] font-bold uppercase italic text-slate-500">Увійти в кабінет</p>
            </div>
         </button>
      </div>

      {!isNewUser && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[32px] bg-violet-600/10 border border-violet-500/30 backdrop-blur-xl space-y-4"
        >
           <h3 className="text-white font-black uppercase italic tracking-tighter">
             {isAuthenticated ? 'Ви успішно увійшли!' : 'Увійти для швидкого бронювання'}
           </h3>
           {!isAuthenticated ? (
             <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={`w-full bg-black/40 border ${loginError ? 'border-rose-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500`}
                  required
                />
                <input 
                  type="password" 
                  placeholder="Пароль" 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className={`w-full bg-black/40 border ${loginError ? 'border-rose-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500`}
                  required
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-violet-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all"
                >
                   Увійти
                </button>
             </form>
           ) : (
             <div className="flex items-center gap-4 text-[#00e676] bg-[#00e676]/10 p-4 rounded-xl border border-[#00e676]/20">
                <div className="w-10 h-10 rounded-full bg-[#00e676] text-black flex items-center justify-center font-black">✓</div>
                <div>
                   <p className="text-xs font-black uppercase">Авторизовано</p>
                   <p className="text-[10px] font-bold opacity-70">Дані пасажира заповнено автоматично</p>
                </div>
             </div>
           )}
           {loginError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">Невірний email або пароль</p>}
        </motion.div>
      )}

      {/* 1. КОНТАКТНІ ДАНІ (Тільки для головного замовника) */}
      <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Mail className="text-cyan-400" size={20} /> Контактна інформація
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Email (для квитка та кабінету)</label>
            <input 
              type="email"
              value={mainContact.email}
              onChange={(e) => updateContact({ email: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none transition-all placeholder:text-slate-600 font-bold"
              placeholder="example@mail.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Номер телефону</label>
            <input 
              type="tel"
              value={mainContact.phone}
              onChange={(e) => updateContact({ phone: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none transition-all placeholder:text-slate-600 font-bold"
              placeholder="+380..."
            />
          </div>
        </div>
      </div>

      {/* 2. СПИСОК ПАСАЖИРІВ */}
      <div className="space-y-4">
        <AnimatePresence>
          {passengers.map((passenger, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 rounded-[32px] bg-white/5 border border-white/10 relative overflow-hidden group backdrop-blur-md"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="px-4 py-1.5 rounded-full bg-cyan-400/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-400/20">
                   ПАСАЖИР 0{index + 1}
                </span>
                {index > 0 && (
                  <button 
                    onClick={() => removePassenger(index)}
                    className="text-rose-400 hover:text-white transition-colors p-2 hover:bg-rose-500/20 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Ім'я</label>
                   <input 
                    placeholder="Ім'я"
                    value={passenger.firstName}
                    onChange={(e) => updatePassenger(index, { firstName: e.target.value })}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-violet-400 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Прізвище</label>
                   <input 
                    placeholder="Прізвище"
                    value={passenger.lastName}
                    onChange={(e) => updatePassenger(index, { lastName: e.target.value })}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-violet-400 outline-none font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                   <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Знижка</label>
                   <select 
                    value={passenger.discountType}
                    onChange={(e) => updatePassenger(index, { discountType: e.target.value as any })}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-fuchsia-400 outline-none appearance-none cursor-pointer font-bold"
                  >
                    <option value="none">Без знижки (Повний)</option>
                    <option value="child">Дитячий (-50%)</option>
                    <option value="student">Студентський (-20%)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button 
          onClick={addPassenger}
          className="w-full py-6 border-2 border-dashed border-white/10 rounded-[32px] text-slate-500 hover:border-cyan-400/50 hover:text-cyan-400 transition-all flex items-center justify-center gap-3 group bg-black/20"
        >
          <Plus size={24} className="group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-sm font-black uppercase tracking-widest italic">Додати пасажира</span>
        </button>
      </div>

      {/* Inline Form Error Banner */}
      <AnimatePresence>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400"
          >
            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 font-black text-sm">!</div>
            <p className="text-sm font-bold flex-1">{formError}</p>
            <button onClick={() => setFormError(null)} className="text-rose-400 hover:text-white transition-colors shrink-0">
              <XIcon size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Footer: sticky on mobile with proper safe-area padding */}
      <div className="fixed bottom-0 left-0 right-0 sm:relative bg-[#020617]/90 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none border-t border-white/5 sm:border-0 p-4 pb-8 sm:p-0 z-40" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="sm:hidden" style={{ height: '0' }} />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:p-8 sm:bg-gradient-to-r from-cyan-900/20 to-violet-900/20 sm:rounded-[32px] sm:border sm:border-white/10">
          <div>
            {selectedTrip?.price == null ? (
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle size={16} />
                <p className="text-sm font-black uppercase tracking-widest">Ціна недоступна — оберіть рейс знову</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Загальна вартість ({passengers.length} пас.)</p>
                <p className="text-3xl sm:text-4xl font-black text-white holographic-text">
                  {calculateTotal()} <span className="text-lg font-normal text-cyan-400 italic">UAH</span>
                </p>
              </>
            )}
          </div>
          
          <button 
            onClick={handleNext}
            disabled={selectedTrip?.price == null}
            className="w-full sm:w-auto px-10 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 text-sm"
          >
            Підтвердити квитки
          </button>
        </div>
      </div>
      {/* Safe-area spacer for mobile sticky footer */}
      <div className="h-32 sm:h-0" />
    </div>
  );
}
