import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ChevronRight, User as UserIcon } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/onboarding';

const GenderScreen = ({ navigation }: any) => {
  const [selectedGender, setSelectedGender] = React.useState<string | null>(null);
  const { updateUserData } = useOnboardingStore();

  const handleContinue = () => {
    if (selectedGender) {
      updateUserData({ gender: selectedGender });
      navigation.navigate('OnboardingBirthDate');
    }
  };

  const genders = [
    { label: 'Masculino', value: 'male', icon: '♂' },
    { label: 'Femenino', value: 'female', icon: '♀' },
    { label: 'No Binario', value: 'non_binary', icon: '⚥' },
    { label: 'Otro', value: 'other', icon: '?' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '33%' }]} />
        </View>
        <Text style={styles.title}>¿Cuál es tu género?</Text>
        <Text style={styles.subtitle}>Esto nos ayuda a personalizar tus objetivos calóricos y nutricionales.</Text>
      </View>

      <View style={styles.optionsContainer}>
        {genders.map((gender) => (
          <TouchableOpacity
            key={gender.value}
            onPress={() => setSelectedGender(gender.value)}
            style={[
              styles.optionCard,
              selectedGender === gender.value && styles.selectedCard,
            ]}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionIcon}>{gender.icon}</Text>
              <Text style={[
                styles.optionLabel,
                selectedGender === gender.value && styles.selectedLabel
              ]}>
                {gender.label}
              </Text>
            </View>
            <View style={[
              styles.radio,
              selectedGender === gender.value && styles.radioSelected
            ]}>
              {selectedGender === gender.value && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title="Continuar"
          onPress={handleContinue}
          disabled={!selectedGender}
          style={!selectedGender ? { opacity: 0.5 } : {}}
        />
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
  optionsContainer: {
    flex: 1,
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  selectedCard: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  selectedLabel: {
    color: '#166534',
  },
  radio: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#22c55e',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  footer: {
    marginTop: 'auto',
  },
});

export default GenderScreen;
