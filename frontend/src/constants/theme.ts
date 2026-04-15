export const Colors = {
  background: '#09090B',
  surface: '#18181B',
  surfaceElevated: '#27272A',
  primary: '#EAB308',
  primaryDark: '#CA8A04',
  primaryForeground: '#000000',
  secondary: '#27272A',
  secondaryForeground: '#FFFFFF',
  accentLive: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  textMain: '#FFFFFF',
  textSecondary: '#D4D4D8',
  textMuted: '#A1A1AA',
  textDim: '#71717A',
  border: '#27272A',
  borderLight: '#3F3F46',
  overlay: 'rgba(0,0,0,0.7)',
  cardBg: '#141416',
  inputBg: '#1C1C1E',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  hero: 34,
};

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 999,
};

export const CURRENCY = 'NAD';

export const formatCurrency = (amount: number): string => {
  return `${CURRENCY} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatOdds = (odds: number): string => {
  return odds.toFixed(2);
};
