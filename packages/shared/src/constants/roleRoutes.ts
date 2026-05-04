export const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin/',
  carrier: '/carrier/',
  agent: '/agent/',
  driver: '/driver/',
  passenger: '/dashboard',
  user: '/dashboard',
};

export const getAbsoluteRoleRoute = (role: string): string => {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const route = ROLE_ROUTES[role] || '/dashboard';
  return `${base}${route}`;
};
