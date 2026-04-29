// v4.0 - Deployment Trigger for Newly Connected Vercel Project
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

// Глобальна змінна — гарантуємо один підпис
let authSubscription: { unsubscribe: () => void } | null = null;
// Прапор щоб initAuth не запускався двічі одночасно
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
        // ✅ ФІКС #3 — Запобігаємо подвійному запуску
        if (authSubscription) {
          console.log('[initAuth] Already subscribed, skipping re-init');
          return () => {};
        }
        if (initInProgress) {
          console.log('[initAuth] Init already in progress, skipping');
          return () => {};
        }
        initInProgress = true;

        // Перевіряємо поточну сесію одразу
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            set({ isAuthenticated: false, user: null, loading: false });
          }
          // Якщо сесія є — onAuthStateChange підхопить INITIAL_SESSION
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[initAuth] Auth event:', event, session?.user?.email);

          if (!session?.user) {
            set({ isAuthenticated: false, user: null, activeRole: null, loading: false });
            return;
          }

          // Якщо user вже є в сторі і uid збігається — не робимо зайвий запит до БД
          const currentUser = get().user;
          if (
            event === 'TOKEN_REFRESHED' &&
            currentUser &&
            currentUser.uid === session.user.id
          ) {
            console.log('[initAuth] Token refreshed, user already loaded — skip DB fetch');
            set({ loading: false });
            return;
          }

          try {
            set({ loading: true });

            // 1. Шукаємо по UID
            let { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('uid', session.user.id)
              .single();

            if (error && error.code !== 'PGRST116') {
              // PGRST116 = no rows returned (не помилка, просто не знайшли)
              console.error('[initAuth] DB error fetching by UID:', error);
            }

            // 2. Якщо не знайдено по UID — шукаємо по email
            if (!userData) {
              console.log('[initAuth] UID not found, trying email:', session.user.email);
              const { data: byEmail, error: emailError } = await supabase
                .from('users')
                .select('*')
                .eq('email', session.user.email ?? '')
                .single();

              if (emailError && emailError.code !== 'PGRST116') {
                console.error('[initAuth] DB error fetching by email:', emailError);
              }

              if (byEmail) {
                // Оновлюємо UID в БД якщо знайшли по email
                console.log('[initAuth] Found by email, updating UID...');
                const { data: updated, error: updateError } = await supabase
                  .from('users')
                  .update({ uid: session.user.id })
                  .eq('email', session.user.email ?? '')
                  .select()
                  .single();

                userData = (!updateError && updated) ? updated : byEmail;
              }
            }

            // 3. Якщо все ще не знайдено, робимо коротку паузу (для нових реєстрацій, де INSERT ще йде)
            if (!userData) {
              console.log('[initAuth] User not found, waiting 2s for potential signup insert...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const { data: retryData } = await supabase
                .from('users')
                .select('*')
                .eq('uid', session.user.id)
                .single();
                
              if (retryData) {
                console.log('[initAuth] User found after retry!');
                userData = retryData;
              }
            }

            // 4. Юзер знайдений — завантажуємо в стор
            if (userData) {
              console.log('[initAuth] User loaded:', userData.email, 'role:', userData.role);
              set({
                isAuthenticated: true,
                user: { ...userData, uid: session.user.id },
                activeRole: userData.role as Role,
                loading: false,
                error: null,
              });
              return;
            }

            // 5. Юзера НЕМАЄ в БД — Система Самовідновлення (Self-Healing)
            console.warn('[initAuth] User not found in DB. Creating fallback profile...', session.user.id);
            
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
              console.log('[initAuth] Fallback profile created successfully');
              set({
                isAuthenticated: true,
                user: fallbackUser,
                activeRole: fallbackUser.role as Role,
                loading: false,
              });
              return;
            } else {
              console.error('[initAuth] Critical: Failed to create fallback profile:', insertError);
            }

            set({
              loading: false,
              isAuthenticated: true, // Ми все одно авторизовані в Auth
              user: { uid: session.user.id, email: session.user.email || '', role: 'passenger' } as any,
              activeRole: 'passenger',
              error: 'Profile synchronization pending...'
            });

          } catch (err) {
            console.error('[initAuth] Unexpected error:', err);
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
          // loading: false буде виставлено в onAuthStateChange після завантаження user з БД
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
            options: { data: { firstName: userData.firstName, lastName: userData.lastName } },
          });
          if (error) throw error;

          if (data.user) {
            const newUser = {
              uid: data.user.id,
              email: userData.email,
              role: 'passenger',
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              status: 'active',
            };
            // ✅ ФІКС 401: Даємо Supabase час оновити сесію
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const { error: insertError } = await supabase.from('users').insert(newUser);
            if (insertError) {
              console.error('registerFromBooking insert error:', insertError);
              // Спроба #2 через 1.5 сек якщо перша провалилась
              await new Promise(resolve => setTimeout(resolve, 1500));
              await supabase.from('users').insert(newUser);
            } else {
              set({
                user: newUser as User,
                isAuthenticated: true,
                activeRole: 'passenger',
                loading: false,
              });
            }
          } else {
            set({ loading: false });
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
            options: { data: { companyName: companyData.companyName } },
          });
          if (error) throw error;

          if (data.user) {
            const newCarrier = {
              uid: data.user.id,
              email: companyData.email,
              role: 'carrier',
              companyName: companyData.companyName,
              phone: companyData.phone,
              status: 'active',
            };
            // ✅ ФІКС 401: Даємо Supabase час оновити сесію
            await new Promise(resolve => setTimeout(resolve, 800));

            const { error: insertError } = await supabase.from('users').insert(newCarrier);
            if (insertError) {
              console.error('registerCarrier insert error:', insertError);
              // Спроба #2
              await new Promise(resolve => setTimeout(resolve, 1500));
              await supabase.from('users').insert(newCarrier);
            } else {
              set({
                user: newCarrier as User,
                isAuthenticated: true,
                activeRole: 'carrier',
                loading: false,
              });
            }
          } else {
            set({ loading: false });
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
            const newUser = {
              uid: data.user.id,
              ...userData,
              status: 'active',
            };
            // ✅ ФІКС 401: Даємо Supabase час оновити сесію
            await new Promise(resolve => setTimeout(resolve, 800));

            const { error: insertError } = await supabase.from('users').insert(newUser);
            if (insertError) {
              console.error('registerUser insert error:', insertError);
              // Спроба #2
              await new Promise(resolve => setTimeout(resolve, 1500));
              await supabase.from('users').insert(newUser);
            } else {
              set({
                user: newUser as User,
                isAuthenticated: true,
                activeRole: newUser.role as Role || 'passenger',
                loading: false,
              });
            }
          } else {
            set({ loading: false });
          }
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      signInWithGoogle: async (_requestedRole, _additionalData) => {
        set({ loading: true, error: null });
        try {
          const redirectTo = `${window.location.origin}/bridge`;
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo },
          });
          if (error) throw error;
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      loginWithPhone: async (phoneNumber: string) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
          if (error) throw error;
        } catch (err: any) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.warn('[logout] SignOut error:', err);
        } finally {
          // Очищаємо Supabase auth токени
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
              localStorage.removeItem(key);
            }
          }
          // Очищаємо Zustand persist cache — щоб не залишались старі ролі при повторному логіні
          localStorage.removeItem('auth-storage');
          // Відписуємося від auth
          if (authSubscription) {
            authSubscription.unsubscribe();
            authSubscription = null;
          }
          // Скидаємо прапор ініціалізації
          initInProgress = false;
          set({
            isAuthenticated: false,
            user: null,
            activeRole: null,
            loading: false,
            error: null,
          });
          window.location.href = '/';
        }
      },

      updateUserProfile: async (data) => {
        const user = get().user;
        if (!user) return;
        try {
          const { error } = await supabase
            .from('users')
            .update(data)
            .eq('uid', user.uid);
          if (error) throw error;
          set({ user: { ...user, ...data } });
        } catch (err: any) {
          set({ error: err.message });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        activeRole: state.activeRole,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // НЕ викликаємо initAuth тут — він запускається через useEffect в App.tsx.
          // onRehydrateStorage — тільки для відновлення стану зі сховища, не для підписок.
          console.log('[AuthStore] Rehydrated from storage, role:', state.activeRole);
        }
      },
    }
  )
);