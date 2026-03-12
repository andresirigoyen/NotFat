import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Switch, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, LogOut, Trash2, User, Gauge, 
  Activity, Watch, Utensils, Droplets, Settings, Bell, ShieldAlert, Share2, Star,
  Heart, Flame, Drumstick, Wheat, Droplet, Pencil, Eye, Ghost, Info
} from 'lucide-react-native';
import { useProfile } from '@/hooks/useProfile';

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
      setModalCalories(String(nutritionGoals.calories || 0));
      setModalProtein(String(nutritionGoals.protein || 0));
      setModalCarbs(String(nutritionGoals.carbs || 0));
      setModalFat(String(nutritionGoals.fat || 0));
      setIsManualNutrition(nutritionGoals.source === 'manual');
    }
    if (hydrationGoals) {
      setModalHydrationTarget(String(hydrationGoals.target || 0));
    }
  }, [nutritionGoals, hydrationGoals]);

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
        <ActivityIndicator size="large" color="#7c2d12" />
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
              <ChevronLeft size={28} color="#7c2d12" />
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
              trackColor={{ false: '#e2e8f0', true: '#7c2d12' }}
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
              style={styles.outlineBtnCenter} 
              onPress={async () => {
                await generateAutomaticGoals();
                setShowNutritionalModal(false);
                Alert.alert('Éxito', 'Objetivos calculados automáticamente.');
              }}
            >
              <Text style={styles.outlineBtnText}>Generar con AI (Harris-Benedict)</Text>
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
              <ChevronLeft size={28} color="#7c2d12" />
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

        {/* User Header */}
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
            <User size={18} color="#7c2d12" />
            <Text style={styles.editBtnText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Accordion Menu */}
        <View style={styles.menuContainer}>
          
          {/* Métricas Corporales */}
          <View style={styles.accordionItem}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('metrics')}>
              <View style={styles.menuIconBox}><Gauge size={22} color="#7c2d12" /></View>
              <Text style={styles.menuLabel}>Métricas Corporales</Text>
              <View style={styles.menuInfo}>
                <Text style={styles.menuValueText}>
                  {profile?.weight_value} {profile?.weight_unit} • {profile?.height_value} {profile?.height_unit}
                </Text>
              </View>
              <ChevronDown size={22} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          {/* Salud */}
          <View style={styles.accordionItem}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('health')}>
              <View style={styles.menuIconBox}><Watch size={22} color="#7c2d12" /></View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Salud</Text>
                <Text style={styles.menuValueText}>No conectado</Text>
              </View>
              {expandedSection === 'health' ? <ChevronUp size={22} color="#cbd5e1" /> : <ChevronDown size={22} color="#cbd5e1" />}
            </TouchableOpacity>
            {expandedSection === 'health' && (
              <View style={styles.expandedContent}>
                <View style={styles.healthConnectCard}>
                  <Heart size={40} color="#cbd5e1" />
                  <Text style={styles.healthConnectText}>
                    Conecta Apple Health para ajustar tus metas nutricionales según tu actividad real
                  </Text>
                  <TouchableOpacity style={styles.connectBtn}>
                    <Text style={styles.connectBtnText}>Conectar Apple Health</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Objetivos Nutricionales */}
          <View style={styles.accordionItem}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('nutrition')}>
              <View style={styles.menuIconBox}><Utensils size={22} color="#7c2d12" /></View>
              <Text style={styles.menuLabel}>Objetivos Nutricionales</Text>
              <TouchableOpacity onPress={() => setShowNutritionalModal(true)} style={{ marginRight: 12 }}>
                <Pencil size={20} color="#7c2d12" />
              </TouchableOpacity>
              {expandedSection === 'nutrition' ? <ChevronUp size={22} color="#cbd5e1" /> : <ChevronDown size={22} color="#cbd5e1" />}
            </TouchableOpacity>
            {expandedSection === 'nutrition' && (
              <View style={styles.expandedContent}>
                <View style={styles.macroSettingsList}>
                   <View style={styles.macroSettingItem}>
                      <View style={[styles.miniIconBox, { backgroundColor: '#7c2d12' }]}><Watch size={14} color="#ffffff" /></View>
                      <Text style={styles.macroSettingLabel}>Mostrar calorías en Dashboard</Text>
                      <Switch 
                        value={profile?.show_calories} 
                        onValueChange={toggleShowCalories}
                        trackColor={{ false: '#e2e8f0', true: '#7c2d12' }}
                      />
                   </View>
                   {[
                     { icon: <Flame color="#f59e0b" size={18} fill="#f59e0b" />, label: 'Calorías', value: `${nutritionGoals?.calories || 0} kcal` },
                     { icon: <Drumstick color="#ef4444" size={18} />, label: 'Proteínas', value: `${nutritionGoals?.protein || 0}g` },
                     { icon: <Wheat color="#f59e0b" size={18} />, label: 'Carbos', value: `${nutritionGoals?.carbs || 0}g` },
                     { icon: <Droplet color="#3b82f6" size={18} />, label: 'Grasas', value: `${nutritionGoals?.fat || 0}g` },
                   ].map((item, idx) => (
                     <View key={idx} style={styles.macroSettingItem}>
                        <View style={styles.macroItemLeft}>
                          {item.icon}
                          <View style={{ marginLeft: 16 }}>
                            <Text style={styles.macroLabelText}>{item.label}</Text>
                            <Text style={styles.macroValueText}>{item.value}</Text>
                          </View>
                        </View>
                     </View>
                   ))}
                </View>
              </View>
            )}
          </View>

          {/* Objetivos Científicos */}
          <TouchableOpacity style={styles.accordionItem} onPress={() => navigation.navigate('ScientificGoalsScreen')}>
            <View style={styles.menuIconBox}>
              <Activity size={22} color="#7c2d12" />
            </View>
            <Text style={styles.menuLabel}>Objetivos Científicos</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuValueText}>
                {nutritionGoals?.source === 'algorithm' ? 'Basado en ciencia' : 'Manual'}
              </Text>
            </View>
            <ChevronRight size={22} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Hidratación */}
          <View style={styles.accordionItem}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('hydration')}>
              <View style={styles.menuIconBox}><Droplets size={22} color="#7c2d12" /></View>
              <Text style={styles.menuLabel}>Hidratación</Text>
              {expandedSection === 'hydration' ? <ChevronUp size={22} color="#cbd5e1" /> : <ChevronDown size={22} color="#cbd5e1" />}
            </TouchableOpacity>
            {expandedSection === 'hydration' && (
              <View style={styles.expandedContent}>
                <View style={styles.subMenuList}>
                   <View style={styles.macroSettingItem}>
                      <View style={[styles.miniIconBox, { backgroundColor: '#7c2d12' }]}><Droplets size={14} color="#ffffff" /></View>
                      <Text style={styles.macroSettingLabel}>Mostrar hidratación</Text>
                      <Switch 
                        value={profile?.show_hydration} 
                        onValueChange={toggleShowHydration}
                        trackColor={{ false: '#e2e8f0', true: '#7c2d12' }}
                      />
                   </View>
                  <TouchableOpacity style={styles.subMenuItem} onPress={() => setShowHydrationModal(true)}>
                    <View style={[styles.subIconBox, { backgroundColor: '#e0f2fe' }]}><Droplet size={18} color="#3b82f6" /></View>
                    <View style={styles.subMenuInfo}>
                      <Text style={styles.subMenuLabel}>Objetivo de hidratación</Text>
                      <Text style={styles.subMenuValue}>
                        {hydrationGoals ? `${hydrationGoals.target} ${hydrationGoals.target_unit}` : 'No configurado'}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#cbd5e1" />
                  </TouchableOpacity>
                  <View style={styles.subMenuItem}>
                    <View style={[styles.subIconBox, { backgroundColor: '#f0fdf4' }]}><Ghost size={18} color="#22c55e" /></View>
                    <View style={styles.subMenuInfo}>
                      <Text style={styles.subMenuLabel}>Tamaño de botella preferida</Text>
                      <Text style={styles.subMenuValue}>{profile?.preferred_bottle_size} ml</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.accordionHeader} onPress={() => navigation.navigate('Subscription')}>
            <View style={styles.menuIconBox}><Star size={22} color="#7c2d12" /></View>
            <Text style={styles.menuLabel}>Mi Suscripción</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuValueText}>{profile?.subscription_status === 'premium' ? 'Premium' : 'Gratis'}</Text>
            </View>
            <ChevronRight size={22} color="#cbd5e1" />
          </TouchableOpacity>

        </View>

        {/* Footer Buttons */}
        <View style={{ marginTop: 24 }}>
          <TouchableOpacity style={styles.logoutBtn}>
            <LogOut size={22} color="#ffffff" />
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
    backgroundColor: '#FAF3ED',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#334155',
    marginBottom: 32,
  },
  userHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7c2d12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '900',
  },
  userName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 20,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#7c2d12',
  },
  editBtnText: {
    color: '#7c2d12',
    fontSize: 18,
    fontWeight: '800',
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 16,
  },
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  menuIconBox: {
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  menuInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  menuValueText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  healthConnectCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  healthConnectText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: 20,
    lineHeight: 22,
  },
  connectBtn: {
    backgroundColor: '#7c2d12',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  macroSettingsList: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 12,
  },
  macroSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  macroItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroLabelText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  macroValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },
  miniIconBox: {
    padding: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  macroSettingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  subMenuList: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 8,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  subMenuValue: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f43f5e',
    borderRadius: 32,
    paddingVertical: 20,
    gap: 12,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#334155',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  toggleSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  inputStack: {
    gap: 12,
  },
  inputWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
  },
  inputLabelSmall: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '800',
    marginBottom: 4,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    flex: 1,
    padding: 0,
  },
  unitText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#7c2d12',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#7c2d12',
    fontWeight: '800',
    fontSize: 16,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: '#7c2d12',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  outlineBtnCenter: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#7c2d12',
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#7c2d12',
    fontWeight: '800',
    fontSize: 16,
  }
});

export default ProfileScreen;
