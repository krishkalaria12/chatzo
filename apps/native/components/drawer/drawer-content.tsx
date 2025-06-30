import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, InteractionManager, Text } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useUser } from '@clerk/clerk-expo';
import { chatAPI, Thread } from '@/lib/api/chat-api';
import { useThreadVersion } from '@/store/thread-version-store';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { AppContainer } from '@/components/app-container';

import { AppHeader } from './app-header';
import { NewChatButton } from './new-chat-button';
import { EnhancedThreadList } from './enhanced-thread-list';

interface DrawerContentProps extends DrawerContentComponentProps {}

// Error boundary for the drawer content
class DrawerErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Drawer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Memoized drawer content component
export const DrawerContent = React.memo<DrawerContentProps>(props => {
  const { user } = useUser();
  const { isDarkColorScheme } = useColorScheme();

  // Memoized colors to prevent unnecessary re-renders
  const colors = useMemo(
    () => (isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light),
    [isDarkColorScheme]
  );

  // State management
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get the current active route - memoized for performance
  const currentThreadId = useMemo(() => {
    const { state } = props;
    const activeRoute = state?.routes[state.index];
    return (activeRoute?.params as any)?.id;
  }, [props.state]);

  // Thread version for refreshing on new thread creation
  const version = useThreadVersion(state => state.version);

  // Optimized load threads function with error handling
  const loadThreads = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Use InteractionManager for non-blocking operations
        await new Promise(resolve => {
          InteractionManager.runAfterInteractions(async () => {
            try {
              const { threads: fetchedThreads } = await chatAPI.getThreads(user.id, 30, 0, false);
              setThreads(fetchedThreads || []);
              resolve(void 0);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to load threads');
              resolve(void 0);
            }
          });
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load threads');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  // Load threads on mount and version change
  useEffect(() => {
    loadThreads();
  }, [loadThreads, version]);

  // Optimized callback handlers - wrapped in useCallback to prevent re-renders
  const handleNewChat = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      props.navigation.setParams({ newChat: Date.now().toString() });
      props.navigation.closeDrawer();
    });
  }, [props.navigation]);

  const handleThreadSelect = useCallback(
    (thread: Thread) => {
      if (thread._id) {
        InteractionManager.runAfterInteractions(() => {
          props.navigation.navigate('[id]', { id: thread._id });
          props.navigation.closeDrawer();
        });
      }
    },
    [props.navigation]
  );

  const handleRetry = useCallback(() => {
    loadThreads(false);
  }, [loadThreads]);

  const handleRefresh = useCallback(() => {
    loadThreads(true);
  }, [loadThreads]);

  // Fallback component for error boundary
  const ErrorFallback = useMemo(
    () => (
      <View className='flex-1 justify-center items-center p-6'>
        <AppHeader />
        <View className='flex-1 justify-center items-center'>
          <Text style={{ color: colors.text }}>Something went wrong with the drawer</Text>
        </View>
      </View>
    ),
    [colors.text]
  );

  return (
    <DrawerErrorBoundary fallback={ErrorFallback}>
      <AppContainer
        className='flex-1'
        style={{ backgroundColor: colors.background }}
        disableStatusBar={true}
      >
        {/* App Header */}
        <AppHeader />

        {/* New Chat Button */}
        <View className='px-6 py-4'>
          <NewChatButton onPress={handleNewChat} />
        </View>

        {/* Thread List */}
        <View className='flex-1'>
          <EnhancedThreadList
            threads={threads}
            loading={loading}
            error={error}
            currentThreadId={currentThreadId}
            onThreadSelect={handleThreadSelect}
            onRetry={handleRetry}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        </View>
      </AppContainer>
    </DrawerErrorBoundary>
  );
});

DrawerContent.displayName = 'DrawerContent';
