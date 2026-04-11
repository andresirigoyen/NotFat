import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingData {
  gender?: 'male' | 'female' | 'non_binary' | 'other';
  birth_date?: string;
  weight_value?: number;
  height_value?: number;
  weight_unit?: 'kg' | 'lb';
  height_unit?: 'cm' | 'in';
  nutrition_goal?: string;
  diet_type?: string;
  activity_level?: string;
  workout_frequency?: string;
  fitness_goal?: string;
  goal_pace?: string;
  coach_style?: 'apoyo' | 'reto' | 'directo';
}

interface OnboardingState {
  data: OnboardingData;
  setData: (data: Partial<OnboardingData>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      data: {},
      setData: (newData) => set((state) => ({ 
        data: { ...state.data, ...newData } 
      })),
      reset: () => set({ data: {} }),
    }),
    {
      name: 'onboarding-temp-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
