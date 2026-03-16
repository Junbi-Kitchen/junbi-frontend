// Purpose: Single source of truth for all design tokens used across the app

import { Platform } from 'react-native';

export const TOKENS = {
  colors: {
    background: '#FAFAF7',
    primary: '#2D6A4F',
    primaryLight: '#52B788',
    primaryMuted: '#D8F3DC',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#F4A261',
    accentLight: '#FDE8D0',
    error: '#E63946',
    errorLight: '#FDEAEB',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    success: '#2D6A4F',
    successLight: '#D8F3DC',
    white: '#FFFFFF',
    border: '#E8E8E3',
    borderLight: '#F0F0EB',
    surface: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.4)',
    cardBg: '#FFFFFF',
    inputBg: '#F5F5F0',
    skeleton: '#E8E8E3',
    skeletonHighlight: '#F5F5F0',
  },
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
  },
} as const;

export type TokenColors = keyof typeof TOKENS.colors;
export type TokenSpacing = keyof typeof TOKENS.spacing;
