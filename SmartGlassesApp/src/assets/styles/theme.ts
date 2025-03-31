import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Color palette
export const colors = {
  primary: {
    light: '#4C84FF',
    default: '#2563EB',
    dark: '#1D4ED8',
  },
  secondary: {
    light: '#8B5CF6',
    default: '#7C3AED',
    dark: '#6D28D9',
  },
  success: {
    light: '#34D399',
    default: '#10B981',
    dark: '#059669',
  },
  danger: {
    light: '#F87171',
    default: '#EF4444',
    dark: '#DC2626',
  },
  warning: {
    light: '#FBBF24',
    default: '#F59E0B',
    dark: '#D97706',
  },
  info: {
    light: '#60A5FA',
    default: '#3B82F6',
    dark: '#2563EB',
  },
  neutral: {
    white: '#FFFFFF',
    lightest: '#F9FAFB',
    lighter: '#F3F4F6',
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
    darker: '#6B7280',
    darkest: '#374151',
    black: '#111827',
  },
  bluetooth: {
    active: '#0A84FF',
    connected: '#30D158',
    scanning: '#5E5CE6',
    disabled: '#9CA3AF',
  }
};

// Typography
export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Borders
export const borders = {
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    full: 9999,
  },
  width: {
    none: 0,
    thin: 1,
    thick: 2,
    heavy: 4,
  },
};

// Shadows
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
};

// Screen dimensions
export const screen = {
  width,
  height,
};

// Layout
export const layout = {
  container: {
    paddingHorizontal: spacing.md,
  },
};

// Theme object
export const theme = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  screen,
  layout,
};

export default theme; 