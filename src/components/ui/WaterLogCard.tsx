import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface WaterLogCardProps {
  id: string;
  volume: number;
  unit: 'ml' | 'oz';
  time: string;
  date: string;
  onPress?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const WaterLogCard: React.FC<WaterLogCardProps> = ({
  id,
  volume,
  unit,
  time,
  date,
  onPress,
  onDelete,
  showActions = false,
  size = 'medium'
}) => {
  const { t } = useTranslation();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: 20,
          volume: styles.volumeSmall,
          time: styles.timeSmall
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: 28,
          volume: styles.volumeLarge,
          time: styles.timeLarge
        };
      default:
        return {
          container: styles.containerMedium,
          icon: 24,
          volume: styles.volumeMedium,
          time: styles.timeMedium
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[sizeStyles.container, styles.shadow]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="water" size={sizeStyles.icon} color="#007AFF" />
        </View>
        
        <View style={styles.details}>
          <Text style={sizeStyles.volume}>
            {volume} {unit}
          </Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={sizeStyles.time}>{time}</Text>
          </View>
        </View>

        {showActions && (
          <View style={styles.actions}>
            {onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Small size
  containerSmall: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 16,
    padding: 8
  },
  volumeSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  timeSmall: {
    fontSize: 12,
    color: '#6B7280'
  },

  // Medium size
  containerMedium: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    padding: 12
  },
  volumeMedium: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  timeMedium: {
    fontSize: 14,
    color: '#6B7280'
  },

  // Large size
  containerLarge: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 16
  },
  volumeLarge: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827'
  },
  timeLarge: {
    fontSize: 16,
    color: '#6B7280'
  },

  // Common styles
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  details: {
    flex: 1,
    marginLeft: 12
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 6
  }
});

export default WaterLogCard;
