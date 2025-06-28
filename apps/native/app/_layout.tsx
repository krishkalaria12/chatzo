import '@/polyfills';
import { Stack } from 'expo-router';
import '../global.css';
import { ClerkProvider } from '@clerk/clerk-expo';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/use-color-scheme';
import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { setAndroidNavigationBar } from '@/lib/android-navigation-bar';
import * as SecureStore from 'expo-secure-store';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Clerk token cache for React Native
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const hasMounted = useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  const useIsomorphicLayoutEffect =
    Platform.OS === 'web' && typeof window === 'undefined'
      ? React.useEffect
      : React.useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === 'web') {
      document.documentElement.classList.add('bg-background');
    }
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, [colorScheme]);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexProvider client={convex}>
        <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name='(auth)' />
            <Stack.Screen name='(home)' />
            <Stack.Screen name='modal' options={{ title: 'Modal', presentation: 'modal' }} />
          </Stack>
        </GestureHandlerRootView>
      </ConvexProvider>
    </ClerkProvider>
  );
}
