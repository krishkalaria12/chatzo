import React, { useCallback, useRef, useEffect, memo } from 'react';
import { View, Animated, TouchableOpacity } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useColorScheme } from '@/lib/use-color-scheme';
import { useThemeColors } from '@/components/theme-colors';

interface ThemeToggleProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
}

const ThemeToggleComponent: React.FC<ThemeToggleProps> = ({ value, onChange, className = '' }) => {
  const { isDarkColorScheme: isDark, toggleColorScheme: toggleTheme } = useColorScheme();
  const colors = useThemeColors();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  // Memoize the animation configuration
  const springConfig = useRef({
    useNativeDriver: true,
    bounciness: 4,
    speed: 12,
  }).current;

  // Update thumb position when theme changes
  useEffect(() => {
    const isActive = value !== undefined ? value : isDark;
    Animated.spring(slideAnim, {
      toValue: isActive ? 6 : 0.5,
      ...springConfig,
    }).start();
  }, [isDark, value, slideAnim, springConfig]);

  // Memoize the interpolation config
  const translateInterpolation = useRef(
    slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 7],
    })
  ).current;

  const handlePress = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const newValue = value !== undefined ? !value : !isDark;
    if (onChange) {
      onChange(newValue);
    } else {
      toggleTheme();
    }

    // Animate the switch
    Animated.spring(slideAnim, {
      toValue: newValue ? 6 : 0.5,
      ...springConfig,
    }).start(() => {
      isAnimatingRef.current = false;
    });
  }, [isDark, value, onChange, toggleTheme, slideAnim, springConfig]);

  // Memoize the active state
  const isActive = value !== undefined ? value : isDark;

  // Memoize icon color to prevent unnecessary style object creation
  const iconColor = colors.icon;

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`flex-row items-center py-1 ${className}`}
      activeOpacity={0.7}
    >
      <View className='w-20 h-10 rounded-full flex-row items-center justify-between'>
        <View className='absolute w-full h-full rounded-full bg-neutral-200 dark:bg-[#323232]' />

        {/* Sun icon on left */}
        <View className='z-10 w-8 h-8 items-center justify-center ml-1'>
          <Feather name='sun' size={16} color={iconColor} />
        </View>

        {/* Moon icon on right */}
        <View className='z-10 w-8 h-8 items-center justify-center mr-1'>
          <Feather name='moon' size={16} color={iconColor} />
        </View>

        {/* Animated thumb */}
        <Animated.View
          style={{
            transform: [{ translateX: translateInterpolation }],
            position: 'absolute',
            left: 1,
          }}
          className='w-8 h-8 bg-white dark:bg-dark-primary rounded-full shadow-sm my-0.5'
        />
      </View>
    </TouchableOpacity>
  );
};

// Memoize the entire component
export const ThemeToggle = memo(ThemeToggleComponent);
