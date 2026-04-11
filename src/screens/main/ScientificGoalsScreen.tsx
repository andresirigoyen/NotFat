import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useScientificGoals } from '@/hooks/useScientificGoals';
import { useProfile } from '@/hooks/useProfile';
import { getStyles } from './ScientificGoalsScreen.styles';
import { calculateAge } from '@/utils/nutrition';

interface ScientificGoalsScreenProps {
  navigation: any;
}

export const ScientificGoalsScreen: React.FC<ScientificGoalsScreenProps> = ({
  navigation,
}) => {
  const { colors, isDark } = useThemeColors();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  
  const { profile, nutritionGoals, isLoading: profileLoading } = useProfile();
  const { generateAndSaveGoals, isLoading: goalsLoading } = useScientificGoals();
  
  const [showResults, setShowResults] = useState(false);
  const [generatedGoals, setGeneratedGoals] = useState<any>(null);

  useEffect(() => {
    console.log('ScientificGoals - nutritionGoals:', nutritionGoals);
    console.log('ScientificGoals - source:', nutritionGoals?.source);
    const source = nutritionGoals?.source;
    const hasAlgorithm = source === 'algorithm' || source === 'Algorithm' || source === 'ALGORITHM' || source === 'ai';
    if (nutritionGoals && hasAlgorithm) {
      setGeneratedGoals({
        calories: nutritionGoals.calories,
        protein: nutritionGoals.protein,
        carbs: nutritionGoals.carbs,
        fat: nutritionGoals.fat,
        fiber: nutritionGoals.fiber || 25,
        water: nutritionGoals.water || 2000,
        bmr: 'Calculado',
        tdee: nutritionGoals.calories,
        calculations: {
          bmr_formula: 'Mifflin-St Jeor',
          activity_multiplier: 'Perfil',
          protein_formula: 'Gramos por kilo',
          carb_formula: 'Balanceado',
          fat_formula: 'Balanceado',
        }
      });
      setShowResults(true);
      console.log('ScientificGoals - Showing results');
    }
  }, [nutritionGoals]);

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
            { text: 'Cancelar', style: 'cancel', onPress: () => navigation.goBack() }
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
      ? calculateAge(profile.birth_date)
      : 'N/A';

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Análisis de Datos</Text>
        <View style={styles.profileGrid}>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Edad</Text>
            <Text style={styles.profileValue}>{age} años</Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Peso actual</Text>
            <Text style={styles.profileValue}>{profile.weight_value} kg</Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Altura</Text>
            <Text style={styles.profileValue}>{profile.height_value} cm</Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Actividad</Text>
            <Text style={styles.profileValue}>
              {profile.activity_level ? `${(profile.activity_level * 100).toFixed(0)}%` : 'Manual'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFormulas = () => {
    if (!generatedGoals) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Metodología Científica</Text>
        
        <View style={styles.formulaItem}>
          <Text style={styles.formulaName}>Tasa Metabólica Basal (BMR)</Text>
          <Text style={styles.formulaDesc}>Fórmula de Mifflin-St Jeor (Estándar de oro)</Text>
          <Text style={styles.formulaResult}>{generatedGoals.bmr} kcal/día</Text>
        </View>

        <View style={styles.formulaItem}>
          <Text style={styles.formulaName}>Gasto Energético (TDEE)</Text>
          <Text style={styles.formulaDesc}>Multiplicador de actividad física aplicado</Text>
          <Text style={styles.formulaResult}>{generatedGoals.tdee} kcal de mantenimiento</Text>
        </View>

        <View style={styles.formulaItem}>
          <Text style={styles.formulaName}>Macronutrientes</Text>
          <Text style={styles.formulaDesc}>Basado en requerimientos de masa muscular</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Text style={styles.formulaResult}>P: {generatedGoals.protein}g</Text>
            <Text style={styles.formulaResult}>C: {generatedGoals.carbs}g</Text>
            <Text style={styles.formulaResult}>G: {generatedGoals.fat}g</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGoals = () => {
    if (!generatedGoals) return null;

    const goalCards = [
      { label: 'Calorías', value: generatedGoals.calories, icon: 'flame', color: '#FF6B6B' },
      { label: 'Proteína', value: `${generatedGoals.protein}g`, icon: 'fitness', color: '#2196F3' },
      { label: 'Carbos', value: `${generatedGoals.carbs}g`, icon: 'nutrition', color: '#FF9800' },
      { label: 'Grasas', value: `${generatedGoals.fat}g`, icon: 'water', color: '#4CAF50' },
      { label: 'Fibra', value: `${generatedGoals.fiber}g`, icon: 'leaf', color: '#9C27B0' },
      { label: 'Agua', value: `${generatedGoals.water}ml`, icon: 'water-outline', color: '#03A9F4' },
    ];

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tus Objetivos Calculados</Text>
        <View style={styles.goalsGrid}>
          {goalCards.map((g, i) => (
            <View key={i} style={styles.goalCard}>
              <View style={[styles.goalIconContainer, { backgroundColor: `${g.color}15` }]}>
                <Ionicons name={g.icon as any} size={22} color={g.color} />
              </View>
              <Text style={styles.goalValue}>{g.value}</Text>
              <Text style={styles.goalLabel}>{g.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary.amber} />
        <Text style={styles.loadingText}>Analizando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary.amber} />
        </TouchableOpacity>
        <Text style={styles.title}>Analítica de Ciencia</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: 40,
          backgroundColor: colors.background.primary 
        }}
      >
        {renderProfileInfo()}

        {!showResults ? (
          <View style={styles.introContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="analytics" size={40} color={colors.primary.amber} />
            </View>
            <Text style={styles.introTitle}>
              Objetivos Científicos
            </Text>
            <Text style={styles.introText}>
              Usaremos la inteligencia de NotFat y fórmulas de nutrición clínica como Mifflin-St Jeor para determinar tus requerimientos biológicos exactos.
            </Text>
            <Text style={styles.introText}>
              Este análisis considera tu tasa metabólica basal (BMR) y el efecto térmico de tus actividades diarias.
            </Text>
            
            <TouchableOpacity
              style={[styles.mainButton, { width: '100%' }]}
              onPress={handleGenerateGoals}
              disabled={goalsLoading}
              activeOpacity={0.8}
            >
              {goalsLoading ? (
                <ActivityIndicator size="small" color={colors.background.primary} />
              ) : (
                <Text style={styles.mainButtonText}>Calcular mis objetivos</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderFormulas()}
            {renderGoals()}
            
            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.mainButtonText}>Aplicar y salir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGenerateGoals}
              disabled={goalsLoading}
            >
              <Text style={styles.secondaryButtonText}>
                {goalsLoading ? 'Recalculando...' : 'Recalcular objetivos'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScientificGoalsScreen;