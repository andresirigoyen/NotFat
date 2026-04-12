import 'react-native-gesture-handler';
import React, { useEffect } from 'react'; // Añadido useEffect explícito
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, Text } from 'react-native';
import {
  useFonts,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold
} from '@expo-google-fonts/montserrat';

import Navigation from '@/navigation/Navigation';
import { SupabaseProvider } from '@/services/supabase';
import { useAuthStore, authListenerUnsubscribe } from '@/store';
import { useNotifications } from '@/hooks/useNotifications';

// --- ErrorBoundary (Sin cambios, es correcto para tu tesis) ---
interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    if (__DEV__) console.error("APP CRASH:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ 
          flex: 1, 
          backgroundColor: '#000', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 40 
        }}>
          <Text style={{ 
            fontSize: 32, 
            color: '#fff', 
            fontWeight: '700', 
            textAlign: 'center',
            marginBottom: 16,
            fontFamily: 'Montserrat_700Bold'
          }}>
            Ups, algo no va bien
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#666', 
            textAlign: 'center',
            lineHeight: 24,
            fontFamily: 'Montserrat_400Regular'
          }}>
            Estamos trabajando para que todo vuelva a la normalidad lo antes posible.
          </Text>
          {__DEV__ && (
            <View style={{ 
              marginTop: 32, 
              padding: 16, 
              backgroundColor: '#111', 
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#222'
            }}>
              <Text style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: 12 }}>
                {this.state.error?.message}
              </Text>
            </View>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_300Light, 
    Montserrat_400Regular, 
    Montserrat_600SemiBold, 
    Montserrat_700Bold,
    Montserrat: Montserrat_400Regular,
  });

  // Mantenemos el hook, pero el registro lo movemos al useEffect único
  const notifications = useNotifications();

  useEffect(() => {
    const initApp = async () => {
      const isNative = Platform.OS !== 'web';
      const isEmulator = __DEV__;

      // 🛡️ REGISTRO CONTROLADO: Evita el spam en el simulador
      if (isNative && !isEmulator) {
        try {
          await notifications.registerForPushNotificationsAsync();
          await notifications.scheduleHydrationReminder('2hours');
        } catch (e) {
          console.log("Push Notifications no disponibles (esperado en simulador)");
        }
      } else if (isEmulator) {
        if (__DEV__) console.log("🛡️ [Dev Mode] Registro de notificaciones omitido en simulador.");
      }

      // 🔑 INICIALIZACIÓN ÚNICA: Llamamos al store de Zustand corregido
      try {
        await useAuthStore.getState().initializeAuth();
      } catch (error) {
        console.error("Fallo crítico al inicializar auth:", error);
      }
    };

    initApp();

    // 🌐 GLOBAL WEB FIX: Bloquear zoom automático y mejorar interactividad
    if (Platform.OS === 'web') {
      try {
        // Preconnect a dominios clave
        const preconnectUnsplash = document.createElement('link');
        preconnectUnsplash.rel = 'preconnect';
        preconnectUnsplash.href = 'https://images.unsplash.com';
        document.head.appendChild(preconnectUnsplash);

        // Preload de la imagen LCP del WelcomeScreen
        const preloadLCP = document.createElement('link');
        preloadLCP.rel = 'preload';
        preloadLCP.as = 'image';
        preloadLCP.href = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=75&w=1200&auto=format&fit=crop';
        document.head.appendChild(preloadLCP);

        const style = document.createElement('style');
        style.textContent = `
          /* Optimización de fuentes global */
          @font-face {
            font-family: 'Montserrat_300Light';
            font-display: swap !important;
          }
          @font-face {
            font-family: 'Montserrat_400Regular';
            font-display: swap !important;
          }
          @font-face {
            font-family: 'Montserrat_600SemiBold';
            font-display: swap !important;
          }
          @font-face {
            font-family: 'Montserrat_700Bold';
            font-display: swap !important;
          }
          @font-face {
            font-family: 'Ionicons';
            font-display: swap !important;
          }
          @font-face {
            font-family: 'MaterialCommunityIcons';
            font-display: swap !important;
          }

          * {
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            text-rendering: optimizeLegibility;
          }
          input, textarea, select {
            font-size: 16px !important;
          }
          body {
            overscroll-behavior-y: none;
            position: fixed;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000;
          }
          #root, #__next {
            height: 100%;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
        `;
        document.head.append(style);
        
        // Bloquear gestos de zoom (pinch-to-zoom)
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('dblclick', (e) => e.preventDefault());
      } catch (e) {
        console.warn("No se pudo inyectar estilos globales web:", e);
      }
    }

    // ✅ FIX #6: Cancelar el listener global de auth al desmontar App
    // Evita acumulación de suscripciones en Hot Module Replacement
    return () => {
      authListenerUnsubscribe();
    };
  }, [notifications]); 

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SupabaseProvider>
          <Navigation />
          <StatusBar style="auto" />
        </SupabaseProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}