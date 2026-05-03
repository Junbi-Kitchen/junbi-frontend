import { useColorScheme } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { LIGHT_COLORS, DARK_COLORS } from '../lib/tokens';

export function useTheme() {
  const { mode } = useThemeStore();
  const systemScheme = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  return { colors: isDark ? DARK_COLORS : LIGHT_COLORS, isDark, mode };
}
