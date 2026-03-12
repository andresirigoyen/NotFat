import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  onPress?: () => void;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  target,
  unit,
  icon,
  color,
  backgroundColor,
  onPress,
  showPercentage = true,
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const percentage = Math.min((current / target) * 100, 100);
  const isExceeded = current > target;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: 20,
          title: styles.titleSmall,
          value: styles.valueSmall,
          progressBar: styles.progressBarSmall
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: 28,
          title: styles.titleLarge,
          value: styles.valueLarge,
          progressBar: styles.progressBarLarge
        };
      default:
        return {
          container: styles.containerMedium,
          icon: 24,
          title: styles.titleMedium,
          value: styles.valueMedium,
          progressBar: styles.progressBarMedium
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[sizeStyles.container, { backgroundColor }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <Ionicons name={icon} size={sizeStyles.icon} color={color} />
        <Text style={[sizeStyles.title, { color: '#374151' }]}>{title}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[sizeStyles.value, { color: isExceeded ? '#EF4444' : '#111827' }]}>
          {Math.round(current)} / {target} {unit}
        </Text>
        
        {showPercentage && (
          <Text style={[styles.percentage, { color: isExceeded ? '#EF4444' : color }]}>
            {Math.round(percentage)}%
          </Text>
        )}
      </View>

      <View style={styles.progressContainer}>
        <View style={sizeStyles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: isExceeded ? '#EF4444' : color,
                borderRadius: size === 'small' ? 2 : 3
              }
            ]}
          />
        </View>
        
        {isExceeded && (
          <Ionicons name="warning-outline" size={16} color="#EF4444" style={styles.warningIcon} />
        )}
      </View>

      {isExceeded && (
        <Text style={styles.exceededText}>
          {t('progress.exceeded')}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Small size
  containerSmall: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  titleSmall: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  valueSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden'
  },

  // Medium size
  containerMedium: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  titleMedium: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8
  },
  valueMedium: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4
  },
  progressBarMedium: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden'
  },

  // Large size
  containerLarge: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  titleLarge: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12
  },
  valueLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden'
  },

  // Common styles
  header: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  content: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600'
  },
  warningIcon: {
    marginLeft: 8
  },
  exceededText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    textAlign: 'center'
  }
});

export default ProgressCard;
