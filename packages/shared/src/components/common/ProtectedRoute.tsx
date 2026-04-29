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
      try {
        // ЗАВЖДИ перевіряємо живу сесію — localStorage НЕ є авторизацією
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (!cancelled) setStatus('no-session');
          return;
        }

        // Сесія є — чекаємо поки стор завантажить user (макс 8 сек)
        const start = Date.now();
        const wait = () => {
          if (cancelled) return;
          const u = useAuthStore.getState().user;
          if (u) {
            setStatus('ready');
            return;
          }
          if (Date.now() - start > 8000) {
            setStatus('no-session');
            return;
          }
          setTimeout(wait, 100);
        };
        wait();

      } catch {
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

  if (role && currentUser?.role !== role) {
    window.location.href = '/';
    return null;
  }

  return <>{children}</>;
}