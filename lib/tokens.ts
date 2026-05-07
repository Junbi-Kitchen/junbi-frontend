// Purpose: Single source of truth for all design tokens used across the app

import { Platform } from 'react-native';

export const LIGHT_COLORS = {
  background: (Platform.select({ ios: '#F2F2F7', android: '#F4F6F4' }) ?? '#F2F2F7'),
  primary: '#2D6A4F',
  primaryLight: '#52B788',
  primaryMuted: '#D8F3DC',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  cardLabel: '#8A8A82',
  tabInactive: '#B0B0A8',
  accent: '#F4A261',
  accentLight: '#FDE8D0',
  error: '#E63946',
  errorLight: '#FDEAEB',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  success: '#22C55E',
  successLight: '#DCFCE7',
  freshnessRed: '#D94F3D',
  freshnessRedBg: '#FFF5F0',
  freshnessAmber: '#E8903A',
  freshnessGreen: '#2D6A4F',
  freshnessGreenBg: '#EFF7F2',
  white: '#FFFFFF',
  border: '#E8E8E3',
  borderLight: '#F0F0EB',
  surface: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.4)',
  cardBg: '#FFFFFF',
  inputBg: '#F5F5F0',
  skeleton: '#E8E8E3',
  skeletonHighlight: '#F5F5F0',
} as const;

export const DARK_COLORS = {
  background: (Platform.select({ ios: '#161616', android: '#141414' }) ?? '#161616'),
  primary: '#2D6A4F',
  primaryLight: '#52B788',
  primaryMuted: '#1C2E26',
  text: '#F2F2F0',
  textSecondary: '#8D8D93',
  textMuted: '#48484A',
  cardLabel: '#636360',
  tabInactive: '#48484A',
  accent: '#F4A261',
  accentLight: '#2D1D0E',
  error: '#E63946',
  errorLight: '#2D1419',
  warning: '#F59E0B',
  warningLight: '#2D2208',
  success: '#22C55E',
  successLight: '#0F2A17',
  freshnessRed: '#D94F3D',
  freshnessRedBg: '#2A1614',
  freshnessAmber: '#E8903A',
  freshnessGreen: '#2D6A4F',
  freshnessGreenBg: '#1A2E24',
  white: '#1C1C1E',
  border: '#38383A',
  borderLight: '#2C2C2E',
  surface: '#1C1C1E',
  overlay: 'rgba(0,0,0,0.65)',
  cardBg: '#1C1C1E',
  inputBg: '#2C2C2E',
  skeleton: '#2C2C2E',
  skeletonHighlight: '#38383A',
} as const;

export const TOKENS = {
  colors: LIGHT_COLORS,
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    card: 22,
    full: 999,
  },
  shadows: {
    sm: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  typography: {
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontFamily: {
      regular: 'DMSans_400Regular',
      medium: 'DMSans_500Medium',
      semibold: 'DMSans_600SemiBold',
      bold: 'DMSans_700Bold',
    },
  },
} as const;

export type TokenColors = keyof typeof TOKENS.colors;
export type TokenSpacing = keyof typeof TOKENS.spacing;
