import { StyleSheet, Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling logic
const scale = SCREEN_WIDTH / 375; // Standard design width is 375px

export const normalize = (size: number) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

export const wp = (percentage: number) => {
  return (percentage * SCREEN_WIDTH) / 100;
};

export const hp = (percentage: number) => {
  return (percentage * SCREEN_HEIGHT) / 100;
};

export const darkColors = {
  // ... (keeping existing colors)
  primary: {
    sky: '#38BDF8',  // sky-400
    amber: '#FCD34D', // amber-400
  },
  background: {
    primary: '#000000',   // black
    secondary: '#111111', // dark gray
    tertiary: '#1A1A1A', // lighter gray
    card: '#1F1F1F',     // card background
    border: '#2A2A2A',     // border color
  },
  text: {
    primary: '#FFFFFF',     // white
    secondary: '#E5E7EB', // light gray
    tertiary: '#9CA3AF',  // medium gray
    muted: '#6B7280',    // muted gray
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  interactive: {
    active: '#38BDF8',    // sky-400
    inactive: '#374151',   // dark gray
    pressed: '#0EA5E9',   // sky-500
    disabled: '#4B5563',  // disabled gray
  },
};

export const lightColors = {
  primary: {
    sky: '#0EA5E9',  // sky-500
    amber: '#D97706', // amber-600
  },
  background: {
    primary: '#FFFFFF',   
    secondary: '#F9FAFB', 
    tertiary: '#F3F4F6',  
    card: '#FFFFFF',      
    border: '#E5E7EB',    
  },
  text: {
    primary: '#111827',   
    secondary: '#374151', 
    tertiary: '#4B5563',  
    muted: '#9CA3AF',     
  },
  status: {
    success: '#059669',   
    warning: '#D97706',   
    error: '#DC2626',     
    info: '#2563EB',      
  },
  interactive: {
    active: '#0EA5E9',    
    inactive: '#F3F4F6',  
    pressed: '#0284C7',   
    disabled: '#D1D5DB',  
  },
};

export const COLORS = darkColors;

export const FONTS = {
  primary: 'Montserrat',
  sizes: {
    xs: normalize(12),
    sm: normalize(14),
    base: normalize(16),
    lg: normalize(18),
    xl: normalize(20),
    '2xl': normalize(24),
    '3xl': normalize(30),
    '4xl': normalize(36),
    '5xl': normalize(48),
  },
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const SPACING = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(16),
  lg: normalize(24),
  xl: normalize(32),
  '2xl': normalize(48),
  '3xl': normalize(64),
};

export const BORDER_RADIUS = {
  sm: normalize(8),
  md: normalize(12),
  lg: normalize(16),
  xl: normalize(20),
  '2xl': normalize(24),
  full: normalize(9999),
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isMobile: SCREEN_WIDTH < 768,
  isTablet: SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 1024,
  isDesktop: SCREEN_WIDTH >= 1024,
};

export const createStyleSheet = (styles: any) => {
  return StyleSheet.create(styles);
};
