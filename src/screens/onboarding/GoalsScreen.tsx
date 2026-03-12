import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Target, Zap, Heart, ShieldCheck } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/onboarding';

const GoalsScreen = ({ navigation }: any) => {
  const [selectedGoal, setSelectedGoal] = React.useState<string | null>(null);
  const { setGoal, completeOnboarding } = useOnboardingStore();

  const goals = [
    {
      id: 'lose_weight',
      title: 'Perder peso',
      desc: 'Quema grasa y mejora tu composición corporal.',
      icon: <Target color="#ef4444" size={24} />,
    },
    {
      id: 'maintain',
      title: 'Mantener salud',
      desc: 'Optimiza tu energía y mantén tu peso actual.',
      icon: <Heart color="#22c55e" size={24} />,
    },
    {
      id: 'gain_muscle',
      title: 'Ganar músculo',
      desc: 'Construye fuerza y aumenta tu masa muscular.',
      icon: <Zap color="#f59e0b" size={24} />,
    },
    {
      id: 'healthy_habits',
      title: 'Hábitos saludables',
      desc: 'Enfócate en comer mejor y sentirte increíble.',
      icon: <ShieldCheck color="#3b82f6" size={24} />,
    },
  ];

  const handleComplete = () => {
    if (selectedGoal) {
      setGoal(selectedGoal);
      completeOnboarding();
      // Navigate to main app (Dashboard)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '100%' }]} />
          </View>
          <Text style={styles.title}>¿Cuál es tu meta?</Text>
          <Text style={styles.subtitle}>Selecciona el objetivo que más se adapte a lo que buscas lograr.</Text>
        </View>

        <View style={styles.optionsContainer}>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              onPress={() => setSelectedGoal(goal.id)}
              style={[
                styles.goalCard,
                selectedGoal === goal.id && styles.selectedCard,
              ]}
            >
              <View style={styles.iconContainer}>{goal.icon}</View>
              <View style={styles.textContainer}>
                <Text style={styles.goalLine}>{goal.title}</Text>
                <Text style={styles.goalDesc}>{goal.desc}</Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedGoal === goal.id && styles.checkboxSelected
              ]}>
                {selectedGoal === goal.id && <View style={styles.checkInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Comenzar mi viaje"
          onPress={handleComplete}
          disabled={!selectedGoal}
          style={!selectedGoal ? { opacity: 0.5 } : {}}
        />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Atrás</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginBottom: 32,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  goalLine: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  goalDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  checkbox: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  checkInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  backText: {
    color: '#64748b',
    fontWeight: '600',
  },
});

export default GoalsScreen;
