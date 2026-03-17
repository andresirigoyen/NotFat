import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { 
  useUserNutritionGuidelines,
  useCreateNutritionGuideline,
  useUserNutritionistConnections,
  useCreateGuidelineDay,
  useCreateGuidelineMeal,
  useCreateGuidelineMealItem,
  useConnectWithNutritionist
} from '@/hooks/useNutritionists';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const ALLERGIES_OPTIONS = [
  'Lácteos',
  'Gluten',
  'Frutos secos',
  'Mariscos',
  'Huevos',
  'Soya',
  'Maní',
  'Sésamo',
];

const PATHOLOGIES_OPTIONS = [
  'Diabetes',
  'Hipertensión',
  'Colesterol alto',
  'Enfermedad celíaca',
  'Síndrome del intestino irritable',
  'Enfermedad de Crohn',
  'Colitis ulcerosa',
  'Tiroides',
];

const COOKING_TIME_OPTIONS = [
  'Menos de 15 min',
  '15-30 min',
  '30-45 min',
  '45-60 min',
  'Más de 1 hora',
];

export default function NutritionGuidelinesScreen() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const { data: guidelines, isLoading } = useUserNutritionGuidelines(profile?.id || '');
  const { data: connections } = useUserNutritionistConnections(profile?.id || '');
  
  const { mutate: createGuideline, isPending: creating } = useCreateNutritionGuideline();
  const { mutate: createDay } = useCreateGuidelineDay();
  const { mutate: createMeal } = useCreateGuidelineMeal();
  const { mutate: createMealItem } = useCreateGuidelineMealItem();
  const { mutate: connectWithNutritionist } = useConnectWithNutritionist();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    allergies: [] as string[],
    pathologies: [] as string[],
    food_aversions: [] as string[],
    cooking_time: '',
    supplementation: false,
    notes: '',
    nutritionist_id: '',
  });

  const handleCreateGuideline = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el plan');
      return;
    }

    try {
      const guideline = await createGuidelineAsync(formData);
      
      // Connect with nutritionist if selected
      if (formData.nutritionist_id) {
        await connectWithNutritionistAsync({
          nutritionistId: formData.nutritionist_id,
          guidelineId: guideline.id
        });
      }

      // Create default structure
      await createGuidelineStructure(guideline.id);

      Alert.alert('Éxito', 'Plan nutricional creado correctamente');
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Error creating guideline:', error);
      Alert.alert('Error', 'No se pudo crear el plan nutricional');
    }
  };

  const createGuidelineAsync = (data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      createGuideline(data, {
        onSuccess: resolve,
        onError: reject,
      });
    });
  };

  const connectWithNutritionistAsync = (data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      connectWithNutritionist(data, {
        onSuccess: resolve,
        onError: reject,
      });
    });
  };

  const createGuidelineStructure = async (guidelineId: string) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    for (let i = 0; i < days.length; i++) {
      const day = await createDayAsync({
        guideline_id: guidelineId,
        day_name: days[i],
        day_order: i + 1,
        total_calories: 2000,
        total_protein: 150,
        total_carbs: 250,
        total_fat: 65,
      }) as any;

      // Create meals for each day
      const mealTypes = [
        { type: 'Desayuno', order: 1, time: '08:00' },
        { type: 'Almuerzo', order: 2, time: '13:00' },
        { type: 'Cena', order: 3, time: '20:00' },
        { type: 'Snack', order: 4, time: '16:00' },
      ];

      for (const mealType of mealTypes) {
        const meal = await createMealAsync({
          guideline_day_id: day.id,
          meal_order: mealType.order,
          meal_type: mealType.type,
          meal_name: `${mealType.type} - ${days[i]}`,
          scheduled_time: mealType.time,
        }) as any;

        // Create sample meal items with real nutritional data
        const sampleItems = getSampleItemsForMeal(mealType.type);
        for (const [index, item] of sampleItems.entries()) {
          await createMealItemAsync({
            guideline_meal_id: meal.id,
            item_order: index + 1,
            ...item,
          });
        }
      }
    }
  };

  const createDayAsync = (data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      createDay(data, {
        onSuccess: resolve,
        onError: reject,
      });
    });
  };

  const createMealAsync = (data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      createMeal(data, {
        onSuccess: resolve,
        onError: reject,
      });
    });
  };

  const createMealItemAsync = (data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      createMealItem(data, {
        onSuccess: resolve,
        onError: reject,
      });
    });
  };

  const getSampleItemsForMeal = (mealType: string) => {
    const sampleItems = {
      'Desayuno': [
        { name: 'Avena con frutas', quantity: 100, unit: 'g' as const, calories: 150, protein: 5, carbs: 30, fat: 3 },
        { name: 'Yogurt griego', quantity: 200, unit: 'g' as const, calories: 120, protein: 20, carbs: 8, fat: 2 },
      ],
      'Almuerzo': [
        { name: 'Pechuga de pollo', quantity: 150, unit: 'g' as const, calories: 250, protein: 35, carbs: 0, fat: 10 },
        { name: 'Arroz integral', quantity: 100, unit: 'g' as const, calories: 130, protein: 3, carbs: 25, fat: 1 },
        { name: 'Ensalada mixta', quantity: 200, unit: 'g' as const, calories: 50, protein: 2, carbs: 8, fat: 0 },
      ],
      'Cena': [
        { name: 'Salmón', quantity: 120, unit: 'g' as const, calories: 280, protein: 25, carbs: 0, fat: 18 },
        { name: 'Quinoa', quantity: 80, unit: 'g' as const, calories: 120, protein: 4, carbs: 21, fat: 2 },
        { name: 'Vegetales al vapor', quantity: 150, unit: 'g' as const, calories: 40, protein: 2, carbs: 6, fat: 0 },
      ],
      'Snack': [
        { name: 'Fruta', quantity: 150, unit: 'g' as const, calories: 80, protein: 1, carbs: 20, fat: 0 },
        { name: 'Nueces', quantity: 20, unit: 'g' as const, calories: 120, protein: 4, carbs: 4, fat: 10 },
      ],
    };

    return sampleItems[mealType as keyof typeof sampleItems] || [];
  };

  const resetForm = () => {
    setFormData({
      name: '',
      allergies: [],
      pathologies: [],
      food_aversions: [],
      cooking_time: '',
      supplementation: false,
      notes: '',
      nutritionist_id: '',
    });
  };

  const toggleAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  const togglePathology = (pathology: string) => {
    setFormData(prev => ({
      ...prev,
      pathologies: prev.pathologies.includes(pathology)
        ? prev.pathologies.filter(p => p !== pathology)
        : [...prev.pathologies, pathology]
    }));
  };

  const handleViewPlan = (guideline: any) => {
    // Navigate to a detailed view of the nutrition plan
    (navigation as any).navigate('NutritionPlanDetail', { guidelineId: guideline.id });
  };

  const handleEditPlan = (guideline: any) => {
    // Navigate to edit the nutrition plan
    (navigation as any).navigate('NutritionPlanEdit', { guidelineId: guideline.id });
  };

  const handleDeletePlan = (guideline: any) => {
    Alert.alert(
      'Eliminar Plan',
      '¿Estás seguro de que quieres eliminar este plan nutricional? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            Alert.alert('Info', 'Funcionalidad de eliminar próximamente');
          }
        }
      ]
    );
  };

  const handleConnectNutritionist = (guideline: any) => {
    (navigation as any).navigate('Nutritionists', { guidelineId: guideline.id });
  };

  const renderGuidelineCard = (guideline: any) => {
    const nutritionist = guideline.nutritionists;
    const totalDays = guideline.guideline_days?.length || 0;
    const totalMeals = guideline.guideline_days?.reduce((acc: number, day: any) => 
      acc + (day.guideline_meals?.length || 0), 0) || 0;
    const totalCalories = guideline.guideline_days?.reduce((acc: number, day: any) => 
      acc + (day.total_calories || 0), 0) || 0;

    return (
      <View key={guideline.id} style={styles.guidelineCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.guidelineName}>{guideline.name}</Text>
            <Text style={styles.guidelineStatus}>
              {guideline.status === 'draft' ? 'Borrador' : 'Activo'}
            </Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.daysCount}>{totalDays} días</Text>
            <Text style={styles.mealsCount}>{totalMeals} comidas</Text>
            {nutritionist && (
              <Text style={styles.nutritionistName}>
                Dr. {nutritionist.first_name} {nutritionist.last_name}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.guidelineInfo}>
          {guideline.allergies && guideline.allergies.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="alert-circle" size={16} color={COLORS.status.error} />
              <Text style={styles.infoText}>
                Alergias: {guideline.allergies.join(', ')}
              </Text>
            </View>
          )}
          
          {guideline.pathologies && guideline.pathologies.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="medical" size={16} color={COLORS.status.warning} />
              <Text style={styles.infoText}>
                Condiciones: {guideline.pathologies.join(', ')}
              </Text>
            </View>
          )}
          
          {guideline.cooking_time && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color={COLORS.primary.amber} />
              <Text style={styles.infoText}>
                Tiempo: {guideline.cooking_time}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="flame" size={16} color={COLORS.status.info} />
            <Text style={styles.infoText}>
              {Math.round(totalCalories / Math.max(totalDays, 1))} kcal/día promedio
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleViewPlan(guideline)}
          >
            <Ionicons name="eye" size={20} color={COLORS.primary.amber} />
            <Text style={styles.actionButtonText}>Ver Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditPlan(guideline)}
          >
            <Ionicons name="create" size={20} color={COLORS.primary.amber} />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {!nutritionist && (
          <View style={styles.connectSection}>
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={() => handleConnectNutritionist(guideline)}
            >
              <Ionicons name="person-add" size={16} color={COLORS.primary.amber} />
              <Text style={styles.connectButtonText}>Conectar con Nutricionista</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeletePlan(guideline)}
        >
          <Ionicons name="trash" size={16} color={COLORS.status.error} />
          <Text style={styles.deleteButtonText}>Eliminar Plan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary.amber} />
        </TouchableOpacity>
        <Text style={styles.title}>Planes Nutricionales</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateForm(true)}>
          <Ionicons name="add-circle" size={24} color={COLORS.primary.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Guidelines List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando planes...</Text>
          </View>
        ) : guidelines && guidelines.length > 0 ? (
          guidelines.map(renderGuidelineCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant" size={48} color={COLORS.text.muted} />
            <Text style={styles.emptyText}>No tienes planes nutricionales</Text>
            <Text style={styles.emptySub}>Crea tu primer plan personalizado</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Form Modal */}
      {showCreateForm && (
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Plan Nutricional</Text>
              <TouchableOpacity onPress={() => setShowCreateForm(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Basic Info */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Nombre del Plan</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Ej: Plan para perder peso"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>

            {/* Allergies */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Alergias</Text>
              <View style={styles.optionsGrid}>
                {ALLERGIES_OPTIONS.map((allergy) => (
                  <TouchableOpacity
                    key={allergy}
                    style={[
                      styles.optionChip,
                      formData.allergies.includes(allergy) && styles.optionChipSelected
                    ]}
                    onPress={() => toggleAllergy(allergy)}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.allergies.includes(allergy) && styles.optionTextSelected
                    ]}>
                      {allergy}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pathologies */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Condiciones Médicas</Text>
              <View style={styles.optionsGrid}>
                {PATHOLOGIES_OPTIONS.map((pathology) => (
                  <TouchableOpacity
                    key={pathology}
                    style={[
                      styles.optionChip,
                      formData.pathologies.includes(pathology) && styles.optionChipSelected
                    ]}
                    onPress={() => togglePathology(pathology)}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.pathologies.includes(pathology) && styles.optionTextSelected
                    ]}>
                      {pathology}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cooking Time */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Tiempo de Cocción Preferido</Text>
              <View style={styles.optionsGrid}>
                {COOKING_TIME_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.optionChip,
                      formData.cooking_time === time && styles.optionChipSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, cooking_time: time }))}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.cooking_time === time && styles.optionTextSelected
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Supplementation */}
            <View style={styles.formSection}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Incluir suplementación</Text>
                <Switch
                  value={formData.supplementation}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, supplementation: value }))}
                  trackColor={{ false: COLORS.background.primary, true: COLORS.primary.amber }}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Notas Adicionales</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Notas adicionales sobre el plan..."
                placeholderTextColor={COLORS.text.secondary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!formData.name.trim() || creating) && styles.submitButtonDisabled]}
              onPress={handleCreateGuideline}
              disabled={!formData.name.trim() || creating}
            >
              {creating ? (
                <Text style={styles.submitButtonText}>Creando...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Crear Plan</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  addButton: {
    padding: SPACING.sm,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  guidelineCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  guidelineName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  guidelineStatus: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  cardMeta: {
    alignItems: 'flex-end',
  },
  daysCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary.amber,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  mealsCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  nutritionistName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  guidelineInfo: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(252,211,77,0.1)',
    gap: SPACING.xs,
  },
  actionButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary.amber,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  connectSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(252,211,77,0.1)',
    gap: SPACING.xs,
  },
  connectButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary.amber,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(239,68,68,0.1)',
    gap: SPACING.xs,
  },
  deleteButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.status.error,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg * 2,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionChip: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary.amber,
    borderColor: COLORS.primary.amber,
  },
  optionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  optionTextSelected: {
    color: COLORS.background.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  submitButton: {
    backgroundColor: COLORS.primary.amber,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.background.primary,
    fontFamily: FONTS.primary,
  },
});
