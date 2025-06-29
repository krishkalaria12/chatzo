import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { AppContainer } from '@/components/app-container';
import { useAuthStore } from '@/store/auth-store';

export default function IndexScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { setUser, setSignedIn, setLoading } = useAuthStore();

  // Sync Clerk auth state with local store
  useEffect(() => {
    if (isLoaded) {
      setLoading(false);

      if (isSignedIn && user) {
        // User is authenticated, sync with store
        const storeUser = {
          id: user.id,
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.fullName || '',
          imageUrl: user.imageUrl || '',
        };

        setUser(storeUser);
        setSignedIn(true);
      } else {
        // User is not authenticated, clear store
        setUser(null);
        setSignedIn(false);
      }
    } else {
      setLoading(true);
    }
  }, [isLoaded, isSignedIn, user, setUser, setSignedIn, setLoading]);

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <AppContainer>
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#3B82F6' />
        </View>
      </AppContainer>
    );
  }

  // Handle authentication routing
  if (isSignedIn) {
    // User is signed in, redirect to home
    return <Redirect href='/(home)' />;
  } else {
    // User is not signed in, redirect to auth
    return <Redirect href='/(auth)/signin' />;
  }
}
