import React, { createContext, useContext, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';

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

// 🔥 Offline-First: Enlazar React Query con el estado de red nativo del dispositivo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    // Si isInternetReachable es estrictamente falso, estamos desconectados
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  });
});

// 🔥 Offline-First: Configurar el cajero de memoria (QueryClient) global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: 1000 * 60 * 5, // Mantener datos frescos por 5 minutos
      gcTime: 1000 * 60 * 60 * 24, // Guardar memoria inactiva por 24 horas
      retry: 2,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3, // Si falla por desconexión, React Query la pausa y reintenta cuando vuelva la red en vez de lanzar error al backend
    },
  },
});

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
