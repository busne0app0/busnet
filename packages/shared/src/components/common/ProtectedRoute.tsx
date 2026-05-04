import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../supabase/config';

export function ProtectedRoute({ 
  children, 
  role, 
  loginUrl 
}: { 
  children: React.ReactNode, 
  role?: string, 
  loginUrl: string 
}) {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<'checking' | 'no-session' | 'ready'>('checking');

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      // ✅ ФІКС: Якщо в сторі ВЖЕ є user — ми готові. Не смикаємо базу зайвий раз.
      const existingUser = useAuthStore.getState().user;
      if (existingUser) {
        if (!cancelled) setStatus('ready');
        return;
      }

      try {
        // Якщо в сторі пусто — перевіряємо живу сесію
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (!cancelled) setStatus('no-session');
          return;
        }

        // Сесія є — чекаємо поки стор завантажить user (макс 8 сек)
        const start = Date.now();
        const wait = () => {
          if (cancelled) return;
          
          const state = useAuthStore.getState();
          
          // Якщо завантаження завершено — ми готові прийняти рішення
          if (!state.loading) {
            if (state.user) {
              setStatus('ready');
              return;
            } else {
              setStatus('no-session');
              return;
            }
          }

          if (Date.now() - start > 8000) {
            console.warn('[ProtectedRoute] Timeout waiting for auth store synchronization');
            setStatus('no-session');
            return;
          }
          setTimeout(wait, 100);
        };
        wait();

      } catch (err) {
        console.error('[ProtectedRoute] Auth check error:', err);
        if (!cancelled) setStatus('no-session');
      }
    };

    check();
    return () => { cancelled = true; };
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030712]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-cyan-400 font-bold text-sm tracking-widest uppercase">
            Перевірка доступу...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'no-session') {
    return <Navigate to={loginUrl} replace />;
  }

  // Беремо user зі стору — LiveSession вже підтверджена вище
  const currentUser = user;

  console.log(`[ProtectedRoute] User: ${currentUser?.email}, Role: ${currentUser?.role}, Required: ${role}`);

  // ✅ ФІКС: Адмін має доступ до ВСЬОГО. Або роль має збігатися.
  const hasAccess = currentUser?.role === 'admin' || (role ? currentUser?.role === role : true);

  if (!hasAccess) {
    console.warn(`[ProtectedRoute] Access Denied. Redirecting to home.`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}