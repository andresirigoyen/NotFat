import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { darkColors, lightColors } from '@/constants/theme';
import { useProfile } from './useProfile';

export function useThemeColors() {
  const { themeMode } = useThemeStore();
  const { profile } = useProfile();
  const systemColorScheme = useColorScheme();

  let isDark = true;
  if (themeMode === 'system') {
    isDark = systemColorScheme === 'dark';
  } else {
    isDark = themeMode === 'dark';
  }

  const baseColors = isDark ? darkColors : lightColors;
  const isFriendly = profile?.coach_mode === 'soft' || profile?.coach_mode === 'friendly';

  return {
    colors: {
      ...baseColors,
      accent: isFriendly ? (baseColors as any).mint || '#AAF0D1' : baseColors.primary.amber,
    },
    isDark,
    isFriendly,
    coachMode: profile?.coach_mode || 'soft'
  };
}
