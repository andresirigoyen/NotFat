import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const handleDataExport = () => {
    Alert.alert(
      'Exportar Datos',
      'Recibirás tus datos en formato JSON en tu correo electrónico.',
      [{ text: 'OK', onPress: () => console.log('Data export requested') }]
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Eliminar Cuenta',
      'Esta acción es irreversible. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => console.log('Account deletion requested')
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Política de Privacidad</Text>
        <Text style={styles.subtitle}>Cumplimiento GDPR/HIPAA</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Datos que Recopilamos</Text>
          <Text style={styles.text}>• Información de perfil y salud</Text>
          <Text style={styles.text}>• Registro de comidas y actividad</Text>
          <Text style={styles.text}>• Datos de uso y rendimiento</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Cómo Protegemos tus Datos</Text>
          <Text style={styles.text}>• Encriptación end-to-end</Text>
          <Text style={styles.text}>• Servidores seguros en la UE</Text>
          <Text style={styles.text}>• Acceso limitado del personal</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Preferencias de Privacidad</Text>
          
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Analíticas</Text>
              <Text style={styles.preferenceDesc}>Mejorar la experiencia</Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              trackColor={{ false: '#767577', true: '#22c55e' }}
              thumbColor={analyticsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Marketing</Text>
              <Text style={styles.preferenceDesc}>Comunicaciones promocionales</Text>
            </View>
            <Switch
              value={marketingEnabled}
              onValueChange={setMarketingEnabled}
              trackColor={{ false: '#767577', true: '#22c55e' }}
              thumbColor={marketingEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Tus Derechos GDPR</Text>
          <Text style={styles.text}>• Acceso a tus datos</Text>
          <Text style={styles.text}>• Rectificación de información</Text>
          <Text style={styles.text}>• Portabilidad de datos</Text>
          <Text style={styles.text}>• Derecho al olvido</Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDataExport}>
            <Ionicons name="download-outline" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Exportar Mis Datos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleDataDeletion}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <Text style={[styles.actionText, styles.dangerText]}>Eliminar Mi Cuenta</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Para preguntas sobre privacidad, contacta a:
          </Text>
          <Text style={styles.contactEmail}>privacy@notfat.app</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666' },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  text: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 8 },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  preferenceInfo: { flex: 1 },
  preferenceTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  preferenceDesc: { fontSize: 14, color: '#666' },
  actionSection: { marginTop: 32 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12
  },
  dangerButton: { backgroundColor: '#fff3f3', borderWidth: 1, borderColor: '#ffe0e0' },
  actionText: { fontSize: 16, fontWeight: '500', marginLeft: 12, color: '#007AFF' },
  dangerText: { color: '#FF3B30' },
  footer: { marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  footerText: { fontSize: 14, color: '#666', textAlign: 'center' },
  contactEmail: { fontSize: 16, fontWeight: '500', color: '#007AFF', textAlign: 'center', marginTop: 4 }
});
