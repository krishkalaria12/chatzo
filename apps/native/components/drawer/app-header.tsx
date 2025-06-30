import React from 'react';
import { View, Text } from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  className?: string;
}

// Memoized component since it rarely changes
export const AppHeader = React.memo<AppHeaderProps>(({ className }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View
      className={cn('px-6 py-6 pt-8 border-b', className)}
      style={{ borderColor: colors.border }}
    >
      <Text
        className='text-2xl font-bold tracking-tight font-lora'
        style={{
          color: colors.text,
        }}
      >
        Chatzo
      </Text>
      <Text
        className='text-sm mt-1 font-lora'
        style={{
          color: colors.textSecondary,
        }}
      >
        AI Chat Assistant
      </Text>
    </View>
  );
});

AppHeader.displayName = 'AppHeader';
