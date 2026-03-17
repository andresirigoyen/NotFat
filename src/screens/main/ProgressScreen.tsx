import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Info } from 'lucide-react-native';
import { useWeeklyStats } from '@/hooks/useWeeklyStats';
import { useProfile } from '@/hooks/useProfile';
import { useBodyMetrics, useAddBodyMetric } from '@/hooks/useBodyMetrics';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

const ProgressScreen = ({ navigation }: any) => {
  const tabs = ['Esta semana', 'La semana pasada', 'Hace un mes'];
  const [activeTab, setActiveTab] = React.useState(0);
  const [showWeightModal, setShowWeightModal] = React.useState(false);
  const [showInfoModal, setShowInfoModal] = React.useState(false);
  const [newWeight, setNewWeight] = React.useState('');
  const [isSavingWeight, setIsSavingWeight] = React.useState(false);
  
  const { data: weeklyStats, isLoading: statsLoading } = useWeeklyStats();
  const { profile, nutritionGoals, isLoading: profileLoading } = useProfile();
  const { data: bodyMetrics } = useBodyMetrics(profile?.id || '');
  const { mutateAsync: addBodyMetric } = useAddBodyMetric();
  
  // Get latest body metrics
  const latestMetrics = bodyMetrics?.[bodyMetrics.length - 1];

  const handleAddWeight = async () => {
    const parsed = Number(newWeight.replace(',', '.'));
    if (!parsed || Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert('Peso inválido', 'Ingresa un peso válido mayor a 0.');
      return;
    }

    try {
      setIsSavingWeight(true);
      await addBodyMetric({ weight_value: parsed, weight_unit: profile?.weight_unit || 'kg' } as any);
      setShowWeightModal(false);
      setNewWeight('');
    } catch (error) {
      console.error('Error adding weight:', error);
      Alert.alert('Error', 'No pudimos guardar tu peso. Intenta nuevamente.');
    } finally {
      setIsSavingWeight(false);
    }
  };

  if (statsLoading || profileLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary.amber} />
      </View>
    );
  }

  const targetKcal = nutritionGoals?.calories || 2000;
  const averageKcal = weeklyStats?.average || 0;
  const progressPercent = Math.min(Math.round((averageKcal / targetKcal) * 100), 100);

  const chartData = {
    labels: weeklyStats?.labels || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [{
      data: weeklyStats?.data || [0, 0, 0, 0, 0, 0, 0],
      color: (opacity = 1) => `rgba(252, 211, 77, ${opacity})`,
      strokeWidth: 4
    }]
  };

  const chartConfig = {
    backgroundColor: COLORS.background.secondary,
    backgroundGradientFrom: COLORS.background.secondary,
    backgroundGradientTo: COLORS.background.secondary,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(252, 211, 77, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: BORDER_RADIUS.lg },
    propsForDots: {
      r: '6',
      strokeWidth: '3',
      stroke: COLORS.background.primary
    },
    propsForBackgroundLines: {
      strokeDasharray: '6',
      stroke: 'rgba(255,255,255,0.1)'
    }
  };

  const weightChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(252, 211, 77, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    propsForLabels: {
      fontSize: 12,
      fontWeight: '700',
      fill: '#FFFFFF',
    },
    barPercentage: 0.55,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSpacer} />

        {/* Tab Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {tabs.map((tab, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.tabBtn, activeTab === idx && styles.tabBtnActive]}
              onPress={() => setActiveTab(idx)}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Promedio Diario</Text>
            <View style={styles.cardMainInfo}>
              <Text style={styles.cardValue}>{averageKcal.toLocaleString()}</Text>
              <Text style={styles.cardUnit}>kcal</Text>
            </View>
            <View style={styles.progressPlaceholder}>
              <View style={[styles.progressInner, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.cardSubtitle}>{progressPercent}% de tu meta ({targetKcal} kcal)</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Días Registrados</Text>
            <View style={styles.daysValueBox}>
              <Text style={styles.daysValue}>{weeklyStats?.daysActive || 0}/7</Text>
            </View>
            <View style={styles.dotRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
                <View 
                   key={dayIdx}                    style={[styles.summaryDot, weeklyStats?.data && weeklyStats.data[dayIdx] > 0 && styles.dotActive]} 
                />
              ))}
            </View>
            <Text style={styles.cardSubtitle}>{Math.round(((weeklyStats?.daysActive || 0) / 7) * 100)}% completado</Text>
          </View>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Calorías consumidas</Text>
            <TouchableOpacity onPress={() => setShowInfoModal(true)} activeOpacity={0.8}>
              <Info size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <LineChart
            data={chartData}
            width={width - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chartStyle}
            withInnerLines={true}
            withOuterLines={false}
            yAxisSuffix=""
            yAxisInterval={1}
            fromZero={true}
          />
          
          <View style={styles.chartFooter}>
            <Text style={styles.chartFooterText}>Meta diaria: {targetKcal} kcal</Text>
            <View style={styles.goalLine} />
          </View>
        </View>

        {/* Weight Progression */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Progreso de peso</Text>
            <TouchableOpacity
              style={styles.addWeightBtn}
              onPress={() => {
                console.log('Open weight modal');
                setShowWeightModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addWeightText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyWeightBox}>
             <BarChart
               data={{
                 labels: ['Inicial', 'Actual'],
                 datasets: [{ data: [profile?.weight_value || 70, profile?.weight_value || 70] }]
               }}
               width={width - 80}
               height={150}
               yAxisLabel=""
               yAxisSuffix={profile?.weight_unit || 'kg'}
               chartConfig={weightChartConfig}
               style={{ borderRadius: 16 }}
               fromZero={true}
             />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={showWeightModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar peso</Text>
            <Text style={styles.modalSubtitle}>Guarda una nueva medición en tu progreso</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. 74.8"
              placeholderTextColor={COLORS.text.muted}
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setShowWeightModal(false)} disabled={isSavingWeight}>
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleAddWeight} disabled={isSavingWeight}>
                <Text style={styles.modalPrimaryText}>{isSavingWeight ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Qué muestra este gráfico?</Text>
            <Text style={styles.modalSubtitle}>
              Aquí ves tu consumo de calorías por día según las comidas registradas en tu cuenta.
            </Text>
            <Text style={styles.infoText}>
              • La línea amarilla corresponde a tu evolución diaria.
            </Text>
            <Text style={styles.infoText}>
              • La meta diaria se calcula desde tu objetivo nutricional.
            </Text>
            <Text style={styles.infoText}>
              • Usa los botones de rango para ver 7 días, 30 días o 3 meses.
            </Text>
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { marginTop: SPACING.lg }]}
              onPress={() => setShowInfoModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  topSpacer: {
    height: SPACING.sm,
  },
  tabScroll: {
    marginBottom: SPACING.lg,
  },
  tabBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.background.secondary,
    marginRight: SPACING.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary.amber,
  },
  tabText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  tabTextActive: {
    color: COLORS.background.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  statsCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.primary,
  },
  cardMainInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  cardValue: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  cardUnit: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.primary,
  },
  progressPlaceholder: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    width: '100%',
    marginBottom: SPACING.sm,
  },
  progressInner: {
    height: '100%',
    backgroundColor: COLORS.primary.amber,
    borderRadius: 4,
  },
  cardSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weights.bold,
    textAlign: 'center',
    fontFamily: FONTS.primary,
  },
  daysValueBox: {
    marginBottom: SPACING.sm,
  },
  daysValue: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  dotRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dotActive: {
    backgroundColor: COLORS.primary.amber,
  },
  chartCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  chartStyle: {
    paddingRight: SPACING.xl,
    marginTop: SPACING.sm,
  },
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  chartFooterText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    fontFamily: FONTS.primary,
  },
  goalLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.primary.amber,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  summaryCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  addWeightBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(252,211,77,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.25)',
  },
  addWeightText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.primary.amber,
    fontWeight: FONTS.weights.bold,
  },
  emptyWeightBox: {
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  modalSubtitle: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  infoText: {
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  modalInput: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalSecondaryBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalSecondaryText: {
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  modalPrimaryBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.primary.amber,
  },
  modalPrimaryText: {
    color: COLORS.background.primary,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
});

export default ProgressScreen;
