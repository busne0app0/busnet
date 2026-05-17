import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Zap, Ticket, Bus, Star } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

const PENDING_REFERRAL_KEY = 'busnet_pending_referral';

export default function InvitePage() {
  const { role, referralId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'guest_ready'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [inviterInfo, setInviterInfo] = useState<any>(null);

  useEffect(() => {
    if (!referralId) {
      setStatus('error');
      setErrorMessage('Некоректне посилання запрошення.');
      return;
    }

    (async () => {
      try {
        const { data: linkData, error } = await supabase
          .from('referral_links')
          .select('*')
          .eq('id', referralId)
          .single();

        if (error || !linkData) throw new Error('Запрошення не знайдено або більше не дійсне.');
        if (linkData.status !== 'active') throw new Error('Це запрошення вже використано або деактивовано.');

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', linkData.owner_id)
          .single();
        setInviterInfo(profile || { email: 'Офіційний Партнер BUSNET' });

        // If user is already logged in — process immediately
        if (user) {
          const res = await supabase.functions.invoke('process-referral', {
            body: { referralId, newUserId: user.uid },
          });
          if (res.error) throw new Error(res.error.message);
          localStorage.removeItem(PENDING_REFERRAL_KEY);
          setStatus('success');
          setTimeout(() => navigate(role === 'agent' ? '/carrier' : '/'), 3000);
          return;
        }

        // Guest flow: save referral to localStorage, show welcome screen
        localStorage.setItem(PENDING_REFERRAL_KEY, referralId);
        setStatus('guest_ready');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Сталася невідома помилка.');
      }
    })();
  }, [referralId, user, role, navigate]);

  const inviterName = inviterInfo
    ? `${inviterInfo.first_name || ''} ${inviterInfo.last_name || ''}`.trim() || inviterInfo.email
    : 'Партнер BUSNET';

  const benefits = role === 'agent'
    ? ['Прямий доступ до рейсів перевізника', 'Автоматичне нарахування комісії', 'Закритий B2B чат та підтримка']
    : ['Офіційні квитки від партнерської мережі', 'Пріоритетна клієнтська підтримка', 'Швидке бронювання та збереження історії'];

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#00E5FF]/5 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#8B5CF6]/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#0B1221]/90 border border-white/10 rounded-[32px] p-8 shadow-[0_0_60px_rgba(0,229,255,0.12)] relative z-10 text-center"
      >
        <AnimatePresence mode="wait">

          {/* Loading */}
          {status === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 py-8">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-[#00E5FF]/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-[#00E5FF] border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={26} className="text-[#00E5FF]" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-wider">Перевірка Запрошення</h3>
                <p className="text-[10px] text-[#5A6A85] font-black uppercase tracking-widest mt-2">Встановлення захищеного зв'язку...</p>
              </div>
            </motion.div>
          )}

          {/* Guest Ready — core new state */}
          {status === 'guest_ready' && (
            <motion.div key="guest" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 py-2">
              {/* Icon */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-full h-full rounded-2xl flex items-center justify-center bg-[#00E5FF]/10 border border-[#00E5FF]/20 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
                  {role === 'agent' ? <Bus size={36} className="text-[#00E5FF]" /> : <Ticket size={36} className="text-[#00E5FF]" />}
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#10B981] flex items-center justify-center shadow-lg">
                  <ShieldCheck size={14} className="text-white" />
                </div>
              </div>

              {/* Badge */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] text-[9px] font-black uppercase tracking-widest mb-3">
                  <Star size={10} /> Офіційне Запрошення
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight leading-tight">
                  {role === 'agent' ? 'Ви запрошені як Агент' : 'Ваше персональне запрошення'}
                </h3>
                <p className="text-sm text-white/60 mt-2 leading-relaxed">
                  Від <span className="text-[#00E5FF] font-bold">{inviterName}</span> до екосистеми BUSNET
                </p>
              </div>

              {/* Benefits */}
              <div className="p-4 rounded-2xl bg-[#1A2639]/50 border border-white/5 text-left space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6A85] mb-2">Що вас чекає:</p>
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#10B981]/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={10} className="text-[#10B981]" />
                    </div>
                    <span className="text-xs text-white/80 font-medium">{b}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                {/* PRIMARY — Guest: go to schedule immediately */}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/')}
                  className="w-full py-4 bg-gradient-to-r from-[#00E5FF] to-[#0080FF] text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_25px_rgba(0,229,255,0.35)] flex items-center justify-center gap-2"
                >
                  Переглянути Рейси <ArrowRight size={16} />
                </motion.button>
                {/* SECONDARY — Register for full benefits */}
                <button
                  onClick={() => navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname))}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-white/20 font-bold uppercase tracking-widest text-xs rounded-2xl transition-all"
                >
                  Зареєструватись для повного доступу
                </button>
                <p className="text-[9px] text-[#5A6A85] font-bold uppercase tracking-widest">
                  Реферал зберігається · Зв'язок активується після реєстрації
                </p>
              </div>
            </motion.div>
          )}

          {/* Success */}
          {status === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 py-8">
              <div className="w-20 h-20 rounded-full bg-[#10B981]/10 text-[#10B981] mx-auto flex items-center justify-center border border-[#10B981]/20 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={40} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Успішно Підключено!</h3>
                <p className="text-xs text-white/60 mt-2">Ваш акаунт підв'язано до мережі {inviterName}. Перенаправлення...</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate(role === 'agent' ? '/carrier' : '/')}
                className="w-full py-3 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#10B981]/30 transition-all flex items-center justify-center gap-2"
              >
                Перейти до Розкладу <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          )}

          {/* Error */}
          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 py-8">
              <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <AlertTriangle size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Помилка</h3>
                <p className="text-xs text-red-400/80 mt-2 font-medium">{errorMessage}</p>
              </div>
              <button onClick={() => navigate('/')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                На головну
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
