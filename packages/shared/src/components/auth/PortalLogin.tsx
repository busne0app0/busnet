import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Mail, AlertCircle, User, Phone, Building, Loader2 } from 'lucide-react';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { getAbsoluteRoleRoute } from '../../constants/roleRoutes';

export default function PortalLogin({ role, title, subtitle, colorClass, icon: Icon }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, registerCarrier, registerUser, error, user, isAuthenticated, loading: authLoading } = useAuthStore();

  // ✅ ФІКС: Надійний редірект через useEffect
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      console.log('[PortalLogin] Redirecting authenticated user:', user.email, 'to:', user.role);
      const targetUrl = role === 'admin' || role === 'carrier' || role === 'agent' || role === 'driver' ? '/' : '/dashboard';
      if (window.location.pathname !== targetUrl) {
        window.location.href = targetUrl;
      }
    }
  }, [isAuthenticated, authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
        // Редірект відбудеться через useEffect
      } else {
        if (role === 'carrier') {
          if (!companyName || !phone) throw new Error("Усі поля є обов'язковими");
          await registerCarrier({ companyName, email, phone }, password);
        } else {
          if (!firstName || !lastName) throw new Error("Усі поля є обов'язковими");
          await registerUser({ email, firstName, lastName, phone, role }, password);
        }
      }
    } catch (err: any) {
      setLocalError(err.message || 'Помилка авторизації');
      setSubmitting(false);
    }
  };

  const baseColorName = colorClass.match(/text-([a-z]+)-/)?.[1] || 'cyan';

  // Dynamic colors matching theme
  const getThemeColors = () => {
    switch (baseColorName) {
      case 'violet':
        return {
          glow: 'rgba(139, 92, 246, 0.15)',
          glowFocus: 'rgba(139, 92, 246, 0.4)',
          textGlow: 'text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]',
          borderFocus: 'focus:border-violet-500',
          gradientBg: 'from-violet-500/20 via-purple-500/5 to-slate-950',
          buttonBg: 'bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.6)]',
        };
      case 'emerald':
        return {
          glow: 'rgba(16, 185, 129, 0.15)',
          glowFocus: 'rgba(16, 185, 129, 0.4)',
          textGlow: 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]',
          borderFocus: 'focus:border-emerald-500',
          gradientBg: 'from-emerald-500/20 via-teal-500/5 to-slate-950',
          buttonBg: 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]',
        };
      case 'orange':
        return {
          glow: 'rgba(249, 115, 22, 0.15)',
          glowFocus: 'rgba(249, 115, 22, 0.4)',
          textGlow: 'text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]',
          borderFocus: 'focus:border-orange-500',
          gradientBg: 'from-orange-500/20 via-amber-500/5 to-slate-950',
          buttonBg: 'bg-orange-600 hover:bg-orange-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.6)]',
        };
      case 'cyan':
      default:
        return {
          glow: 'rgba(6, 182, 212, 0.15)',
          glowFocus: 'rgba(6, 182, 212, 0.4)',
          textGlow: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]',
          borderFocus: 'focus:border-cyan-400',
          gradientBg: 'from-cyan-500/20 via-blue-500/5 to-slate-950',
          buttonBg: 'bg-cyan-500 hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]',
        };
    }
  };

  const colors = getThemeColors();

  // Create floating background particles
  const particles = React.useMemo(() =>
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      duration: Math.random() * 15 + 20,
      delay: Math.random() * -20,
    })), []
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden p-4 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Import Syne font dynamic */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-syne {
          font-family: 'Syne', sans-serif;
        }
        body {
          font-family: 'Inter', sans-serif;
        }
      `}} />

      {/* Futuristic Mesh Gradients */}
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b ${colors.gradientBg} pointer-events-none z-0`} />
      
      {/* Radial neon glow blobs */}
      <motion.div 
        animate={{
          scale: [1, 1.15, 0.95, 1],
          opacity: [0.12, 0.18, 0.14, 0.12],
          x: [0, 40, -30, 0],
          y: [0, -30, 50, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] bg-cyan-500/20 pointer-events-none z-0" 
      />
      <motion.div 
        animate={{
          scale: [1, 0.9, 1.1, 1],
          opacity: [0.1, 0.16, 0.12, 0.1],
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] bg-purple-500/25 pointer-events-none z-0" 
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute bg-white/30 rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              y: [0, -180, 0],
              opacity: [0.1, 0.7, 0.1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glow behind the main card */}
        <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-2xl opacity-40 z-0 pointer-events-none transition-all duration-1000 group-hover:opacity-60" />

        <div className="bg-slate-950/70 border border-white/10 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl relative z-10 hover:border-white/15 transition-all duration-500">
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] mb-4 border border-white/15 bg-slate-900/80 cursor-pointer overflow-hidden p-2`}
            >
              <img src="/icon.png" alt="BUSNET UA" className="w-full h-full object-contain" />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2 font-syne text-center">
              {title}
            </h1>
            <p className="text-slate-400 text-center text-sm font-medium tracking-wide">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {(error || localError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5 animate-pulse" size={18} />
                  <p className="text-sm text-red-200">{localError || error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4"
                  >
                    {role === 'carrier' ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Building size={18} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          required
                          placeholder="Назва транспортної компанії"
                          className={`w-full bg-slate-950/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900/50 ${colors.borderFocus} focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium`}
                        />
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User size={18} className="text-slate-400" />
                          </div>
                          <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            required
                            placeholder="Ім'я"
                            className={`w-full bg-slate-950/60 border border-white/10 rounded-xl py-3.5 pl-10 pr-3 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900/50 ${colors.borderFocus} transition-all font-medium`}
                          />
                        </div>
                        <input
                          type="text"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          required
                          placeholder="Прізвище"
                          className={`flex-1 bg-slate-950/60 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900/50 ${colors.borderFocus} transition-all font-medium`}
                        />
                      </div>
                    )}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone size={18} className="text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Номер телефону"
                        className={`w-full bg-slate-950/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900/50 ${colors.borderFocus} transition-all font-medium`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="Електронна пошта"
                  className={`w-full bg-slate-950/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900/50 ${colors.borderFocus} transition-all font-medium`}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Пароль"
                  className={`w-full bg-slate-950/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-900/50 ${colors.borderFocus} transition-all font-medium`}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all duration-300 disabled:opacity-50 ${colors.buttonBg}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isLogin ? 'Вхід...' : 'Реєстрація...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Увійти в систему' : 'Створити акаунт'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {role !== 'admin' && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setLocalError(''); }}
                className="text-sm text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                {isLogin
                  ? <span>Немає акаунту? <strong className={colors.textGlow}>Зареєструватись</strong></span>
                  : <span>Вже є акаунт? <strong className={colors.textGlow}>Увійти</strong></span>}
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors font-medium tracking-wide">
              Повернутися на головний сайт BUSNET
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
