import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useAdminStore } from '../../../store/useAdminStore';
import {
  Plus,
  Trash2,
  Mail,
  Lock,
  UserCheck,
  X as XIcon,
  LogIn,
  Percent,
  ChevronDown,
  Check
} from 'lucide-react';
import { getTripCurrencySymbol } from '@busnet/shared/lib/currencyUtils';

// Компонент фірмового стильного випадаючого списку знижок
function DiscountDropdown({
  value,
  onChange,
  childAvailable,
  customDiscounts,
}: {
  value?: string;
  onChange: (val: string) => void;
  childAvailable: boolean;
  customDiscounts: { id: string; label: string; value: number }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Якщо в базі знижки не задані — показуємо офіційні стандартні знижки перевізника
  const defaultDiscounts = [
    { id: 'child_50', label: 'Діти до 4 років', value: 50 },
    { id: 'child_30', label: 'Діти від 4 до 12 років', value: 30 },
    { id: 'student_10', label: 'Студенти', value: 10 },
    { id: 'senior_10', label: 'Пенсіонери (60+)', value: 10 },
  ];

  const activeCustom = customDiscounts.length > 0
    ? customDiscounts.map(cd => ({ id: cd.id, label: cd.label, value: cd.value }))
    : defaultDiscounts;

  const options = [
    { id: 'none', label: 'Без знижки (Повний)', value: 0 },
    ...(childAvailable ? [{ id: 'child', label: 'Дитячий', value: 50 }] : []),
    ...activeCustom
  ];

  const currentOption = options.find(o => o.id === (value || 'none')) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 hover:bg-black/60 border border-white/10 hover:border-cyan-500/40 rounded-xl px-3 py-2 text-white flex items-center justify-between gap-2 transition-all font-bold text-xs sm:text-sm text-left group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Percent size={13} className="text-cyan-400 shrink-0" />
          <span className="truncate">{currentOption.label}</span>
          {currentOption.value > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-black shrink-0">
              -{currentOption.value}%
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 group-hover:text-cyan-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0d1322] border border-cyan-500/30 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-1 overflow-hidden backdrop-blur-xl"
          >
            {options.map((opt) => {
              const isSelected = opt.id === (value || 'none');
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${isSelected
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.value > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-black">
                        -{opt.value}%
                      </span>
                    )}
                    {isSelected && <Check size={14} className="text-cyan-400" />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

  const calculateTotal = () => {
    const basePrice = selectedTrip?.price ?? null;
    if (basePrice === null) return 0;

    const discountPercents: Record<string, number> = {
      none: 0,
      child: 50,
      child_50: 50,
      child_30: 30,
      student_10: 10,
      senior_10: 10,
    };

    (selectedTrip?.custom_discounts || []).forEach(cd => {
      discountPercents[cd.id] = cd.value;
    });

    return passengers.reduce((total, p) => {
      const discountVal = discountPercents[p.discountType] || 0;
      const price = basePrice * (1 - discountVal / 100);
      return total + price;
    }, 0);
  };

  const handleNext = async () => {
    setFormError(null);

    if (!isAuthenticated) {
      setFormError('Будь ласка, увійдіть у свій акаунт або зареєструйтесь перед бронюванням.');
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

    const success = await confirmBooking();
    if (!success) return;

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
  const currencyLabel = getTripCurrencySymbol(selectedTrip?.departureCity || selectedTrip?.from, selectedTrip?.arrivalCity || selectedTrip?.to, selectedTrip?.currency);

  return (
    <div className="space-y-4 pb-8">
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
        <div className="p-5 sm:p-8 rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <LogIn className="text-cyan-400" size={18} /> Авторизація
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                Для підтвердження збереження квитків
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${authMode === 'login'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Вхід
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${authMode === 'register'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Реєстрація
              </button>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3.5 max-w-xl">
            {authMode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Ім'я"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-cyan-400 font-bold placeholder:text-slate-600 text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Прізвище"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-cyan-400 font-bold placeholder:text-slate-600 text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input
                  type="email"
                  required
                  placeholder="Ваш Email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-cyan-400 font-bold placeholder:text-slate-600 text-sm"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input
                  type="password"
                  required
                  placeholder="Ваш пароль"
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none focus:border-cyan-400 font-bold placeholder:text-slate-600 text-sm"
                />
              </div>
            </div>

            {authFormError && (
              <p className="text-rose-400 text-xs font-bold">{authFormError}</p>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                {authMode === 'login' ? 'Увійти' : 'Зареєструватися'}
              </button>

              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-[22px] bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black">
              <UserCheck size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Ви авторизовані</p>
              <p className="text-xs sm:text-sm font-bold text-white">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. КОНТАКТНІ ДАНІ */}
      <div className="p-5 sm:p-7 rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-xl">
        <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Mail className="text-cyan-400" size={18} /> Контактна інформація
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Email (для квитка)</label>
            <input
              type="email"
              value={mainContact.email}
              onChange={(e) => updateContact({ email: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-400 outline-none transition-all placeholder:text-slate-600 font-bold text-sm"
              placeholder="example@mail.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Номер телефону</label>
            <input
              type="tel"
              value={mainContact.phone}
              onChange={(e) => updateContact({ phone: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-400 outline-none transition-all placeholder:text-slate-600 font-bold text-sm"
              placeholder="+380..."
            />
          </div>
        </div>
      </div>

      {/* 2. СПИСОК ПАСАЖИРІВ */}
      <div className="space-y-3.5">
        <AnimatePresence>
          {passengers.map((passenger, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-5 sm:p-6 rounded-[24px] bg-white/5 border border-white/10 relative overflow-visible group backdrop-blur-md"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-400/20">
                  ПАСАЖИР 0{index + 1}
                </span>
                {index > 0 && (
                  <button
                    onClick={() => removePassenger(index)}
                    className="text-rose-400 hover:text-white transition-colors p-1.5 hover:bg-rose-500/20 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Ім'я</label>
                  <input
                    placeholder="Ім'я"
                    value={passenger.firstName}
                    onChange={(e) => updatePassenger(index, { firstName: e.target.value })}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3.5 py-2 text-white focus:border-cyan-400 outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Прізвище</label>
                  <input
                    placeholder="Прізвище"
                    value={passenger.lastName}
                    onChange={(e) => updatePassenger(index, { lastName: e.target.value })}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3.5 py-2 text-white focus:border-cyan-400 outline-none font-bold text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Знижка</label>
                  <DiscountDropdown
                    value={passenger.discountType}
                    onChange={(val) => updatePassenger(index, { discountType: val })}
                    childAvailable={childDiscountAvailable}
                    customDiscounts={customDiscountsList}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Кнопка "Додати пасажира" */}
        <button
          type="button"
          onClick={addPassenger}
          className="w-full py-4 border-2 border-dashed border-cyan-400/30 hover:border-cyan-400/60 rounded-[24px] text-cyan-400 hover:text-white transition-all flex items-center justify-center gap-2.5 group bg-cyan-950/20 active:scale-[0.98]"
        >
          <Plus size={20} className="group-hover:rotate-180 transition-transform duration-500 text-cyan-400" />
          <span className="text-xs font-black uppercase tracking-widest italic">Додати пасажира</span>
        </button>
      </div>

      {/* Inline Form Error Banner */}
      <AnimatePresence>
        {(formError || bookingError) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-3.5 bg-rose-950/90 border border-rose-500/50 rounded-2xl text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
          >
            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 font-black text-xs text-rose-400">!</div>
            <p className="text-xs font-bold flex-1 leading-snug">{formError || bookingError}</p>
            <button onClick={() => setFormError(null)} className="text-rose-400 hover:text-white transition-colors shrink-0 p-1">
              <XIcon size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Підсумковий блок вартості та кнопка підтвердження */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141928]/95 border border-white/10 shadow-xl flex items-center justify-between gap-4 mt-2">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
            Загальна вартість ({passengers.length} пас.)
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
              {calculateTotal().toLocaleString('uk-UA')}
            </span>
            <span className="text-xs font-bold text-slate-300">
              {currencyLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={selectedTrip?.price == null}
          className="neon-gradient-btn min-h-11 px-6 sm:px-8 py-3 rounded-xl font-black uppercase tracking-wider text-xs sm:text-sm text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
        >
          Підтвердити квитки
        </button>
      </div>
    </div>
  );
}