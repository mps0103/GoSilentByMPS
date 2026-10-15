/**
 * Theme palettes. Every screen reads its colors through useTheme()
 * (src/lib/ThemeContext.tsx), so switching theme recolors the whole app live.
 * "Ember" matches the original native Kotlin app's palette exactly.
 */
export interface Palette {
  bg: string;
  surface: string;
  surface2: string;
  accent: string;
  accentDeep: string;
  /** Text and icons drawn on top of the accent gradient. */
  onAccent: string;
  textHi: string;
  textLo: string;
  textDim: string;
}

export interface Theme {
  id: string;
  name: string;
  dark: boolean;
  colors: Palette;
  gradient: [string, string];
}

function makeTheme(id: string, name: string, dark: boolean, colors: Palette): Theme {
  return {id, name, dark, colors, gradient: [colors.accent, colors.accentDeep]};
}

export const themes: Theme[] = [
  makeTheme('ember', 'Ember', true, {
    bg: '#0A0908',
    surface: '#1C1917',
    surface2: '#292524',
    accent: '#FBBF24',
    accentDeep: '#EA580C',
    onAccent: '#0A0908',
    textHi: '#F5F5F4',
    textLo: '#78716C',
    textDim: '#44403C',
  }),
  makeTheme('ocean', 'Ocean', true, {
    bg: '#050B14',
    surface: '#0F1A2A',
    surface2: '#1B2A3F',
    accent: '#38BDF8',
    accentDeep: '#6366F1',
    onAccent: '#050B14',
    textHi: '#F1F5F9',
    textLo: '#64748B',
    textDim: '#334155',
  }),
  makeTheme('forest', 'Forest', true, {
    bg: '#06100B',
    surface: '#102018',
    surface2: '#1C3326',
    accent: '#4ADE80',
    accentDeep: '#0D9488',
    onAccent: '#06100B',
    textHi: '#F0FDF4',
    textLo: '#6B8F7A',
    textDim: '#2F4A3B',
  }),
  makeTheme('rose', 'Rose', true, {
    bg: '#12070B',
    surface: '#221017',
    surface2: '#351A24',
    accent: '#FB7185',
    accentDeep: '#C026D3',
    onAccent: '#12070B',
    textHi: '#FFF1F2',
    textLo: '#9F7A85',
    textDim: '#4A2A35',
  }),
  makeTheme('aurora', 'Aurora', true, {
    bg: '#08061A',
    surface: '#15122E',
    surface2: '#241F45',
    accent: '#A78BFA',
    accentDeep: '#EC4899',
    onAccent: '#08061A',
    textHi: '#F5F3FF',
    textLo: '#7C7A9E',
    textDim: '#3A3660',
  }),
  makeTheme('daylight', 'Daylight', false, {
    bg: '#F7F3EE',
    surface: '#FFFFFF',
    surface2: '#E6DED3',
    accent: '#F59E0B',
    accentDeep: '#EA580C',
    onAccent: '#FFFFFF',
    textHi: '#1C1917',
    textLo: '#7C716A',
    textDim: '#BDB3A7',
  }),
];

export const DEFAULT_THEME_ID = 'ember';

export function getTheme(id: string | null | undefined): Theme {
  return themes.find(t => t.id === id) ?? themes[0];
}

/** '#RRGGBB' + opacity -> 'rgba(...)'. */
export function alpha(hex: string, opacity: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`;
}

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
