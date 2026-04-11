import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChevronLeft } from 'lucide-react-native';
import { useScientificGoals } from '@/hooks/useScientificGoals';
import { useProfile } from '@/hooks/useProfile';
import { getStyles } from './ScientificGoalsScreen.styles';

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
  const { colors, isDark } = useThemeColors();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
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
          <ActivityIndicator size="large" color={colors.primary?.amber} />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.primary?.amber} />
        </TouchableOpacity>
        <Text style={styles.title}>Objetivos Científicos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileInfo()}

        {!showResults ? (
          <View style={styles.introductionCard}>
            <Ionicons name="analytics" size={48} color={colors.primary?.amber} />
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

export default ScientificGoalsScreen;