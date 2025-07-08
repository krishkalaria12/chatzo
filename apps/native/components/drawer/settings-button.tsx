import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SettingsButtonProps {
  onPress: () => void;
  className?: string;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onPress, className }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={cn('flex-row items-center p-3 rounded-xl', className)}
      style={{ backgroundColor: colors.surface }}
    >
      <View
        className='w-8 h-8 rounded-full items-center justify-center mr-3'
        style={{ backgroundColor: colors.primary }}
      >
        <Text style={{ color: colors.background, fontSize: 16 }}>⚙️</Text>
      </View>

      <Text className='text-base font-medium font-lora' style={{ color: colors.text }}>
        Settings
      </Text>
    </TouchableOpacity>
  );
};
