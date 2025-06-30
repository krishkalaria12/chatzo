import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NewChatButtonProps {
  onPress: () => void;
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Memoized component to prevent unnecessary re-renders
export const NewChatButton = React.memo<NewChatButtonProps>(
  ({ onPress, disabled = false, className, style, textStyle }) => {
    const { isDarkColorScheme } = useColorScheme();
    const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        className={cn(
          'flex-row items-center justify-center px-6 py-4 rounded-2xl shadow-sm',
          'active:opacity-80 transition-opacity',
          disabled && 'opacity-50',
          className
        )}
        style={[
          {
            backgroundColor: colors.primary,
          },
          style,
        ]}
        activeOpacity={0.8}
        // Performance optimization for touch handling
        delayPressIn={0}
        delayPressOut={100}
      >
        <MaterialIcons name='add' size={20} color='#FFFFFF' style={{ marginRight: 8 }} />
        <Text
          className='font-semibold text-base font-lora'
          style={[
            {
              color: '#FFFFFF',
            },
            textStyle,
          ]}
        >
          New Chat
        </Text>
      </TouchableOpacity>
    );
  }
);

NewChatButton.displayName = 'NewChatButton';
