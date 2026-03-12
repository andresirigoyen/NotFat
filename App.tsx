import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, Text } from 'react-native';
import { 
  useFonts,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold 
} from '@expo-google-fonts/montserrat';

// Importaciones con manejo de errores
let Navigation: React.ComponentType<any> | null;
let SupabaseProvider: React.ComponentType<{ children: React.ReactNode }>;
let StoreProvider: React.ComponentType<{ children: React.ReactNode }>;
let useNotifications: any;

try {
  Navigation = require('@/navigation/Navigation').default;
} catch (error) {
  console.log('Navigation not available:', error);
  Navigation = () => null;
}

try {
  SupabaseProvider = require('@/services/supabase').SupabaseProvider;
} catch (error) {
  console.log('SupabaseProvider not available:', error);
  SupabaseProvider = ({ children }: any) => <>{children}</>;
}

try {
  StoreProvider = require('@/store').StoreProvider;
} catch (error) {
  console.log('StoreProvider not available:', error);
  StoreProvider = ({ children }: any) => <>{children}</>;
}

try {
  useNotifications = require('@/hooks/useNotifications').useNotifications;
} catch (error) {
  console.log('Notifications not available on web:', error);
  useNotifications = () => ({
    registerForPushNotificationsAsync: async () => {},
    scheduleHydrationReminder: async () => {},
  });
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("APP CRASH:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#fee2e2', padding: 20, justifyContent: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#991b1b', marginBottom: 10 }}>App Crashed!</Text>
          <Text style={{ fontSize: 16, color: '#b91c1c', marginBottom: 20 }}>{this.state.error?.toString()}</Text>
          <Text style={{ fontSize: 12, color: '#7f1d1d', fontFamily: 'monospace' }}>
            {this.state.errorInfo?.componentStack}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Cargar fuentes
  let [fontsLoaded] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat: Montserrat_400Regular, // Alias para el nombre usado en el tema
  });

  // Solo usar notificaciones en plataformas nativas
  const isNative = Platform.OS !== 'web';
  const { registerForPushNotificationsAsync, scheduleHydrationReminder } = isNative ? useNotifications() : { registerForPushNotificationsAsync: async () => {}, scheduleHydrationReminder: async () => {} };

  React.useEffect(() => {
    if (isNative) {
      registerForPushNotificationsAsync();
      // Schedule a reminder every 2 hours as default
      scheduleHydrationReminder('2hours');
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  // Aplicar Montserrat globalmente a todos los componentes Text de la app
  (Text as any).defaultProps = (Text as any).defaultProps ?? {};
  (Text as any).defaultProps.style = { fontFamily: 'Montserrat' };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SupabaseProvider>
          <StoreProvider>
            {Navigation ? <Navigation /> : (
              <div style={{ 
                flex: 1, 
                backgroundColor: '#FAF3ED', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh'
              }}>
                <h1 style={{ 
                  fontSize: 32, 
                  fontWeight: 'bold', 
                  color: '#7c2d12', 
                  marginBottom: 10,
                  fontFamily: 'Montserrat'
                }}>NotFat 🦦</h1>
                <p style={{ 
                  fontSize: 18, 
                  color: '#a16207', 
                  textAlign: 'center',
                  fontFamily: 'Montserrat'
                }}>Cargando navegación...</p>
              </div>
            )}
            <StatusBar style="auto" />
          </StoreProvider>
        </SupabaseProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
