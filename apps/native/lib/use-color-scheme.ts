import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const THEME_STORAGE_KEY = '@chatzo/theme';

export function useColorScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativewindColorScheme();

  // Load saved theme on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
          setColorScheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading saved theme:', error);
      }
    };
    loadSavedTheme();
  }, [setColorScheme]);

  // Wrap the theme toggle to persist the new value
  const persistentToggleColorScheme = () => {
    const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
    toggleColorScheme();
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(error => {
      console.error('Error saving theme:', error);
    });
  };

  return {
    colorScheme: colorScheme ?? 'dark',
    isDarkColorScheme: colorScheme === 'dark',
    setColorScheme,
    toggleColorScheme: persistentToggleColorScheme,
  };
}
