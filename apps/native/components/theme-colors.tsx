import { useColorScheme } from '@/lib/use-color-scheme';

export const useThemeColors = () => {
  const { isDarkColorScheme: isDark } = useColorScheme();

  return {
    // Main background colors
    bg: isDark ? '#0a0a0b' : '#fafafa', // background
    card: isDark ? '#0a0a0b' : '#ffffff', // card

    // Text colors
    text: isDark ? '#fafafa' : '#09090b', // foreground
    textSecondary: isDark ? '#a1a1aa' : '#71717a', // muted-foreground

    // UI elements
    border: isDark ? '#27272a' : '#e4e4e7', // border
    input: isDark ? '#27272a' : '#e4e4e7', // input background

    // Interactive elements
    primary: '#3b82f6', // primary blue
    primaryText: '#ffffff',

    // Status colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',

    // Legacy support (for existing components)
    icon: isDark ? '#fafafa' : '#09090b',
    invert: isDark ? '#09090b' : '#fafafa',
    secondary: isDark ? '#27272a' : '#f4f4f5',
    gradient: isDark ? ['#18181b', '#27272a'] : ['#f8fafc', '#ffffff'],
  };
};
