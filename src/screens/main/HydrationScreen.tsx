import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useHydration } from '@/hooks/useHydration';
import { useAuthStore } from '@/store';

const { width } = Dimensions.get('window');

const HydrationScreen = ({ navigation }: any) => {
  const navigationHook = useNavigation();
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
  const { user } = useAuthStore();

  const todayProgress = getTodayProgress().consumed;
  const weeklyProgress = getWeeklyProgress();

  const quickAmounts = hydrationGoal?.unit === 'ml' 
    ? [100, 250, 500, 750, 1000]
    : [4, 8, 16, 24, 32];

  const handleAddWater = async (amount: number) => {
    try {
      await addWaterLog(amount, hydrationGoal?.unit || 'ml');
      Alert.alert('¡Éxito!', `Has agregado ${amount} ${hydrationGoal?.unit || 'ml'} de agua`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el agua. Por favor intenta nuevamente.');
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
      '¿Estás seguro de que quieres eliminar este registro?',
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

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return '#10B981';
    if (percentage >= 80) return '#F59E0B';
    if (percentage >= 60) return '#3B82F6';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigationHook.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hidratación</Text>
          <TouchableOpacity onPress={handleUpdateGoal}>
            <Ionicons name="settings" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconContainer}>
              <Ionicons name="water" size={32} color="#3B82F6" />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Progreso de Hoy</Text>
              <Text style={styles.progressSubtitle}>
                {todayProgress} / {hydrationGoal?.daily_goal || 2000} {hydrationGoal?.unit || 'ml'}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getProgressColor()
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round(getProgressPercentage())}%
            </Text>
          </View>
        </View>

        {/* Quick Add */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agregar Agua</Text>
          
          <View style={styles.quickAmounts}>
            {quickAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountButton,
                  selectedAmount === amount && styles.amountButtonSelected
                ]}
                onPress={() => {
                  setSelectedAmount(amount);
                  handleAddWater(amount);
                }}
              >
                <Text style={[
                  styles.amountText,
                  selectedAmount === amount && styles.amountTextSelected
                ]}>
                  {amount}
                </Text>
                <Text style={[
                  styles.amountUnit,
                  selectedAmount === amount && styles.amountUnitSelected
                ]}>
                  {hydrationGoal?.unit || 'ml'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.customButton} onPress={handleCustomAmount}>
            <Ionicons name="add-circle" size={20} color="#3B82F6" />
            <Text style={styles.customButtonText}>Cantidad personalizada</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registros de Hoy</Text>
          
          {waterLogs && waterLogs.length > 0 ? (
            waterLogs.map((log: any, index: number) => (
              <TouchableOpacity key={log.id} style={styles.logItem}>
                <View style={styles.logContent}>
                  <View style={styles.logHeader}>
                    <View style={styles.logTime}>
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <Text style={styles.logTimeText}>
                        {new Date(log.logged_at).toLocaleTimeString('es-CL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.logAmount}>
                    {log.volume} {log.unit}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyLogs}>
              <Ionicons name="water" size={48} color="#D1D5DB" />
              <Text style={styles.emptyLogsText}>No hay registros hoy</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => handleAddWater(250)}
              >
                <Text style={styles.addFirstButtonText}>Agregar primer registro</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Weekly Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progreso Semanal</Text>
          <View style={styles.weeklyCard}>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>{weeklyProgress.total}</Text>
                <Text style={styles.weeklyStatLabel}>Total {hydrationGoal?.unit || 'ml'}</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>{weeklyProgress.average}</Text>
                <Text style={styles.weeklyStatLabel}>Promedio diario</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>{weeklyProgress.days}</Text>
                <Text style={styles.weeklyStatLabel}>Días activos</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Goal Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objetivo Diario</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalContent}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalValue}>{hydrationGoal?.daily_goal || 2000}</Text>
                <Text style={styles.goalUnit}>{hydrationGoal?.unit || 'ml'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.goalEditButton}
                onPress={handleUpdateGoal}
              >
                <Ionicons name="create" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.goalDescription}>
              Basado en tu peso y nivel de actividad
            </Text>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
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
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  amountButton: {
    flex: 1,
    minWidth: 60,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  amountTextSelected: {
    color: '#FFFFFF',
  },
  amountUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountUnitSelected: {
    color: '#DBEAFE',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  logItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTimeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  logAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  emptyLogs: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyLogsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  addFirstButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weeklyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  goalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  goalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  goalUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  goalEditButton: {
    padding: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default HydrationScreen;
