import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHealthScore } from '@/hooks/useHealthScore';
import { COLORS, SPACING, FONTS } from '@/constants/theme';

const TYPOGRAPHY = {
  heading: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
  },
  subheading: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  body: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
  },
  caption: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
  },
  button: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
  },
};

const { width } = Dimensions.get('window');

interface HealthScoreCardProps {
  date?: string;
  onRefresh?: () => void;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  date,
  onRefresh,
}) => {
  const {
    healthScore,
    nutritionData,
    isLoading,
    isGenerating,
    generateScore,
  } = useHealthScore(date);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (healthScore && !isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [healthScore, isLoading, fadeAnim, slideAnim]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50'; // Verde - Excelente
    if (score >= 80) return '#8BC34A'; // Verde claro - Muy bueno
    if (score >= 70) return '#FFC107'; // Amarillo - Bueno
    if (score >= 60) return '#FF9800'; // Naranja - Regular
    return '#F44336'; // Rojo - Necesita mejorar
  };

  const getGradeEmoji = (grade: string) => {
    switch (grade) {
      case 'A': return '🌟';
      case 'B': return '✨';
      case 'C': return '👍';
      case 'D': return '👌';
      case 'F': return '⚠️';
      default: return '📊';
    }
  };

  const handleGenerateScore = () => {
    if (nutritionData) {
      generateScore();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.loadingCard}>
          <View style={styles.skeleton}>
            <View style={styles.skeletonScore} />
            <View style={styles.skeletonText} />
            <View style={styles.skeletonText} />
          </View>
        </View>
      </View>
    );
  }

  if (!healthScore || !nutritionData) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <View style={styles.emptyCard}>
          <Ionicons name="analytics-outline" size={48} color={COLORS.primary.amber} />
          <Text style={styles.emptyTitle}>Health Score</Text>
          <Text style={styles.emptyText}>
            Registra tus comidas para ver tu análisis nutricional
          </Text>
          {nutritionData && (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateScore}
              disabled={isGenerating}
            >
              <Text style={styles.generateButtonText}>
                {isGenerating ? 'Generando...' : 'Generar Health Score'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Health Score</Text>
            <Text style={styles.subtitle}>
              {new Date(healthScore.generated_at).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color={COLORS.primary.amber} />
          </TouchableOpacity>
        </View>

        {/* Score Principal */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(healthScore.score) }]}>
            <Text style={[styles.scoreNumber, { color: getScoreColor(healthScore.score) }]}>
              {healthScore.score}
            </Text>
            <Text style={styles.scoreGrade}>
              {getGradeEmoji(healthScore.grade)} {healthScore.grade}
            </Text>
          </View>
        </View>

        {/* Stats Rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{nutritionData.totalCalories}</Text>
            <Text style={styles.statLabel}>Calorías</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{nutritionData.totalProtein}g</Text>
            <Text style={styles.statLabel}>Proteína</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{nutritionData.mealCount}</Text>
            <Text style={styles.statLabel}>Comidas</Text>
          </View>
        </View>

        {/* Insights */}
        {healthScore.insights && healthScore.insights.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>Insights del Día</Text>
            {healthScore.insights.slice(0, 2).map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Ionicons name="bulb" size={16} color={COLORS.primary.amber} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Fortalezas y Debilidades */}
        {(healthScore.strengths.length > 0 || healthScore.weaknesses.length > 0) && (
          <View style={styles.analysisContainer}>
            {healthScore.strengths.length > 0 && (
              <View style={styles.strengthContainer}>
                <Text style={styles.sectionTitle}>✅ Fortalezas</Text>
                {healthScore.strengths.slice(0, 2).map((strength, index) => (
                  <Text key={index} style={styles.strengthText}>• {strength}</Text>
                ))}
              </View>
            )}

            {healthScore.weaknesses.length > 0 && (
              <View style={styles.weaknessContainer}>
                <Text style={styles.sectionTitle}>⚠️ A Mejorar</Text>
                {healthScore.weaknesses.slice(0, 2).map((weakness, index) => (
                  <Text key={index} style={styles.weaknessText}>• {weakness}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Recomendaciones */}
        {healthScore.recommendations && healthScore.recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>💡 Recomendaciones</Text>
            {healthScore.recommendations.slice(0, 2).map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.heading,
    fontSize: 18,
    color: '#000000',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: '#666666',
    marginTop: 2,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  scoreNumber: {
    ...TYPOGRAPHY.heading,
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreGrade: {
    ...TYPOGRAPHY.caption,
    fontSize: 16,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.heading,
    fontSize: 20,
    color: '#000000',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: '#666666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  insightsContainer: {
    marginVertical: SPACING.md,
  },
  insightsTitle: {
    ...TYPOGRAPHY.subheading,
    color: '#000000',
    marginBottom: SPACING.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  insightText: {
    ...TYPOGRAPHY.body,
    color: '#333333',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  analysisContainer: {
    flexDirection: 'row',
    marginVertical: SPACING.md,
  },
  strengthContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  weaknessContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: '#000000',
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  strengthText: {
    ...TYPOGRAPHY.caption,
    color: '#4CAF50',
    marginBottom: 2,
  },
  weaknessText: {
    ...TYPOGRAPHY.caption,
    color: '#FF9800',
    marginBottom: 2,
  },
  recommendationsContainer: {
    marginVertical: SPACING.md,
  },
  recommendationsTitle: {
    ...TYPOGRAPHY.subheading,
    color: '#000000',
    marginBottom: SPACING.sm,
  },
  recommendationItem: {
    backgroundColor: '#f8f8f8',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  recommendationText: {
    ...TYPOGRAPHY.caption,
    color: '#333333',
  },
  loadingContainer: {
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.lg,
  },
  skeleton: {
    gap: SPACING.sm,
  },
  skeletonScore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignSelf: 'center',
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 4,
  },
  emptyContainer: {
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.heading,
    color: '#000000',
    marginTop: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: '#666666',
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  generateButton: {
    backgroundColor: COLORS.primary.amber,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  generateButtonText: {
    ...TYPOGRAPHY.button,
    color: '#000000',
  },
});

export default HealthScoreCard;
