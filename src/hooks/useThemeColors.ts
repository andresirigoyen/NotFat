import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { darkColors, lightColors } from '@/constants/theme';

export function useThemeColors() {
  const { themeMode } = useThemeStore();
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null | undefined

  let isDark = true; // Por defecto

  if (themeMode === 'system') {
    isDark = systemColorScheme === 'dark';
  } else {
    isDark = themeMode === 'dark';
  }

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}
