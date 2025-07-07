import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SearchInputProps extends Omit<TextInputProps, 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
  placeholder = 'Search conversations...',
  disabled = false,
  loading = false,
  className,
  ...props
}) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animation values
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.surface],
  });

  // Handle focus state changes
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();

    // Add a subtle animation for the clear action
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = () => {
    // Close keyboard on submit
    Keyboard.dismiss();
    inputRef.current?.blur();
  };

  return (
    <Animated.View
      className={cn('relative', className)}
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Animated.View
        className='flex-row items-center px-4 py-3 rounded-xl border'
        style={{
          borderColor,
          backgroundColor,
          shadowColor: colors.primary,
          shadowOffset: {
            width: 0,
            height: isFocused ? 2 : 1,
          },
          shadowOpacity: isFocused ? 0.1 : 0.05,
          shadowRadius: isFocused ? 4 : 2,
          elevation: isFocused ? 3 : 1,
        }}
      >
        {/* Search Icon */}
        <Ionicons
          name='search'
          size={20}
          color={isFocused ? colors.primary : colors.textSecondary}
          style={{ marginRight: 12 }}
        />

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          editable={!disabled}
          returnKeyType='search'
          autoCorrect={false}
          autoCapitalize='none'
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
          className='flex-1 text-base font-lora'
          style={{
            color: colors.text,
            fontSize: 16,
            lineHeight: 20,
          }}
          {...props}
        />

        {/* Clear Button (Android) or Loading Indicator */}
        {Platform.OS === 'android' && (
          <View className='flex-row items-center'>
            {loading && (
              <Animated.View
                className='mr-2'
                style={{
                  opacity: focusAnim,
                }}
              >
                <Ionicons name='refresh' size={16} color={colors.primary} />
              </Animated.View>
            )}

            {value.length > 0 && !loading && (
              <TouchableOpacity
                onPress={handleClear}
                className='p-1 rounded-full'
                style={{
                  backgroundColor: colors.textSecondary + '20',
                }}
                activeOpacity={0.7}
                disabled={disabled}
              >
                <Ionicons name='close' size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Loading Indicator for iOS */}
        {Platform.OS === 'ios' && loading && (
          <Animated.View
            className='ml-2'
            style={{
              opacity: focusAnim,
            }}
          >
            <Ionicons name='refresh' size={16} color={colors.primary} />
          </Animated.View>
        )}
      </Animated.View>

      {/* Focus indicator line */}
      <Animated.View
        className='absolute bottom-0 left-4 right-4 h-0.5 rounded-full'
        style={{
          backgroundColor: colors.primary,
          opacity: focusAnim,
          transform: [
            {
              scaleX: focusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ],
        }}
      />
    </Animated.View>
  );
};
