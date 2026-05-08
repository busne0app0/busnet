import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * ProtectedRoute — чекає на isInitialized (встановлюється initAuth після
 * обробки першого onAuthStateChange, включно з hash-токенами після редіректу
 * між доменами). Це усуває "темний екран" при переході з лендингу в кабінети.
 */
export function ProtectedRoute({ 
  children, 
  role, 
  loginUrl 
}: { 
  children: React.ReactNode, 
  role?: string, 
  loginUrl: string 
}) {
  const { user, isInitialized } = useAuthStore();

  // Supabase ще не обробив сесію (включно з URL hash-токенами)
  if (!isInitialized) {
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

  // Немає юзера після ініціалізації — редіректим на логін
  if (!user) {
    return <Navigate to={loginUrl} replace />;
  }

  // Перевірка ролі
  const hasAccess = user.role === 'admin' || (role ? user.role === role : true);
  if (!hasAccess) {
    console.warn(`[ProtectedRoute] Access Denied. User role: ${user.role}, Required: ${role}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
