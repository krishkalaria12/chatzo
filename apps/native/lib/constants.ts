export const NAV_THEME = {
  light: {
    background: 'hsl(0 0% 100%)',
    border: 'hsl(220 13% 91%)',
    card: 'hsl(0 0% 100%)',
    notification: 'hsl(0 84.2% 60.2%)',
    primary: 'hsl(221.2 83.2% 53.3%)',
    text: 'hsl(222.2 84% 4.9%)',
  },
  dark: {
    background: 'hsl(222.2 84% 4.9%)',
    border: 'hsl(217.2 32.6% 17.5%)',
    card: 'hsl(222.2 84% 4.9%)',
    notification: 'hsl(0 72% 51%)',
    primary: 'hsl(217.2 91.2% 59.8%)',
    text: 'hsl(210 40% 98%)',
  },
};

// Chatzo Brand Color Palette
export const CHATZO_COLORS = {
  // Primary brand colors from the palette
  primary: {
    50: '#F0F4FF', // Lightest blue
    100: '#E0ECFF',
    200: '#C7D8FF',
    300: '#A3BFFF',
    400: '#5B5E97', // From palette - darker blue
    500: '#4338CA', // Main primary
    600: '#3730A3',
    700: '#312E81',
    800: '#1E1B4B',
    900: '#0F0E2E',
  },

  // Secondary colors
  secondary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Accent colors from palette
  accent: {
    yellow: '#FFC145', // From palette
    orange: '#FF6B6C', // From palette
    purple: '#B8B8D1', // From palette
    blue: '#5B5E97', // From palette
  },

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Neutral colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Theme specific colors
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#E4E4E7',
    text: '#09090B',
    textSecondary: '#71717A',
    primary: '#5B5E97',
    accent: '#FFC145',
    destructive: '#EF4444',
  },

  dark: {
    background: '#0A0A0B',
    surface: '#18181B',
    border: '#27272A',
    text: '#FAFAFA',
    textSecondary: '#A1A1AA',
    primary: '#FFC145', // Changed to accent color for better visibility
    accent: '#FFC145',
    destructive: '#EF4444',
  },
};
