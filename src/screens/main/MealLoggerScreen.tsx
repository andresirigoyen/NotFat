import { useThemeColors } from '@/hooks/useThemeColors';
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { useAuthStore } from '@/store';
import { useCreateMealWithItems } from '@/hooks/useMeals';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionPopover } from '@/components/ui/PermissionPopover';
import VoiceInputButton from '@/components/VoiceInputButton';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

const MealLoggerScreen = ({ navigation, route }: any) => {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigationHook = useNavigation();
  const initialType = route?.params?.mealType || 'breakfast';
  const initialDate = route?.params?.mealDate;
  const initialName = route?.params?.mealName || '';
  const [mealName, setMealName] = React.useState(initialName);
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
    console.log('[MealLogger] handleCameraPress called, Platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      Alert.alert('Disponible en móvil', 'La cámara no está disponible en web. Por favor usa la opción de Galería o instala la app en tu teléfono.');
      return;
    }

    try {
      setAnalyzing(true);
      console.log('[MealLogger] Requesting camera permission...');
      const hasPermission = await requestCameraAccess();
      console.log('[MealLogger] Camera permission:', hasPermission);
      
      if (!hasPermission) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar fotos de tu comida.');
        setAnalyzing(false);
        return;
      }

      console.log('[MealLogger] Taking photo...');
      const photoUri = await takePhoto();
      console.log('[MealLogger] Photo URI received:', photoUri);

      if (!photoUri) {
        console.log('[MealLogger] No photo taken, user cancelled or error');
        setAnalyzing(false);
        return;
      }

      console.log('[MealLogger] Photo captured successfully, navigating to AnalysisResult...');
      (navigationHook as any).navigate('AnalysisResult', { 
        imageUri: photoUri,
        mealType: selectedType,
        mealDate: initialDate
      });
    } catch (error: any) {
      console.error('[MealLogger] Camera error:', error);
      Alert.alert('Error', `No se pudo tomar la foto: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGalleryPress = async () => {
    console.log('[MealLogger] handleGalleryPress called, Platform:', Platform.OS);
    try {
      setAnalyzing(true);
      console.log('[MealLogger] Requesting media library permission...');
      const hasPermission = await requestMediaLibraryAccess();
      console.log('[MealLogger] Media library permission:', hasPermission);
      
      if (!hasPermission) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería para seleccionar fotos.');
        setAnalyzing(false);
        return;
      }

      console.log('[MealLogger] Picking image...');
      const imageUri = await pickImage();
      console.log('[MealLogger] Image URI received:', imageUri);

      if (!imageUri) {
        console.log('[MealLogger] No image selected, user cancelled');
        setAnalyzing(false);
        return;
      }

      console.log('[MealLogger] Image selected successfully, navigating to AnalysisResult...');
      (navigationHook as any).navigate('AnalysisResult', { 
        imageUri,
        mealType: selectedType,
        mealDate: initialDate
      });
    } catch (error: any) {
      console.error('[MealLogger] Gallery error:', error);
      Alert.alert('Error', `No se pudo seleccionar la imagen: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBarcodePress = async () => {
    // Navigate to barcode scanner
    (navigationHook as any).navigate('BarcodeScanner');
  };

  const handleVoicePress = async () => {
    try {
      console.log('[MealLogger] Requesting microphone permission...');
      const hasPermission = await requestMicrophoneAccess();
      console.log('[MealLogger] Microphone permission:', hasPermission);
      
      if (!hasPermission) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso al micrófono para usar comandos de voz.');
        return;
      }

      console.log('[MealLogger] Navigating to VoiceInput...');
      (navigationHook as any).navigate('VoiceInput', { 
        mealType: selectedType,
        mealDate: initialDate
      });
    } catch (error) {
      console.error('[MealLogger] Voice error:', error);
      Alert.alert('Error', 'No se pudo abrir la entrada de voz.');
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

      // Run the creation in background (don't await)
      createMeal({
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
      }).catch(err => {
        console.error('Background save failed:', err);
        // Optional: show a notification if it fails
      });

      // Navigate back immediately for a snappy feel
      navigationHook.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la comida. Por favor intenta nuevamente.');
    }
  };

  const handleNowPress = () => {
    (navigationHook as any).navigate('MealTime', { 
      mealName: mealName, 
      mealType: selectedType 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigationHook.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
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
                  color={selectedType === type.value ? colors.text.primary : colors.text.muted} 
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
                <Ionicons name="camera" size={24} color={colors.status.error} />
              </View>
              <Text style={styles.actionTitle}>Cámara</Text>
              <Text style={styles.actionSubtitle}>Toma una foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleGalleryPress}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="images" size={24} color={colors.status.info} />
              </View>
              <Text style={styles.actionTitle}>Galería</Text>
              <Text style={styles.actionSubtitle}>Elige una imagen</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleVoicePress}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="mic" size={24} color={colors.status.success} />
              </View>
              <Text style={styles.actionTitle}>Voz</Text>
              <Text style={styles.actionSubtitle}>Describe con voz</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleBarcodePress}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="barcode" size={24} color={colors.status.warning} />
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
              placeholderTextColor={colors.text.muted}
            />
            
            <TouchableOpacity 
              style={[styles.saveButton, !mealName.trim() && styles.saveButtonDisabled]}
              onPress={handleManualSave}
              disabled={!mealName.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
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
              <Ionicons name="time" size={16} color={colors.primary.amber} />
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
        primaryColor={colors.primary.amber}
      />

      {/* Loading Overlay */}
      {analyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary.amber} />
          <Text style={styles.loadingText}>
            Analizando imagen...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    color: colors.text.primary,
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
    color: colors.text.primary,
    marginBottom: SPACING.md,
    fontFamily: FONTS.primary,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.muted,
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
    borderColor: colors.background.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: colors.background.card,
  },
  mealTypeButtonSelected: {
    backgroundColor: colors.primary.amber,
    borderColor: colors.primary.amber,
  },
  mealTypeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.muted,
    marginLeft: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  mealTypeTextSelected: {
    color: colors.background.primary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionButton: {
    width: '47%',
    backgroundColor: colors.background.card,
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
    color: colors.text.primary,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  actionSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: colors.text.muted,
    textAlign: 'center',
    fontFamily: FONTS.primary,
  },
  manualEntry: {
    backgroundColor: colors.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.background.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.base,
    color: colors.text.primary,
    backgroundColor: colors.background.tertiary,
    marginBottom: SPACING.md,
    fontFamily: FONTS.primary,
  },
  saveButton: {
    backgroundColor: colors.primary.amber,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.interactive.disabled,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: colors.background.primary,
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
    borderColor: colors.primary.amber,
  },
  timeBadgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: colors.primary.amber,
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
    color: colors.text.primary,
    fontWeight: FONTS.weights.semibold,
    fontFamily: FONTS.primary,
  },
});

export default MealLoggerScreen;
