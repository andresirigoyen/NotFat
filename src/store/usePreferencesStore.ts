import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CoachMode = 'low' | 'high';

interface PreferencesState {
  coachMode: CoachMode;
  setCoachMode: (mode: CoachMode) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      coachMode: 'high',
      setCoachMode: (mode) => set({ coachMode: mode }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
