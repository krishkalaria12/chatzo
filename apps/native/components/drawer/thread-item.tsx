import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Thread } from '@/lib/api/chat-api';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onPress: () => void;
}

// Optimized comparison function for React.memo
const areEqual = (prevProps: ThreadItemProps, nextProps: ThreadItemProps) => {
  return (
    prevProps.thread._id === nextProps.thread._id &&
    prevProps.thread.title === nextProps.thread.title &&
    prevProps.thread.settings?.modelId === nextProps.thread.settings?.modelId &&
    prevProps.isActive === nextProps.isActive
    // onPress is assumed to be stable (wrapped in useCallback)
  );
};

// Memoized component with custom comparison
export const ThreadItem = React.memo<ThreadItemProps>(({ thread, isActive, onPress }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  // No individual time display needed for threads

  return (
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'px-3 py-3 rounded-lg transition-all duration-200',
        isActive && 'bg-opacity-10'
      )}
      style={{
        backgroundColor: isActive ? colors.primary + '20' : 'transparent',
      }}
      activeOpacity={0.7}
      // Performance optimizations for touch handling
      delayPressIn={0}
      delayPressOut={50}
    >
      <View className='flex-row items-center'>
        <Text
          className='font-medium text-base font-lora flex-1'
          style={{
            color: isActive ? colors.primary : colors.text,
          }}
          numberOfLines={1}
          ellipsizeMode='tail'
          // Performance optimization: disable font scaling
          allowFontScaling={false}
        >
          {thread.title || 'Untitled Chat'}
        </Text>
      </View>

      {thread.settings?.modelId && (
        <Text
          className='text-xs mt-1 font-lora'
          style={{
            color: colors.textSecondary,
          }}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {thread.settings.modelId}
        </Text>
      )}
    </TouchableOpacity>
  );
}, areEqual);

ThreadItem.displayName = 'ThreadItem';
