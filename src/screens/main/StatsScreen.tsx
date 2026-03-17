import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { useStatsOverview } from '@/hooks/useStatsOverview';

const { width } = Dimensions.get('window');

const CHART_CONFIG = {
  backgroundColor: COLORS.background.primary,
  backgroundGradientFrom: COLORS.background.primary,
  backgroundGradientTo: COLORS.background.primary,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(252, 211, 77, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: COLORS.primary.amber,
  },
};

const TIME_RANGES = [
  { label: '7 días', value: 7 },
  { label: '30 días', value: 30 },
  { label: '3 meses', value: 90 },
];

export default function StatsScreen() {
  const [selectedRange, setSelectedRange] = useState(7);
  const [activeTab, setActiveTab] = useState<'weight' | 'calories' | 'macros'>('weight');
  const { data: stats, isLoading } = useStatsOverview(selectedRange as 7 | 30 | 90);
  if (isLoading || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.text.secondary }}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weightData = {
    labels: stats.labels,
    datasets: [
      {
        data: stats.weightData,
        color: (opacity = 1) => `rgba(252, 211, 77, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const caloriesData = {
    labels: stats.labels,
    datasets: [
      {
        data: stats.caloriesData,
        color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const hydrationData = {
    labels: stats.labels,
    datasets: [
      {
        data: stats.hydrationData,
        color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
      },
    ],
  };

  const macrosData = stats.macrosData;

  const renderChart = () => {
    switch (activeTab) {
      case 'weight':
        return (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Progreso de Peso</Text>
            <LineChart
              data={weightData}
              width={width - 40}
              height={220}
              chartConfig={CHART_CONFIG}
              bezier
              style={styles.chart}
            />
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.summary.weightChange >= 0 ? '+' : ''}{stats.summary.weightChange} kg</Text>
                <Text style={styles.statLabel}>Últ. {selectedRange} días</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.summary.totalCalories.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Calorías</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.summary.currentWeight || 0} kg</Text>
                <Text style={styles.statLabel}>Actual</Text>
              </View>
            </View>
          </View>
        );
      case 'calories':
        return (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Consumo de Calorías</Text>
            <BarChart
              data={{
                labels: caloriesData.labels,
                datasets: [{ data: caloriesData.datasets[0].data }],
              }}
              width={width - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                ...CHART_CONFIG,
                color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
              }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.summary.avgCalories.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Promedio/día</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.summary.totalCalories.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total semana</Text>
              </View>
            </View>
          </View>
        );
      case 'macros':
        return (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Distribución de Macros</Text>
            <PieChart
              data={macrosData}
              width={width - 40}
              height={220}
              chartConfig={CHART_CONFIG}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
            <View style={styles.macroLegend}>
              {macrosData.map((macro) => (
                <View key={macro.name} style={styles.macroItem}>
                  <View style={[styles.macroColor, { backgroundColor: macro.color }]} />
                  <Text style={styles.macroText}>{macro.name}: {macro.population}%</Text>
                </View>
              ))}
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Tu progreso en detalle</Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.rangeSelector}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.rangeButton,
              selectedRange === range.value && styles.rangeButtonActive,
            ]}
            onPress={() => setSelectedRange(range.value)}
          >
            <Text
              style={[
                styles.rangeButtonText,
                selectedRange === range.value && styles.rangeButtonTextActive,
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        {[
          { key: 'weight', label: 'Peso', icon: 'scale-outline' },
          { key: 'calories', label: 'Calorías', icon: 'flame-outline' },
          { key: 'macros', label: 'Macros', icon: 'pie-chart-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? COLORS.primary.amber : COLORS.text.secondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderChart()}

        {/* Hidratación */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Hidratación (vasos/día)</Text>
          <BarChart
            data={{
              labels: hydrationData.labels,
              datasets: [{ data: hydrationData.datasets[0].data }],
            }}
            width={width - 40}
            height={180}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...CHART_CONFIG,
              color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
            }}
            style={styles.chart}
          />
        </View>

        {/* Resumen Semanal */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumen Semanal</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="flame-outline" size={24} color={COLORS.primary.amber} />
              <Text style={styles.summaryValue}>{stats.summary.totalCalories.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Calorías</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="restaurant-outline" size={24} color={COLORS.primary.sky} />
              <Text style={styles.summaryValue}>{stats.summary.totalMeals}</Text>
              <Text style={styles.summaryLabel}>Comidas</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="water-outline" size={24} color="#38BDF8" />
              <Text style={styles.summaryValue}>{Math.round(stats.summary.totalWater / 250)}</Text>
              <Text style={styles.summaryLabel}>Vasos agua</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="trending-down-outline" size={24} color="#34D399" />
              <Text style={styles.summaryValue}>{stats.summary.weightChange >= 0 ? '+' : ''}{stats.summary.weightChange}</Text>
              <Text style={styles.summaryLabel}>kg perdidos</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontFamily: FONTS.primary,
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  rangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.background.secondary,
  },
  rangeButtonActive: {
    backgroundColor: COLORS.primary.amber,
  },
  rangeButtonText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text.secondary,
  },
  rangeButtonTextActive: {
    color: COLORS.background.primary,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
  },
  tabActive: {
    backgroundColor: 'rgba(252, 211, 77, 0.15)',
  },
  tabText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  tabTextActive: {
    color: COLORS.primary.amber,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  chartContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  chart: {
    borderRadius: 16,
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
    fontSize: 20,
    color: COLORS.text.primary,
  },
  statLabel: {
    fontFamily: FONTS.primary,
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    flexWrap: 'wrap',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 4,
  },
  macroColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  macroText: {
    fontFamily: FONTS.primary,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  summaryContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  summaryTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryValue: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
    fontSize: 24,
    color: COLORS.text.primary,
    marginTop: 8,
  },
  summaryLabel: {
    fontFamily: FONTS.primary,
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
});
