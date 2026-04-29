import { create } from 'zustand';
import { supabase } from '../supabase/config';
import { User, Role } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  activeRole: Role | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  initAuth: () => () => void;
  registerCarrier: (companyData: any, password: string) => Promise<void>;
  registerFromBooking: (userData: any, password?: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
}

let authSubscription: any = null;
let initInProgress = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  activeRole: null,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    activeRole: (user?.role as Role) || null 
  }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

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

  initAuth: () => {
    if (authSubscription || initInProgress) return () => {};
    initInProgress = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[initAuth] Auth event:', event, session?.user?.email);

        if (!session) {
          set({ user: null, isAuthenticated: false, activeRole: null, loading: false });
          initInProgress = false;
          return;
        }

        try {
          set({ loading: true });

          // Try to get user from database
          let { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('uid', session.user.id)
            .limit(1);

          let userData = users && users.length > 0 ? users[0] : null;

          // Fallback check by email
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

          // Retry logic
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
            set({
              user: userData as User,
              isAuthenticated: true,
              activeRole: (userData.role as Role) || 'passenger',
              loading: false,
              error: null,
            });
            initInProgress = false;
            return;
          }

          // Self-healing: if user is authed but no DB record exists
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

          const { error: insertError } = await supabase.from('users').insert(fallbackUser);
          
          set({
            user: fallbackUser as User,
            isAuthenticated: true,
            activeRole: fallbackUser.role as Role,
            loading: false,
          });

        } catch (err: any) {
          console.error('[initAuth] Error:', err);
          set({ loading: false });
        } finally {
          initInProgress = false;
        }
      }
    );

    authSubscription = subscription;
    return () => {
      subscription.unsubscribe();
      authSubscription = null;
    };
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
}));