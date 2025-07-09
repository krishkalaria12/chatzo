import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';

export default function SettingsLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='account' />
      <Stack.Screen name='analytics' />
      <Stack.Screen name='preferences' />
    </Stack>
  );
}
