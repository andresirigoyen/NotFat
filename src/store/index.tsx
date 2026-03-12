import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/SupabaseContext';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      
      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          set({ user: null, session: null });
        } catch (error) {
          console.error('Error signing out:', error);
          throw error;
        }
      },
      
      signIn: async (email, password) => {
        try {
          set({ loading: true });
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          set({ 
            user: data.user, 
            session: data.session,
            loading: false 
          });
          
          return { error: null };
        } catch (error) {
          set({ loading: false });
          return { error };
        }
      },
      
      signUp: async (email, password, fullName) => {
        try {
          set({ loading: true });
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });
          
          if (error) throw error;
          
          set({ 
            user: data.user, 
            session: data.session,
            loading: false 
          });
          
          return { error: null };
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
      
      initializeAuth: async () => {
        try {
          set({ loading: true });
          
          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          set({ 
            user: session?.user || null, 
            session: session || null,
            loading: false 
          });
          
          // We don't return the unsubscribe function because this is an async function
          // and the interface expects Promise<void>.
          // Listen for auth changes
          supabase.auth.onAuthStateChange(
            (_event, session) => {
              set({ 
                user: session?.user || null, 
                session: session || null,
                loading: false 
              });
            }
          );
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ loading: false });
          return;
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

// Provider component
interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  return <>{children}</>;
};
