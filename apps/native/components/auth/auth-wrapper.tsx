import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { router, usePathname } from 'expo-router';
import { AppContainer } from '../app-container';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  // For now, we'll use a simple state-based approach
  // In production, you'd use the actual auth queries from your Convex backend
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const pathname = usePathname();

  React.useEffect(() => {
    // Simulate checking auth status
    const checkAuth = async () => {
      // Here you would typically check if the user is authenticated
      // For now, we'll assume not authenticated to show the auth screen
      setIsLoading(false);
      setIsAuthenticated(false);
    };

    checkAuth();
  }, []);

  React.useEffect(() => {
    if (isLoading) return;

    const isAuthRoute =
      pathname.includes('auth') || pathname.includes('signin') || pathname.includes('signup');

    if (!isAuthenticated && !isAuthRoute) {
      // Redirect to sign in if not authenticated
      try {
        router.replace('/(auth)/signin' as any);
      } catch (error) {
        console.log('Navigation error:', error);
      }
    } else if (isAuthenticated && isAuthRoute) {
      // Redirect to main app if authenticated
      try {
        router.replace('/' as any);
      } catch (error) {
        console.log('Navigation error:', error);
      }
    }
  }, [isAuthenticated, isLoading, pathname]);

  if (isLoading) {
    return (
      <AppContainer>
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#3B82F6' />
          <Text className='mt-4 text-gray-600 text-lg'>Loading...</Text>
        </View>
      </AppContainer>
    );
  }

  return <>{children}</>;
}
