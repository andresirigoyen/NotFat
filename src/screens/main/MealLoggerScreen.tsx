import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { useAuthStore } from '@/store';
import { useCreateMealWithItems } from '@/hooks/useMeals';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionPopover } from '@/components/ui/PermissionPopover';
import VoiceInputButton from '@/components/VoiceInputButton';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

const MealLoggerScreen = ({ navigation, route }: any) => {
  const navigationHook = useNavigation();
  const initialType = route?.params?.mealType || 'breakfast';
  const initialDate = route?.params?.mealDate;
  const [mealName, setMealName] = React.useState('');
  const [selectedType, setSelectedType] = React.useState(initialType);
  const [showPermissionPopover, setShowPermissionPopover] = React.useState(false);
  const [permissionType, setPermissionType] = React.useState<'camera' | 'microphone' | 'mediaLibrary'>('camera');
  const [analyzing, setAnalyzing] = React.useState(false);
  
  const { takePhoto, analyzeMealImage, pickImage } = useAIAnalysis();
  const { user } = useAuthStore();
  const { mutateAsync: createMeal, isPending: saving } = useCreateMealWithItems();
  const { requestCameraAccess, requestMediaLibraryAccess, requestMicrophoneAccess } = usePermissions();

  const mealTypes = [
    { value: 'breakfast', label: 'Desayuno', icon: 'sunny' },
    { value: 'lunch', label: 'Almuerzo', icon: 'partly-sunny' },
    { value: 'dinner', label: 'Cena', icon: 'moon' },
    { value: 'snack', label: 'Snack', icon: 'restaurant' },
  ];

  const handleCameraPress = async () => {
    const hasPermission = await requestCameraAccess();
    if (hasPermission) {
      await handleTakePhoto();
    }
  };

  const handleTakePhoto = async () => {
    try {
      setAnalyzing(true);
      const photoUri = await takePhoto();
      if (photoUri) {
        // Navigate to analysis result
        (navigationHook as any).navigate('AnalysisResult', { 
          imageUri: photoUri,
          mealType: selectedType,
          mealDate: initialDate
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto. Por favor intenta nuevamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGalleryPress = async () => {
    const hasPermission = await requestMediaLibraryAccess();
    if (hasPermission) {
      await handlePickImage();
    }
  };

  const handlePickImage = async () => {
    try {
      setAnalyzing(true);
      const imageUri = await pickImage();
      if (imageUri) {
        // Navigate to analysis result
        (navigationHook as any).navigate('AnalysisResult', { 
          imageUri,
          mealType: selectedType,
          mealDate: initialDate
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Por favor intenta nuevamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBarcodePress = async () => {
    // Navigate to barcode scanner
    (navigationHook as any).navigate('BarcodeScanner');
  };

  const handleVoicePress = async () => {
    const hasPermission = await requestMicrophoneAccess();
    if (hasPermission) {
      // Navigate to voice input screen
      (navigationHook as any).navigate('VoiceInput', { 
        mealType: selectedType,
        mealDate: initialDate
      });
    }
  };

  const handleManualSave = async () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la comida');
      return;
    }

    try {
      // Basic nutritional estimation based on meal name (simplified)
      const estimatedCalories = Math.max(200, mealName.length * 15); // Basic estimation
      const estimatedProtein = Math.round(estimatedCalories * 0.2 / 4); // 20% protein
      const estimatedCarbs = Math.round(estimatedCalories * 0.5 / 4); // 50% carbs
      const estimatedFat = Math.round(estimatedCalories * 0.3 / 9); // 30% fat

      await createMeal({
        meal: {
          name: mealName,
          meal_type: selectedType as any,
          source_type: 'text',
          status: 'complete',
          meal_at: (initialDate && initialDate !== 'before') ? initialDate : new Date().toISOString(),
          image_url: null,
          recorded_timezone: null,
          llm_used: null,
          modified: false,
          is_from_favorite: false,
          image_url_aux: null,
          feedback: null,
          recommendation: null,
          api_time_ms: null,
          processing_time_ms: null,
          prompt_version: null,
        },
        items: [{
          name: mealName,
          quantity: 1,
          unit: 'unit',
          calories: estimatedCalories,
          protein: estimatedProtein,
          carbs: estimatedCarbs,
          fat: estimatedFat,
          barcode_number: null,
          scanned: false,
          servings: 1,
          contributed: false,
          nutriscore_grade: null,
          nova_group: null,
          notfat_score: null,
          labels_tags: null,
          additives_tags: null,
          notfat_score_breakdown: null,
          additives_details: null,
          is_alcoholic: false,
          has_ingredients_data: false,
        }],
      });

      Alert.alert('¡Éxito!', 'Comida registrada correctamente');
      navigationHook.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la comida. Por favor intenta nuevamente.');
    }
  };

  const handleNowPress = () => {
    (navigationHook as any).navigate('MealTime');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigationHook.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registrar Comida</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Meal Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Comida</Text>
          <View style={styles.mealTypes}>
            {mealTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.mealTypeButton,
                  selectedType === type.value && styles.mealTypeButtonSelected
                ]}
                onPress={() => setSelectedType(type.value)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={20} 
                  color={selectedType === type.value ? COLORS.text.primary : COLORS.text.muted} 
                />
                <Text style={[
                  styles.mealTypeText,
                  selectedType === type.value && styles.mealTypeTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Cómo quieres registrar?</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCameraPress}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="camera" size={24} color={COLORS.status.error} />
              </View>
              <Text style={styles.actionTitle}>Cámara</Text>
              <Text style={styles.actionSubtitle}>Toma una foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleGalleryPress}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="images" size={24} color={COLORS.status.info} />
              </View>
              <Text style={styles.actionTitle}>Galería</Text>
              <Text style={styles.actionSubtitle}>Elige una imagen</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleVoicePress}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="mic" size={24} color={COLORS.status.success} />
              </View>
              <Text style={styles.actionTitle}>Voz</Text>
              <Text style={styles.actionSubtitle}>Describe con voz</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleBarcodePress}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="barcode" size={24} color={COLORS.status.warning} />
              </View>
              <Text style={styles.actionTitle}>Código</Text>
              <Text style={styles.actionSubtitle}>Escanea barcode</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manual Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O ingresa manualmente</Text>
          
          <View style={styles.manualEntry}>
            <TextInput
              style={styles.textInput}
              value={mealName}
              onChangeText={setMealName}
              placeholder="Nombre de la comida..."
              placeholderTextColor={COLORS.text.muted}
            />
            
            <TouchableOpacity 
              style={[styles.saveButton, !mealName.trim() && styles.saveButtonDisabled]}
              onPress={handleManualSave}
              disabled={!mealName.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.text.primary} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O describe con tu voz</Text>
          <Text style={styles.sectionSubtitle}>
            Mantén presionado el botón y describe lo que comiste
          </Text>
          <VoiceInputButton 
            onMealCreated={(mealData) => {
              Alert.alert('¡Éxito!', 'Comida registrada correctamente');
              navigationHook.goBack();
            }}
          />
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <View style={styles.timeRow}>
            <Text style={styles.sectionTitle}>¿Cuándo comiste?</Text>
            <TouchableOpacity style={styles.timeBadge} onPress={handleNowPress}>
              <Text style={styles.timeBadgeText}>Ahora</Text>
              <Ionicons name="time" size={16} color={COLORS.primary.amber} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Permission Popover */}
      <PermissionPopover
        visible={showPermissionPopover}
        onClose={() => setShowPermissionPopover(false)}
        title={`Permiso de ${permissionType === 'camera' ? 'Cámara' : permissionType === 'microphone' ? 'Micrófono' : 'Galería'}`}
        description={`Necesitamos acceso a tu ${permissionType === 'camera' ? 'cámara' : permissionType === 'microphone' ? 'micrófono' : 'galería'} para que puedas registrar tus comidas de forma fácil y rápida.`}
        icon={permissionType === 'camera' ? 'camera' : permissionType === 'microphone' ? 'mic' : 'images'}
        onAllow={() => {
          setShowPermissionPopover(false);
          // Handle permission granted
        }}
        onDeny={() => setShowPermissionPopover(false)}
        primaryColor={COLORS.primary.amber}
      />

      {/* Loading Overlay */}
      {(analyzing || saving) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary.amber} />
          <Text style={styles.loadingText}>
            {analyzing ? 'Analizando imagen...' : 'Guardando comida...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  placeholder: {
    width: 24,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    fontFamily: FONTS.primary,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontFamily: FONTS.primary,
  },
  mealTypes: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  mealTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.card,
  },
  mealTypeButtonSelected: {
    backgroundColor: COLORS.primary.amber,
    borderColor: COLORS.primary.amber,
  },
  mealTypeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.muted,
    marginLeft: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  mealTypeTextSelected: {
    color: COLORS.background.primary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionButton: {
    width: '47%',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  actionSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    textAlign: 'center',
    fontFamily: FONTS.primary,
  },
  manualEntry: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.background.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.tertiary,
    marginBottom: SPACING.md,
    fontFamily: FONTS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary.amber,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.interactive.disabled,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.background.primary,
    fontFamily: FONTS.primary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 211, 77, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary.amber,
  },
  timeBadgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.primary.amber,
    marginRight: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontWeight: FONTS.weights.semibold,
    fontFamily: FONTS.primary,
  },
});

export default MealLoggerScreen;
