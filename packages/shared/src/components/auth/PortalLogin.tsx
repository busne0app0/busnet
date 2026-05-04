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
      const targetUrl = getAbsoluteRoleRoute(user.role);
      if (window.location.href !== targetUrl) {
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

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center relative overflow-hidden p-4">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-15 ${colorClass}`} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-4 border border-white/20 ${colorClass}`}>
              <Icon className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">{title}</h1>
            <p className="text-slate-400 text-center text-sm">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence>
              {(error || localError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-200">{localError || error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-4">
              {!isLogin && (
                <>
                  {role === 'carrier' ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building size={18} className="text-slate-500" />
                      </div>
                      <input
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        required
                        placeholder="Назва транспортної компанії"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User size={18} className="text-slate-500" />
                        </div>
                        <input
                          type="text"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          required
                          placeholder="Ім'я"
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-all"
                        />
                      </div>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        required
                        placeholder="Прізвище"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-all"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={18} className="text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Номер телефону"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                </>
              )}

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="Електронна пошта"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-all"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Пароль"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${colorClass}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Вхід...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Увійти в систему' : 'Створити акаунт'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {role !== 'admin' && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setLocalError(''); }}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {isLogin
                  ? <span>Немає акаунту? <strong className={`text-${baseColorName}-400`}>Зареєструватись</strong></span>
                  : <span>Вже є акаунт? <strong className={`text-${baseColorName}-400`}>Увійти</strong></span>}
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <a href="/" className="text-sm text-slate-500 hover:text-white transition-colors">
              Повернутися на головний сайт BUSNET
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}