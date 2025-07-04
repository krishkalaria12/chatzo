import React from 'react';
import { View } from 'react-native';
import Skeleton from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Assistant message loading placeholder (left aligned)
export const AssistantMessageSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <View className={cn('mb-4 px-4 items-start', className)}>
      <View className='w-full max-w-[90%] space-y-2'>
        <Skeleton height={16} width='100%' />
        <Skeleton height={16} width='90%' />
        <Skeleton height={16} width='70%' />
      </View>
    </View>
  );
};

// User message loading placeholder (right aligned)
export const UserMessageSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <View className={cn('mb-4 px-4 items-end', className)}>
      <View className='max-w-[85%] space-y-2 rounded-2xl rounded-br-md'>
        <Skeleton height={16} width='75%' />
        <Skeleton height={16} width='40%' />
      </View>
    </View>
  );
};