import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';

interface ErrorThreadListProps {
  error: string;
  onRetry: () => void;
}

export const ErrorThreadList: React.FC<ErrorThreadListProps> = ({ error, onRetry }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View className='flex-1 justify-center items-center py-12 px-6'>
      <View
        className='w-16 h-16 rounded-full items-center justify-center mb-4'
        style={{ backgroundColor: colors.surface }}
      >
        <MaterialIcons name='error-outline' size={32} color={CHATZO_COLORS.error} />
      </View>

      <Text
        className='text-lg font-semibold text-center mb-2 font-lora'
        style={{
          color: colors.text,
        }}
      >
        Failed to load conversations
      </Text>

      <Text
        className='text-sm text-center leading-5 mb-6 font-lora'
        style={{
          color: colors.textSecondary,
        }}
      >
        {error}
      </Text>

      <TouchableOpacity
        onPress={onRetry}
        className='px-6 py-3 rounded-xl border'
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
        activeOpacity={0.7}
      >
        <View className='flex-row items-center'>
          <MaterialIcons
            name='refresh'
            size={18}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text
            className='font-medium font-lora'
            style={{
              color: colors.primary,
            }}
          >
            Try Again
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
