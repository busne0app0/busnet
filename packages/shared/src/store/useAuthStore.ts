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
    const { authSubscription, initInProgress } = get();
    if (authSubscription || initInProgress) return () => {};
    
    set({ initInProgress: true });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[initAuth] Auth event:', event, session?.user?.email);

        if (!session) {
          set({ user: null, isAuthenticated: false, activeRole: null, loading: false, initInProgress: false });
          return;
        }

        try {
          set({ loading: true });

          // Try to get user from database with a timeout
          const fetchWithTimeout = async () => {
            const { data: users, error } = await supabase
              .from('users')
              .select('*')
              .eq('uid', session.user.id)
              .limit(1);
            return { data: users, error };
          };

          let { data: users, error: fetchError } = await fetchWithTimeout();
          if (fetchError) console.error('[initAuth] Fetch error:', fetchError);

          let userData = users && users.length > 0 ? users[0] : null;

          if (!userData && session.user.email) {
            const { data: byEmailUsers } = await supabase
              .from('users')
              .select('*')
              .eq('email', session.user.email)
              .limit(1);
            
            const byEmail = byEmailUsers && byEmailUsers.length > 0 ? byEmailUsers[0] : null;

            if (byEmail) {
              const { data: updatedUsers } = await supabase
                .from('users')
                .update({ uid: session.user.id })
                .eq('email', session.user.email)
                .select()
                .limit(1);
              userData = (updatedUsers && updatedUsers.length > 0) ? updatedUsers[0] : byEmail;
            }
          }

          if (!userData) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const { data: retryUsers } = await supabase
              .from('users')
              .select('*')
              .eq('uid', session.user.id)
              .limit(1);
            userData = retryUsers && retryUsers.length > 0 ? retryUsers[0] : null;
          }

          if (userData) {
            console.log('[initAuth] User loaded successfully:', userData.email, 'role:', userData.role);
            set({
              user: userData as User,
              isAuthenticated: true,
              activeRole: (userData.role as Role) || 'passenger',
              loading: false,
              error: null,
              initInProgress: false
            });
            return;
          }

          console.warn('[initAuth] User profile not found in DB, using metadata for:', session.user.email);
          // Self-healing using metadata as primary source if DB fails
          const meta = session.user.user_metadata || {};
          const fallbackUser: any = {
            uid: session.user.id,
            email: session.user.email || '',
            role: meta.role || 'passenger',
            firstName: meta.firstName || meta.full_name?.split(' ')[0] || 'User',
            lastName: meta.lastName || meta.full_name?.split(' ').slice(1).join(' ') || '',
            phone: meta.phone || '',
            status: 'active',
          };

          // Update store immediately so UI can redirect
          set({
            user: fallbackUser as User,
            isAuthenticated: true,
            activeRole: fallbackUser.role as Role,
            loading: false,
            initInProgress: false
          });

          // Background insert/repair
          supabase.from('users').insert(fallbackUser).then(({ error }) => {
            if (error) console.error('[initAuth] Background self-healing failed:', error);
            else console.log('[initAuth] Background self-healing successful');
          });


        } catch (err: any) {
          console.error('[initAuth] Error:', err);
          set({ loading: false, initInProgress: false });
        }
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        await supabase.from('users').insert(newUser);
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        await supabase.from('users').insert(newCarrier);
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