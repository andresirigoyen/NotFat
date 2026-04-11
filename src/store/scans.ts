import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScanState {
  dailyScans: { [date: string]: number };
  incrementScan: () => void;
  getTodayScans: () => number;
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      dailyScans: {},
      incrementScan: () => {
        const today = new Date().toISOString().split('T')[0];
        const currentScans = get().dailyScans[today] || 0;
        set((state) => ({
          dailyScans: {
            ...state.dailyScans,
            [today]: currentScans + 1,
          },
        }));
      },
      getTodayScans: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().dailyScans[today] || 0;
      },
    }),
    {
      name: 'scan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
