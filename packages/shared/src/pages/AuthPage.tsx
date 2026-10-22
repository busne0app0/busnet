import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Mail, Lock, Smartphone, Building2, Briefcase,
  ArrowRight, ArrowLeft, Loader2, User, ChevronDown, X, Bus, Zap
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Role } from '../types';
import { supabase } from '../supabase/config';
import { getAbsoluteRoleRoute } from '../constants/roleRoutes';
import { PartnerApplicationModal } from '../components/auth/PartnerApplicationModal';

// ─── Floating particle data ───────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: 10 + Math.random() * 14,
  delay: Math.random() * 8,
  color: i % 3 === 0 ? '#00E5FF' : i % 3 === 1 ? '#E879F9' : '#FBBF24',
  opacity: Math.random() * 0.4 + 0.1,
}));

// ─── Neon Input ───────────────────────────────────────────────────────────────
const NeonInput = ({
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  accentColor = '#00E5FF',
}: {
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  accentColor?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative group">
      <Icon
        className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-all duration-300"
        style={{ color: focused ? accentColor : '#5a6a85' }}
      />
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-black/30 border rounded-2xl py-[15px] pl-12 pr-4 text-[13px] text-white outline-none transition-all duration-300 placeholder-[#3d4f6a]"
        style={{
          borderColor: focused ? `${accentColor}60` : 'rgba(255,255,255,0.06)',
          boxShadow: focused ? `0 0 0 1px ${accentColor}30, inset 0 0 20px ${accentColor}05` : 'none',
        }}
      />
      {/* Animated underline */}
      <motion.div
        className="absolute bottom-0 left-4 right-4 h-[1px] rounded-full"
        style={{ background: accentColor }}
        animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
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

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const formatAuthError = (msg?: string) => {
    if (!msg) return 'Сталася помилка. Спробуйте ще раз';
    if (msg.includes('Invalid login credentials')) return 'Невірний email або пароль';
    if (msg.includes('Email not confirmed')) return 'Електронна пошта ще не підтверджена';
    if (msg.includes('User already registered')) return 'Користувач з такою поштою вже зареєстрований';
    if (msg.includes('Password should be at least')) return 'Пароль повинен містити щонайменше 6 символів';
    if (msg.includes('rate limit') || msg.includes('Too many')) return 'Забагато спроб. Зачекайте хвилину';
    return msg;
  };

  const { login, registerCarrier, registerUser, signInWithGoogle, user, isAuthenticated, loading: authLoading, setLoading: setAuthLoading } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const targetUrl = getAbsoluteRoleRoute(user.role);
      if (window.location.href !== targetUrl) {
        window.location.href = targetUrl;
      }
    }
  }, [isAuthenticated, authLoading, user]);

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) { toast.error('Введіть ваш Email для відновлення'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      if (error) throw error;
      toast.success('Інструкції для відновлення надіслано на вашу пошту!');
    } catch (err: any) { toast.error(formatAuthError(err.message)); }
    finally { setLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch (err: any) { toast.error(formatAuthError(err.message)); setGoogleLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && password !== confirmPassword) { toast.error('Паролі не співпадають'); return; }
    setLoading(true);
    const loadingTimeout = setTimeout(() => {
      const state = useAuthStore.getState();
      if (state.isAuthenticated && state.user) { window.location.href = getAbsoluteRoleRoute(state.user.role); }
      else if (!state.isAuthenticated) { setLoading(false); setAuthLoading(false); }
    }, 6000);
    try {
      if (mode === 'login') {
        await login(email, password);
        clearTimeout(loadingTimeout);
        toast.success('Вітаємо у Busnet!');
      } else {
        await registerUser({ email, firstName, lastName, phone, role: 'passenger' }, password);
        clearTimeout(loadingTimeout);
        toast.success('Аккаунт створено!');
      }
    } catch (err: any) { clearTimeout(loadingTimeout); toast.error(formatAuthError(err.message)); }
    finally { setLoading(false); }
  };

  const accentColor = role === 'carrier' ? '#FBBF24' : role === 'agent' ? '#A855F7' : '#00E5FF';
  const accentGlow = role === 'carrier' ? 'rgba(251,191,36,0.3)' : role === 'agent' ? 'rgba(168,85,247,0.3)' : 'rgba(0,229,255,0.3)';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#00E5FF]/30 selection:text-white"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, #020b12 0%, #050B14 60%, #07090e 100%)' }}
    >
      {/* ── Deep space gradient mesh ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full blur-[140px] opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.18) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(232,121,249,0.15) 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 65%)' }} />
      </div>

      {/* ── Grid lines (subtle) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* ── Floating particles ── */}
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            filter: `blur(${p.size > 2.5 ? 1 : 0}px)`,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          animate={{
            y: [0, -(30 + Math.random() * 40), 0],
            x: [0, (Math.random() - 0.5) * 20, 0],
            opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.2, p.opacity],
            scale: [1, 1.3, 0.8, 1],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* ── Orbiting ring decoration ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
        <motion.div
          className="w-[700px] h-[700px] rounded-full border border-[#00E5FF]/5"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-[80px] rounded-full border border-[#E879F9]/5"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(11,18,33,0.92) 0%, rgba(5,11,20,0.95) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 32,
          boxShadow: `0 40px 100px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px ${accentGlow}`,
        }}
      >
        {/* Accent glow top bar */}
        <motion.div
          className="absolute top-0 left-8 right-8 h-[1px] rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Close button */}
        <button
          onClick={() => navigate(from === '/booking' ? '/' : ['/', '/forum'].includes(from) ? from : '/')}
          className="absolute top-5 right-5 z-[60] w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300 group"
        >
          <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center pt-8 pb-2">
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)`, border: `1px solid ${accentColor}30` }}
            animate={{ boxShadow: [`0 0 10px ${accentColor}20`, `0 0 25px ${accentColor}40`, `0 0 10px ${accentColor}20`] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Bus size={22} style={{ color: accentColor }} />
          </motion.div>
          <p className="text-[9px] font-black tracking-[0.4em] uppercase" style={{ color: accentColor }}>BUSNET UA</p>
        </div>

        {/* Tabs */}
        {mode !== 'forgot' && (
          <div className="flex bg-black/20 border-b border-white/5 relative mx-0 mt-4">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-5 text-center font-black text-[13px] uppercase tracking-widest transition-all relative z-10 font-sans ${
                  mode === m ? 'text-white' : 'text-[#4a5a75] hover:text-[#7a90b5]'
                }`}
              >
                {m === 'login' ? 'Вхід' : 'Реєстрація'}
              </button>
            ))}
            <motion.div
              className="absolute bottom-0 h-[2px] rounded-t-full"
              style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, boxShadow: `0 0 12px ${accentColor}` }}
              animate={{ left: mode === 'login' ? '25%' : '75%', x: '-50%', width: '28%' }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          </div>
        )}

        {/* Form area */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {mode === 'forgot' ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-white tracking-tighter">Відновлення доступу</h1>
                  <p className="text-[11px] text-[#8b9dc3] font-bold uppercase tracking-widest mt-1">
                    Введіть email, на який надіслати інструкції
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <NeonInput icon={Mail} type="email" value={email} onChange={setEmail} placeholder="Email адреса" required accentColor={accentColor} />

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[12px] text-white flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #0EA5E9 100%)` }}
                    whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${accentGlow}` }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <Zap size={14} />
                        <span>Надіслати інструкції</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center py-2.5 text-xs font-bold text-[#8b9dc3] hover:text-[#00E5FF] transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={14} />
                    <span>Повернутися до входу</span>
                  </button>
                </form>
              </motion.div>
            ) : mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-white tracking-tighter">Вітаємо назад</h1>
                  <p className="text-[11px] text-[#8b9dc3] font-bold uppercase tracking-widest mt-1">Увійдіть до вашого кабінету</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <NeonInput icon={Mail} type="email" value={email} onChange={setEmail} placeholder="Email адреса" required accentColor={accentColor} />
                  <NeonInput icon={Lock} type="password" value={password} onChange={setPassword} placeholder="Пароль" required accentColor={accentColor} />

                  <div className="flex items-center justify-end px-1">
                    <button type="button" onClick={() => setMode('forgot')} className="text-[11px] text-[#8b9dc3] font-bold uppercase tracking-wider hover:text-[#00E5FF] transition-colors">
                      Відновити доступ
                    </button>
                  </div>

                  {/* Primary button with pulse */}
                  <motion.button
                    disabled={loading || googleLoading}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[12px] text-white flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${role === 'passenger' ? '#0EA5E9' : role === 'carrier' ? '#F97316' : '#7c5cfc'} 100%)` }}
                    whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${accentGlow}` }}
                    whileTap={{ scale: 0.98 }}
                    animate={{ boxShadow: [`0 10px 30px ${accentGlow}`, `0 15px 40px ${accentGlow.replace('0.3', '0.5')}`, `0 10px 30px ${accentGlow}`] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' } as any}
                  >
                    {/* Shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                    />
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <Zap size={14} />
                        <span>Авторизуватись</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  {/* Clean transparent divider without background box */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b9dc3]">
                      або
                    </span>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    className="w-full py-3.5 rounded-2xl border border-white/8 bg-white/[0.04] hover:bg-white/[0.08] text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  >
                    {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="text-center mb-3">
                  <h1 className="text-2xl font-black text-white tracking-tighter">Приєднатись</h1>
                  <p className="text-[11px] text-[#8b9dc3] font-bold uppercase tracking-widest mt-1">Реєстрація пасажира</p>
                </div>

                {/* Google Sign-In Top Option */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full py-3.5 rounded-2xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg"
                >
                  {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Реєстрація через Google</span>
                    </>
                  )}
                </button>

                {/* Clean transparent divider without background box */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b9dc3]">
                    або через email
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <NeonInput icon={User} value={firstName} onChange={setFirstName} placeholder="Ім'я" required accentColor="#00E5FF" />
                    <div className="relative">
                      <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Прізвище"
                        className="w-full bg-black/30 border border-white/6 rounded-2xl py-[15px] px-4 text-[13px] text-white outline-none focus:border-[#00E5FF]/40 transition-all placeholder-[#3d4f6a]" />
                    </div>
                  </div>
                  <NeonInput icon={Smartphone} type="tel" value={phone} onChange={setPhone} placeholder="Номер телефону" required accentColor="#00E5FF" />
                  <NeonInput icon={Mail} type="email" value={email} onChange={setEmail} placeholder="Email адреса" required accentColor="#00E5FF" />
                  <div className="grid grid-cols-2 gap-3">
                    <NeonInput icon={Lock} type="password" value={password} onChange={setPassword} placeholder="Пароль" required accentColor="#00E5FF" />
                    <div className="relative">
                      <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Підтвердити"
                        className="w-full bg-black/30 border border-white/6 rounded-2xl py-[15px] px-4 text-[13px] text-white outline-none focus:border-[#00E5FF]/40 transition-all placeholder-[#3d4f6a]" />
                    </div>
                  </div>

                  <motion.button
                    disabled={loading}
                    className="w-full mt-2 py-4 rounded-2xl font-black uppercase tracking-widest text-[12px] text-white flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #00E5FF 0%, #0EA5E9 100%)' }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 35px rgba(0,229,255,0.3)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <User size={14} />
                        <span>Створити акаунт пасажира</span>
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Partner Application Link */}
                <div className="pt-4 border-t border-white/5 text-center">
                  <button
                    type="button"
                    onClick={() => setIsPartnerModalOpen(true)}
                    className="text-[12px] text-amber-400/90 hover:text-amber-300 transition-colors font-medium flex items-center justify-center gap-2 mx-auto group"
                  >
                    <Building2 size={15} className="group-hover:scale-110 transition-transform text-amber-400" />
                    <span>Транспортна компанія чи квитковий агент? <strong className="underline underline-offset-2">Подати заявку</strong></span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom accent bar */}
        <motion.div
          className="absolute bottom-0 left-8 right-8 h-[1px] rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </motion.div>

      {/* Bottom label */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[#3a4a5a] text-[9px] uppercase font-black tracking-[0.5em] select-none pointer-events-none">
        <span>БЕЗПЕКА</span>
        <div className="w-[1px] h-3 bg-[#3a4a5a]/30" />
        <span>BUSNET СИСТЕМИ 4.0</span>
        <div className="w-[1px] h-3 bg-[#3a4a5a]/30" />
        <span>UA</span>
      </div>

      {/* Partner Application Modal */}
      <PartnerApplicationModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
      />
    </div>
  );
}
