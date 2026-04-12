import React, { useEffect, useMemo } from 'react';
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
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface HealthScoreCardProps {
  date?: string;
  onRefresh?: () => void;
  processedRatioToday?: number;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  date,
  onRefresh,
  processedRatioToday,
}) => {
  const { colors } = useThemeColors();
  const {
    healthScore,
    nutritionData,
    isLoading,
    isGenerating,
    generateScore,
  } = useHealthScore(date);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (healthScore && !isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [healthScore, isLoading, fadeAnim, scaleAnim]);

  const statusConfig = useMemo(() => {
    const score = healthScore?.score || 0;
    if (score >= 90) return { color: '#10B981', label: 'E x c e l e n t e', icon: 'sparkles' };
    if (score >= 75) return { color: '#FBBF24', label: 'B u e n  p r o g r e s o', icon: 'checkmark-circle' };
    if (score >= 50) return { color: '#F97316', label: 'A j u s t e  n e c e s a r i o', icon: 'alert-circle' };
    return { color: '#EF4444', label: 'C r í t i c o', icon: 'warning' };
  }, [healthScore?.score]);

  if (isLoading) return null;

  if (!healthScore || !nutritionData) {
    return (
      <View style={styles.emptyCard}>
        <LinearGradient
          colors={['#111', '#080808']}
          style={styles.emptyGradient}
        >
          <Ionicons name="bar-chart-outline" size={32} color="#333" />
          <Text style={styles.emptyTitle}>Análisis de Salud</Text>
          <Text style={styles.emptySubtitle}>Completa tu registro para desbloquear el Health Score de hoy.</Text>
          {nutritionData && (
            <TouchableOpacity 
              style={styles.generateBtn} 
              onPress={() => generateScore()}
              disabled={isGenerating}
            >
              <Text style={styles.generateBtnText}>{isGenerating ? 'Calculando...' : 'Analizar ahora'}</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['#1A1A1A', '#000']}
        style={styles.card}
      >
        {/* Superior: Score + Status */}
        <View style={styles.topSection}>
          <View style={styles.scoreBox}>
            <View style={[styles.scoreRing, { borderColor: statusConfig.color }]}>
              <Text style={[styles.scoreValue, { color: statusConfig.color }]}>{healthScore.score}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
          </View>
          
          <View style={styles.infoBox}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
              <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
            <Text style={styles.mainInsight}>{healthScore.insights[0]}</Text>
          </View>
        </View>

        {/* Centro: Métricas Precisas */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="flame-outline" size={18} color="#F97316" />
            </View>
            <Text style={styles.metricValue}>{nutritionData.totalCalories}</Text>
            <Text style={styles.metricLabel}>kcal</Text>
          </View>
          
          <View style={styles.metricItem}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="nutrition-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.metricValue}>{nutritionData.totalProtein}g</Text>
            <Text style={styles.metricLabel}>Prot.</Text>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="restaurant-outline" size={18} color="#38BDF8" />
            </View>
            <Text style={styles.metricValue}>{nutritionData.mealCount}</Text>
            <Text style={styles.metricLabel}>Platos</Text>
          </View>
        </View>

        {/* Inferior: Pulse Point (Precisión) */}
        <View style={styles.footer}>
           <View style={styles.pulsePoint}>
             <Ionicons name="flash" size={12} color={COLORS.primary.amber} />
             <Text style={styles.pulseText}>Pulse: {healthScore.strengths[0] || 'Análisis completado'}</Text>
           </View>
           <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
             <Ionicons name="refresh" size={16} color="rgba(255,255,255,0.3)" />
           </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    width: '100%',
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#222',
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  scoreBox: {
    marginRight: SPACING.lg,
  },
  scoreRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: FONTS.primary,
  },
  scoreMax: {
    fontSize: 10,
    color: '#666',
    marginTop: -4,
    fontWeight: '800',
  },
  infoBox: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    gap: 6,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainInsight: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIconWrap: {
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  pulsePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.8,
  },
  pulseText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 6,
  },
  emptyCard: {
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  emptyGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: SPACING.lg,
  },
  generateBtn: {
    backgroundColor: COLORS.primary.amber,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  generateBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default HealthScoreCard;
