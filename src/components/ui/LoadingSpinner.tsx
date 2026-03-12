import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#007AFF',
  text,
  overlay = false
}) => {
  const { t } = useTranslation();

  const getSizeValue = () => {
    return size === 'large' ? 'large' : 'small';
  };

  const content = (
    <View style={[styles.container, overlay && styles.overlay]}>
      <ActivityIndicator 
        size={getSizeValue()} 
        color={color}
        style={styles.spinner}
      />
      {text && (
        <Text style={[styles.text, { color }]}>
          {text}
        </Text>
      )}
    </View>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000
  },
  spinner: {
    marginBottom: 12
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center'
  }
});

export default LoadingSpinner;
