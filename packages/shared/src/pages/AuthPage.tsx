import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Smartphone, Building2, Briefcase,
  ArrowRight, Loader2, User, ChevronDown, X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Role } from '../types';
import { supabase } from '../supabase/config';

// ✅ ФІКС: Замість busy-polling використовуємо Zustand store subscription
// Підписка реагує точно коли стан змінився — без CPU навантаження
function waitForUserAndRedirect(): Promise<void> {
  return new Promise((resolve) => {
    const MAX_WAIT = 8000;
    const timer = setTimeout(() => {
      unsub();
      toast.error('Не вдалося визначити роль. Спробуйте ще раз.');
      resolve();
    }, MAX_WAIT);

    const roleRoutes: Record<string, string> = {
      admin: '/admin/',
      carrier: '/carrier/',
      agent: '/agent/',
      driver: '/driver/',
      passenger: '/dashboard',
      user: '/dashboard',
    };

    const tryRedirect = (state: ReturnType<typeof useAuthStore.getState>) => {
      if (!state.loading && state.user) {
        clearTimeout(timer);
        unsub();
        const target = roleRoutes[state.user.role] || '/dashboard';
        setTimeout(() => {
          window.location.href = target;
          resolve();
        }, 300);
      }
    };

    // Перевіряємо одразу (якщо стан вже готовий)
    tryRedirect(useAuthStore.getState());

    // Підписуємось — спрацює точно при наступній зміні стору
    const unsub = useAuthStore.subscribe(tryRedirect);
  });
}


export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('passenger');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isRoleExpanded, setIsRoleExpanded] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // TODO: реалізувати sessionStorage логіку

  const { login, registerCarrier, registerUser, signInWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Введіть ваш Email для відновлення');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success('Інструкції надіслано на пошту');
    } catch (err: any) {
      toast.error('Помилка: ' + err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Редірект відбудеться через /bridge
    } catch (err: any) {
      toast.error(err.message || 'Помилка Google авторизації');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register' && password !== confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        // login() повертає після того як supabase.auth.signInWithPassword виконано.
        // onAuthStateChange в useAuthStore АСИНХРОННО завантажить user з БД.
        // Чекаємо поки loading стане false і user з'явиться.
        toast.success('Вітаємо у Busnet!');
        await waitForUserAndRedirect();
      } else {
        if (role === 'passenger') {
          await registerUser({ email, firstName, lastName, phone, role: 'passenger' }, password);
          toast.success('Аккаунт створено!');
          await waitForUserAndRedirect();
        } else if (role === 'carrier') {
          await registerCarrier({ email, companyName, phone }, password);
          toast.success('Вітаємо у Busnet! Ваш кабінет готовий.');
          await waitForUserAndRedirect();
        } else if (role === 'agent') {
          await registerUser({ email, firstName, lastName, phone, role: 'agent' }, password);
          toast.success('Агент успішно зареєстрований');
          await waitForUserAndRedirect();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Сталася помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 relative overflow-hidden font-dm selection:bg-[#00c8e0]/30 selection:text-white">
      {/* Background */}
      <div
        className="absolute -top-[100px] -left-[100px] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none z-0 opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(0,200,224,0.15) 0%, rgba(0,0,0,0) 70%)' }}
      />
      <div
        className="absolute -bottom-[100px] -right-[100px] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none z-0 opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 70%)' }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -40, 0], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 8 + Math.random() * 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-1 h-1 bg-[#00c8e0]/40 rounded-full blur-[1px]"
          style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] bg-[#111928CC] backdrop-blur-[32px] saturate-[180%] border border-white/10 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden relative z-10"
      >
        {/* Close button */}
        <button
          onClick={() => {
            // Якщо from='/booking' — BookingPage без selectedTrip одразу редіректить на '/'
            // тому NavigatE на '/' щоб уникнути infinite redirect loop
            if (from === '/booking') {
              navigate('/');
            } else {
              navigate(['/', '/forum'].includes(from) ? from : '/');
            }
          }}
          className="absolute top-5 right-5 z-[60] w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
        >
          <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
        </button>

        {/* Tabs */}
        <div className="flex bg-black/30 border-b border-white/5 relative">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-6 text-center font-syne text-[14px] font-extrabold uppercase tracking-tighter transition-all relative z-10 ${
                mode === m ? 'text-white' : 'text-[#5a6a85] hover:text-[#8ba2c4]'
              }`}
            >
              {m === 'login' ? 'Увійти' : 'Реєстрація'}
            </button>
          ))}
          <motion.div
            className="absolute bottom-0 h-[3px] bg-[#00c8e0] shadow-[0_0_20px_#00c8e0] rounded-t-full"
            animate={{ left: mode === 'login' ? '25%' : '75%', x: '-50%', width: '25%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email адреса"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-[16px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 focus:ring-1 focus:ring-[#00c8e0]/20 transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Пароль"
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-[16px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 focus:ring-1 focus:ring-[#00c8e0]/20 transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-start px-1">
                    <button type="button" onClick={handleResetPassword} className="text-[10px] text-[#5a6a85] font-extrabold uppercase tracking-widest hover:text-[#00c8e0] transition-colors">
                      Відновити доступ
                    </button>
                  </div>

                  <button
                    disabled={loading || googleLoading}
                    className="w-full py-4 rounded-2xl font-syne font-black uppercase tracking-tighter text-[13px] text-white flex items-center justify-center gap-2 group transition-all duration-500 relative overflow-hidden active:scale-[0.97] disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #00c8e0 0%, #3b82f6 100%)', boxShadow: '0 15px 35px rgba(0, 200, 224, 0.3)' }}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Авторизуватись</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-[#111928] px-4 text-[#5a6a85]">АБО</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    className="w-full py-3.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-syne font-black uppercase tracking-tighter text-[12px] flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  >
                    {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Увійти через Google</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Role selector */}
                <div className="relative z-50 py-4">
                  <div className="relative max-w-[320px] mx-auto">
                    <motion.button
                      onClick={() => setIsRoleExpanded(!isRoleExpanded)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full relative flex items-center gap-4 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-full p-2.5 transition-all shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] group"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        role === 'passenger' ? 'bg-[#00D4FF]/10 text-[#00D4FF]' :
                        role === 'carrier' ? 'bg-[#FFB800]/10 text-[#FFB800]' :
                        'bg-[#A855F7]/10 text-[#A855F7]'
                      }`}>
                        {role === 'passenger' ? <User className="w-6 h-6" /> :
                         role === 'carrier' ? <Building2 className="w-6 h-6" /> :
                         <Briefcase className="w-6 h-6" />}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 font-syne">РЕЖИМ ДОСТУПУ</span>
                        <span className="text-sm font-black uppercase tracking-widest text-white font-syne">
                          {role === 'passenger' ? 'ПАСАЖИР' : role === 'carrier' ? 'ПЕРЕВІЗНИК' : 'АГЕНТ'}
                        </span>
                      </div>
                      <div className="ml-auto pr-3">
                        <ChevronDown className={`w-5 h-5 transition-all text-white/20 group-hover:text-white/60 ${isRoleExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </motion.button>

                    <AnimatePresence>
                      {isRoleExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0a0f18]/90 backdrop-blur-3xl border border-white/10 rounded-[28px] p-2 flex flex-col gap-1 shadow-2xl z-50"
                        >
                          {(['passenger', 'carrier', 'agent'] as Role[]).map((r) => (
                            <button
                              key={r}
                              onClick={() => { setRole(r); setIsRoleExpanded(false); }}
                              className={`w-full flex items-center gap-3 p-3 rounded-[18px] transition-all ${role === r ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                role === r ? (
                                  r === 'passenger' ? 'bg-[#00D4FF] text-black' :
                                  r === 'carrier' ? 'bg-[#FFB800] text-black' :
                                  'bg-[#A855F7] text-white'
                                ) : 'bg-white/5 text-white/30'
                              }`}>
                                {r === 'passenger' ? <User className="w-4 h-4" /> : r === 'carrier' ? <Building2 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                              </div>
                              <span className={`text-[13px] font-black uppercase tracking-widest font-syne ${role === r ? 'text-white' : 'text-white/40'}`}>
                                {r === 'passenger' ? 'ПАСАЖИР' : r === 'carrier' ? 'ПЕРЕВІЗНИК' : 'АГЕНТ'}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {role === 'passenger' && (
                      <motion.div key="pass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                            <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ім'я"
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                          </div>
                          <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Прізвище"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] px-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <div className="relative group">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Номер телефону"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email адреса"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль"
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                          </div>
                          <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Підтвердити"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] px-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <button disabled={loading} className="w-full py-4 rounded-2xl font-syne font-black uppercase tracking-tighter text-[13px] text-white flex items-center justify-center disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #00c8e0 0%, #3b82f6 100%)', boxShadow: '0 15px 35px rgba(0, 200, 224, 0.3)' }}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Створити аккаунт'}
                        </button>
                        <button type="button" onClick={handleGoogleSignIn} disabled={loading || googleLoading}
                          className="w-full py-3.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-syne font-black uppercase tracking-tighter text-[12px] flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                              </svg>
                              <span>Зареєструватись через Google</span>
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}

                    {role === 'carrier' && (
                      <motion.div key="carrier" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="relative group">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                          <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Назва компанії або ПІБ"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Бізнес пошта"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <div className="relative group">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Контактний телефон"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль"
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                          </div>
                          <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Підтвердити"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] px-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <button disabled={loading} className="w-full py-4 rounded-2xl font-syne font-black uppercase tracking-tighter text-[13px] text-white flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #00c8e0 0%, #3b82f6 100%)', boxShadow: '0 15px 35px rgba(0, 200, 224, 0.3)' }}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Briefcase className="w-4 h-4" /><span>Приєднатись до мережі</span></>}
                        </button>
                      </motion.div>
                    )}

                    {role === 'agent' && (
                      <motion.div key="agent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                            <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ім'я"
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                          </div>
                          <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Прізвище"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] px-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <div className="relative group">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Номер телефону"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email адреса"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a85] group-focus-within:text-[#00c8e0] transition-colors" />
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль"
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                          </div>
                          <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Підтвердити"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-[14px] px-4 text-sm text-white focus:outline-none focus:border-[#00c8e0]/60 transition-all" />
                        </div>
                        <button disabled={loading} className="w-full py-4 rounded-2xl font-syne font-black uppercase tracking-tighter text-[13px] text-white flex items-center justify-center disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', boxShadow: '0 15px 35px rgba(168, 85, 247, 0.4)' }}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Зареєструвати Агента'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 text-[#5a6a85]/30 font-syne text-[10px] uppercase font-black tracking-[0.7em] select-none pointer-events-none">
        <span>БЕЗПЕКА</span>
        <div className="w-[1px] h-4 bg-[#5a6a85]/10" />
        <span>BUSNET СИСТЕМИ 4.0</span>
      </div>
    </div>
  );
}
