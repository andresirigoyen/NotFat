import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function GDPRAgreementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    dataProcessing: false
  });

  const allAgreed = Object.values(agreements).every(Boolean);

  const handleContinue = () => {
    if (!allAgreed) {
      Alert.alert('Aceptación Requerida', 'Debes aceptar todos los términos obligatorios para continuar.');
      return;
    }

    // Save consent preferences
    console.log('GDPR consent saved:', agreements);
    
    // Navigate to next screen
    navigation.navigate('OnboardingBirthDate' as never);
  };

  const toggleAgreement = (key: keyof typeof agreements) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderAgreementItem = (
    key: keyof typeof agreements,
    title: string,
    description: string,
    required: boolean = true
  ) => (
    <View style={styles.agreementItem}>
      <View style={styles.agreementHeader}>
        <TouchableOpacity
          style={[styles.checkbox, agreements[key] && styles.checkboxChecked]}
          onPress={() => toggleAgreement(key)}
        >
          {agreements[key] && <Ionicons name="checkmark" size={16} color="#fff" />}
        </TouchableOpacity>
        <View style={styles.agreementInfo}>
          <Text style={styles.agreementTitle}>
            {title}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          <Text style={styles.agreementDescription}>{description}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#22c55e" />
        </View>
        <Text style={styles.title}>Protección de tus Datos</Text>
        <Text style={styles.subtitle}>
          Cumplimos con GDPR y HIPAA para proteger tu información de salud
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
            Tu privacidad es nuestra prioridad. Lee y acepta los siguientes términos para continuar.
          </Text>
        </View>

        <View style={styles.agreementsSection}>
          <Text style={styles.sectionTitle}>Consentimientos Obligatorios</Text>
          
          {renderAgreementItem(
            'terms',
            'Términos y Condiciones',
            'Acepto los términos de servicio de NotFat'
          )}
          
          {renderAgreementItem(
            'privacy',
            'Política de Privacidad',
            'Acepto cómo recopilamos y proceso mis datos personales'
          )}
          
          {renderAgreementItem(
            'dataProcessing',
            'Procesamiento de Datos de Salud',
            'Consiento el procesamiento de mis datos de salud para proporcionar el servicio'
          )}
        </View>

        <View style={styles.agreementsSection}>
          <Text style={styles.sectionTitle}>Consentimientos Opcionales</Text>
          
          {renderAgreementItem(
            'marketing',
            'Comunicaciones de Marketing',
            'Deseo recibir información sobre promociones y nuevas características',
            false
          )}
        </View>

        <View style={styles.rightsSection}>
          <Text style={styles.sectionTitle}>Tus Derechos</Text>
          <View style={styles.rightItem}>
            <Ionicons name="eye-outline" size={20} color="#666" />
            <Text style={styles.rightText}>Acceder a tus datos en cualquier momento</Text>
          </View>
          <View style={styles.rightItem}>
            <Ionicons name="download-outline" size={20} color="#666" />
            <Text style={styles.rightText}>Exportar tus datos en formato legible</Text>
          </View>
          <View style={styles.rightItem}>
            <Ionicons name="trash-outline" size={20} color="#666" />
            <Text style={styles.rightText}>Solicitar la eliminación de tus datos</Text>
          </View>
          <View style={styles.rightItem}>
            <Ionicons name="settings-outline" size={20} color="#666" />
            <Text style={styles.rightText}>Cambiar preferencias de privacidad</Text>
          </View>
        </View>

        <View style={styles.legalInfo}>
          <Text style={styles.legalText}>
            Puedes revocar tu consentimiento en cualquier momento desde la configuración de la aplicación.
          </Text>
          <Text style={styles.legalText}>
            Para ejercer tus derechos de privacidad, contáctanos en privacy@notfat.app
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, allAgreed && styles.continueButtonEnabled]}
          onPress={handleContinue}
          disabled={!allAgreed}
        >
          <Text style={[styles.continueButtonText, allAgreed && styles.continueButtonTextEnabled]}>
            Continuar
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    padding: 24, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  iconContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  content: { padding: 20 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start'
  },
  infoText: { fontSize: 14, color: '#0369a1', marginLeft: 12, flex: 1, lineHeight: 20 },
  agreementsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  agreementItem: { marginBottom: 16 },
  agreementHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2
  },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  agreementInfo: { flex: 1 },
  agreementTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  required: { color: '#ef4444' },
  agreementDescription: { fontSize: 14, color: '#666', lineHeight: 20 },
  rightsSection: { marginBottom: 24 },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb'
  },
  rightText: { fontSize: 15, color: '#374151', marginLeft: 12 },
  legalInfo: { marginBottom: 24 },
  legalText: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 8 },
  footer: { padding: 20, paddingTop: 0 },
  continueButton: {
    backgroundColor: '#e5e7eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  continueButtonEnabled: { backgroundColor: '#22c55e' },
  continueButtonText: { fontSize: 16, fontWeight: '600', color: '#9ca3af' },
  continueButtonTextEnabled: { color: '#fff' },
  backButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  backButtonText: { fontSize: 16, fontWeight: '500', color: '#374151' }
});
