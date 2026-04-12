import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/SupabaseContext';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setPro: (isPro: boolean) => void;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any; user?: User | null; session?: Session | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any; user?: User | null; session?: Session | null }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any; user?: User | null; session?: Session | null }>;
  initializeAuth: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ✅ FIX #5: Flag atómica fuera del store — garantiza ejecución única absoluta
// independientemente del estado loading/session en el store.
let _authInitialized = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      isPro: false,
      setUser: (user) => {
        const isPro = !!(user?.user_metadata?.is_pro || user?.user_metadata?.subscription_tier === 'pro');
        set({ user, isPro });
      },
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setPro: (isPro) => set({ isPro }),

      signOut: async () => {
        try {
          console.log('[AuthStore] Signing out...');
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.warn('[AuthStore] SignOut error:', error);
          }
          console.log('[AuthStore] Signed out successfully');
        } catch (err) {
          console.warn('[AuthStore] SignOut warning:', err);
        } finally {
          // Resetear la flag para permitir re-inicialización tras logout
          _authInitialized = false;
          set({ user: null, session: null, loading: false });
          console.log('[AuthStore] State reset - user is now null, loading is false');
        }
      },

      signIn: async (email, password) => {
        try {
          set({ loading: true });
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          set({ user: data.user, session: data.session, loading: false });
          return { error: null, user: data.user, session: data.session };
        } catch (error) {
          set({ loading: false });
          return { error };
        }
      },

      signUp: async (email, password, fullName) => {
        try {
          set({ loading: true });

          const nameParts = fullName.trim().split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || '';

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                email: email,
                full_name: fullName,
                first_name: firstName,
                last_name: lastName,
                gender: 'other',
                role: 'user',
                onboarding_completed: false,
                onboarding_step: 'welcome',
                steps_goal: 10000,
                show_calories: true,
                show_hydration: true,
                preferred_bottle_size: 500,
                preferred_bottle_unit: 'ml'
              }
            },
          });

          if (error) throw error;

          // 🛡️ FALLBACK: Si hay sesión, intentamos guardar el perfil manualmente por si el trigger falla o es lento
          if (data.session?.user) {
            try {
              console.log('[AuthStore] Manual profile sync fallback...');
              await supabase.from('profiles').upsert({
                id: data.session.user.id,
                email: email,
                full_name: fullName,
                first_name: firstName,
                last_name: lastName,
                gender: 'other',
                role: 'user',
                subscription_tier: 'free',
                subscription_status: 'inactive',
                onboarding_completed: false,
                onboarding_step: 'welcome',
                show_calories: true,
                show_hydration: true,
                preferred_bottle_size: 500,
                preferred_bottle_unit: 'ml',
                steps_goal: 10000,
                height_unit: 'cm',
                weight_unit: 'kg',
                updated_at: new Date().toISOString()
              } as any, { onConflict: 'id' });
            } catch (syncError) {
              console.warn('[AuthStore] Manual sync failed (non-critical):', syncError);
            }
          }

          set({ user: data.user, session: data.session, loading: false });
          return { error: null, user: data.user, session: data.session };
        } catch (error) {
          set({ loading: false });
          return { error };
        }
      },

      resetPassword: async (email) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          return { error };
        } catch (error) {
          return { error };
        }
      },

      signInWithApple: async () => {
        try {
          set({ loading: true });
          
          // Importación dinámica para evitar crash si la librería no está instalada
          let AppleAuthentication;
          try {
            AppleAuthentication = await import('expo-apple-authentication');
          } catch (e) {
            throw new Error('La librería expo-apple-authentication no está instalada. Ejecuta: npx expo install expo-apple-authentication');
          }

          const appleAuthRequest = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });

          if (!appleAuthRequest.identityToken) {
            throw new Error('No se recibió el identityToken de Apple');
          }

          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: appleAuthRequest.identityToken,
          });

          if (error) throw error;
          
          set({ user: data.user, session: data.session, loading: false });
          return { error: null, user: data.user, session: data.session };
        } catch (error: any) {
          set({ loading: false });
          console.error('[AuthStore] Apple SignIn error:', error);
          return { error };
        }
      },

      initializeAuth: async () => {
        // ✅ FIX #5: Guard con flag atómica — nunca ejecuta dos veces
        if (_authInitialized) return;
        _authInitialized = true;

        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          const user = session?.user || null;
          const isPro = !!(user?.user_metadata?.is_pro || user?.user_metadata?.subscription_tier === 'pro');
          
          set({ 
            user, 
            session: session || null, 
            loading: false,
            isPro 
          });

          // Sync usage limits from DB if user is logged in
          if (user?.id) {
            const { syncUsageFromServer } = (await import('./scans')).useScanStore.getState();
            await syncUsageFromServer(user.id);
          }
        } catch (error) {
          console.error('[AuthStore] Error en initializeAuth:', error);
          set({ loading: false });
        }
      },
      refreshProfile: async () => {
        try {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          
          if (authUser) {
            // Check both metadata and profiles table (as backup)
            const { data: profile } = await supabase
              .from('profiles')
              .select('subscription_tier')
              .eq('id', authUser.id)
              .single();

            const isPro = !!(
              authUser.user_metadata?.is_pro || 
              authUser.user_metadata?.subscription_tier === 'pro' ||
              profile?.subscription_tier === 'pro'
            );

            set({ user: authUser, isPro });
          }
        } catch (error) {
          console.error('[AuthStore] Error en refreshProfile:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          user_metadata: state.user.user_metadata,
        } : null,
        session: state.session ? {
          access_token: state.session.access_token,
          refresh_token: state.session.refresh_token,
          expires_at: state.session.expires_at,
        } : null,
      }),
    }
  )
);

// ✅ FIX #6: Guardamos la suscripción para poder cancelarla.
// App.tsx debe llamar a authListenerUnsubscribe() en su cleanup de useEffect.
const { data: _authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  const user = session?.user || null;
  const isPro = !!(user?.user_metadata?.is_pro || user?.user_metadata?.subscription_tier === 'pro');
  useAuthStore.setState({
    user,
    session: session || null,
    loading: false,
    isPro
  });
});

export const authListenerUnsubscribe = () => {
  _authListener.subscription.unsubscribe();
};

export default useAuthStore;