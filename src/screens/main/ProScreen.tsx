import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ProScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>NotFat Pro</Text>
          <Text style={styles.subtitle}>Desbloquea todo el potencial de tu salud</Text>
        </View>

        {/* Subscription Cards */}
        <View style={styles.subscriptionContainer}>
          
          {/* Annual Subscription - Black Background */}
          <View style={styles.annualCard}>
            <View style={styles.priceHeader}>
              <Text style={styles.planTitle}>Suscripción Anual</Text>
              <Text style={styles.annualPrice}>$29.990 CLP</Text>
            </View>
            <View style={styles.features}>
              <Text style={[styles.featureText, styles.annualCardFeature]}>Acceso a todo ilimitado</Text>
            </View>
            <TouchableOpacity style={styles.annualButton}>
              <Text style={styles.annualButtonText}>Elegir Anual</Text>
            </TouchableOpacity>
          </View>

          {/* Monthly Subscription - White Background */}
          <View style={styles.monthlyCard}>
            <View style={styles.priceHeader}>
              <Text style={styles.planTitle}>Suscripción Mensual</Text>
              <Text style={styles.monthlyPrice}>$4.990</Text>
            </View>
            <View style={styles.features}>
              <Text style={[styles.featureText, styles.monthlyCardFeature]}>Unlimited photos</Text>
              <Text style={[styles.featureText, styles.monthlyCardFeature]}>Scan of packaged products</Text>
              <Text style={[styles.featureText, styles.monthlyCardFeature]}>Share info</Text>
            </View>
            <TouchableOpacity style={styles.monthlyButton}>
              <Text style={styles.monthlyButtonText}>Elegir Mensual</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="analytics" size={32} color="#7c2d12" />
            </View>
            <Text style={styles.featureTitle}>Análisis Avanzado</Text>
            <Text style={styles.featureDescription}>Métricas detalladas de tu progreso nutricional</Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="restaurant" size={32} color="#7c2d12" />
            </View>
            <Text style={styles.featureTitle}>Recetas Premium</Text>
            <Text style={styles.featureDescription}>Acceso a más de 1000 recetas personalizadas</Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="fitness" size={32} color="#7c2d12" />
            </View>
            <Text style={styles.featureTitle}>Planes Fitness</Text>
            <Text style={styles.featureDescription}>Rutinas de ejercicio personalizadas</Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="nutrition" size={32} color="#7c2d12" />
            </View>
            <Text style={styles.featureTitle}>Consulta Nutricionista</Text>
            <Text style={styles.featureDescription}>Chat con expertos en nutrición</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3ED',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7c2d12',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  subscriptionContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  annualCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  monthlyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  priceHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  annualPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  monthlyPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7c2d12',
  },
  features: {
    marginBottom: 20,
  },
  featureText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
    textAlign: 'center',
  },
  annualCardFeature: {
    color: '#ffffff',
  },
  monthlyCardFeature: {
    color: '#374151',
  },
  annualButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  monthlyButton: {
    backgroundColor: '#7c2d12',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  annualButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },
  monthlyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
});

export default ProScreen;
