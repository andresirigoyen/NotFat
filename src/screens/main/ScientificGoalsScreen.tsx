import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useScientificGoals } from '@/hooks/useScientificGoals';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, SPACING, FONTS } from '@/constants/theme';

const TYPOGRAPHY = {
  heading: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
  },
  subheading: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  body: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
  },
  button: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
  },
  caption: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
  },
};

interface ScientificGoalsScreenProps {
  navigation: any;
}

export const ScientificGoalsScreen: React.FC<ScientificGoalsScreenProps> = ({
  navigation,
}) => {
  const [generatedGoals, setGeneratedGoals] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  
  const { profile, isLoading: profileLoading } = useProfile();
  const { generateAndSaveGoals, isLoading: goalsLoading } = useScientificGoals();

  useEffect(() => {
    // Verificar si el perfil está completo
    if (profile && !profileLoading) {
      const hasRequiredData = 
        profile.height_value && 
        profile.weight_value && 
        profile.birth_date && 
        profile.gender;

      if (!hasRequiredData) {
        Alert.alert(
          'Perfil Incompleto',
          'Para calcular objetivos científicos, necesitas completar tu perfil con altura, peso, fecha de nacimiento y género.',
          [
            { text: 'Completar Perfil', onPress: () => navigation.navigate('Profile') },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
    }
  }, [profile, profileLoading, navigation]);

  const handleGenerateGoals = async () => {
    try {
      const goals = await generateAndSaveGoals();
      setGeneratedGoals(goals);
      setShowResults(true);
    } catch (error) {
      console.error('Error generating goals:', error);
    }
  };

  const renderProfileInfo = () => {
    if (!profile) return null;

    const age = profile.birth_date 
      ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
      : 'N/A';

    return (
      <View style={styles.profileCard}>
        <Text style={styles.profileTitle}>Tu Perfil</Text>
        <View style={styles.profileInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Edad:</Text>
            <Text style={styles.infoValue}>{age} años</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Peso:</Text>
            <Text style={styles.infoValue}>{profile.weight_value} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Altura:</Text>
            <Text style={styles.infoValue}>{profile.height_value} cm</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Género:</Text>
            <Text style={styles.infoValue}>
              {profile.gender === 'male' ? 'Masculino' : 
               profile.gender === 'female' ? 'Femenino' : 'Otro'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Actividad:</Text>
            <Text style={styles.infoValue}>
              {profile.activity_level ? 
                `${(profile.activity_level * 100).toFixed(0)}%` : 
                'No especificado'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFormulas = () => {
    if (!generatedGoals) return null;

    return (
      <View style={styles.formulasCard}>
        <Text style={styles.formulasTitle}>Fórmulas Científicas Utilizadas</Text>
        
        <View style={styles.formulaSection}>
          <Text style={styles.formulaName}>BMR (Tasa Metabólica Basal)</Text>
          <Text style={styles.formulaValue}>
            {generatedGoals.calculations.bmr_formula}
          </Text>
          <Text style={styles.formulaResult}>
            BMR: {generatedGoals.bmr} kcal/día
          </Text>
        </View>

        <View style={styles.formulaSection}>
          <Text style={styles.formulaName}>TDEE (Gasto Total Diario)</Text>
          <Text style={styles.formulaValue}>
            BMR × {generatedGoals.calculations.activity_multiplier}
          </Text>
          <Text style={styles.formulaResult}>
            TDEE: {generatedGoals.tdee} kcal/día
          </Text>
        </View>

        <View style={styles.formulaSection}>
          <Text style={styles.formulaName}>Distribución de Macronutrientes</Text>
          <Text style={styles.formulaValue}>
            Proteína: {generatedGoals.calculations.protein_formula}
          </Text>
          <Text style={styles.formulaValue}>
            Carbohidratos: {generatedGoals.calculations.carb_formula}
          </Text>
          <Text style={styles.formulaValue}>
            Grasas: {generatedGoals.calculations.fat_formula}
          </Text>
        </View>
      </View>
    );
  };

  const renderGoals = () => {
    if (!generatedGoals) return null;

    return (
      <View style={styles.goalsCard}>
        <Text style={styles.goalsTitle}>Tus Objetivos Diarios</Text>
        
        <View style={styles.goalsGrid}>
          <View style={styles.goalItem}>
            <View style={[styles.goalIcon, { backgroundColor: '#FFE5E5' }]}>
              <Ionicons name="flame" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.goalValue}>{generatedGoals.calories}</Text>
            <Text style={styles.goalLabel}>Calorías</Text>
          </View>

          <View style={styles.goalItem}>
            <View style={[styles.goalIcon, { backgroundColor: '#E5F5FF' }]}>
              <Ionicons name="fitness" size={24} color="#2196F3" />
            </View>
            <Text style={styles.goalValue}>{generatedGoals.protein}g</Text>
            <Text style={styles.goalLabel}>Proteína</Text>
          </View>

          <View style={styles.goalItem}>
            <View style={[styles.goalIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="nutrition" size={24} color="#FF9800" />
            </View>
            <Text style={styles.goalValue}>{generatedGoals.carbs}g</Text>
            <Text style={styles.goalLabel}>Carbohidratos</Text>
          </View>

          <View style={styles.goalItem}>
            <View style={[styles.goalIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="water" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.goalValue}>{generatedGoals.fat}g</Text>
            <Text style={styles.goalLabel}>Grasas</Text>
          </View>

          <View style={styles.goalItem}>
            <View style={[styles.goalIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="leaf" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.goalValue}>{generatedGoals.fiber}g</Text>
            <Text style={styles.goalLabel}>Fibra</Text>
          </View>

          <View style={styles.goalItem}>
            <View style={[styles.goalIcon, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="water-outline" size={24} color="#03A9F4" />
            </View>
            <Text style={styles.goalValue}>{generatedGoals.water}ml</Text>
            <Text style={styles.goalLabel}>Agua</Text>
          </View>
        </View>
      </View>
    );
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.amber} />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Objetivos Científicos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileInfo()}

        {!showResults ? (
          <View style={styles.introductionCard}>
            <Ionicons name="analytics" size={48} color={COLORS.primary.amber} />
            <Text style={styles.introductionTitle}>
              Objetivos Basados en Ciencia
            </Text>
            <Text style={styles.introductionText}>
              Calcularemos tus objetivos nutricionales usando fórmulas científicas 
              validadas como Mifflin-St Jeor para tu metabolismo basal y 
              distribuciones óptimas de macronutrientes.
            </Text>
            <Text style={styles.introductionText}>
              Los resultados estarán basados en tu edad, peso, altura, 
              género y nivel de actividad física.
            </Text>
            
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateGoals}
              disabled={goalsLoading}
            >
              {goalsLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.generateButtonText}>Calcular Mis Objetivos</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderFormulas()}
            {renderGoals()}
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3ED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.primary.amber,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.heading,
    color: '#ffffff',
    fontSize: 18,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: '#666666',
    marginTop: SPACING.md,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 18,
    color: '#000000',
    marginBottom: SPACING.md,
  },
  profileInfo: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...TYPOGRAPHY.body,
    color: '#666666',
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: '#000000',
    fontWeight: '600',
  },
  introductionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introductionTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  introductionText: {
    ...TYPOGRAPHY.body,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  generateButton: {
    backgroundColor: COLORS.primary.amber,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    marginTop: SPACING.lg,
    minWidth: 200,
  },
  generateButtonText: {
    ...TYPOGRAPHY.button,
    color: '#000000',
    textAlign: 'center',
  },
  formulasCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formulasTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 18,
    color: '#000000',
    marginBottom: SPACING.md,
  },
  formulaSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formulaName: {
    ...TYPOGRAPHY.subheading,
    color: '#000000',
    marginBottom: SPACING.xs,
  },
  formulaValue: {
    ...TYPOGRAPHY.caption,
    color: '#666666',
    fontFamily: 'monospace',
    marginBottom: SPACING.xs,
  },
  formulaResult: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary.amber,
    fontWeight: '600',
  },
  goalsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalsTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 18,
    color: '#000000',
    marginBottom: SPACING.md,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  goalValue: {
    ...TYPOGRAPHY.heading,
    fontSize: 16,
    color: '#000000',
    marginBottom: 2,
  },
  goalLabel: {
    ...TYPOGRAPHY.caption,
    color: '#666666',
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: COLORS.primary.amber,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
    margin: SPACING.lg,
  },
  doneButtonText: {
    ...TYPOGRAPHY.button,
    color: '#000000',
  },
});

export default ScientificGoalsScreen;
