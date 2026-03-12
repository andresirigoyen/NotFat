import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface QuickActionCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  badge?: number;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  icon,
  color,
  backgroundColor,
  onPress,
  badge,
  size = 'medium',
  disabled = false
}) => {
  const { t } = useTranslation();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: 20,
          title: styles.titleSmall
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: 32,
          title: styles.titleLarge
        };
      default:
        return {
          container: styles.containerMedium,
          icon: 24,
          title: styles.titleMedium
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        sizeStyles.container, 
        { 
          backgroundColor: disabled ? '#F9FAFB' : backgroundColor,
          opacity: disabled ? 0.5 : 1
        }
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={icon} 
          size={sizeStyles.icon} 
          color={disabled ? '#9CA3AF' : color} 
        />
        
        {badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[
        sizeStyles.title, 
        { color: disabled ? '#9CA3AF' : '#374151' }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Small size
  containerSmall: {
    width: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  titleSmall: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center'
  },

  // Medium size
  containerMedium: {
    width: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  titleMedium: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center'
  },

  // Large size
  containerLarge: {
    width: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  titleLarge: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center'
  },

  // Common styles
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  }
});

export default QuickActionCard;
