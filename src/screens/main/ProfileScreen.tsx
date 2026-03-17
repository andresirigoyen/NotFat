import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Switch, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, LogOut, Trash2, User, Gauge, 
  Activity, Watch, Utensils, Droplets, Settings, Bell, ShieldAlert, Share2, Star,
  Heart, Flame, Drumstick, Wheat, Droplet, Pencil, Eye, Ghost, Info
} from 'lucide-react-native';
import { useProfile } from '@/hooks/useProfile';
import { useHealthSettings } from '@/hooks/useHealthSettings';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }: any) => {
  const { 
    profile, 
    isLoading,
    nutritionGoals,
    hydrationGoals,
    updateProfile,
    updateNutritionGoals,
    updateHydrationGoals,
    generateAutomaticGoals,
    generateAutomaticHydrationGoal
  } = useProfile();
  
  const { healthSettings } = useHealthSettings();

  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);
  const [showNutritionalModal, setShowNutritionalModal] = React.useState(false);
  const [showHydrationModal, setShowHydrationModal] = React.useState(false);
  
  // Nutrition Modal State
  const [modalCalories, setModalCalories] = React.useState('0');
  const [modalProtein, setModalProtein] = React.useState('0');
  const [modalCarbs, setModalCarbs] = React.useState('0');
  const [modalFat, setModalFat] = React.useState('0');
  const [isManualNutrition, setIsManualNutrition] = React.useState(true);

  // Hydration Modal State
  const [modalHydrationTarget, setModalHydrationTarget] = React.useState('0');

  React.useEffect(() => {
    if (nutritionGoals) {
      setModalCalories(nutritionGoals.calories?.toString() || '2000');
      setModalProtein(nutritionGoals.protein?.toString() || '150');
      setModalCarbs(nutritionGoals.carbs?.toString() || '250');
      setModalFat(nutritionGoals.fat?.toString() || '65');
    }
  }, [nutritionGoals]);

  React.useEffect(() => {
    if (hydrationGoals) {
      setModalHydrationTarget(hydrationGoals.target?.toString() || '2000');
    }
  }, [hydrationGoals]);

  const toggleSection = (name: string) => {
    setExpandedSection(expandedSection === name ? null : name);
  };

  const handleSaveNutrition = async () => {
    try {
      await updateNutritionGoals.mutateAsync({
        calories: parseInt(modalCalories),
        protein: parseInt(modalProtein),
        carbs: parseInt(modalCarbs),
        fat: parseInt(modalFat),
        source: isManualNutrition ? 'manual' : 'algorithm',
      });
      setShowNutritionalModal(false);
      Alert.alert('Éxito', 'Objetivos nutricionales actualizados.');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los objetivos.');
    }
  };

  const handleSaveHydration = async () => {
    try {
      await updateHydrationGoals.mutateAsync({
        target: parseInt(modalHydrationTarget),
        target_unit: 'ml',
      });
      setShowHydrationModal(false);
      Alert.alert('Éxito', 'Objetivo de hidratación actualizado.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el objetivo.');
    }
  };

  const toggleShowCalories = (value: boolean) => {
    updateProfile.mutate({ show_calories: value });
  };

  const toggleShowHydration = (value: boolean) => {
    updateProfile.mutate({ show_hydration: value });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary.amber} />
      </View>
    );
  }

  // --- Modals Render Helpers ---

  const renderNutritionalModal = () => (
    <Modal visible={showNutritionalModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNutritionalModal(false)}>
              <ChevronLeft size={28} color={COLORS.primary.amber} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Objetivos nutricionales</Text>
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Editar manualmente</Text>
              <Text style={styles.toggleSub}>O usar cálculo automático</Text>
            </View>
            <Switch 
              value={isManualNutrition} 
              onValueChange={setIsManualNutrition} 
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: COLORS.primary.amber }}
            />
          </View>

          <View style={styles.inputStack}>
            {[
              { label: 'Calorías', value: modalCalories, setter: setModalCalories, unit: 'kcal' },
              { label: 'Proteínas', value: modalProtein, setter: setModalProtein, unit: 'g' },
              { label: 'Carbos', value: modalCarbs, setter: setModalCarbs, unit: 'g' },
              { label: 'Grasas', value: modalFat, setter: setModalFat, unit: 'g' },
            ].map((item, idx) => (
              <View key={idx} style={styles.inputWrapper}>
                <Text style={styles.inputLabelSmall}>{item.label}</Text>
                <View style={styles.inputInner}>
                  <TextInput 
                    style={styles.textInput} 
                    value={item.value} 
                    onChangeText={item.setter}
                    keyboardType="numeric" 
                  />
                  <Text style={styles.unitText}>{item.unit}</Text>
                </View>
              </View>
            ))}
          </View>

          {!isManualNutrition && (
            <TouchableOpacity 
              style={[styles.outlineBtnCenter, updateNutritionGoals.isPending && styles.outlineBtnDisabled]} 
              onPress={async () => {
                try {
                  console.log('🧠 Generating automatic goals with NotFat IA...');
                  const result = await generateAutomaticGoals();
                  console.log('🧠 AI Result:', result);
                  setShowNutritionalModal(false);
                  
                  // Mostrar mensaje más detallado si hay explicación
                  if (result && typeof result === 'object' && 'explanation' in result) {
                    Alert.alert(
                      '✅ ¡Objetivos generados con NotFat IA!', 
                      `${result.explanation || 'Objetivos calculados automáticamente con inteligencia artificial.'}`
                    );
                  } else {
                    Alert.alert('✅ Éxito', 'Objetivos calculados automáticamente con NotFat IA.');
                  }
                } catch (error) {
                  console.error('❌ Error generating automatic goals:', error);
                  Alert.alert('❌ Error', 'No se pudieron generar los objetivos automáticos. Por favor intenta manualmente.');
                }
              }}
              disabled={updateNutritionGoals.isPending}
            >
              {updateNutritionGoals.isPending ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={COLORS.primary.amber} />
                  <Text style={styles.outlineBtnText}>Generando...</Text>
                </View>
              ) : (
                <Text style={styles.outlineBtnText}>Generar con NotFat IA</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNutritionalModal(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleSaveNutrition}
              disabled={updateNutritionGoals.isPending}
            >
              <Text style={styles.saveBtnText}>
                {updateNutritionGoals.isPending ? '...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHydrationModal = () => (
    <Modal visible={showHydrationModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHydrationModal(false)}>
              <ChevronLeft size={28} color={COLORS.primary.amber} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Objetivo de hidratación</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabelSmall}>Objetivo diario</Text>
            <View style={styles.inputInner}>
              <TextInput 
                style={[styles.textInput, { fontSize: 22 }]} 
                value={modalHydrationTarget} 
                onChangeText={setModalHydrationTarget}
                keyboardType="numeric" 
              />
              <Text style={styles.unitText}>ml</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.outlineBtnCenter} 
            onPress={async () => {
              await generateAutomaticHydrationGoal();
              setShowHydrationModal(false);
              Alert.alert('Éxito', 'Objetivo de agua calculado automáticamente.');
            }}
          >
            <Text style={styles.outlineBtnText}>Generar automático (35ml/kg)</Text>
          </TouchableOpacity>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowHydrationModal(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleSaveHydration}
              disabled={updateHydrationGoals.isPending}
            >
              <Text style={styles.saveBtnText}>
                {updateHydrationGoals.isPending ? '...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Ajustes</Text>

        {/* User Header Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.userHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {profile?.first_name?.charAt(0) || ''}{profile?.last_name?.charAt(0) || ''}
              </Text>
            </View>
            <Text style={styles.userName}>{profile?.first_name} {profile?.last_name}</Text>
            <Text style={styles.userEmail}>{profile?.email}</Text>
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <User size={18} color={COLORS.primary.amber} />
              <Text style={styles.editBtnText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid Layout for Sections */}
        <View style={styles.gridContainer}>
          {/* First Row */}
          <View style={styles.gridRow}>
            {/* Métricas Corporales */}
            <View style={styles.gridItem}>
              <TouchableOpacity style={styles.gridItemContent} onPress={() => navigation.navigate('Progress')}>
                <View style={styles.gridIcon}><Gauge size={24} color={COLORS.primary.amber} /></View>
                <Text style={styles.gridTitle}>Métricas</Text>
                <Text style={styles.gridValue}>
                  {profile?.weight_value} {profile?.weight_unit}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Salud */}
            <View style={styles.gridItem}>
              <TouchableOpacity style={styles.gridItemContent} onPress={() => navigation.navigate('HealthIntegration')}>
                <View style={styles.gridIcon}><Watch size={24} color={COLORS.primary.amber} /></View>
                <Text style={styles.gridTitle}>Salud</Text>
                <Text style={styles.gridValue}>
                  {healthSettings?.health_platform ? 'Conectado' : 'Conectar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Second Row */}
          <View style={styles.gridRow}>
            {/* Objetivos Nutricionales */}
            <View style={styles.gridItem}>
              <TouchableOpacity style={styles.gridItemContent} onPress={() => setShowNutritionalModal(true)}>
                <View style={styles.gridIcon}><Utensils size={24} color={COLORS.primary.amber} /></View>
                <Text style={styles.gridTitle}>Nutrición</Text>
                <Text style={styles.gridValue}>
                  {nutritionGoals?.calories || 0} kcal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Objetivos Científicos */}
            <View style={styles.gridItem}>
              <TouchableOpacity style={styles.gridItemContent} onPress={() => navigation.navigate('ScientificGoals')}>
                <View style={styles.gridIcon}><Activity size={24} color={COLORS.primary.amber} /></View>
                <Text style={styles.gridTitle}>Ciencia</Text>
                <Text style={styles.gridValue}>
                  {nutritionGoals?.source === 'algorithm' ? 'Auto' : 'Manual'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Third Row */}
          <View style={styles.gridRow}>
            {/* Hidratación */}
            <View style={styles.gridItem}>
              <TouchableOpacity style={styles.gridItemContent} onPress={() => setShowHydrationModal(true)}>
                <View style={styles.gridIcon}><Droplets size={24} color={COLORS.primary.amber} /></View>
                <Text style={styles.gridTitle}>Hidratación</Text>
                <Text style={styles.gridValue}>
                  {hydrationGoals?.target || 0} ml
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mi Suscripción */}
            <View style={styles.gridItem}>
              <TouchableOpacity style={styles.gridItemContent} onPress={() => navigation.navigate('SubscriptionCenter')}>
                <View style={styles.gridIcon}><Star size={24} color={COLORS.primary.amber} /></View>
                <Text style={styles.gridTitle}>Suscripción</Text>
                <Text style={styles.gridValue}>
                  {profile?.subscription_status === 'premium' ? 'Premium' : 'Gratis'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fourth Row */}
          <View style={styles.gridRow}>
            {/* Preferencias */}
            <View style={styles.gridItem}>
              <TouchableOpacity style={styles.gridItemContent} onPress={() => navigation.navigate('Preferences')}>
                <View style={styles.gridIcon}><Settings size={24} color={COLORS.primary.amber} /></View>
                <Text style={styles.gridTitle}>Preferencias</Text>
                <Text style={styles.gridValue}>
                  Ajustes
                </Text>
              </TouchableOpacity>
            </View>

            {/* Estadísticas */}
            <View style={styles.gridItem}>
              <TouchableOpacity style={styles.gridItemContent} onPress={() => navigation.navigate('Stats')}>
                <View style={styles.gridIcon}><Activity size={24} color={COLORS.primary.amber} /></View>
                <Text style={styles.gridTitle}>Estadísticas</Text>
                <Text style={styles.gridValue}>
                  Ver datos
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cerrar Sesión Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.logoutBtn}>
            <LogOut size={22} color={COLORS.status.error} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {renderNutritionalModal()}
      {renderHydrationModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xl,
    fontFamily: FONTS.primary,
  },
  userHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  sectionContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gridContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gridItem: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  gridItemContent: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gridIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(252,211,77,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  gridValue: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarInitials: {
    color: COLORS.background.primary,
    fontSize: 44,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.primary,
  },
  userName: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  userEmail: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weights.semibold,
    marginBottom: SPACING.lg,
    fontFamily: FONTS.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252,211,77,0.1)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary.amber,
  },
  editBtnText: {
    color: COLORS.primary.amber,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.primary,
  },
  menuContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.md,
  },
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  menuIconBox: {
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  menuInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  menuValueText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weights.semibold,
    fontFamily: FONTS.primary,
  },
  expandedContent: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  healthConnectCard: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.xl,
    alignItems: 'center',
  },
  healthConnectText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: FONTS.weights.semibold,
    marginVertical: SPACING.lg,
    lineHeight: 22,
    fontFamily: FONTS.primary,
  },
  connectBtn: {
    backgroundColor: COLORS.primary.amber,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    alignItems: 'center',
  },
  connectBtnText: {
    color: COLORS.background.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.primary,
  },
  macroSettingsList: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.sm,
  },
  macroSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  macroItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroLabelText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  macroValueText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  miniIconBox: {
    padding: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  macroSettingLabel: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  subMenuList: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.sm,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  subIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subMenuInfo: {
    flex: 1,
  },
  subMenuLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  subMenuValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weights.semibold,
    fontFamily: FONTS.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  logoutText: {
    color: COLORS.status.error,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  toggleLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  toggleSub: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weights.semibold,
    fontFamily: FONTS.primary,
  },
  inputStack: {
    gap: SPACING.sm,
  },
  inputWrapper: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  inputLabelSmall: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.primary,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    flex: 1,
    padding: 0,
    fontFamily: FONTS.primary,
  },
  unitText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS['2xl'],
    borderWidth: 1.5,
    borderColor: COLORS.primary.amber,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.primary.amber,
    fontWeight: FONTS.weights.bold,
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.primary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: COLORS.primary.amber,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.background.primary,
    fontWeight: FONTS.weights.bold,
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.primary,
  },
  outlineBtnCenter: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS['2xl'],
    borderWidth: 1.5,
    borderColor: COLORS.primary.amber,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: COLORS.primary.amber,
    fontWeight: FONTS.weights.bold,
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.primary,
  },
  outlineBtnDisabled: {
    opacity: 0.6,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});

export default ProfileScreen;
