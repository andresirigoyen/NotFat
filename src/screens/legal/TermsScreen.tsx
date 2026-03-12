import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Términos y Condiciones</Text>
        <Text style={styles.subtitle}>Última actualización: 10 de marzo de 2026</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
        <Text style={styles.text}>
          Al utilizar la aplicación NotFat, aceptas estos términos y condiciones.
        </Text>

        <Text style={styles.sectionTitle}>2. Privacidad y Datos</Text>
        <Text style={styles.text}>
          Protegemos tu información según nuestra Política de Privacidad.
        </Text>

        <Text style={styles.sectionTitle}>3. Uso del Servicio</Text>
        <Text style={styles.text}>
          La aplicación proporciona seguimiento nutricional y de salud.
        </Text>

        <Text style={styles.sectionTitle}>4. Derechos del Usuario</Text>
        <Text style={styles.text}>
          Puedes solicitar la eliminación de tus datos en cualquier momento.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  text: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 16 }
});
