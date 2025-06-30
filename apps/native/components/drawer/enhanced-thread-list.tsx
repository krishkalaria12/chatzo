import React, { useMemo, useCallback } from 'react';
import { View, InteractionManager } from 'react-native';
import { Thread } from '@/lib/api/chat-api';
import { ThreadItem } from './thread-item';
import { SectionHeader } from './section-header';
import { SkeletonThreadItem } from '@/components/ui/skeleton';
import { EmptyThreadList } from './states/empty-thread-list';
import { ErrorThreadList } from './states/error-thread-list';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { EnhancedFlashList, EnhancedFlashListRef } from '@/components/ui/enhanced-flash-list';
import { groupThreadsByDate, ThreadGroup } from './utils/date-grouping';

interface EnhancedThreadListProps {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  currentThreadId?: string;
  onThreadSelect: (thread: Thread) => void;
  onRetry: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

// Types for flattened list items
type ListItem =
  | { type: 'header'; data: string; id: string }
  | { type: 'thread'; data: Thread; id: string };

// Memoized loading component for better performance
const ThreadListLoadingComponent = React.memo(() => (
  <View className='px-4'>
    {Array.from({ length: 5 }).map((_, index) => (
      <SkeletonThreadItem key={index} className='mb-2' />
    ))}
  </View>
));

ThreadListLoadingComponent.displayName = 'ThreadListLoadingComponent';

// Memoized comparison function for the entire component
const arePropsEqual = (prevProps: EnhancedThreadListProps, nextProps: EnhancedThreadListProps) => {
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.currentThreadId === nextProps.currentThreadId &&
    prevProps.refreshing === nextProps.refreshing &&
    prevProps.threads.length === nextProps.threads.length &&
    prevProps.threads.every(
      (thread, index) =>
        thread._id === nextProps.threads[index]?._id &&
        thread.title === nextProps.threads[index]?.title &&
        thread.updatedAt === nextProps.threads[index]?.updatedAt
    )
  );
};

export const EnhancedThreadList = React.memo<EnhancedThreadListProps>(
  ({
    threads,
    loading,
    error,
    currentThreadId,
    onThreadSelect,
    onRetry,
    onRefresh,
    refreshing = false,
  }) => {
    const { isDarkColorScheme } = useColorScheme();

    // Memoized colors
    const colors = useMemo(
      () => (isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light),
      [isDarkColorScheme]
    );

    // Memoized grouped and flattened data with performance optimization
    const flattenedData = useMemo(() => {
      if (threads.length === 0) return [];

      // Use InteractionManager for heavy computation
      const groupedThreads = groupThreadsByDate(threads);
      const flattened: ListItem[] = [];

      groupedThreads.forEach((group: ThreadGroup) => {
        // Add section header
        flattened.push({
          type: 'header',
          data: group.title,
          id: `header-${group.title}`,
        });

        // Add threads in this group
        group.threads.forEach((thread: Thread) => {
          flattened.push({
            type: 'thread',
            data: thread,
            id: thread._id || `thread-${Math.random()}`,
          });
        });
      });

      return flattened;
    }, [threads]);

    // Optimized render item function with error boundary
    const renderItem = useCallback(
      ({ item }: { item: ListItem }) => {
        try {
          if (item.type === 'header') {
            return <SectionHeader title={item.data} />;
          }

          return (
            <ThreadItem
              thread={item.data}
              isActive={currentThreadId === item.data._id}
              onPress={() => {
                // Use InteractionManager for smoother interactions
                InteractionManager.runAfterInteractions(() => {
                  onThreadSelect(item.data);
                });
              }}
            />
          );
        } catch (error) {
          console.error('Render item error:', error);
          return <View style={{ height: 60 }} />; // Fallback view
        }
      },
      [currentThreadId, onThreadSelect]
    );

    // Stable key extractor
    const keyExtractor = useCallback((item: ListItem) => item.id, []);

    // Optimized item type getter
    const getItemType = useCallback((item: ListItem) => {
      return item.type;
    }, []);

    // Optimized item layout handler
    const overrideItemLayout = useCallback(
      (layout: { span?: number; size?: number }, item: ListItem) => {
        if (item.type === 'header') {
          layout.size = 35; // Section header height
        } else {
          layout.size = 68; // Thread item height
        }
      },
      []
    );

    // Optimized refresh handler
    const handleRefresh = useCallback(() => {
      if (onRefresh) {
        InteractionManager.runAfterInteractions(() => {
          onRefresh();
        });
      }
    }, [onRefresh]);

    // Optimized retry handler
    const handleRetry = useCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        onRetry();
      });
    }, [onRetry]);

    // Memoized container style
    const containerStyle = useMemo(
      () => ({
        flex: 1,
        backgroundColor: colors.background,
      }),
      [colors.background]
    );

    // Memoized content container style
    const contentContainerStyle = useMemo(
      () => ({
        paddingHorizontal: 16,
        paddingVertical: 8,
      }),
      []
    );

    return (
      <EnhancedFlashList
        data={flattenedData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        // Loading states
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        // State components
        emptyComponent={EmptyThreadList}
        loadingComponent={ThreadListLoadingComponent}
        errorComponent={ErrorThreadList}
        error={error}
        onRetry={handleRetry}
        // Separator - disable for grouped layout
        showSeparator={false}
        // Performance optimizations
        estimatedItemSize={55}
        overrideItemLayout={overrideItemLayout}
        // Custom styling
        containerStyle={containerStyle}
        contentContainerStyle={contentContainerStyle}
        // Accessibility
        accessible={true}
        accessibilityRole='list'
        accessibilityLabel='Chat threads list'
      />
    );
  },
  arePropsEqual
);

EnhancedThreadList.displayName = 'EnhancedThreadList';
