import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import Skeleton from '@/components/ui/skeleton';

export const SettingsLoading: React.FC = () => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View className='flex-1'>
      {/* Header skeleton */}
      <View
        className='px-6 py-4 border-b flex-row items-center'
        style={{ borderColor: colors.border }}
      >
        <Skeleton width={40} height={40} className='mr-4 rounded-full' />
        <Skeleton width={120} height={24} className='rounded-md' />
      </View>

      {/* Content skeleton */}
      <View className='p-6 space-y-6'>
        {/* Account section skeleton */}
        <View className='space-y-4'>
          <Skeleton width={150} height={20} className='rounded-md' />
          <View className='p-4 rounded-xl space-y-3' style={{ backgroundColor: colors.surface }}>
            <View className='flex-row items-center space-x-3'>
              <Skeleton width={60} height={60} className='rounded-full' />
              <View className='flex-1 space-y-2'>
                <Skeleton width='80%' height={18} className='rounded-md' />
                <Skeleton width='60%' height={14} className='rounded-md' />
              </View>
            </View>
            <View className='space-y-2'>
              <Skeleton width='40%' height={14} className='rounded-md' />
              <Skeleton width='90%' height={14} className='rounded-md' />
            </View>
          </View>
        </View>

        {/* Analytics section skeleton */}
        <View className='space-y-4'>
          <Skeleton width={120} height={20} className='rounded-md' />

          {/* Usage stats skeleton */}
          <View className='p-4 rounded-xl space-y-3' style={{ backgroundColor: colors.surface }}>
            <View className='flex-row justify-between'>
              <View className='space-y-2'>
                <Skeleton width={80} height={14} className='rounded-md' />
                <Skeleton width={60} height={24} className='rounded-md' />
              </View>
              <View className='space-y-2'>
                <Skeleton width={80} height={14} className='rounded-md' />
                <Skeleton width={60} height={24} className='rounded-md' />
              </View>
            </View>
            <View className='space-y-2'>
              <Skeleton width={100} height={14} className='rounded-md' />
              <Skeleton width='100%' height={120} className='rounded-md' />
            </View>
          </View>

          {/* Model usage skeleton */}
          <View className='p-4 rounded-xl space-y-3' style={{ backgroundColor: colors.surface }}>
            <Skeleton width={120} height={18} className='rounded-md' />
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} className='flex-row items-center justify-between py-2'>
                <View className='flex-1 space-y-1'>
                  <Skeleton width='70%' height={16} className='rounded-md' />
                  <Skeleton width='50%' height={12} className='rounded-md' />
                </View>
                <View className='items-end space-y-1'>
                  <Skeleton width={40} height={16} className='rounded-md' />
                  <Skeleton width={30} height={12} className='rounded-md' />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Sign out button skeleton */}
        <View className='pt-6'>
          <Skeleton width='100%' height={48} className='rounded-xl' />
        </View>
      </View>
    </View>
  );
};
