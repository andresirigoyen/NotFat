import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from './onboarding';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'creator' | 'admin' | 'superadmin';
  onboarding_completed: boolean | null;
  subscription_status: string | null;
}

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
  signIn: (email: string, pass: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: false,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      signOut: () => set({ user: null, session: null }),
      signIn: async (email, pass) => {
        // Mock simple de signIn para evitar errores TS, se debe ajustar
        set({ loading: true });
        setTimeout(() => {
          set({ user: { id: 'test-123', email, first_name: 'Test', last_name: 'User', avatar_url: null, role: 'user', onboarding_completed: false, subscription_status: null }, loading: false });
        }, 1000);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
);

interface NutritionState {
  dailyGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
  currentIntake: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
  setDailyGoals: (goals: Partial<NutritionState['dailyGoals']>) => void;
  updateIntake: (intake: Partial<NutritionState['currentIntake']>) => void;
  resetDailyIntake: () => void;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      dailyGoals: {
        calories: 2000,
        protein: 100,
        carbs: 250,
        fat: 65,
        water: 2000,
      },
      currentIntake: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        water: 0,
      },
      setDailyGoals: (goals) => 
        set((state) => ({ 
          dailyGoals: { ...state.dailyGoals, ...goals } 
        })),
      updateIntake: (intake) => 
        set((state) => ({ 
          currentIntake: { ...state.currentIntake, ...intake } 
        })),
      resetDailyIntake: () => 
        set({ 
          currentIntake: { 
            calories: 0, 
            protein: 0, 
            carbs: 0, 
            fat: 0, 
            water: 0 
          } 
        }),
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

interface UIState {
  theme: 'light' | 'dark' | 'system';
  showCalories: boolean;
  showHydration: boolean;
  notifications: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setShowCalories: (show: boolean) => void;
  setShowHydration: (show: boolean) => void;
  setNotifications: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      showCalories: true,
      showHydration: true,
      notifications: true,
      setTheme: (theme) => set({ theme }),
      setShowCalories: (show) => set({ showCalories: show }),
      setShowHydration: (show) => set({ showHydration: show }),
      setNotifications: (enabled) => set({ notifications: enabled }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
