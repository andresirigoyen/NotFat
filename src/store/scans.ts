import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/SupabaseContext';

interface ScanState {
  dailyScans: { [date: string]: number };
  dailyMessages: { [date: string]: number };
  incrementScan: () => void;
  incrementMessage: () => void;
  getTodayScans: () => number;
  getTodayMessages: () => number;
  syncUsageFromServer: (userId: string) => Promise<void>;
}

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      dailyScans: {},
      dailyMessages: {},
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
      incrementMessage: () => {
        const today = new Date().toISOString().split('T')[0];
        const currentMessages = get().dailyMessages[today] || 0;
        set((state) => ({
          dailyMessages: {
            ...state.dailyMessages,
            [today]: currentMessages + 1,
          },
        }));
      },
      getTodayScans: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().dailyScans[today] || 0;
      },
      getTodayMessages: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().dailyMessages[today] || 0;
      },
      syncUsageFromServer: async (userId: string) => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { data, error } = await supabase
            .from('user_usage')
            .select('scans_count, messages_count')
            .eq('user_id', userId)
            .eq('usage_date', today)
            .single();

          if (error && error.code !== 'PGRST116') throw error;

          if (data) {
            set((state) => ({
              dailyScans: { ...state.dailyScans, [today]: data.scans_count },
              dailyMessages: { ...state.dailyMessages, [today]: data.messages_count },
            }));
          }
        } catch (err) {
          console.error('[ScanStore] Error syncing usage:', err);
        }
      },
    }),
    {
      name: 'scan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
