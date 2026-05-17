import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertTriangle, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

export default function InvitePage() {
  const { role, referralId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'auth_required'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [inviterInfo, setInviterInfo] = useState<any>(null);

  useEffect(() => {
    async function checkInvite() {
      if (!referralId) {
        setStatus('error');
        setErrorMessage('Некоректне посилання запрошення');
        return;
      }

      try {
        // 1. Fetch referral link details
        const { data: linkData, error: linkError } = await supabase
          .from('referral_links')
          .select('*')
          .eq('id', referralId)
          .single();

        if (linkError || !linkData) {
          throw new Error('Запрошення не знайдено або воно більше не дійсне.');
        }

        if (linkData.status !== 'active') {
          throw new Error('Це запрошення вже було використано або деактивовано.');
        }

        // Fetch inviter profile mock/info
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', linkData.owner_id)
          .single();

        setInviterInfo(profile || { email: 'Офіційний Партнер BUSNET' });

        // 2. Check if user is logged in
        if (!user) {
          setStatus('auth_required');
          return;
        }

        // 3. Process referral via Edge Function
        const res = await supabase.functions.invoke('process-referral', {
          body: { referralId, newUserId: user.uid }
        });

        if (res.error) {
          throw new Error(res.error.message || 'Помилка при обробці рефералу');
        }

        setStatus('success');
        setTimeout(() => {
          if (role === 'agent') navigate('/carrier');
          else navigate('/');
        }, 3000);

      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Сталася невідома помилка');
      }
    }

    checkInvite();
  }, [referralId, user, role, navigate]);

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      {/* 🌌 Nebula Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00E5FF]/10 via-[#030712] to-[#030712] blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0B1221]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_0_50px_rgba(0,229,255,0.15)] relative z-10 text-center"
      >
        {status === 'loading' && (
          <div className="space-y-6 py-8">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-[#00E5FF]/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-[#00E5FF] border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[#00E5FF]">
                <Loader2 size={28} className="animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-wider">Перевірка Запрошення</h3>
              <p className="text-[10px] text-[#5A6A85] font-black uppercase tracking-widest mt-2">
                Встановлення захищеного B2B/B2C зв'язку...
              </p>
            </div>
          </div>
        )}

        {status === 'auth_required' && (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] mx-auto flex items-center justify-center border border-[#00E5FF]/20 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
              <UserPlus size={32} />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[9px] font-black uppercase tracking-widest mb-3">
                <ShieldCheck size={12} /> Офіційне Запрошення
              </div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                {role === 'agent' ? 'Запрошення для Агента' : 'Запрошення для Пасажира'}
              </h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed font-medium">
                Вас запросив <span className="text-[#00E5FF] font-bold">{inviterInfo ? `${inviterInfo.first_name || ''} ${inviterInfo.last_name || ''}`.trim() || inviterInfo.email : 'Партнер'}</span> приєднатися до екосистеми BUSNET.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1A2639]/30 border border-white/5 text-left space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6A85]">Що ви отримуєте:</p>
              {role === 'agent' ? (
                <ul className="text-xs text-white/80 space-y-1.5 font-medium">
                  <li className="flex items-center gap-2">✓ Прямий доступ до рейсів перевізника</li>
                  <li className="flex items-center gap-2">✓ Автоматичне нарахування комісії</li>
                  <li className="flex items-center gap-2">✓ Закритий B2B чат та підтримка</li>
                </ul>
              ) : (
                <ul className="text-xs text-white/80 space-y-1.5 font-medium">
                  <li className="flex items-center gap-2">✓ Офіційні квитки безпосередньо від партнера</li>
                  <li className="flex items-center gap-2">✓ Пріоритетна клієнтська підтримка</li>
                  <li className="flex items-center gap-2">✓ Збереження історії та швидке бронювання</li>
                </ul>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <button 
                onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                className="w-full py-4 bg-gradient-to-r from-[#00E5FF] to-[#00B0FF] text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Увійти або Зареєструватись <ArrowRight size={16} />
              </button>
              <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest">
                Після входу зв'язок активується автоматично
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-8 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-[#10B981]/10 text-[#10B981] mx-auto flex items-center justify-center border border-[#10B981]/20 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={40} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Успішно Підключено!</h3>
              <p className="text-xs text-white/60 mt-2">
                Ваш акаунт успішно підв'язано до партнерської мережі. Перенаправлення в кабінет...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-8 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <AlertTriangle size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Помилка Запрошення</h3>
              <p className="text-xs text-red-400 mt-2 font-medium">{errorMessage}</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              На головну
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
