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

const MealLoggerScreen = ({ navigation }: any) => {
  const navigationHook = useNavigation();
  const [mealName, setMealName] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('breakfast');
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
          mealType: selectedType
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
          mealType: selectedType
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Por favor intenta nuevamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleVoicePress = async () => {
    const hasPermission = await requestMicrophoneAccess();
    if (hasPermission) {
      // Navigate to voice input screen
      (navigationHook as any).navigate('VoiceInputScreen', { 
        mealType: selectedType 
      });
    }
  };

  const handleManualSave = async () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la comida');
      return;
    }

    try {
      await createMeal({
        meal: {
          name: mealName,
          meal_type: selectedType as any,
          source_type: 'text',
          status: 'complete',
          meal_at: new Date().toISOString(),
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
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          barcode_number: null,
          scanned: false,
          servings: 1,
          contributed: false,
          nutriscore_grade: null,
          nova_group: null,
          nutria_score: null,
          labels_tags: null,
          additives_tags: null,
          nutria_score_breakdown: null,
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
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
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
                  color={selectedType === type.value ? '#FFFFFF' : '#6B7280'} 
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
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="camera" size={24} color="#EF4444" />
              </View>
              <Text style={styles.actionTitle}>Cámara</Text>
              <Text style={styles.actionSubtitle}>Toma una foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleGalleryPress}>
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="images" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.actionTitle}>Galería</Text>
              <Text style={styles.actionSubtitle}>Elige una imagen</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleVoicePress}>
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="mic" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionTitle}>Voz</Text>
              <Text style={styles.actionSubtitle}>Describe con voz</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => (navigationHook as any).navigate('BarcodeScannerScreen')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FED7AA' }]}>
                <Ionicons name="barcode" size={24} color="#F59E0B" />
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
              placeholderTextColor="#9CA3AF"
            />
            
            <TouchableOpacity 
              style={[styles.saveButton, !mealName.trim() && styles.saveButtonDisabled]}
              onPress={handleManualSave}
              disabled={!mealName.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
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
              <Ionicons name="time" size={16} color="#7c2d12" />
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
        primaryColor="#10B981"
      />

      {/* Loading Overlay */}
      {(analyzing || saving) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
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
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  mealTypes: {
    flexDirection: 'row',
    gap: 12,
  },
  mealTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  mealTypeButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  mealTypeTextSelected: {
    color: '#FFFFFF',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionButton: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  manualEntry: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  timeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c2d12',
    marginRight: 4,
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
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default MealLoggerScreen;
