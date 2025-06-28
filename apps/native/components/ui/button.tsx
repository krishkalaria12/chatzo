import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  style,
  ...props
}: ButtonProps) {
  const { isDarkColorScheme } = useColorScheme();
  const isDisabled = disabled || loading;

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 'h-9',
      padding: 'px-3 py-2',
      fontSize: 'text-sm',
      iconSize: 16,
      borderRadius: 'rounded-md',
    },
    md: {
      height: 'h-12',
      padding: 'px-6 py-3',
      fontSize: 'text-base',
      iconSize: 20,
      borderRadius: 'rounded-lg',
    },
    lg: {
      height: 'h-14',
      padding: 'px-8 py-4',
      fontSize: 'text-lg',
      iconSize: 24,
      borderRadius: 'rounded-xl',
    },
  };

  // Variant configurations for light mode
  const lightVariants = {
    primary: {
      bg: 'bg-blue-600',
      bgPressed: 'bg-blue-700',
      bgDisabled: 'bg-gray-300',
      text: 'text-white',
      textDisabled: 'text-gray-500',
      border: '',
      shadow: 'shadow-sm',
    },
    secondary: {
      bg: 'bg-gray-100',
      bgPressed: 'bg-gray-200',
      bgDisabled: 'bg-gray-50',
      text: 'text-gray-900',
      textDisabled: 'text-gray-400',
      border: '',
      shadow: '',
    },
    outline: {
      bg: 'bg-transparent',
      bgPressed: 'bg-gray-50',
      bgDisabled: 'bg-transparent',
      text: 'text-gray-700',
      textDisabled: 'text-gray-400',
      border: 'border border-gray-300',
      shadow: '',
    },
    ghost: {
      bg: 'bg-transparent',
      bgPressed: 'bg-gray-100',
      bgDisabled: 'bg-transparent',
      text: 'text-gray-700',
      textDisabled: 'text-gray-400',
      border: '',
      shadow: '',
    },
    destructive: {
      bg: 'bg-red-600',
      bgPressed: 'bg-red-700',
      bgDisabled: 'bg-gray-300',
      text: 'text-white',
      textDisabled: 'text-gray-500',
      border: '',
      shadow: 'shadow-sm',
    },
  };

  // Variant configurations for dark mode
  const darkVariants = {
    primary: {
      bg: 'bg-blue-500',
      bgPressed: 'bg-blue-600',
      bgDisabled: 'bg-gray-700',
      text: 'text-white',
      textDisabled: 'text-gray-500',
      border: '',
      shadow: 'shadow-sm',
    },
    secondary: {
      bg: 'bg-gray-700',
      bgPressed: 'bg-gray-600',
      bgDisabled: 'bg-gray-800',
      text: 'text-white',
      textDisabled: 'text-gray-500',
      border: '',
      shadow: '',
    },
    outline: {
      bg: 'bg-transparent',
      bgPressed: 'bg-gray-800',
      bgDisabled: 'bg-transparent',
      text: 'text-gray-300',
      textDisabled: 'text-gray-600',
      border: 'border border-gray-600',
      shadow: '',
    },
    ghost: {
      bg: 'bg-transparent',
      bgPressed: 'bg-gray-800',
      bgDisabled: 'bg-transparent',
      text: 'text-gray-300',
      textDisabled: 'text-gray-600',
      border: '',
      shadow: '',
    },
    destructive: {
      bg: 'bg-red-500',
      bgPressed: 'bg-red-600',
      bgDisabled: 'bg-gray-700',
      text: 'text-white',
      textDisabled: 'text-gray-500',
      border: '',
      shadow: 'shadow-sm',
    },
  };

  const variants = isDarkColorScheme ? darkVariants : lightVariants;
  const config = sizeConfig[size];
  const variantConfig = variants[variant];

  // Build button classes
  const getButtonClasses = () => {
    let classes = `${config.height} ${config.padding} ${config.borderRadius} flex-row items-center justify-center`;

    if (fullWidth) {
      classes += ' w-full';
    }

    if (isDisabled) {
      classes += ` ${variantConfig.bgDisabled}`;
    } else {
      classes += ` ${variantConfig.bg} ${variantConfig.shadow}`;
    }

    if (variantConfig.border) {
      classes += ` ${variantConfig.border}`;
    }

    if (className) {
      classes += ` ${className}`;
    }

    return classes;
  };

  const getTextColor = () => {
    return isDisabled ? variantConfig.textDisabled : variantConfig.text;
  };

  const getIconColor = () => {
    if (isDarkColorScheme) {
      return isDisabled ? '#6B7280' : '#FFFFFF';
    }
    return isDisabled
      ? '#9CA3AF'
      : variant === 'primary' || variant === 'destructive'
        ? '#FFFFFF'
        : '#374151';
  };

  return (
    <TouchableOpacity
      className={getButtonClasses()}
      disabled={isDisabled}
      style={[
        {
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size='small' color={getIconColor()} />
      ) : (
        <View className='flex-row items-center justify-center'>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={config.iconSize}
              color={getIconColor()}
              style={{ marginRight: 8 }}
            />
          )}

          <Text className={`font-semibold ${config.fontSize} ${getTextColor()}`} numberOfLines={1}>
            {title}
          </Text>

          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={config.iconSize}
              color={getIconColor()}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
