import React from 'react';
import { View, Text } from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface SettingsErrorProps {
  error: string;
  onRetry: () => void;
}

export const SettingsError: React.FC<SettingsErrorProps> = ({ error, onRetry }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View className='flex-1 justify-center items-center p-6'>
      <View className='items-center max-w-sm'>
        <Text className='text-6xl mb-4' style={{ color: colors.textSecondary }}>
          ⚠️
        </Text>

        <Text
          className='text-xl font-bold mb-2 text-center font-lora'
          style={{ color: colors.text }}
        >
          Something went wrong
        </Text>

        <Text className='text-center mb-6 leading-relaxed' style={{ color: colors.textSecondary }}>
          {error}
        </Text>

        <Button onPress={onRetry} className='w-full' style={{ backgroundColor: colors.primary }}>
          <Text style={{ color: colors.background }}>Try Again</Text>
        </Button>
      </View>
    </View>
  );
};
