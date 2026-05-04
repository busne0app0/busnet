import { create } from 'zustand';
import { supabase } from '../supabase/config';
import { User, Role } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  activeRole: Role | null;
  initInProgress: boolean;
  authSubscription: any;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  initAuth: () => () => void;
  registerUser: (userData: any, password: string) => Promise<void>;
  registerCarrier: (companyData: any, password: string) => Promise<void>;
  registerFromBooking: (userData: any, password?: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

// Глобальний прапорець для запобігання конфліктам запитів до Supabase
let isProcessingAuth = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  activeRole: null,
  initInProgress: false,
  authSubscription: null,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    activeRole: (user?.role as Role) || null 
  }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    console.log('[AuthStore] Attempting login for:', email);
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[AuthStore] Login error:', error.message, error.status);
        throw error;
      }
      console.log('[AuthStore] Login successful for:', email);
    } catch (err: any) {
      console.error('[AuthStore] Login catch error:', err);
      set({ error: err.message || 'Помилка входу', loading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ 
        user: null, 
        isAuthenticated: false, 
        activeRole: null,
        loading: false,
        error: null 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/bridge`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  initAuth: () => {
    const { authSubscription } = get();
    if (authSubscription) return () => {};

    let isHandling = false; // локальний флаг, не глобальний

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[initAuth] Event:', event, '| isHandling:', isHandling, '| email:', session?.user?.email);

        // SIGNED_OUT — завжди обробляємо
        if (!session) {
          isHandling = false;
          isProcessingAuth = false;
          set({ user: null, isAuthenticated: false, activeRole: null, loading: false, initInProgress: false });
          return;
        }

        // SIGNED_IN завжди обробляємо (навіть якщо isHandling=true — це нова сесія)
        if (event === 'SIGNED_IN') {
          isHandling = false; // скидаємо щоб опрацювати нову сесію
        }

        // Пропускаємо лише дублікати TOKEN_REFRESHED та повторні INITIAL_SESSION
        if (isHandling && (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          console.log('[initAuth] Skipping duplicate event:', event);
          return;
        }

        // INITIAL_SESSION при вже залогіненому — просто не блокуємо
        if (event === 'INITIAL_SESSION' && get().isAuthenticated) {
          return;
        }

        isHandling = true;
        isProcessingAuth = true;
        set({ loading: true });

        // ВАЖЛИВО: Відкріплюємо асинхронний запит від основного потоку onAuthStateChange.
        // Це усуває deadlock у Supabase v2, коли supabase.from() намагається отримати сесію,
        // яка зараз заблокована виконанням onAuthStateChange.
        setTimeout(async () => {
          try {
            console.log('[initAuth] Loading profile for UID:', session.user.id);

            // 1. Шукаємо по uid
            let { data: users } = await supabase
              .from('users')
              .select('*')
              .eq('uid', session.user.id)
              .limit(1);

            let userData = users && users.length > 0 ? users[0] : null;

            // 2. Шукаємо по email якщо uid не знайдено
            if (!userData && session.user.email) {
              const { data: byEmail } = await supabase
                .from('users')
                .select('*')
                .eq('email', session.user.email)
                .limit(1);
              
              if (byEmail && byEmail.length > 0) {
                // Оновлюємо uid
                await supabase.from('users').update({ uid: session.user.id }).eq('email', session.user.email);
                userData = { ...byEmail[0], uid: session.user.id };
              }
            }

            // 3. Якщо профіль ще не знайдено — чекаємо 2с (register вставляє його)
            if (!userData) {
              console.log('[initAuth] Profile not found, waiting 2s for register to insert...');
              await new Promise(r => setTimeout(r, 2000));
              const { data: retried } = await supabase
                .from('users').select('*').eq('uid', session.user.id).limit(1);
              userData = retried && retried.length > 0 ? retried[0] : null;
            }

            // 4. Fallback — створюємо профіль з метаданих
            if (!userData) {
              const meta = session.user.user_metadata || {};
              let role: Role = meta.role || 'passenger';
              const path = window.location.pathname;
              if (!meta.role) {
                if (path.includes('/admin')) role = 'admin';
                else if (path.includes('/carrier')) role = 'carrier';
                else if (path.includes('/agent')) role = 'agent';
              }
              userData = {
                uid: session.user.id,
                email: session.user.email || '',
                role,
                firstName: meta.firstName || meta.full_name?.split(' ')[0] || '',
                lastName: meta.lastName || meta.full_name?.split(' ').slice(1).join(' ') || '',
                phone: meta.phone || '',
                status: 'active',
              };
              await supabase.from('users').upsert(userData, { onConflict: 'uid' });
              console.log('[initAuth] Created fallback profile with role:', role);
            }

            console.log('[initAuth] ✅ Profile loaded:', userData.email, 'role:', userData.role);
            set({
              user: userData as User,
              isAuthenticated: true,
              activeRole: (userData.role as Role) || 'passenger',
              loading: false,
              error: null,
              initInProgress: false,
            });

          } catch (err: any) {
            console.error('[initAuth] Error:', err);
            set({ loading: false, initInProgress: false });
          } finally {
            isHandling = false;
            isProcessingAuth = false;
          }
        }, 0);
      }
    );

    set({ authSubscription: subscription });
    return () => {
      subscription.unsubscribe();
      set({ authSubscription: null, initInProgress: false });
    };
  },


  registerUser: async (userData, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password,
        options: { data: { ...userData, role: userData.role || 'passenger' } },
      });
      if (error) throw error;
      if (data.user) {
        const newUser = { uid: data.user.id, ...userData, role: userData.role || 'passenger', status: 'active' };
        // Вставляємо профіль одразу — initAuth перевірить DB через 2 секунди
        const { error: insertError } = await supabase.from('users').upsert(newUser, { onConflict: 'uid' });
        if (insertError) console.warn('[registerUser] Profile insert warning:', insertError.message);
        console.log('[registerUser] Profile saved for:', userData.email);
        // loading скинеться через onAuthStateChange → initAuth
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  registerCarrier: async (companyData, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: companyData.email,
        password,
        options: { 
          data: { 
            companyName: companyData.companyName,
            phone: companyData.phone,
            role: 'carrier' 
          } 
        },
      });
      if (error) throw error;
      if (data.user) {
        const newCarrier = { uid: data.user.id, ...companyData, role: 'carrier', status: 'active' };
        const { error: insertError } = await supabase.from('users').upsert(newCarrier, { onConflict: 'uid' });
        if (insertError) console.warn('[registerCarrier] Profile insert warning:', insertError.message);
        console.log('[registerCarrier] Carrier profile saved for:', companyData.email);
        // loading скинеться через onAuthStateChange → initAuth
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  registerFromBooking: async (userData, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: password || Math.random().toString(36).slice(-12),
        options: { data: { ...userData, role: 'passenger' } },
      });
      if (error) throw error;
      if (data.user) {
        const newPassenger = { uid: data.user.id, ...userData, role: 'passenger', status: 'active' };
        await new Promise(resolve => setTimeout(resolve, 500));
        await supabase.from('users').insert(newPassenger);
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  loginWithPhone: async (phone) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateUserProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('uid', user.uid);
      if (error) throw error;
      set({ user: { ...user, ...updates }, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));