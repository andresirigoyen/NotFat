import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  onPress?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  size?: 'small' | 'medium' | 'large';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  backgroundColor,
  onPress,
  trend,
  size = 'medium'
}) => {
  const { t } = useTranslation();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: 18,
          title: styles.titleSmall,
          value: styles.valueSmall,
          subtitle: styles.subtitleSmall
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: 32,
          title: styles.titleLarge,
          value: styles.valueLarge,
          subtitle: styles.subtitleLarge
        };
      default:
        return {
          container: styles.containerMedium,
          icon: 24,
          title: styles.titleMedium,
          value: styles.valueMedium,
          subtitle: styles.subtitleMedium
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
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon} size={sizeStyles.icon} color={iconColor} />
        </View>
        
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={16}
              color={trend.isPositive ? '#10B981' : '#EF4444'}
            />
            <Text style={[
              styles.trendValue,
              { color: trend.isPositive ? '#10B981' : '#EF4444' }
            ]}>
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={sizeStyles.title}>{title}</Text>
      <Text style={sizeStyles.value}>{value}</Text>
      
      {subtitle && (
        <Text style={sizeStyles.subtitle}>{subtitle}</Text>
      )}

      {trend && trend.label && (
        <Text style={styles.trendLabel}>{trend.label}</Text>
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
    color: '#6B7280',
    marginTop: 8
  },
  valueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2
  },
  subtitleSmall: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2
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
    color: '#6B7280',
    marginTop: 12
  },
  valueMedium: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4
  },
  subtitleMedium: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4
  },

  // Large size
  containerLarge: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  titleLarge: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16
  },
  valueLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8
  },
  subtitleLarge: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8
  },

  // Common styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },
  trendLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8
  }
});

export default StatCard;
