import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, TextInput } from 'react-native';
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
  onEdit?: (threadId: string, newTitle: string) => void;
}

// Optimized comparison function for React.memo
const areEqual = (prevProps: ThreadItemProps, nextProps: ThreadItemProps) => {
  return (
    prevProps.thread._id === nextProps.thread._id &&
    prevProps.thread.title === nextProps.thread.title &&
    prevProps.thread.settings?.modelId === nextProps.thread.settings?.modelId &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onEdit === nextProps.onEdit
    // onPress is assumed to be stable (wrapped in useCallback)
  );
};

// Memoized component with custom comparison
export const ThreadItem = React.memo<ThreadItemProps>(
  ({ thread, isActive, onPress, onDelete, onEdit }) => {
    const { isDarkColorScheme } = useColorScheme();
    const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

    const [showActionButtons, setShowActionButtons] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTitle, setEditingTitle] = useState(thread.title);
    const actionButtonsAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const showActions = () => {
      if (onDelete || onEdit) {
        setShowActionButtons(true);
        Animated.parallel([
          Animated.timing(actionButtonsAnim, {
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

    const hideActions = () => {
      if (showActionButtons) {
        Animated.parallel([
          Animated.timing(actionButtonsAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowActionButtons(false);
        });
      }
    };

    const handleLongPress = () => {
      if (!isEditing) {
        showActions();
      }
    };

    const handlePressOut = () => {
      if (showActionButtons && !isEditing) {
        // Hide action buttons after a delay
        setTimeout(() => {
          hideActions();
        }, 2000);
      }
    };

    const handleEditPress = () => {
      setIsEditing(true);
      setEditingTitle(thread.title);
      hideActions();
    };

    const handleEditSave = () => {
      if (onEdit && editingTitle.trim() !== thread.title) {
        onEdit(thread._id, editingTitle.trim());
      }
      setIsEditing(false);
    };

    const handleEditCancel = () => {
      setIsEditing(false);
      setEditingTitle(thread.title);
    };

    const handleDeletePress = () => {
      if (onDelete) {
        onDelete(thread._id);
      }
      hideActions();
    };

    const handleThreadPress = () => {
      if (!isEditing && !showActionButtons) {
        onPress();
      }
    };

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={handleThreadPress}
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
          disabled={isEditing}
        >
          <View className='flex-row items-center'>
            {isEditing ? (
              <View className='flex-1 flex-row items-center'>
                <TextInput
                  value={editingTitle}
                  onChangeText={setEditingTitle}
                  className='flex-1 font-medium text-base font-lora'
                  style={{
                    color: colors.text,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.primary,
                    paddingBottom: 2,
                  }}
                  autoFocus
                  selectTextOnFocus
                  returnKeyType='done'
                  onSubmitEditing={handleEditSave}
                  onBlur={handleEditCancel}
                  maxLength={100}
                />
                <View className='flex-row ml-2'>
                  <TouchableOpacity
                    onPress={handleEditSave}
                    className='p-1 rounded-full mr-1'
                    style={{
                      backgroundColor: colors.primary + '20',
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name='checkmark' size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleEditCancel}
                    className='p-1 rounded-full'
                    style={{
                      backgroundColor: colors.textSecondary + '20',
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name='close' size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
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

                {/* Action Buttons */}
                <Animated.View
                  style={{
                    opacity: actionButtonsAnim,
                    transform: [
                      {
                        scale: actionButtonsAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  }}
                  pointerEvents={showActionButtons ? 'auto' : 'none'}
                  className='flex-row'
                >
                  {onEdit && (
                    <TouchableOpacity
                      onPress={handleEditPress}
                      className='ml-2 p-1 rounded-full'
                      style={{
                        backgroundColor: colors.primary + '20',
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name='pencil' size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  {onDelete && (
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
                  )}
                </Animated.View>
              </>
            )}
          </View>

          {!isEditing && thread.settings?.modelId && (
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
  },
  areEqual
);

ThreadItem.displayName = 'ThreadItem';
