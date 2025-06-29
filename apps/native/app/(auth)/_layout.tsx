import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // If user is already signed in, redirect to home
  if (isLoaded && isSignedIn) {
    return <Redirect href='/(home)' />;
  }

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
