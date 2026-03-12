import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/onboarding';

const BirthDateScreen = ({ navigation }: any) => {
  const [date, setDate] = React.useState(new Date(2000, 0, 1));
  const [show, setShow] = React.useState(Platform.OS === 'ios');
  const { setBirthDate } = useOnboardingStore();

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleContinue = () => {
    setBirthDate(date.toISOString());
    navigation.navigate('OnboardingGoals');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '66%' }]} />
        </View>
        <Text style={styles.title}>¿Cuándo naciste?</Text>
        <Text style={styles.subtitle}>Usamos tu edad para calcular tu tasa metabólica basal con precisión.</Text>
      </View>

      <View style={styles.content}>
        {Platform.OS !== 'ios' && (
          <TouchableOpacity style={styles.dateSelector} onPress={() => setShow(true)}>
            <Calendar color="#22c55e" size={24} />
            <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}

        {show && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChange}
              maximumDate={new Date()}
              themeVariant="light"
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title="Continuar"
          onPress={handleContinue}
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
    marginBottom: 40,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    width: '100%',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#334155',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    overflow: 'hidden',
  },
  footer: {
    marginTop: 'auto',
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

export default BirthDateScreen;
