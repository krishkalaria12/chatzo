import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, InteractionManager, Text } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useUser } from '@clerk/clerk-expo';
import { chatAPI, Thread } from '@/lib/api/chat-api';
import { useThreadVersion } from '@/store/thread-version-store';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { AppContainer } from '@/components/app-container';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

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

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<Thread | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Handle thread deletion
  const handleThreadDelete = useCallback(
    (threadId: string) => {
      const thread = threads.find(t => t._id === threadId);
      if (thread) {
        setThreadToDelete(thread);
        setShowDeleteModal(true);
      }
    },
    [threads]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!threadToDelete || !user?.id) return;

    try {
      setDeleteLoading(true);
      await chatAPI.deleteThread(user.id, threadToDelete._id);

      // Remove thread from local state
      setThreads(prev => prev.filter(t => t._id !== threadToDelete._id));

      // If the deleted thread was currently active, navigate to home
      if (currentThreadId === threadToDelete._id) {
        InteractionManager.runAfterInteractions(() => {
          props.navigation.navigate('index');
          props.navigation.closeDrawer();
        });
      }

      setShowDeleteModal(false);
      setThreadToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete thread');
    } finally {
      setDeleteLoading(false);
    }
  }, [threadToDelete, user?.id, currentThreadId, props.navigation]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setThreadToDelete(null);
  }, []);

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
            onThreadDelete={handleThreadDelete}
            onRetry={handleRetry}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        </View>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          visible={showDeleteModal}
          title='Delete Thread'
          message={`Are you sure you want to delete "${threadToDelete?.title || 'this thread'}"? This action cannot be undone.`}
          confirmText='Delete'
          cancelText='Cancel'
          confirmVariant='destructive'
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={deleteLoading}
        />
      </AppContainer>
    </DrawerErrorBoundary>
  );
});

DrawerContent.displayName = 'DrawerContent';
