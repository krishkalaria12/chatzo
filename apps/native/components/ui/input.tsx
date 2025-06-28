import React, { forwardRef, useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  required?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      variant = 'outlined',
      size = 'md',
      disabled = false,
      required = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const { colorScheme } = useColorScheme();
    const [isFocused, setIsFocused] = useState(false);
    const isDark = colorScheme === 'dark';

    // Size configurations
    const sizeConfig = {
      sm: {
        height: 'h-10',
        padding: 'px-3 py-2',
        fontSize: 'text-sm',
        iconSize: 16,
      },
      md: {
        height: 'h-12',
        padding: 'px-4 py-3',
        fontSize: 'text-base',
        iconSize: 20,
      },
      lg: {
        height: 'h-14',
        padding: 'px-5 py-4',
        fontSize: 'text-lg',
        iconSize: 24,
      },
    };

    // Theme colors
    const colors = {
      light: {
        background: 'bg-white',
        backgroundFilled: 'bg-gray-50',
        border: 'border-gray-300',
        borderFocused: 'border-blue-500',
        borderError: 'border-red-500',
        text: 'text-gray-900',
        placeholder: 'text-gray-500',
        label: 'text-gray-700',
        error: 'text-red-600',
        hint: 'text-gray-500',
        icon: '#6B7280',
        iconFocused: '#3B82F6',
        disabled: 'bg-gray-100',
      },
      dark: {
        background: 'bg-gray-800',
        backgroundFilled: 'bg-gray-700',
        border: 'border-gray-600',
        borderFocused: 'border-blue-400',
        borderError: 'border-red-400',
        text: 'text-white',
        placeholder: 'text-gray-400',
        label: 'text-gray-300',
        error: 'text-red-400',
        hint: 'text-gray-400',
        icon: '#9CA3AF',
        iconFocused: '#60A5FA',
        disabled: 'bg-gray-700',
      },
    };

    const theme = isDark ? colors.dark : colors.light;
    const config = sizeConfig[size];

    // Build container classes
    const getContainerClasses = () => {
      let classes = `${config.height} flex-row items-center border rounded-lg ${config.padding}`;

      if (disabled) {
        classes += ` ${theme.disabled}`;
      } else if (variant === 'filled') {
        classes += ` ${theme.backgroundFilled} border-transparent`;
      } else {
        classes += ` ${theme.background}`;
      }

      if (error) {
        classes += ` ${theme.borderError}`;
      } else if (isFocused) {
        classes += ` ${theme.borderFocused} shadow-sm`;
      } else {
        classes += ` ${theme.border}`;
      }

      return classes;
    };

    const handleFocus = (e: any) => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const handleRightIconPress = () => {
      if (onRightIconPress && !disabled) {
        onRightIconPress();
      }
    };

    return (
      <View className='w-full'>
        {/* Label */}
        {label && (
          <View className='mb-2 flex-row items-center'>
            <Text className={`font-medium ${config.fontSize} ${theme.label}`}>{label}</Text>
            {required && <Text className={`ml-1 ${theme.error}`}>*</Text>}
          </View>
        )}

        {/* Input Container */}
        <View className={getContainerClasses()}>
          {/* Left Icon */}
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={config.iconSize}
              color={isFocused ? theme.iconFocused : theme.icon}
              style={{ marginRight: 12 }}
            />
          )}

          {/* Text Input */}
          <TextInput
            ref={ref}
            className={`flex-1 ${config.fontSize} ${theme.text}`}
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            style={[
              {
                fontFamily: 'System',
                includeFontPadding: false,
                textAlignVertical: 'center',
              },
              style,
            ]}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <TouchableOpacity
              onPress={handleRightIconPress}
              disabled={!onRightIconPress || disabled}
              className='ml-3'
              activeOpacity={0.7}
            >
              <Ionicons
                name={rightIcon}
                size={config.iconSize}
                color={isFocused ? theme.iconFocused : theme.icon}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Error Message */}
        {error && <Text className={`mt-1 text-sm ${theme.error}`}>{error}</Text>}

        {/* Hint Message */}
        {hint && !error && <Text className={`mt-1 text-sm ${theme.hint}`}>{hint}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';
