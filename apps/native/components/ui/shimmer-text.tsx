import React, { useEffect, useState } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ShimmerTextProps {
  text: string;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  duration?: number; // animation cycle duration (ms)
  highlightColor?: string;
  baseColor?: string;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  text,
  className,
  style,
  textStyle,
  duration = 1800,
  highlightColor,
  baseColor,
}) => {
  const { isDarkColorScheme } = useColorScheme();
  const theme = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const translateX = useSharedValue(0);

  // Colors
  const _baseColor = baseColor || theme.textSecondary;
  const _highlightColor = highlightColor || theme.primary;

  useEffect(() => {
    if (dimensions.width === 0) return;
    // Start shimmer animation
    translateX.value = withRepeat(
      // Move full text width so the highlight sweeps through entirely.
      withTiming(dimensions.width, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [dimensions.width, duration, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View className={className} style={style}>
      <MaskedView
        maskElement={
          <Text
            onLayout={e =>
              setDimensions({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              })
            }
            numberOfLines={1}
            className={cn('font-nunito')}
            style={[
              {
                fontSize: 16,
                fontWeight: '500',
                letterSpacing: 0.5,
                color: 'black', // mask color
                opacity: 1,
              },
              textStyle,
            ]}
          >
            {text}
          </Text>
        }
      >
        {/* Gradient that slides under the mask */}
        {dimensions.width > 0 && (
          <Animated.View
            style={[
              {
                width: dimensions.width * 2, // twice the width for seamless loop
                height: dimensions.height,
              },
              animatedStyle,
            ]}
          >
            <LinearGradient
              // Use a stronger highlight contrast for better visibility especially in light mode
              colors={[_baseColor, _highlightColor, _baseColor]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        )}
      </MaskedView>
    </View>
  );
};

// Preset shimmer text components
export const TypingShimmer: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  if (!visible) return null;

  return (
    <ShimmerText
      text='Thinking...'
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
