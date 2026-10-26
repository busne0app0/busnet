const env = import.meta.env;
const isDev =
  env.DEV ||
  (typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname));

const normalizeUrl = (value?: string): string => {
  const v = (value || '').trim().replace(/\/+$/, '');
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

export const getPortalUrl = (role: string): string => {
  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const currentPort = typeof window !== 'undefined' ? window.location.port : '';

  const normalizedRole = role === 'user' ? 'passenger' : role;

  // Якщо ми локально на єдиному шлюзі localhost:3000 (Multi-Vite)
  if (isLocalhost && (currentPort === '3000' || !currentPort)) {
    const localGatewayPortals: Record<string, string> = {
      carrier: '/carrier/',
      admin: '/admin/',
      agent: '/agent/',
      driver: '/driver/',
      passenger: '/dashboard',
    };
    return localGatewayPortals[normalizedRole] || '';
  }

  const portals: Record<string, string> = {
    carrier: normalizeUrl(env.VITE_CARRIER_URL) || (isDev ? 'http://localhost:3001' : 'https://carrier-blond.vercel.app'),
    admin:   normalizeUrl(env.VITE_ADMIN_URL)   || (isDev ? 'http://localhost:3002' : 'https://admin-puce-delta.vercel.app'),
    agent:   normalizeUrl(env.VITE_AGENT_URL)   || (isDev ? 'http://localhost:3003' : 'https://agent-ruby-three.vercel.app'),
    driver:  normalizeUrl(env.VITE_DRIVER_URL)  || (isDev ? 'http://localhost:3004' : 'https://driver-eight-topaz.vercel.app'),
    passenger: '/dashboard',
  };
  return portals[normalizedRole] || '';
};

// Ролі кабінетів всередині СВОГО додатку завжди ведуть на корінь '/'
export const ROLE_ROUTES: Record<string, string> = {
  admin: '/',
  carrier: '/',
  agent: '/',
  driver: '/',
  passenger: '/dashboard',
  user: '/dashboard',
};

export interface PostLoginTarget {
  url: string;
  external: boolean;
  shouldRedirect: boolean;
  error: boolean;
}

/** Чи веде URL на окремий Vite-додаток (кабінет) локального шлюзу */
export const isSubAppPortal = (url: string): boolean => {
  return /^\/(carrier|admin|agent|driver)(\/|$)/i.test(url);
};

/** Куди йти після входу: повертає URL, external, shouldRedirect, error */
export const getPostLoginTarget = (role?: string | null): PostLoginTarget => {
  const rawRole = (role || '').trim();
  const normalizedRole = rawRole === 'user' ? 'passenger' : rawRole;

  const validRoles = ['passenger', 'carrier', 'agent', 'admin', 'driver'];
  if (!validRoles.includes(normalizedRole)) {
    return { url: '', external: false, shouldRedirect: false, error: true };
  }

  const target = getPortalUrl(normalizedRole);
  if (!target) {
    return { url: '', external: false, shouldRedirect: false, error: true };
  }

  if (typeof window === 'undefined') {
    return { url: target, external: /^https?:\/\//i.test(target), shouldRedirect: false, error: false };
  }

  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;

  // 1. Абсолютний URL (Vercel або окремий порт)
  if (/^https?:\/\//i.test(target)) {
    try {
      const targetUrl = new URL(target);
      if (targetUrl.origin !== currentOrigin) {
        return { url: target, external: true, shouldRedirect: true, error: false };
      }

      // Той самий origin: порівнюємо pathname без кінцевого слеша для перевірки "чи ми вже тут"
      const targetPrefix = targetUrl.pathname.replace(/\/+$/, '');
      const alreadyThere = !targetPrefix || targetPrefix === '/'
        ? currentPath === '/'
        : (currentPath === targetPrefix || currentPath.startsWith(targetPrefix + '/'));

      return { url: target, external: false, shouldRedirect: !alreadyThere, error: false };
    } catch {
      return { url: target, external: true, shouldRedirect: true, error: false };
    }
  }

  // 2. Локальний відносний шлях (наприклад, '/carrier/' або '/dashboard')
  const targetPrefix = target.replace(/\/+$/, '');
  const alreadyThere = !targetPrefix || targetPrefix === '/'
    ? currentPath === '/'
    : (currentPath === targetPrefix || currentPath.startsWith(targetPrefix + '/'));

  // Повертаємо цільовий URL у канонічному вигляді (зі збереженням кінцевого слеша для кабінетів)
  return {
    url: target,
    external: false,
    shouldRedirect: !alreadyThere,
    error: false,
  };
};

export const getAbsoluteRoleRoute = (role: string): string => {
  const target = getPortalUrl(role === 'user' ? 'passenger' : role);
  if (!target) return '/';
  if (/^https?:\/\//i.test(target)) return target;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}${target}`;
};

