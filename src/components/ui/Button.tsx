import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, loading, disabled, variant = 'primary', style }) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={loading || disabled} style={[{ width: '100%' }, style]}>
        <LinearGradient
          colors={['#22c55e', '#16a34a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        style={[
          {
            padding: 16,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: '#22c55e',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          },
          style,
        ]}
      >
        <Text style={{ color: '#22c55e', fontSize: 16, fontWeight: '700' }}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        {
          padding: 16,
          borderRadius: 16,
          backgroundColor: '#f8fafc',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        },
        style,
      ]}
    >
      <Text style={{ color: '#475569', fontSize: 16, fontWeight: '700' }}>{title}</Text>
    </TouchableOpacity>
  );
};
