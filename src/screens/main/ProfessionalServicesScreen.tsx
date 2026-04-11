import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { 
  useNutritionists, 
  useInstitutions, 
  useUserNutritionGuidelines,
  useCreateNutritionGuideline 
} from '@/hooks/useNutritionists';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';

const SPECIALTIES = [
  'Nutrición Deportiva',
  'Nutrición Clínica',
  'Nutrición Vegetariana/Vegana',
  'Nutrición Pediátrica',
  'Nutrición Geriátrica',
  'Nutrición Funcional',
  'Nutrición Hormonal',
  'Nutrición para Pérdida de Peso',
];

const INSTITUTIONS = [
  {
    id: 'hospital_clinica',
    name: 'Clínica Salud Total',
    type: 'hospital',
    logo: '🏥',
    description: 'Equipo multidisciplinario de salud',
  },
  {
    id: 'universidad_nutricion',
    name: 'Universidad de Nutrición',
    type: 'university',
    logo: '🎓',
    description: 'Centro de investigación y formación',
  },
  {
    id: 'centro_bienestar',
    name: 'Centro de Bienestar Integral',
    type: 'wellness',
    logo: '🌿',
    description: 'Medicina alternativa y wellness',
  },
];

export default function ProfessionalServicesScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const { profile } = useProfile();
  const { data: nutritionists, isLoading: nutritionistsLoading } = useNutritionists();
  const { data: institutions, isLoading: institutionsLoading } = useInstitutions();
  const { data: guidelines, isLoading: guidelinesLoading } = useUserNutritionGuidelines(profile?.id || '');
  const { mutate: createGuideline } = useCreateNutritionGuideline();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showGuidelineForm, setShowGuidelineForm] = useState(false);
  const [guidelineData, setGuidelineData] = useState({
    name: '',
    allergies: [] as string[],
    pathologies: [] as string[],
    food_aversions: [] as string[],
    notes: '',
  });

  const isLoading = nutritionistsLoading || institutionsLoading || guidelinesLoading;

  const filteredNutritionists = nutritionists?.filter((nutritionist: any) => {
    const matchesSearch = !searchQuery || 
      nutritionist.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nutritionist.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nutritionist.specialties?.some((spec: string) => 
        spec.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesSpecialty = !selectedSpecialty || 
      nutritionist.specialties?.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  const handleConnectNutritionist = async (nutritionistId: string) => {
    try {
      // Aquí iría la lógica para conectar con un nutricionista
      Alert.alert(
        'Conectar con Nutricionista',
        '¿Deseas solicitar una consulta con este profesional?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Solicitar', 
            onPress: () => {
              console.log('Solicitando consulta con:', nutritionistId);
              // Navegar a pantalla de consulta
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    }
  };

  const handleCreateGuideline = async () => {
    try {
      if (!guidelineData.name) {
        Alert.alert('Error', 'Debes ingresar un nombre para el plan');
        return;
      }

      await createGuideline(guidelineData);
      setShowGuidelineForm(false);
      setGuidelineData({
        name: '',
        allergies: [],
        pathologies: [],
        food_aversions: [],
        notes: '',
      });
      
      Alert.alert('Éxito', 'Plan nutricional creado exitosamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el plan nutricional');
    }
  };

  const handleJoinInstitution = async (institutionId: string) => {
    try {
      Alert.alert(
        'Unirse a Institución',
        '¿Deseas unirte a esta institución?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Unirse', 
            onPress: () => {
              console.log('Uniéndose a institución:', institutionId);
              // Lógica para unirse a institución
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Servicios Profesionales</Text>
        <Text style={styles.subtitle}>Conecta con expertos y planes personalizados</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar nutricionistas..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.text.secondary}
            />
          </View>
          
          <ScrollView 
            horizontal 
            style={styles.specialtiesContainer}
            showsHorizontalScrollIndicator={false}
          >
            <TouchableOpacity 
              style={[
                styles.specialtyChip,
                !selectedSpecialty && styles.specialtyChipActive
              ]}
              onPress={() => setSelectedSpecialty('')}
            >
              <Text style={styles.specialtyText}>Todos</Text>
            </TouchableOpacity>
            
            {SPECIALTIES.map(specialty => (
              <TouchableOpacity
                key={specialty}
                style={[
                  styles.specialtyChip,
                  selectedSpecialty === specialty && styles.specialtyChipActive
                ]}
                onPress={() => setSelectedSpecialty(specialty)}
              >
                <Text style={styles.specialtyText}>{specialty}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nutritionists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nutricionistas Disponibles</Text>
            <TouchableOpacity 
              style={styles.createGuidelineBtn}
              onPress={() => setShowGuidelineForm(true)}
            >
              <Ionicons name="add-outline" size={16} color={colors.text.primary} />
              <Text style={styles.createGuidelineText}>Crear Plan</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando nutricionistas...</Text>
            </View>
          ) : filteredNutritionists && filteredNutritionists.length > 0 ? (
            filteredNutritionists.map((nutritionist: any) => (
              <View key={nutritionist.id} style={styles.nutritionistCard}>
                <View style={styles.nutritionistHeader}>
                  <View style={styles.nutritionistInfo}>
                    {nutritionist.profile_image_url ? (
                      <Image 
                        source={{ uri: nutritionist.profile_image_url }} 
                        style={styles.nutritionistAvatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person-outline" size={24} color={colors.text.secondary} />
                      </View>
                    )}
                    
                    <View style={styles.nutritionistDetails}>
                      <Text style={styles.nutritionistName}>
                        {nutritionist.first_name} {nutritionist.last_name}
                      </Text>
                      <Text style={styles.nutritionistTitle}>
                        {nutritionist.specialties?.join(', ') || 'Nutricionista'}
                      </Text>
                      {nutritionist.institutions && (
                        <Text style={styles.nutritionistInstitution}>
                          {nutritionist.institutions.name}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.connectBtn}
                    onPress={() => handleConnectNutritionist(nutritionist.id)}
                  >
                    <Text style={styles.connectBtnText}>Conectar</Text>
                  </TouchableOpacity>
                </View>
                
                {nutritionist.long_description && (
                  <Text style={styles.nutritionistDescription}>
                    {nutritionist.long_description}
                  </Text>
                )}
                
                <View style={styles.nutritionistStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="star-outline" size={16} color={colors.primary.amber} />
                    <Text style={styles.statText}>
                      {Math.floor(Math.random() * 50) + 150} consultas
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={16} color={colors.primary.sky} />
                    <Text style={styles.statText}>
                      {Math.floor(Math.random() * 30) + 20} pacientes
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                    <Text style={styles.statText}>
                      {Math.floor(Math.random() * 5) + 1} años exp.
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.text.muted} />
              <Text style={styles.emptyText}>No se encontraron nutricionistas</Text>
              <Text style={styles.emptySub}>Intenta ajustar los filtros de búsqueda</Text>
            </View>
          )}
        </View>

        {/* My Guidelines */}
        {guidelines && guidelines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis Planes Nutricionales</Text>
            
            {guidelines.map((guideline: any) => (
              <TouchableOpacity
                key={guideline.id}
                style={styles.guidelineCard}
                onPress={() => navigation.navigate('NutritionGuideline', { id: guideline.id })}
              >
                <View style={styles.guidelineHeader}>
                  <Text style={styles.guidelineName}>{guideline.name}</Text>
                  <Text style={styles.guidelineStatus}>{guideline.status}</Text>
                </View>
                
                {guideline.allergies && guideline.allergies.length > 0 && (
                  <View style={styles.guidelineSection}>
                    <Text style={styles.guidelineSectionTitle}>Alergias:</Text>
                    <Text style={styles.guidelineSectionContent}>
                      {guideline.allergies.join(', ')}
                    </Text>
                  </View>
                )}
                
                {guideline.pathologies && guideline.pathologies.length > 0 && (
                  <View style={styles.guidelineSection}>
                    <Text style={styles.guidelineSectionTitle}>Patologías:</Text>
                    <Text style={styles.guidelineSectionContent}>
                      {guideline.pathologies.join(', ')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Guideline Modal */}
      {showGuidelineForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Plan Nutricional</Text>
              <TouchableOpacity onPress={() => setShowGuidelineForm(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nombre del plan</Text>
                <TextInput
                  style={styles.formInput}
                  value={guidelineData.name}
                  onChangeText={(text) => setGuidelineData(prev => ({ ...prev, name: text }))}
                  placeholder="Ej: Plan de pérdida de peso"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Alergias (separadas por comas)</Text>
                <TextInput
                  style={styles.formInput}
                  value={guidelineData.allergies.join(', ')}
                  onChangeText={(text) => setGuidelineData(prev => ({ 
                    ...prev, 
                    allergies: text.split(',').map(a => a.trim()).filter(a => a)
                  }))}
                  placeholder="Ej: Lactosa, gluten, maní"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Patologías (separadas por comas)</Text>
                <TextInput
                  style={styles.formInput}
                  value={guidelineData.pathologies.join(', ')}
                  onChangeText={(text) => setGuidelineData(prev => ({ 
                    ...prev, 
                    pathologies: text.split(',').map(p => p.trim()).filter(p => p)
                  }))}
                  placeholder="Ej: Diabetes, hipertensión"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Aversiones alimentarias (separadas por comas)</Text>
                <TextInput
                  style={styles.formInput}
                  value={guidelineData.food_aversions.join(', ')}
                  onChangeText={(text) => setGuidelineData(prev => ({ 
                    ...prev, 
                    food_aversions: text.split(',').map(f => f.trim()).filter(f => f)
                  }))}
                  placeholder="Ej: Cilantro, brócoli, pescado"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notas adicionales</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={guidelineData.notes}
                  onChangeText={(text) => setGuidelineData(prev => ({ ...prev, notes: text }))}
                  placeholder="Instrucciones especiales, preferencias, etc."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowGuidelineForm(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleCreateGuideline}
              >
                <Text style={styles.modalBtnConfirmText}>Crear Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: colors.text.secondary,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  searchSection: {
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: colors.text.primary,
    marginLeft: SPACING.sm,
  },
  specialtiesContainer: {
    flexDirection: 'row',
  },
  specialtyChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  specialtyChipActive: {
    backgroundColor: colors.primary.amber,
  },
  specialtyText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
  },
  createGuidelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.amber,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  createGuidelineText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: colors.background.primary,
    marginLeft: SPACING.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: colors.text.secondary,
  },
  nutritionistCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  nutritionistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  nutritionistInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  nutritionistAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  nutritionistDetails: {
    flex: 1,
  },
  nutritionistName: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.primary,
  },
  nutritionistTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    marginTop: SPACING.xs,
  },
  nutritionistInstitution: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: colors.primary.sky,
    marginTop: SPACING.xs,
  },
  connectBtn: {
    backgroundColor: colors.primary.amber,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  connectBtnText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: colors.background.primary,
  },
  nutritionistDescription: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  nutritionistStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xs,
    color: colors.text.secondary,
    marginLeft: SPACING.xs,
  },
  institutionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  institutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  institutionLogo: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  institutionInfo: {
    flex: 1,
  },
  institutionName: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.primary,
  },
  institutionType: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    marginTop: SPACING.xs,
  },
  institutionDescription: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
  },
  guidelineCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  guidelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  guidelineName: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.primary,
  },
  guidelineStatus: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: colors.primary.sky,
    backgroundColor: colors.primary.sky + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  guidelineSection: {
    marginBottom: SPACING.sm,
  },
  guidelineSectionTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.primary,
    marginBottom: SPACING.xs,
  },
  guidelineSectionContent: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    margin: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.border,
  },
  modalTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.primary,
    marginBottom: SPACING.sm,
  },
  formInput: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.background.border,
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background.border,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.background.tertiary,
    marginRight: SPACING.sm,
  },
  modalBtnConfirm: {
    backgroundColor: colors.primary.amber,
    marginLeft: SPACING.sm,
  },
  modalBtnCancelText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.secondary,
  },
  modalBtnConfirmText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: colors.background.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg * 2,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySub: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.muted,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
});
