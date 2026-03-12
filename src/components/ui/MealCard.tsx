import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface MealCardProps {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  status?: 'complete' | 'analyzing' | 'error';
  onPress?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const MealCard: React.FC<MealCardProps> = ({
  id,
  name,
  mealType,
  time,
  calories,
  protein,
  carbs,
  fat,
  imageUrl,
  status = 'complete',
  onPress,
  onDelete,
  onEdit,
  showActions = false,
  size = 'medium'
}) => {
  const { t } = useTranslation();

  const getMealTypeIcon = () => {
    switch (mealType) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'partly-sunny-outline';
      case 'dinner':
        return 'moon-outline';
      case 'snack':
        return 'restaurant-outline';
      default:
        return 'restaurant-outline';
    }
  };

  const getMealTypeColor = () => {
    switch (mealType) {
      case 'breakfast':
        return '#F59E0B';
      case 'lunch':
        return '#10B981';
      case 'dinner':
        return '#6366F1';
      case 'snack':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'analyzing':
        return 'ellipsis-circle-outline';
      case 'error':
        return 'warning-outline';
      default:
        return 'checkmark-circle';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'analyzing':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      default:
        return '#10B981';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          imageContainer: styles.imageContainerSmall,
          content: styles.contentSmall,
          title: styles.titleSmall,
          time: styles.timeSmall,
          nutrition: styles.nutritionSmall
        };
      case 'large':
        return {
          container: styles.containerLarge,
          imageContainer: styles.imageContainerLarge,
          content: styles.contentLarge,
          title: styles.titleLarge,
          time: styles.timeLarge,
          nutrition: styles.nutritionLarge
        };
      default:
        return {
          container: styles.containerMedium,
          imageContainer: styles.imageContainerMedium,
          content: styles.contentMedium,
          title: styles.titleMedium,
          time: styles.timeMedium,
          nutrition: styles.nutritionMedium
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const mealTypeColor = getMealTypeColor();

  return (
    <TouchableOpacity
      style={[sizeStyles.container, styles.shadow]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={sizeStyles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: mealTypeColor + '20' }]}>
            <Ionicons name={getMealTypeIcon()} size={32} color={mealTypeColor} />
          </View>
        )}
        
        <View style={styles.statusContainer}>
          <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
        </View>
      </View>

      <View style={sizeStyles.content}>
        <View style={styles.header}>
          <Text style={sizeStyles.title} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.mealTypeContainer}>
            <Ionicons name={getMealTypeIcon()} size={14} color={mealTypeColor} />
            <Text style={[styles.mealType, { color: mealTypeColor }]}>
              {t(`meals.${mealType}`)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={sizeStyles.time}>{time}</Text>
          
          <View style={sizeStyles.nutrition}>
            <Text style={styles.nutritionValue}>
              {Math.round(calories)} {t('meals.calories')}
            </Text>
            <Text style={styles.nutritionDetails}>
              P: {Math.round(protein)}g | C: {Math.round(carbs)}g | F: {Math.round(fat)}g
            </Text>
          </View>
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Ionicons name="create-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Small size
  containerSmall: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    overflow: 'hidden'
  },
  imageContainerSmall: {
    height: 80,
    position: 'relative'
  },
  contentSmall: {
    padding: 12
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  timeSmall: {
    fontSize: 12,
    color: '#6B7280'
  },
  nutritionSmall: {
    alignItems: 'flex-end'
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  nutritionDetails: {
    fontSize: 10,
    color: '#6B7280'
  },

  // Medium size
  containerMedium: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    overflow: 'hidden'
  },
  imageContainerMedium: {
    height: 120,
    position: 'relative'
  },
  contentMedium: {
    padding: 16
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6
  },
  timeMedium: {
    fontSize: 14,
    color: '#6B7280'
  },
  nutritionMedium: {
    alignItems: 'flex-end'
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  nutritionDetails: {
    fontSize: 12,
    color: '#6B7280'
  },

  // Large size
  containerLarge: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden'
  },
  imageContainerLarge: {
    height: 160,
    position: 'relative'
  },
  contentLarge: {
    padding: 20
  },
  titleLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8
  },
  timeLarge: {
    fontSize: 16,
    color: '#6B7280'
  },
  nutritionLarge: {
    alignItems: 'flex-end'
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  nutritionDetails: {
    fontSize: 14,
    color: '#6B7280'
  },

  // Common styles
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  mealType: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  actions: {
    flexDirection: 'row',
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 8
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  }
});

export default MealCard;
