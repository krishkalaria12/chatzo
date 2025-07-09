import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SettingsHeaderProps {
  onSignOut: () => void;
  showBackButton?: boolean;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  onSignOut,
  showBackButton = false,
}) => {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View
      className='px-6 py-4 border-b flex-row items-center justify-between'
      style={{ borderColor: colors.border }}
    >
      <View className='flex-row items-center flex-1'>
        {showBackButton && (
          <TouchableOpacity
            onPress={() => router.back()}
            className='mr-4 p-2 rounded-full'
            style={{ backgroundColor: colors.surface }}
          >
            <Text style={{ color: colors.text, fontSize: 16 }}>←</Text>
          </TouchableOpacity>
        )}

        <Text className='text-xl font-bold font-lora' style={{ color: colors.text }}>
          Settings
        </Text>
      </View>
    </View>
  );
};
