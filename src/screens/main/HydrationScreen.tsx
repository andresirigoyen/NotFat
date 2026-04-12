import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Animated, Easing, Vibration, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useHydration } from '@/hooks/useHydration';
import { useAuthStore } from '@/store';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';

const { width } = Dimensions.get('window');

const HydrationScreen = () => {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const [selectedAmount, setSelectedAmount] = useState(250);
  const { 
    waterLogs, 
    hydrationGoal, 
    loading, 
    addWaterLog, 
    deleteWaterLog, 
    updateHydrationGoal,
    getTodayProgress,
    getWeeklyProgress 
  } = useHydration();
  
  console.log('[HydrationScreen] Current waterLogs:', waterLogs);
  console.log('[HydrationScreen] Loading state:', loading);
  
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const { consumed: todayProgress, unit: currentUnit } = getTodayProgress();
  const weeklyProgress = getWeeklyProgress();

  const quickAmounts = hydrationGoal?.unit === 'ml' 
    ? [100, 250, 500, 750, 1000]
    : [4, 8, 16, 24, 32];

  const handleAddWater = async (amount: number) => {
    try {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(15);
      }
      
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.spring(pulseAnim, { toValue: 1, friction: 4, useNativeDriver: true })
      ]).start();

      await addWaterLog(amount, (hydrationGoal?.unit as any) || 'ml');
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el agua. Inténtalo de nuevo.');
    }
  };

  const handleCustomAmount = () => {
    Alert.prompt(
      'Cantidad personalizada',
      `Ingresa la cantidad en ${hydrationGoal?.unit || 'ml'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Agregar', 
          onPress: (amount: any) => {
            if (amount && !isNaN(Number(amount))) {
              handleAddWater(Number(amount));
            }
          }
        }
      ],
      'plain-text',
      selectedAmount.toString()
    );
  };

  const handleDeleteLog = async (logId: string) => {
    Alert.alert(
      'Eliminar registro',
      '¿Estás seguro de que quieres eliminar este registro de hidratación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteWaterLog(logId) }
      ]
    );
  };

  const handleUpdateGoal = () => {
    Alert.prompt(
      'Actualizar objetivo',
      `Ingresa tu nuevo objetivo diario en ${hydrationGoal?.unit || 'ml'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Actualizar', 
          onPress: (goal: any) => {
            if (goal && !isNaN(Number(goal))) {
              updateHydrationGoal({ daily_goal: Number(goal) });
            }
          }
        }
      ],
      'plain-text',
      hydrationGoal?.daily_goal?.toString() || '2000'
    );
  };

  const getProgressPercentage = () => {
    if (!hydrationGoal?.daily_goal) return 0;
    return Math.min((todayProgress / hydrationGoal.daily_goal) * 100, 100);
  };

  const percentage = getProgressPercentage();

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 1200,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#020617'] : ['#F8FAFC', '#F1F5F9']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diario de Hidratación</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handleUpdateGoal}
          >
            <Ionicons name="options-outline" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={isDark ? [colors.primary.sky, '#075985'] : ['#3B82F6', '#2563EB']}
            style={styles.progressGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.progressTop}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Progreso de Hoy</Text>
                <View style={styles.progressValues}>
                  <Text style={styles.progressCurrent}>{todayProgress}</Text>
                  <Text style={styles.progressTotal}>/ {hydrationGoal?.daily_goal || 2000} {currentUnit}</Text>
                </View>
              </View>
              <Animated.View style={[styles.percentageBadge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
              </Animated.View>
            </View>
            
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarBase}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: '#FFFFFF'
                    }
                  ]} 
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Add Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agregar nuevo registro</Text>
          <View style={styles.quickGrid}>
            {quickAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                activeOpacity={0.8}
                style={[
                  styles.quickButton,
                  selectedAmount === amount && styles.quickButtonActive
                ]}
                onPress={() => {
                  setSelectedAmount(amount);
                  handleAddWater(amount);
                }}
              >
                <View style={[styles.waterDrop, { opacity: selectedAmount === amount ? 1 : 0.6 }]}>
                  <Ionicons name="water" size={16} color={selectedAmount === amount ? '#FFFFFF' : colors.primary.sky} />
                </View>
                <Text style={[styles.quickValue, selectedAmount === amount && styles.textWhite]}>
                  {amount}
                </Text>
                <Text style={[styles.quickUnit, selectedAmount === amount && styles.textWhiteMuted]}>
                  {currentUnit}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.customAddButton} onPress={handleCustomAmount}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
                style={styles.customGradient}
              >
                <Ionicons name="add" size={24} color={colors.primary.sky} />
                <Text style={styles.customLabel}>Más</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Registros de hoy</Text>
            {waterLogs && waterLogs.length > 0 && (
              <Text style={styles.logCount}>{waterLogs.length} tomas</Text>
            )}
          </View>
          
          {waterLogs && waterLogs.length > 0 ? (
            waterLogs.map((log: any) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logIcon}>
                  <Ionicons name="water-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.logMain}>
                  <Text style={styles.logVolume}>{log.volume} {log.unit}</Text>
                  <Text style={styles.logTime}>
                    {new Date(log.logged_at).toLocaleTimeString('es-CL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteLog(log.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={isDark ? '#EF4444' : '#F87171'} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary.sky }]}>
                <Ionicons name="water-outline" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.emptyTitle}>Sin registros aún</Text>
              <Text style={styles.emptySubtitle}>Empieza agregando un vaso de agua</Text>
            </View>
          )}
        </View>

        {/* Weekly Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vista Semanal</Text>
          <View style={styles.insightCard}>
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{weeklyProgress.total}</Text>
                <Text style={styles.insightLabel}>Total {currentUnit}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{weeklyProgress.average}</Text>
                <Text style={styles.insightLabel}>Promedio</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{weeklyProgress.days}</Text>
                <Text style={styles.insightLabel}>Días Meta</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  progressCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.md,
    marginBottom: SPACING.xl,
  },
  progressGradient: {
    padding: 24,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 4,
  },
  progressValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressCurrent: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressTotal: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 6,
    fontWeight: '500',
  },
  percentageBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  percentageText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  progressBarWrapper: {
    height: 12,
    width: '100%',
  },
  progressBarBase: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickButton: {
    width: (width - 40 - 24) / 3,
    backgroundColor: isDark ? colors.background.card : '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
    ...SHADOWS.sm,
  },
  quickButtonActive: {
    backgroundColor: colors.primary.sky,
    borderColor: colors.primary.sky,
  },
  waterDrop: {
    marginBottom: 6,
  },
  quickValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  quickUnit: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '600',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textWhiteMuted: {
    color: 'rgba(255,255,255,0.7)',
  },
  customAddButton: {
    width: (width - 40 - 24) / 3,
    height: 85,
    margin: 4,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary.sky,
  },
  customGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.sky,
    marginTop: 2,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.background.card : '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
    ...SHADOWS.sm,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary.sky,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logMain: {
    flex: 1,
  },
  logVolume: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  logTime: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: isDark ? '#334155' : '#CBD5E1',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDark ? colors.background.tertiary : '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.muted,
  },
  logCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.sky,
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  insightCard: {
    backgroundColor: isDark ? colors.background.card : '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
    ...SHADOWS.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  insightLabel: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
  },
});

export default HydrationScreen;
