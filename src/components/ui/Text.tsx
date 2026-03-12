import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';

interface TextProps extends RNTextProps {
  variant?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'sky' | 'amber' | 'success' | 'warning' | 'error' | 'info';
  center?: boolean;
}

export const Text: React.FC<TextProps> = ({
  variant = 'base',
  weight = 'normal',
  color = 'primary',
  center = false,
  style,
  children,
  ...props
}) => {
  const getFontSize = () => {
    return FONTS.sizes[variant];
  };

  const getFontWeight = () => {
    return FONTS.weights[weight];
  };

  const getColor = () => {
    switch (color) {
      case 'primary':
        return COLORS.text.primary;
      case 'secondary':
        return COLORS.text.secondary;
      case 'tertiary':
        return COLORS.text.tertiary;
      case 'muted':
        return COLORS.text.muted;
      case 'sky':
        return COLORS.primary.sky;
      case 'amber':
        return COLORS.primary.amber;
      case 'success':
        return COLORS.status.success;
      case 'warning':
        return COLORS.status.warning;
      case 'error':
        return COLORS.status.error;
      case 'info':
        return COLORS.status.info;
      default:
        return COLORS.text.primary;
    }
  };

  const textStyles: TextStyle = {
    fontFamily: FONTS.primary,
    fontSize: getFontSize(),
    fontWeight: getFontWeight() as any,
    color: getColor(),
    textAlign: center ? 'center' : 'auto',
  };

  return (
    <RNText style={[textStyles, style]} {...props}>
      {children}
    </RNText>
  );
};
