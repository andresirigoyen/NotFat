import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  isOnboardingComplete: boolean;
  currentStep: number;
  userData: {
    gender?: string;
    birthDate?: string;
    goals?: string[];
    profile?: {
      name?: string;
      height?: number;
      weight?: number;
      activityLevel?: string;
    };
  };
  setIsOnboardingComplete: (complete: boolean) => void;
  setCurrentStep: (step: number) => void;
  updateUserData: (data: Partial<OnboardingState['userData']>) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
  isOnboardingComplete: false,
  currentStep: 0,
  userData: {},
  setIsOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),
  setCurrentStep: (step) => set({ currentStep: step }),
  updateUserData: (data) => 
    set((state) => ({ 
      userData: { ...state.userData, ...data } 
    })),
  resetOnboarding: () => set({
    isOnboardingComplete: false,
    currentStep: 0,
    userData: {},
  }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);