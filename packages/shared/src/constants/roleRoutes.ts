export const ROLE_ROUTES: Record<string, string> = {
  admin: '/',
  carrier: '/',
  agent: '/',
  driver: '/',
  passenger: '/dashboard',
  user: '/dashboard',
};

export const getAbsoluteRoleRoute = (role: string): string => {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const route = ROLE_ROUTES[role] || '/dashboard';
  return `${base}${route}`;
};
