import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTranslation } from '@/hooks/useTranslation';

interface NutritionChartProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  size?: number;
  showLegend?: boolean;
  showTargets?: boolean;
}

export const NutritionChart: React.FC<NutritionChartProps> = ({
  calories,
  protein,
  carbs,
  fat,
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  size = 150,
  showLegend = true,
  showTargets = false
}) => {
  const { t } = useTranslation();

  const screenWidth = Dimensions.get('window').width;

  const chartData = [
    {
      name: t('meals.protein'),
      population: protein,
      color: '#10B981',
      legendFontColor: '#374151',
      legendFontSize: 12
    },
    {
      name: t('meals.carbs'),
      population: carbs,
      color: '#F59E0B',
      legendFontColor: '#374151',
      legendFontSize: 12
    },
    {
      name: t('meals.fat'),
      population: fat,
      color: '#EF4444',
      legendFontColor: '#374151',
      legendFontSize: 12
    }
  ];

  const total = protein + carbs + fat;

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#EF4444';
    if (percentage >= 80) return '#F59E0B';
    return '#10B981';
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={size}
          height={size}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: 'transparent',
            backgroundGradientTo: 'transparent',
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            strokeWidth: 2,
            barPercentage: 0.5,
            useShadowColorFromDataset: false,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
          center={[size / 2, size / 2] as any}
          absolute
          hasLegend={false}
        />
        
        <View style={styles.centerContent}>
          <Text style={styles.totalCalories}>{Math.round(calories)}</Text>
          <Text style={styles.caloriesLabel}>{t('meals.calories')}</Text>
          <Text style={styles.totalGrams}>{Math.round(total)}g</Text>
        </View>
      </View>

      {showLegend && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>
              {t('meals.protein')}: {Math.round(protein)}g
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>
              {t('meals.carbs')}: {Math.round(carbs)}g
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>
              {t('meals.fat')}: {Math.round(fat)}g
            </Text>
          </View>
        </View>
      )}

      {showTargets && (
        <View style={styles.targetsContainer}>
          <Text style={styles.targetsTitle}>{t('meals.daily_goals')}</Text>
          
          {targetProtein && (
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>
                {t('meals.protein')}: {Math.round(protein)}/{targetProtein}g
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage(protein, targetProtein)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(protein, targetProtein))
                    }
                  ]}
                />
              </View>
            </View>
          )}
          
          {targetCarbs && (
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>
                {t('meals.carbs')}: {Math.round(carbs)}/{targetCarbs}g
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage(carbs, targetCarbs)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(carbs, targetCarbs))
                    }
                  ]}
                />
              </View>
            </View>
          )}
          
          {targetFat && (
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>
                {t('meals.fat')}: {Math.round(fat)}/{targetFat}g
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage(fat, targetFat)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(fat, targetFat))
                    }
                  ]}
                />
              </View>
            </View>
          )}
          
          {targetCalories && (
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>
                {t('meals.calories')}: {Math.round(calories)}/{targetCalories}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage(calories, targetCalories)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(calories, targetCalories))
                    }
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16
  },
  chartContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center'
  },
  totalCalories: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827'
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  totalGrams: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6
  },
  legendText: {
    fontSize: 12,
    color: '#374151'
  },
  targetsContainer: {
    width: '100%',
    marginTop: 20
  },
  targetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12
  },
  targetItem: {
    marginBottom: 8
  },
  targetLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  }
});

export default NutritionChart;
