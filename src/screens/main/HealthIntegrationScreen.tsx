import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useHealthSettings } from '@/hooks/useHealthSettings';
import { useAuthStore } from '@/store';

const HEALTH_PLATFORMS = [
  {
    id: 'apple_health',
    name: 'Apple Health',
    icon: 'watch-outline',
    description: 'Sincroniza con Apple Health para tracking automático',
    color: '#007AFF',
  },
  {
    id: 'google_fit',
    name: 'Google Fit',
    icon: 'fitness-outline',
    description: 'Conecta con Google Fit para datos de actividad',
    color: '#4285F4',
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: 'heart-outline',
    description: 'Integra con Fitbit para métricas completas',
    color: '#00B0B4',
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    icon: 'navigate-outline',
    description: 'Sincroniza con dispositivos Garmin',
    color: '#0096C6',
  },
];

const ACTIVITY_TYPES = [
  { id: 'steps', name: 'Pasos', icon: 'walk-outline', unit: 'pasos' },
  { id: 'calories', name: 'Calorías quemadas', icon: 'flame-outline', unit: 'kcal' },
  { id: 'workout', name: 'Entrenamientos', icon: 'fitness-outline', unit: 'minutos' },
  { id: 'sleep', name: 'Sueño', icon: 'moon-outline', unit: 'horas' },
];

export default function HealthIntegrationScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { healthSettings, updateHealthSettings, isLoading } = useHealthSettings();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handleConnect = async (platformId: string) => {
    try {
      switch (platformId) {
        case 'apple_health':
          // Aquí iría la lógica de conexión con Apple Health
          Alert.alert('Apple Health', 'Funcionalidad de Apple Health en desarrollo');
          break;
        case 'google_fit':
          // Conexión con Google Fit
          Alert.alert('Google Fit', 'Funcionalidad de Google Fit en desarrollo');
          break;
        case 'fitbit':
          // Conexión con Fitbit
          Alert.alert('Fitbit', 'Funcionalidad de Fitbit en desarrollo');
          break;
        case 'garmin':
          // Conexión con Garmin
          Alert.alert('Garmin', 'Funcionalidad de Garmin en desarrollo');
          break;
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con la plataforma');
    }
  };

  const toggleSetting = async (setting: string, value: boolean) => {
    try {
      // This would update the health settings in the database
      console.log(`Setting ${setting}:`, value);
      // await updateHealthSettings({ [setting]: value });
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.primary.amber} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Integración de Salud</Text>
          <Text style={styles.subtitle}>Conecta tus dispositivos y apps de salud</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connected Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plataformas Conectadas</Text>
          
          {HEALTH_PLATFORMS.filter(platform => 
            healthSettings?.connected_platforms?.includes(platform.id)
          ).map((platform) => (
            <View key={platform.id} style={styles.platformCard}>
              <View style={styles.platformHeader}>
                <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                  <Ionicons name={platform.icon as any} size={24} color={platform.color} />
                </View>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformName}>{platform.name}</Text>
                  <Text style={styles.platformStatus}>Conectado</Text>
                </View>
                <TouchableOpacity style={styles.disconnectBtn}>
                  <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.platformDescription}>{platform.description}</Text>
            </View>
          ))}
        </View>

        {/* Available Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plataformas Disponibles</Text>
          
          {HEALTH_PLATFORMS.filter(platform => 
            !healthSettings?.connected_platforms?.includes(platform.id)
          ).map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={styles.platformCard}
              onPress={() => handleConnect(platform.id)}
            >
              <View style={styles.platformHeader}>
                <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                  <Ionicons name={platform.icon as any} size={24} color={platform.color} />
                </View>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformName}>{platform.name}</Text>
                  <Text style={styles.platformStatus}>Conectar</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
              </View>
              <Text style={styles.platformDescription}>{platform.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguimiento de Actividad</Text>
          
          {ACTIVITY_TYPES.map((activity) => (
            <View key={activity.id} style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <Ionicons name={activity.icon as any} size={20} color={COLORS.primary.sky} />
              </View>
              <Text style={styles.activityName}>{activity.name}</Text>
              <Text style={styles.activityValue}>
                {(healthSettings as any)?.[`track_${activity.id}`] ? 'Activado' : 'Desactivado'}
              </Text>
              <Switch
                value={(healthSettings as any)?.[`track_${activity.id}`] || false}
                onValueChange={(value) => toggleSetting(`track_${activity.id}`, value)}
                trackColor={{ false: 'transparent', true: COLORS.primary.amber }}
              />
            </View>
          ))}
        </View>

        {/* Data Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sincronización de Datos</Text>
          
          <View style={styles.syncRow}>
            <View style={styles.syncItem}>
              <Text style={styles.syncLabel}>Última sincronización</Text>
              <Text style={styles.syncValue}>
                {healthSettings?.last_sync ? 
                  new Date(healthSettings.last_sync).toLocaleDateString('es-ES') : 
                  'Nunca'
                }
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.syncBtn}
              onPress={() => {
                Alert.alert('Sincronizar', 'Iniciando sincronización manual...');
                // Aquí iría la lógica de sincronización
              }}
            >
              <Ionicons name="sync-outline" size={20} color={COLORS.text.primary} />
              <Text style={styles.syncBtnText}>Sincronizar ahora</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Privacidad</Text>
          
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Compartir datos de salud</Text>
            <Switch
              value={healthSettings?.share_health_data || false}
              onValueChange={(value) => toggleSetting('share_health_data', value)}
              trackColor={{ false: 'transparent', true: COLORS.primary.amber }}
            />
          </View>
          
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Datos anónimos</Text>
            <Switch
              value={healthSettings?.anonymous_data || false}
              onValueChange={(value) => toggleSetting('anonymous_data', value)}
              trackColor={{ false: 'transparent', true: COLORS.primary.amber }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  platformCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.background.border,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
  },
  platformStatus: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  platformDescription: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  disconnectBtn: {
    padding: SPACING.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary.sky + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  activityName: {
    flex: 1,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
  },
  activityValue: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    textAlign: 'right',
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  syncItem: {
    flex: 1,
  },
  syncLabel: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
  },
  syncValue: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.amber,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  syncBtnText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.background.primary,
    marginLeft: SPACING.sm,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.border,
  },
  privacyLabel: {
    flex: 1,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
  },
});
