import React, { useEffect } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ShimmerTextProps {
  text: string;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  shimmerColors?: [string, string, string];
  duration?: number;
  autoStart?: boolean;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  text,
  className,
  style,
  textStyle,
  shimmerColors,
  duration = 2000,
  autoStart = true,
}) => {
  const { isDarkColorScheme } = useColorScheme();
  const theme = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  // Animation value for shimmer effect
  const shimmerValue = useSharedValue(0);

  // Default shimmer colors based on theme
  const defaultShimmerColors: [string, string, string] = isDarkColorScheme
    ? [theme.textSecondary, theme.text, theme.textSecondary]
    : [theme.textSecondary, theme.primary, theme.textSecondary];

  const colors = shimmerColors || defaultShimmerColors;

  useEffect(() => {
    if (autoStart) {
      shimmerValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: duration / 2 }),
          withTiming(0, { duration: duration / 2 })
        ),
        -1,
        false
      );
    }
  }, [autoStart, duration, shimmerValue]);

  // Create animated style for shimmer effect
  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerValue.value,
      [0, 0.5, 1],
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    const color = interpolate(shimmerValue.value, [0, 0.5, 1], [0, 1, 0], Extrapolation.CLAMP);

    // Interpolate between the shimmer colors
    const r1 = parseInt(colors[0].slice(1, 3), 16);
    const g1 = parseInt(colors[0].slice(3, 5), 16);
    const b1 = parseInt(colors[0].slice(5, 7), 16);

    const r2 = parseInt(colors[1].slice(1, 3), 16);
    const g2 = parseInt(colors[1].slice(3, 5), 16);
    const b2 = parseInt(colors[1].slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * color);
    const g = Math.round(g1 + (g2 - g1) * color);
    const b = Math.round(b1 + (b2 - b1) * color);

    return {
      opacity,
      color: `rgb(${r}, ${g}, ${b})`,
    };
  });

  return (
    <View className={className} style={style}>
      <Animated.Text
        className={cn('font-nunito')}
        style={[
          {
            fontSize: 16,
            fontWeight: '500',
            letterSpacing: 0.5,
          },
          textStyle,
          animatedTextStyle,
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
};

// Preset shimmer text components for common use cases
export const TypingShimmer: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  if (!visible) return null;

  return (
    <ShimmerText
      text='Chatzo is thinking...'
      className={cn('px-4 py-2')}
      textStyle={{
        fontSize: 14,
        fontWeight: '400',
      }}
      duration={1500}
    />
  );
};

export const LoadingShimmer: React.FC<{ text?: string; visible?: boolean }> = ({
  text = 'Loading...',
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <ShimmerText
      text={text}
      className={cn('px-2 py-1')}
      textStyle={{
        fontSize: 12,
        fontWeight: '400',
      }}
      duration={1800}
    />
  );
};
