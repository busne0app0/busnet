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
  isInitialized: boolean; // true після першого onAuthStateChange — ProtectedRoute чекає цього флагу
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
    if (authSubscription) return () => {};

    let isHandling = false; // локальний флаг, не глобальний

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[initAuth] Event:', event, '| isHandling:', isHandling, '| email:', session?.user?.email);

        // SIGNED_OUT — завжди обробляємо
        if (!session) {
          isHandling = false;
          isProcessingAuth = false;
          set({ user: null, isAuthenticated: false, activeRole: null, loading: false, initInProgress: false, isInitialized: true });
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

            // Завантажуємо профіль з таблиці users по UID з повторними спробами (до 5 разів з паузою 1с)
            let userData: any = null;
            for (let attempt = 1; attempt <= 5; attempt++) {
              const { data: users, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('uid', session.user.id)
                .limit(1);

              if (userError) {
                console.warn(`[initAuth] Error querying profile (attempt ${attempt}/5):`, userError.message);
              }

              if (users && users.length > 0) {
                userData = users[0];
                break;
              }

              if (attempt < 5) {
                console.log(`[initAuth] Profile not found on attempt ${attempt}/5, waiting 1s...`);
                await new Promise(r => setTimeout(r, 1000));
              }
            }

            const VALID_ROLES = ['user', 'passenger', 'carrier', 'agent', 'admin', 'driver'];

            // Якщо профіль так і не знайдено, або роль не з дозволеного списку — скидаємо сесію і показуємо помилку
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
                error: 'Профіль не знайдено або роль недійсна. Зверніться до підтримки.',
              });
              return;
            }

            // Роль 'user' обробляємо як 'passenger'
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

            // 🔗 Auto-process pending referral (Guest Referral Flow)
            // If user clicked an invite link before logging in, the referralId was saved
            // to localStorage. We now silently process it in the background.
            const pendingReferral = localStorage.getItem('busnet_pending_referral');
            if (pendingReferral && event === 'SIGNED_IN') {
              console.log('[initAuth] Processing pending referral:', pendingReferral);
              supabase.functions.invoke('process-referral', {
                body: { referralId: pendingReferral, newUserId: session.user.id },
              }).then(({ error: refErr }) => {
                if (refErr) {
                  console.warn('[initAuth] Pending referral processing failed:', refErr.message);
                } else {
                  localStorage.removeItem('busnet_pending_referral');
                  console.log('[initAuth] ✅ Pending referral processed and cleared');
                }
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
      // Завжди роль 'passenger' — клієнт не може призначати собі іншу роль
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password,
        options: { data: { ...userData, role: 'passenger' } },
      });
      if (error) throw error;
      if (data.user) {
        const newUser = { uid: data.user.id, ...userData, role: 'passenger', status: 'active' };
        // Upsert профілю (тригер БД вже міг створити базовий запис)
        const { error: insertError } = await supabase.from('users').upsert(newUser, { onConflict: 'uid' });
        if (insertError) console.warn('[registerUser] Profile upsert warning:', insertError.message);
        console.log('[registerUser] Profile saved for:', userData.email);
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // УВАГА: не використовувати для прямої реєстрації — роль carrier видає тільки адмін після схвалення заявки partner_applications
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
      // Завжди роль 'passenger'
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: password || Math.random().toString(36).slice(-12),
        options: { data: { ...userData, role: 'passenger' } },
      });
      if (error) throw error;
      if (data.user) {
        const newPassenger = { uid: data.user.id, ...userData, role: 'passenger', status: 'active' };
        await new Promise(resolve => setTimeout(resolve, 500));
        // Upsert, оскільки профіль вже може створювати тригер БД
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
