import React, { useState, useRef } from 'react';
import { View, Animated, TouchableOpacity, InteractionManager } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useColorScheme } from '@/lib/use-color-scheme';
import { useThemeColors } from '@/components/theme-colors';

interface ThemeToggleProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ value, onChange, className = '' }) => {
  const { isDarkColorScheme: isDark, toggleColorScheme: toggleTheme } = useColorScheme();
  const colors = useThemeColors();
  const slideAnim = useRef(
    new Animated.Value(value !== undefined ? (value ? 0 : 0.5) : isDark ? 0 : 0.5)
  ).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePress = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const newValue = value !== undefined ? !value : !isDark;
    if (onChange) {
      onChange(newValue);
    } else {
      toggleTheme();
    }
    // Animate the switch
    Animated.spring(slideAnim, {
      toValue: newValue ? 6 : 0.5,
      useNativeDriver: true,
      bounciness: 4,
      speed: 12,
    }).start(() => setIsAnimating(false));
  };

  const isActive = value !== undefined ? value : isDark;

  return (
    <TouchableOpacity onPress={handlePress} className={`flex-row items-center py-1 ${className}`}>
      <View className='w-20 h-10 rounded-full flex-row items-center justify-between'>
        <View className='absolute w-full h-full rounded-full bg-neutral-200 dark:bg-[#323232]' />

        {/* Sun icon on left */}
        <View className='z-10 w-8 h-8 items-center justify-center ml-1'>
          <Feather name='sun' size={16} color={isActive ? colors.icon : colors.icon} />
        </View>

        {/* Moon icon on right */}
        <View className='z-10 w-8 h-8 items-center justify-center mr-1'>
          <Feather name='moon' size={16} color={isActive ? colors.icon : colors.icon} />
        </View>

        {/* Animated thumb */}
        <Animated.View
          style={{
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 7],
                }),
              },
            ],
            position: 'absolute',
            left: 1,
          }}
          className='w-8 h-8 bg-white dark:bg-dark-primary rounded-full shadow-sm my-0.5'
        />
      </View>
    </TouchableOpacity>
  );
};
