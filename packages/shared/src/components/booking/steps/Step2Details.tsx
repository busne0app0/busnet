import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useAdminStore } from '../../../store/useAdminStore';
import { Plus, Trash2, Mail, Phone, Lock, UserCheck, X as XIcon, AlertCircle, LogIn } from 'lucide-react';

export default function Step2Details() {
  const { 
    passengers, 
    mainContact, 
    selectedTrip, 
    addPassenger, 
    removePassenger,
    updatePassenger, 
    updateContact, 
    confirmBooking,
    loading: bookingLoading,
    error: bookingError
  } = useBookingStore();

  const { 
    user, 
    isAuthenticated, 
    login, 
    registerFromBooking, 
    signInWithGoogle, 
    loading: authLoading 
  } = useAuthStore();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [authFormError, setAuthFormError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-fill from authenticated user
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!mainContact.email && user.email) {
        updateContact({ email: user.email });
      }
      if (passengers.length > 0 && !passengers[0].firstName && (user.firstName || user.lastName)) {
        updatePassenger(0, {
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        });
      }
    }
  }, [isAuthenticated, user, mainContact.email, passengers, updateContact, updatePassenger]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFormError(null);
    try {
      if (authMode === 'login') {
        await login(authEmail, authPass);
      } else {
        if (!regFirstName || !regLastName) {
          setAuthFormError("Будь ласка, вкажіть ім'я та прізвище");
          return;
        }
        if (authPass.length < 6) {
          setAuthFormError('Пароль повинен містити щонайменше 6 символів');
          return;
        }
        await registerFromBooking(
          {
            email: authEmail,
            firstName: regFirstName,
            lastName: regLastName,
            loyaltyPoints: 0
          },
          authPass
        );
        updateContact({ email: authEmail });
        if (passengers.length > 0) {
          updatePassenger(0, { firstName: regFirstName, lastName: regLastName });
        }
      }
    } catch (err: any) {
      setAuthFormError(err.message || 'Помилка авторизації');
    }
  };

  // Rule 9: Розрахунок ціни зі знижками
  // child: -50% (якщо child04 або child412 у маршруті)
  // custom discount: за id з custom_discounts
  const calculateTotal = () => {
    const basePrice = selectedTrip?.price ?? null;
    if (basePrice === null) return 0;

    const customDiscounts = selectedTrip?.custom_discounts || [];
    const childAllowed = selectedTrip?.discounts?.child04 || selectedTrip?.discounts?.child412;

    return passengers.reduce((total, p) => {
      let price = basePrice;
      if (p.discountType === 'child' && childAllowed) {
        price *= 0.5;
      } else if (p.discountType && p.discountType !== 'none') {
        const found = customDiscounts.find(cd => cd.id === p.discountType);
        if (found && found.value > 0) {
          price *= (1 - found.value / 100);
        }
      }
      return total + price;
    }, 0);
  };

  const handleNext = async () => {
    setFormError(null);

    // Rule 12: Бронювати можна лише після входу
    if (!isAuthenticated) {
      setFormError('Будь ласка, увійдіть у свій акаунт або створіть новий перед бронюванням.');
      return;
    }

    if (!mainContact.email || !mainContact.phone) {
      setFormError('Будь ласка, заповніть контактний email та номер телефону.');
      return;
    }

    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].firstName.trim() || !passengers[i].lastName.trim()) {
        setFormError(`Будь ласка, заповніть ім'я та прізвище для пасажира ${i + 1}.`);
        return;
      }
    }

    // Execute booking via create_booking RPC in store
    const success = await confirmBooking();

    // Rule 12: Якщо бронь не вдалася, далі не йти і не створювати сповіщення/записи
    if (!success) {
      return;
    }

    // Push to Admin Store for Mission Control monitor sync (only on success)
    if (selectedTrip) {
      const adminBooking = {
        id: "BK-" + Math.floor(Math.random() * 9000 + 1000),
        passengerName: passengers[0].firstName + " " + passengers[0].lastName,
        route: `${selectedTrip.departureCity} → ${selectedTrip.arrivalCity}`,
        date: selectedTrip.departureDate,
        seats: passengers.length,
        amount: `${calculateTotal()} ${selectedTrip.currency || 'UAH'}`,
        status: 'active' as const,
        timestamp: new Date().toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      };

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

  const childDiscountAvailable = Boolean(selectedTrip?.discounts?.child04 || selectedTrip?.discounts?.child412);
  const customDiscountsList = selectedTrip?.custom_discounts || [];
  const currencyLabel = selectedTrip?.currency || 'UAH';

  return (
    <div className="space-y-8">
      {(authLoading || bookingLoading) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-white font-black uppercase tracking-widest italic animate-pulse">Опрацювання запиту...</p>
          </div>
        </div>
      )}

      {/* 0. AUTH STATUS / FORM */}
      {!isAuthenticated ? (
        <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <LogIn className="text-cyan-400" size={20} /> Авторизація для бронювання
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Для підтвердження та збереження квитків увійдіть або зареєструйтесь
              </p>
            </div>

            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  authMode === 'login'
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Вхід
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  authMode === 'register'
                    ? 'bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Реєстрація
              </button>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 max-w-xl">
            {authMode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Ім'я"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 font-bold placeholder:text-slate-600"
                />
                <input
                  type="text"
                  required
                  placeholder="Прізвище"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 font-bold placeholder:text-slate-600"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  required
                  placeholder="Ваш Email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-cyan-400 font-bold placeholder:text-slate-600"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  required
                  placeholder="Ваш пароль"
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-cyan-400 font-bold placeholder:text-slate-600"
                />
              </div>
            </div>

            {authFormError && (
              <p className="text-rose-400 text-xs font-bold">{authFormError}</p>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                {authMode === 'login' ? 'Увійти' : 'Зареєструватися'}
              </button>

              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Увійти через Google
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-6 rounded-[24px] bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-400 tracking-wider">Ви авторизовані</p>
              <p className="text-sm font-bold text-white">{user?.email}</p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest hidden sm:block">
            Квитки з'являться у вашому кабінеті
          </span>
        </div>
      )}

      {/* 1. КОНТАКТНІ ДАНІ */}
      <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Mail className="text-cyan-400" size={20} /> Контактна інформація
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Email (для квитка та сповіщень)</label>
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
                    onChange={(e) => updatePassenger(index, { discountType: e.target.value })}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-fuchsia-400 outline-none appearance-none cursor-pointer font-bold"
                  >
                    <option value="none">Без знижки (Повний)</option>
                    {childDiscountAvailable && (
                      <option value="child">Дитячий (-50%)</option>
                    )}
                    {customDiscountsList.map((cd) => (
                      <option key={cd.id} value={cd.id}>
                        {cd.label} (-{cd.value}%)
                      </option>
                    ))}
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
        {(formError || bookingError) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400"
          >
            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 font-black text-sm">!</div>
            <p className="text-sm font-bold flex-1">{formError || bookingError}</p>
            <button onClick={() => setFormError(null)} className="text-rose-400 hover:text-white transition-colors shrink-0">
              <XIcon size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Footer */}
      <div className="fixed bottom-0 left-0 right-0 sm:relative bg-[#020617]/90 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none border-t border-white/5 sm:border-0 p-4 pb-8 sm:p-0 z-40" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:p-8 sm:bg-gradient-to-r from-cyan-900/20 to-violet-900/20 sm:rounded-[32px] sm:border sm:border-white/10">
          <div>
            {selectedTrip?.price == null ? (
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle size={16} />
                <p className="text-sm font-black uppercase tracking-widest">Ціна недоступна — оберіть рейс знову</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">
                  Загальна вартість ({passengers.length} пас.)
                </p>
                <p className="text-3xl sm:text-4xl font-black text-white holographic-text">
                  {calculateTotal()} <span className="text-lg font-normal text-cyan-400 italic">{currencyLabel}</span>
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
      <div className="h-32 sm:h-0" />
    </div>
  );
}
