import React from 'react';
import { View, Text } from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';

interface SectionHeaderProps {
  title: string;
}

// Memoized component since section headers are static
export const SectionHeader = React.memo<SectionHeaderProps>(({ title }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View className='px-3 py-2 mt-3 mb-1'>
      <Text
        className='text-xs font-semibold font-lora uppercase tracking-wide'
        style={{
          color: colors.textSecondary,
        }}
      >
        {title}
      </Text>
    </View>
  );
});

SectionHeader.displayName = 'SectionHeader';
