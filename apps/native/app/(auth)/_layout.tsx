import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style='dark' />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f9fafb' },
        }}
      >
        <Stack.Screen name='signin' />
        <Stack.Screen name='signup' />
      </Stack>
    </>
  );
}
