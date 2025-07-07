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
import { useSearchDebounce } from '@/lib/utils/debounce';

import { AppHeader } from './app-header';
import { NewChatButton } from './new-chat-button';
import { EnhancedThreadList } from './enhanced-thread-list';
import { SearchInput } from './search-input';
import {
  SearchLoading,
  SearchEmpty,
  SearchError,
  SearchResultsCount,
} from './states/search-states';

interface DrawerContentProps extends DrawerContentComponentProps {}

// Enhanced error boundary for drawer
class DrawerErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DrawerContent error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Search state type
interface SearchState {
  query: string;
  isSearching: boolean;
  searchResults: Thread[];
  searchError: string | null;
  searchTotal: number;
  hasSearched: boolean;
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

  // Regular threads state management
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Search state management
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isSearching: false,
    searchResults: [],
    searchError: null,
    searchTotal: 0,
    hasSearched: false,
  });

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

  // Search function with proper error handling
  const performSearch = useCallback(
    async (query: string) => {
      if (!user?.id || !query.trim()) {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          searchResults: [],
          searchError: null,
          searchTotal: 0,
          hasSearched: false,
        }));
        return;
      }

      try {
        setSearchState(prev => ({
          ...prev,
          isSearching: true,
          searchError: null,
        }));

        const result = await chatAPI.searchThreads(user.id, query.trim(), 50, 0, false);

        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          searchResults: result.threads || [],
          searchTotal: result.total || 0,
          hasSearched: true,
        }));
      } catch (err) {
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          searchError: err instanceof Error ? err.message : 'Search failed',
          searchResults: [],
          searchTotal: 0,
          hasSearched: true,
        }));
      }
    },
    [user?.id]
  );

  // Debounced search function - using a simpler approach for now
  const debouncedSearchRef = React.useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = React.useCallback(
    (query: string) => {
      // Clear existing timeout
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current);
      }

      // Set new timeout
      debouncedSearchRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    },
    [performSearch]
  );

  // Cancel function for cleanup
  const cancelDebouncedSearch = React.useCallback(() => {
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
      debouncedSearchRef.current = null;
    }
  }, []);

  // Handle search query changes
  const handleSearchQueryChange = useCallback(
    (query: string) => {
      setSearchState(prev => ({
        ...prev,
        query,
      }));

      const trimmedQuery = query.trim();
      if (trimmedQuery.length > 0) {
        debouncedSearch(trimmedQuery);
      } else {
        // Clear search results when query is empty
        cancelDebouncedSearch();
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          searchResults: [],
          searchError: null,
          searchTotal: 0,
          hasSearched: false,
        }));
      }
    },
    [debouncedSearch, cancelDebouncedSearch]
  );

  // Clear search
  const handleClearSearch = useCallback(() => {
    cancelDebouncedSearch();
    setSearchState({
      query: '',
      isSearching: false,
      searchResults: [],
      searchError: null,
      searchTotal: 0,
      hasSearched: false,
    });
  }, [cancelDebouncedSearch]);

  // Retry search
  const handleRetrySearch = useCallback(() => {
    if (searchState.query.trim()) {
      performSearch(searchState.query);
    }
  }, [searchState.query, performSearch]);

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

  // Cleanup debounced search on unmount
  useEffect(() => {
    return () => {
      cancelDebouncedSearch();
    };
  }, [cancelDebouncedSearch]);

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
      const thread =
        threads.find(t => t._id === threadId) ||
        searchState.searchResults.find(t => t._id === threadId);
      if (thread) {
        setThreadToDelete(thread);
        setShowDeleteModal(true);
      }
    },
    [threads, searchState.searchResults]
  );

  // Handle thread title editing
  const handleThreadEdit = useCallback(
    async (threadId: string, newTitle: string) => {
      if (!user?.id) return;

      try {
        await chatAPI.updateThreadTitle(user.id, threadId, newTitle);

        // Update thread in both regular threads and search results
        setThreads(prev =>
          prev.map(t => (t._id === threadId ? { ...t, title: newTitle, updatedAt: Date.now() } : t))
        );

        setSearchState(prev => ({
          ...prev,
          searchResults: prev.searchResults.map(t =>
            t._id === threadId ? { ...t, title: newTitle, updatedAt: Date.now() } : t
          ),
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update thread title');
      }
    },
    [user?.id]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!threadToDelete || !user?.id) return;

    try {
      setDeleteLoading(true);
      await chatAPI.deleteThread(user.id, threadToDelete._id);

      // Remove thread from both regular threads and search results
      setThreads(prev => prev.filter(t => t._id !== threadToDelete._id));
      setSearchState(prev => ({
        ...prev,
        searchResults: prev.searchResults.filter(t => t._id !== threadToDelete._id),
        searchTotal: Math.max(0, prev.searchTotal - 1),
      }));

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

  // Determine what to display
  const isSearchMode = searchState.query.trim().length > 0;
  const threadsToShow = isSearchMode ? searchState.searchResults : threads;
  const isLoadingToShow = isSearchMode ? searchState.isSearching : loading;
  const errorToShow = isSearchMode ? searchState.searchError : error;

  // Render search results or regular threads
  const renderContent = () => {
    if (isSearchMode) {
      // Search mode
      if (searchState.isSearching) {
        return <SearchLoading query={searchState.query.trim()} />;
      }

      if (searchState.searchError) {
        return (
          <SearchError
            query={searchState.query.trim()}
            error={searchState.searchError}
            onRetry={handleRetrySearch}
            onClear={handleClearSearch}
          />
        );
      }

      if (searchState.hasSearched && searchState.searchResults.length === 0) {
        return <SearchEmpty query={searchState.query.trim()} onClear={handleClearSearch} />;
      }

      if (searchState.searchResults.length > 0) {
        // Show search results
        return (
          <View className='flex-1'>
            <SearchResultsCount count={searchState.searchTotal} query={searchState.query.trim()} />
            <EnhancedThreadList
              threads={searchState.searchResults}
              loading={false}
              error={null}
              currentThreadId={currentThreadId}
              onThreadSelect={handleThreadSelect}
              onThreadDelete={handleThreadDelete}
              onThreadEdit={handleThreadEdit}
              onRetry={handleRetrySearch}
              onRefresh={handleRetrySearch}
              refreshing={false}
            />
          </View>
        );
      }

      // Fallback: show loading if in search mode but no results yet
      return <SearchLoading query={searchState.query.trim()} />;
    }

    // Regular thread list mode
    return (
      <EnhancedThreadList
        threads={threads}
        loading={loading}
        error={error}
        currentThreadId={currentThreadId}
        onThreadSelect={handleThreadSelect}
        onThreadDelete={handleThreadDelete}
        onThreadEdit={handleThreadEdit}
        onRetry={handleRetry}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    );
  };

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

        {/* Search Input */}
        <View className='px-6 pb-4'>
          <SearchInput
            value={searchState.query}
            onChangeText={handleSearchQueryChange}
            onClear={handleClearSearch}
            loading={searchState.isSearching}
            placeholder='Search conversations...'
          />
        </View>

        {/* Thread List or Search Results */}
        <View className='flex-1'>{renderContent()}</View>

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
