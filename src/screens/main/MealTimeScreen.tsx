import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Clock, Calendar, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const MealTimeScreen = ({ navigation }: any) => {
  const mealTimes = [
    {
      id: 'breakfast',
      name: 'Desayuno',
      time: '7:00 - 10:00',
      description: 'Tu primera comida del día',
      icon: '🌅',
      color: '#f59e0b'
    },
    {
      id: 'morning_snack',
      name: 'Snack Mañana',
      time: '10:00 - 11:00',
      description: 'Un pequeño tentempié',
      icon: '🥐',
      color: '#8b5cf6'
    },
    {
      id: 'lunch',
      name: 'Almuerzo',
      time: '12:00 - 14:00',
      description: 'Tu comida principal del día',
      icon: '🍽️',
      color: '#22c55e'
    },
    {
      id: 'afternoon_snack',
      name: 'Snack Tarde',
      time: '16:00 - 17:00',
      description: 'Recarga de energía',
      icon: '🍿',
      color: '#f97316'
    },
    {
      id: 'dinner',
      name: 'Cena',
      time: '19:00 - 21:00',
      description: 'Tu última comida del día',
      icon: '🌙',
      color: '#3b82f6'
    },
    {
      id: 'evening_snack',
      name: 'Snack Noche',
      time: '21:00 - 22:00',
      description: 'Algo ligero antes de dormir',
      icon: '🍵',
      color: '#8b5cf6'
    }
  ];

  const handleMealTimeSelect = (mealType: string) => {
    // Navigate to the appropriate meal logger screen with the selected meal type
    navigation.navigate('MealLogger', { mealType });
  };

  const handleCustomTime = () => {
    // Navigate to a custom time selection screen
    navigation.navigate('CustomTimeMeal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#1e293b" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>¿Cuándo comiste?</Text>
          <Text style={styles.subtitle}>Selecciona el momento de tu comida</Text>
        </View>

        <View style={styles.mealTimesList}>
          {mealTimes.map((meal) => (
            <TouchableOpacity
              key={meal.id}
              style={styles.mealTimeCard}
              onPress={() => handleMealTimeSelect(meal.id)}
            >
              <View style={styles.mealTimeHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#f59e0b20' }]}>
                  <Text style={styles.iconText}>{meal.icon}</Text>
                </View>
                <View style={styles.mealTimeInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                  <Text style={styles.mealDescription}>{meal.description}</Text>
                </View>
                <ChevronRight color="#94a3b8" size={20} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customSection}>
          <Text style={styles.customTitle}>¿No fue ahora mismo?</Text>
          <TouchableOpacity style={styles.customButton} onPress={handleCustomTime}>
            <Calendar color="#64748b" size={20} />
            <Text style={styles.customButtonText}>Elegir hora personalizada</Text>
            <ChevronRight color="#64748b" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Button
            title="Registrar para Ayer"
            variant="secondary"
            onPress={() => navigation.navigate('MealLogger', { mealType: 'yesterday' })}
            style={{ marginBottom: 12 }}
          />
          <Button
            title="Registrar para Antes"
            variant="secondary"
            onPress={() => navigation.navigate('MealLogger', { mealType: 'before' })}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topNav: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '500',
  },
  mealTimesList: {
    marginBottom: 32,
  },
  mealTimeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  mealTimeInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },
  customSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8e0',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginLeft: 12,
  },
  quickActions: {
    marginBottom: 32,
  },
});

export default MealTimeScreen;
