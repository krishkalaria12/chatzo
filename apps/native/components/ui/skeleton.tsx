import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  className?: string;
  style?: ViewStyle;
  borderRadius?: number;
  animated?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  className,
  style,
  borderRadius = 8,
  animated = true,
}) => {
  const { isDarkColorScheme } = useColorScheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (animated) {
      opacity.value = withRepeat(withTiming(0.8, { duration: 1000 }), -1, true);
    }
  }, [animated, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animated ? opacity.value : 0.3,
    };
  });

  const baseColor = isDarkColorScheme ? CHATZO_COLORS.gray[700] : CHATZO_COLORS.gray[200];

  return (
    <View
      className={cn('overflow-hidden', className)}
      style={[
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: baseColor,
            borderRadius,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

export default Skeleton;

// Preset skeleton variants
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className,
}) => (
  <View className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={16}
        width={index === lines - 1 ? '60%' : '100%'}
        className='rounded-md'
      />
    ))}
  </View>
);

export const SkeletonThreadItem: React.FC<{ className?: string }> = ({ className }) => (
  <View className={cn('p-3 space-y-2', className)}>
    <Skeleton height={18} width='80%' className='rounded-md' />
    <View className='flex-row justify-between items-center'>
      <Skeleton height={14} width={100} className='rounded-sm' />
      <Skeleton height={14} width={60} className='rounded-sm' />
    </View>
    <Skeleton height={12} width={120} className='rounded-sm' />
  </View>
);
