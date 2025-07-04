import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert } from 'react-native';
import { Thread } from '@/lib/api/chat-api';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onPress: () => void;
  onDelete?: (threadId: string) => void;
}

// Optimized comparison function for React.memo
const areEqual = (prevProps: ThreadItemProps, nextProps: ThreadItemProps) => {
  return (
    prevProps.thread._id === nextProps.thread._id &&
    prevProps.thread.title === nextProps.thread.title &&
    prevProps.thread.settings?.modelId === nextProps.thread.settings?.modelId &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.onDelete === nextProps.onDelete
    // onPress is assumed to be stable (wrapped in useCallback)
  );
};

// Memoized component with custom comparison
export const ThreadItem = React.memo<ThreadItemProps>(({ thread, isActive, onPress, onDelete }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const deleteButtonAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLongPress = () => {
    if (onDelete) {
      setShowDeleteButton(true);
      Animated.parallel([
        Animated.timing(deleteButtonAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (showDeleteButton) {
      // Hide delete button after a delay
      setTimeout(() => {
        setShowDeleteButton(false);
        Animated.parallel([
          Animated.timing(deleteButtonAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2000);
    }
  };

  const handleDeletePress = () => {
    if (onDelete) {
      onDelete(thread._id);
    }
    setShowDeleteButton(false);
    Animated.parallel([
      Animated.timing(deleteButtonAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        className={cn(
          'relative px-3 py-3 rounded-lg transition-all duration-200',
          isActive && 'bg-opacity-10'
        )}
        style={{
          backgroundColor: isActive ? colors.primary + '20' : 'transparent',
        }}
        activeOpacity={0.7}
        delayPressIn={0}
        delayPressOut={50}
        delayLongPress={500}
      >
        <View className='flex-row items-center'>
          <Text
            className='font-medium text-base font-lora flex-1'
            style={{
              color: isActive ? colors.primary : colors.text,
            }}
            numberOfLines={1}
            ellipsizeMode='tail'
            allowFontScaling={false}
          >
            {thread.title || 'Untitled Chat'}
          </Text>

          {/* Delete Button */}
          {onDelete && (
            <Animated.View
              style={{
                opacity: deleteButtonAnim,
                transform: [
                  {
                    scale: deleteButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              }}
              pointerEvents={showDeleteButton ? 'auto' : 'none'}
            >
              <TouchableOpacity
                onPress={handleDeletePress}
                className='ml-2 p-1 rounded-full'
                style={{
                  backgroundColor: colors.destructive + '20',
                }}
                activeOpacity={0.7}
              >
                <Ionicons name='trash' size={16} color={colors.destructive} />
              </TouchableOpacity>
            </Animated.View>
          )}
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
    </Animated.View>
  );
}, areEqual);

ThreadItem.displayName = 'ThreadItem';
