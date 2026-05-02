// Expenzo Design System — Claude-inspired Light Theme

export const Colors = {
  // Primary backgrounds (warm off-whites like Claude)
  background: '#F9F7F4',
  backgroundSecondary: '#F2EFE9',
  backgroundTertiary: '#EAE6DE',
  surface: '#FFFFFF',
  surfaceElevated: '#FEFEFE',

  // Brand colors (Claude's warm coral/orange-brown accent)
  primary: '#C96442',        // Claude's warm coral
  primaryLight: '#E8865F',
  primaryDark: '#A0472B',
  primaryMuted: '#F5E6DF',

  // Text hierarchy (Claude's warm dark tones)
  textPrimary: '#1A1510',
  textSecondary: '#5C5347',
  textTertiary: '#8A8177',
  textDisabled: '#B8B3AC',
  textInverse: '#FFFFFF',

  // Financial colors
  income: '#2E7D52',         // Forest green
  incomeLight: '#E8F5EE',
  expense: '#C0392B',        // Warm red
  expenseLight: '#FAE9E7',
  savings: '#1565C0',        // Deep blue
  savingsLight: '#E3F0FC',

  // Category colors (warm, curated palette)
  categories: {
    food: '#D4845A',
    transport: '#5B8DB8',
    shopping: '#C278B5',
    health: '#5BAB7D',
    entertainment: '#E6A817',
    housing: '#7B6FA0',
    education: '#4A90A4',
    travel: '#D4745A',
    utilities: '#8A9E6B',
    other: '#9E8F82',
  },

  // Borders & dividers
  border: '#E0DBD3',
  borderLight: '#EDE9E3',
  divider: '#F0ECE6',

  // Semantic
  success: '#2E7D52',
  successLight: '#E8F5EE',
  warning: '#C67C0E',
  warningLight: '#FDF3E3',
  error: '#C0392B',
  errorLight: '#FAE9E7',
  info: '#1565C0',
  infoLight: '#E3F0FC',

  // UI
  shadow: 'rgba(26, 21, 16, 0.08)',
  shadowStrong: 'rgba(26, 21, 16, 0.16)',
  overlay: 'rgba(26, 21, 16, 0.5)',
  overlayLight: 'rgba(26, 21, 16, 0.08)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Typography = {
  // Font families (Google Fonts equivalents of Claude's aesthetic)
  fontFamily: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
    display: 'Playfair_400Regular',
    displayMedium: 'Playfair_600SemiBold',
    mono: 'JetBrainsMono_400Regular',
  },

  // Type scale
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },

  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
    loose: 1.8,
  },

  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const Shadows = {
  none: {},
  xs: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.shadowStrong,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const CATEGORY_LIST = [
  { id: 'food', label: 'Food & Dining', icon: 'restaurant', color: Colors.categories.food },
  { id: 'transport', label: 'Transport', icon: 'directions-car', color: Colors.categories.transport },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-bag', color: Colors.categories.shopping },
  { id: 'health', label: 'Health', icon: 'favorite', color: Colors.categories.health },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie', color: Colors.categories.entertainment },
  { id: 'housing', label: 'Housing', icon: 'home', color: Colors.categories.housing },
  { id: 'education', label: 'Education', icon: 'school', color: Colors.categories.education },
  { id: 'travel', label: 'Travel', icon: 'flight', color: Colors.categories.travel },
  { id: 'utilities', label: 'Utilities', icon: 'bolt', color: Colors.categories.utilities },
  { id: 'other', label: 'Other', icon: 'more-horiz', color: Colors.categories.other },
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];
