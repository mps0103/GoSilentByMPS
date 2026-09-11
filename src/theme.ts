/**
 * Single source of truth for colors, spacing, and radius.
 * Matches the original native Kotlin app's palette exactly.
 */
export const colors = {
  bg: '#0A0908',
  surface: '#1C1917',
  surface2: '#292524',
  amber: '#FBBF24',
  amberDeep: '#EA580C',
  textHi: '#F5F5F4',
  textLo: '#78716C',
  textDim: '#44403C',
} as const;

export const gradients = {
  amber: [colors.amber, colors.amberDeep] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

export const type = {
  hairline: '200' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
};
