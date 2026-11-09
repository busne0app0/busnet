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
  isInitialized: boolean;
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

let isProcessingAuth = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  activeRole: null,
  initInProgress: false,
  isInitialized: false,
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
    if (authSubscription) return () => { };

    let isHandling = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[initAuth] Event:', event, '| isHandling:', isHandling, '| email:', session?.user?.email);

        // SIGNED_OUT — завжди скидаємо
        if (!session) {
          isHandling = false;
          isProcessingAuth = false;
          set({ user: null, isAuthenticated: false, activeRole: null, loading: false, initInProgress: false, isInitialized: true });
          return;
        }

        // ЗАХИСТ ВІД ЦИКЛУ: Якщо профіль вже завантажено для цього UID — ігноруємо повторні події
        const currentUser = get().user;
        const currentUid = (currentUser as any)?.uid || (currentUser as any)?.id;
        if (get().isAuthenticated && currentUid === session.user.id) {
          console.log('[initAuth] ⏩ Профіль для', session.user.email, 'вже завантажено. Ігноруємо дублікат', event);
          set({ loading: false, isInitialized: true });
          return;
        }

        // Пропускаємо дублікати під час активного запиту
        if (isHandling) {
          console.log('[initAuth] Skipping duplicate event:', event);
          return;
        }

        isHandling = true;
        isProcessingAuth = true;
        set({ loading: true });

        setTimeout(async () => {
          try {
            console.log('[initAuth] Loading profile for UID:', session.user.id);

            let userData: any = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
              const { data: users, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('uid', session.user.id)
                .limit(1);

              if (userError) {
                console.warn(`[initAuth] Error querying profile (attempt ${attempt}/3):`, userError.message);
              }

              if (users && users.length > 0) {
                userData = users[0];
                break;
              }

              if (attempt < 3) {
                await new Promise(r => setTimeout(r, 500));
              }
            }

            const VALID_ROLES = ['user', 'passenger', 'carrier', 'agent', 'admin', 'driver'];

            if (!userData || !userData.role || !VALID_ROLES.includes(userData.role)) {
              console.error('[initAuth] Profile not found or invalid role:', userData?.role);
              await supabase.auth.signOut();
              set({
                user: null,
                isAuthenticated: false,
                activeRole: null,
                loading: false,
                initInProgress: false,
                isInitialized: true,
                error: 'Профіль не знайдено або роль недійсна.',
              });
              return;
            }

            const effectiveRole = (userData.role === 'user' ? 'passenger' : userData.role) as Role;
            console.log('[initAuth] ✅ Profile loaded:', userData.email, 'role:', userData.role, 'effectiveRole:', effectiveRole);

            set({
              user: userData as User,
              isAuthenticated: true,
              activeRole: effectiveRole,
              loading: false,
              error: null,
              initInProgress: false,
              isInitialized: true,
            });

            const pendingReferral = localStorage.getItem('busnet_pending_referral');
            if (pendingReferral && event === 'SIGNED_IN') {
              supabase.functions.invoke('process-referral', {
                body: { referralId: pendingReferral, newUserId: session.user.id },
              }).then(({ error: refErr }) => {
                if (!refErr) localStorage.removeItem('busnet_pending_referral');
              });
            }

          } catch (err: any) {
            console.error('[initAuth] Error:', err);
            set({ loading: false, initInProgress: false, isInitialized: true });
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
        options: { data: { ...userData, role: 'passenger' } },
      });
      if (error) throw error;
      if (data.user) {
        const newUser = { uid: data.user.id, ...userData, role: 'passenger', status: 'active' };
        const { error: insertError } = await supabase.from('users').upsert(newUser, { onConflict: 'uid' });
        if (insertError) console.warn('[registerUser] Profile upsert warning:', insertError.message);
        console.log('[registerUser] Profile saved for:', userData.email);
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
        await supabase.from('users').upsert(newPassenger, { onConflict: 'uid' });
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