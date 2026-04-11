import React, { createContext, useContext, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Evitar múltiples instancias con singleton
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
    
    // ✅ FIX #14: Logs de credenciales solo en desarrollo, nunca en producción
    if (__DEV__) {
      console.log('🔑 Creating Supabase client...');
      console.log('🔑 URL:', supabaseUrl);
      console.log('🔑 Key exists:', !!supabaseAnonKey);
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);
const queryClient = new QueryClient();

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
