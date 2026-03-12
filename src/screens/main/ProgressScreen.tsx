import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Info, ChevronRight } from 'lucide-react-native';
import { useWeeklyStats } from '@/hooks/useWeeklyStats';
import { useProfile } from '@/hooks/useProfile';

const { width } = Dimensions.get('window');

const ProgressScreen = () => {
  const tabs = ['Esta semana', 'La semana pasada', 'Hace un mes'];
  const [activeTab, setActiveTab] = React.useState(0);
  
  const { data: weeklyStats, isLoading: statsLoading } = useWeeklyStats();
  const { profile, nutritionGoals, isLoading: profileLoading } = useProfile();

  if (statsLoading || profileLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#7c2d12" />
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
      color: (opacity = 1) => `rgba(124, 45, 18, ${opacity})`,
      strokeWidth: 4
    }]
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124, 45, 18, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '6',
      strokeWidth: '3',
      stroke: '#ffffff'
    },
    propsForBackgroundLines: {
      strokeDasharray: '6',
      stroke: '#f1f5f9'
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.topHeader}>
          <Text style={styles.brandEmoji}>🦦</Text>
          <Text style={styles.brandText}>nutrIA</Text>
          <TouchableOpacity style={styles.weightBadge}>
            <Text style={styles.weightText}>{profile?.weight_value || '--'} {profile?.weight_unit || 'kg'}</Text>
            <ChevronRight size={16} color="#7c2d12" />
          </TouchableOpacity>
        </View>

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
            <TouchableOpacity><Info size={20} color="#94a3b8" /></TouchableOpacity>
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
            <TouchableOpacity style={styles.addWeightBtn}><Text style={styles.addWeightText}>+</Text></TouchableOpacity>
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
               chartConfig={chartConfig}
               style={{ borderRadius: 16 }}
               fromZero={true}
             />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandEmoji: {
    fontSize: 28,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7c2d12',
    marginLeft: 10,
    flex: 1,
  },
  weightBadge: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightText: {
    color: '#7c2d12',
    fontWeight: '800',
    fontSize: 16,
  },
  tabScroll: {
    marginBottom: 24,
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  tabBtnActive: {
    backgroundColor: '#7c2d12',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  cardMainInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
  },
  cardUnit: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '800',
  },
  progressPlaceholder: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    width: '100%',
    marginBottom: 12,
  },
  progressInner: {
    height: '100%',
    backgroundColor: '#7c2d12',
    borderRadius: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textAlign: 'center',
  },
  daysValueBox: {
    marginBottom: 12,
  },
  daysValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1e293b',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  dotActive: {
    backgroundColor: '#7c2d12',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 20,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#334155',
  },
  chartStyle: {
    paddingRight: 40,
    marginTop: 10,
  },
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 10,
  },
  chartFooterText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  goalLine: {
    width: 30,
    height: 2,
    backgroundColor: '#7c2d12',
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#334155',
  },
  addWeightBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FAF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWeightText: {
    fontSize: 20,
    color: '#7c2d12',
    fontWeight: '800',
  },
  emptyWeightBox: {
    alignItems: 'center',
  },
});

export default ProgressScreen;
