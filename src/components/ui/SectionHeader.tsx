import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  showIcon?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onAction,
  showIcon = false,
  icon = 'chevron-forward',
  iconColor = '#9CA3AF'
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>
      
      {(actionText || showIcon) && (
        <TouchableOpacity 
          style={styles.actionContainer} 
          onPress={onAction}
          disabled={!onAction}
        >
          {actionText && (
            <Text style={styles.actionText}>{actionText}</Text>
          )}
          <Ionicons name={icon} size={20} color={iconColor} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff'
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500'
  }
});

export default SectionHeader;
