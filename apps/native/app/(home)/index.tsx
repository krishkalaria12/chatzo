import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '@/store/auth-store';
import { generateConvexApiUrl } from '@/lib/convex-utils';
import { AppContainer } from '@/components/app-container';
import { UserProfile } from '@/components/auth/user-profile';

export default function HomeScreen() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { setUser: setStoreUser, setSignedIn, setLoading, user: storeUser } = useAuthStore();

  // Sync user with Convex when authenticated
  const syncUserWithConvex = async (userData: any) => {
    try {
      const response = await fetch(generateConvexApiUrl('/api/user/sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: userData.clerkId,
          email: userData.email,
          name: userData.name,
          imageUrl: userData.imageUrl,
        }),
      });

      if (!response.ok) {
        console.error('Failed to sync user with Convex:', response.status);
      } else {
        const result = await response.json();
        console.log('User synced successfully:', result);
      }
    } catch (error) {
      console.error('Error syncing user with Convex:', error);
    }
  };

  // Update auth store when Clerk auth state changes
  useEffect(() => {
    if (authLoaded && userLoaded) {
      setSignedIn(isSignedIn);

      if (isSignedIn && user) {
        const storeUser = {
          id: user.id,
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.fullName || '',
          imageUrl: user.imageUrl || '',
        };

        setStoreUser(storeUser);

        // Sync with Convex backend
        syncUserWithConvex(storeUser);
      } else {
        setStoreUser(null);
      }

      setLoading(false);
    }
  }, [isSignedIn, user, authLoaded, userLoaded, setStoreUser, setSignedIn, setLoading]);

  if (!authLoaded || !userLoaded) {
    return (
      <AppContainer>
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#3B82F6' />
          <Text className='text-lg mt-4 text-muted-foreground'>Loading...</Text>
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <View className='flex-1 p-6'>
        {/* Header */}
        <View className='mb-8'>
          <Text className='text-3xl font-bold text-foreground mb-2'>Welcome to Chatzo! 🎉</Text>
          <Text className='text-lg text-muted-foreground'>Your AI-powered chat assistant</Text>
        </View>

        {/* User Greeting */}
        {user && (
          <View className='mb-8'>
            <Text className='text-xl text-foreground'>
              Hello, {user.fullName || user.emailAddresses[0]?.emailAddress}! 👋
            </Text>
            <Text className='text-muted-foreground mt-1'>Ready to start chatting with AI?</Text>
          </View>
        )}

        {/* User Profile Card */}
        <View className='flex-1 justify-center'>
          <UserProfile />
        </View>

        {/* Quick Stats */}
        <View className='mt-8 bg-card rounded-xl p-4 border border-border'>
          <Text className='text-lg font-semibold text-foreground mb-4'>Quick Stats</Text>
          <View className='flex-row justify-between'>
            <View className='items-center'>
              <Text className='text-2xl font-bold text-primary'>0</Text>
              <Text className='text-xs text-muted-foreground'>Chats</Text>
            </View>
            <View className='items-center'>
              <Text className='text-2xl font-bold text-primary'>0</Text>
              <Text className='text-xs text-muted-foreground'>Messages</Text>
            </View>
            <View className='items-center'>
              <Text className='text-2xl font-bold text-primary'>
                {user?.createdAt
                  ? Math.floor(
                      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    )
                  : 0}
              </Text>
              <Text className='text-xs text-muted-foreground'>Days</Text>
            </View>
          </View>
        </View>
      </View>
    </AppContainer>
  );
}
