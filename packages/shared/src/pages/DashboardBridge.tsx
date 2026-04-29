import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function DashboardBridge() {
  const { user, isAuthenticated, loading } = useAuthStore();
  const redirected = useRef(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  // Лічильник часу для UX
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 1;
        if (next >= 4) setShowRetry(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (redirected.current) return;

    // ✅ ФІКС: використовуємо origin динамічно — працює і на preview URL і на прод
    const base = window.location.origin;
    const routes: Record<string, string> = {
      admin: `${base}/admin/`,
      carrier: `${base}/carrier/`,
      agent: `${base}/agent/`,
      driver: `${base}/driver/`,
    };

    // Є дані — редиректимо ОДРАЗУ без чекання loading
    if (isAuthenticated && user?.role) {
      redirected.current = true;
      window.location.href = routes[user.role] || base;
      return;
    }

    // Loading завершився — не залогінений
    if (!loading && !isAuthenticated) {
      redirected.current = true;
      window.location.href = base;
      return;
    }

    // Fallback 5 секунд
    const fallback = setTimeout(() => {
      if (!redirected.current) {
        redirected.current = true;
        window.location.href = isAuthenticated && user?.role
          ? routes[user.role]
          : base;
      }
    }, 5000);

    return () => clearTimeout(fallback);
  }, [user, isAuthenticated, loading]);

  return (
    <div className="h-screen w-screen bg-[#030712] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-cyan-400 font-bold text-xl tracking-widest uppercase animate-pulse">
          Синхронізація сесії...
        </div>
        {elapsedSec >= 2 && (
          <p className="text-slate-500 text-sm">
            Зачекайте, будь ласка... ({elapsedSec}с)
          </p>
        )}
        {showRetry && (
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-slate-400 text-sm">Щось пішло не так із з'єднанням</p>
            <button
              onClick={() => window.location.href = window.location.origin}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-xl transition-all text-sm"
            >
              На головну
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest rounded-xl transition-all text-sm"
            >
              Спробувати ще раз
            </button>
          </div>
        )}
      </div>
    </div>
  );
}