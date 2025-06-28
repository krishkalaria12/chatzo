import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { AppContainer } from '@/components/app-container';

export default function IndexScreen() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <AppContainer>
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#3B82F6' />
        </View>
      </AppContainer>
    );
  }

  if (isSignedIn) {
    return <Redirect href='/(home)' />;
  }

  return <Redirect href='/(auth)/signin' />;
}
