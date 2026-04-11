import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface CustomTextProps extends TextProps {
  variant?: 'light' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
}

/**
 * Componente de texto personalizado que asegura el uso de la fuente Montserrat
 * y proporciona variantes predefinidas.
 */
export const CustomText: React.FC<CustomTextProps> = ({ 
  style, 
  variant = 'regular', 
  children, 
  ...props 
}) => {
  const getFontFamily = () => {
    switch (variant) {
      case 'light': return 'Montserrat_300Light';
      case 'medium': return 'Montserrat_500Medium';
      case 'semiBold': return 'Montserrat_600SemiBold';
      case 'bold': return 'Montserrat_700Bold';
      case 'extraBold': return 'Montserrat_800ExtraBold';
      case 'regular':
      default: return 'Montserrat_400Regular';
    }
  };

  return (
    <Text 
      style={[{ fontFamily: getFontFamily() }, style]} 
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // Puedes añadir estilos base aquí si es necesario
});

export default CustomText;
