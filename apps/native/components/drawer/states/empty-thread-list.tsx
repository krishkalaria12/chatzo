import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';

export const EmptyThreadList: React.FC = () => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View className='flex-1 justify-center items-center py-12 px-6'>
      <View
        className='w-16 h-16 rounded-full items-center justify-center mb-4'
        style={{ backgroundColor: colors.surface }}
      >
        <MaterialIcons name='chat-bubble-outline' size={32} color={colors.textSecondary} />
      </View>

      <Text
        className='text-lg font-semibold text-center mb-2 font-lora'
        style={{
          color: colors.text,
        }}
      >
        No conversations yet
      </Text>

      <Text
        className='text-sm text-center leading-5 font-lora'
        style={{
          color: colors.textSecondary,
        }}
      >
        Start a new conversation to see your chat history here
      </Text>
    </View>
  );
};
