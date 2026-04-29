import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@busnet/shared/supabase/config';
import { User, Role, CarrierBalance, AgentBalance } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  activeRole: Role | null;
  carrierBalance: CarrierBalance | null;
  agentBalance: AgentBalance | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  registerFromBooking: (userData: Omit<User, 'role' | 'uid' | 'status'>, password: string) => Promise<void>;
  registerCarrier: (companyData: { companyName: string; email: string; phone: string }, password: string) => Promise<void>;
  registerUser: (userData: Partial<User>, password: string) => Promise<void>;
  signInWithGoogle: (requestedRole?: Role, additionalData?: Partial<User>) => Promise<void>;
  loginWithPhone: (phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  setActiveRole: (role: Role) => void;
  initAuth: () => () => void;
}

let authSubscription: { unsubscribe: () => void } | null = null;
let initInProgress = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      activeRole: null,
      carrierBalance: null,
      agentBalance: null,
      loading: true,
      error: null,

      setActiveRole: (role: Role) => set({ activeRole: role }),

      initAuth: () => {
        if (authSubscription || initInProgress) return () => {};
        initInProgress = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            set({ isAuthenticated: false, user: null, loading: false });
          }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!session?.user) {
            set({ isAuthenticated: false, user: null, activeRole: null, loading: false });
            return;
          }

          try {
            set({ loading: true });

            let { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('uid', session.user.id)
              .single();

            if (!userData) {
              const { data: byEmail } = await supabase
                .from('users')
                .select('*')
                .eq('email', session.user.email ?? '')
                .single();

              if (byEmail) {
                const { data: updated } = await supabase
                  .from('users')
                  .update({ uid: session.user.id })
                  .eq('email', session.user.email ?? '')
                  .select()
                  .single();
                userData = updated || byEmail;
              }
            }

            if (!userData) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              const { data: retryData } = await supabase
                .from('users')
                .select('*')
                .eq('uid', session.user.id)
                .single();
              userData = retryData;
            }

            if (userData) {
              set({
                isAuthenticated: true,
                user: { ...userData, uid: session.user.id },
                activeRole: userData.role as Role,
                loading: false,
                error: null,
              });
              return;
            }

            // Self-healing block
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
            if (!insertError) {
              set({
                isAuthenticated: true,
                user: fallbackUser,
                activeRole: fallbackUser.role as Role,
                loading: false,
              });
            } else {
              set({ loading: false, isAuthenticated: true, user: fallbackUser, activeRole: fallbackUser.role });
            }

          } catch (err) {
            set({ loading: false });
          }
        });

        authSubscription = subscription;
        initInProgress = false;

        return () => {
          subscription.unsubscribe();
          authSubscription = null;
        };
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
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
            options: { data: { companyName: companyData.companyName, role: 'carrier' } },
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

      registerUser: async (userData, password) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email: userData.email!,
            password,
            options: { data: userData },
          });
          if (error) throw error;
          if (data.user) {
            const newUser = { uid: data.user.id, ...userData, status: 'active' };
            await new Promise(resolve => setTimeout(resolve, 1000));
            await supabase.from('users').insert(newUser);
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      signInWithGoogle: async (requestedRole, additionalData) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { 
              redirectTo: window.location.origin,
              queryParams: { access_type: 'offline', prompt: 'consent' }
            }
          });
          if (error) throw error;
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      loginWithPhone: async (phoneNumber) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithOtp({ phoneNumber });
          if (error) throw error;
          set({ loading: false });
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false, activeRole: null, loading: false });
        } catch (err) {
          set({ loading: false });
        }
      },

      updateUserProfile: async (data) => {
        const { user } = get();
        if (!user) return;
        try {
          const { error } = await supabase.from('users').update(data).eq('uid', user.uid);
          if (error) throw error;
          set({ user: { ...user, ...data } });
        } catch (err: any) {
          console.error('Update profile error:', err);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated, 
        user: state.user,
        activeRole: state.activeRole 
      }),
    }
  )
);