import React, { useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, ViewStyle, RefreshControl, InteractionManager } from 'react-native';
import { FlashList, ListRenderItem, FlashListProps } from '@shopify/flash-list';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';

// Generic interface for list items
interface ListItem {
  _id?: string;
  id?: string;
}

// Enhanced FlashList props extending base FlashList props
interface EnhancedFlashListProps<T extends ListItem>
  extends Omit<FlashListProps<T>, 'renderItem' | 'keyExtractor'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;

  // Enhanced features
  showSeparator?: boolean;
  separatorHeight?: number;
  separatorColor?: string;

  // Loading states
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;

  // Empty states
  emptyComponent?: React.ComponentType;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: string; onRetry: () => void }>;
  error?: string | null;
  onRetry?: () => void;

  // Performance optimizations
  estimatedItemSize?: number;
  overrideItemLayout?: (layout: { span?: number; size?: number }, item: T, index: number) => void;

  // Custom styling
  containerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

// Ref interface for imperative actions
export interface EnhancedFlashListRef {
  scrollToTop: () => void;
  scrollToIndex: (index: number, animated?: boolean) => void;
  recordInteraction: () => void;
}

// Memoized separator component factory
const createSeparatorComponent = (height: number, color?: string) => {
  return React.memo(() => (
    <View
      style={{
        height,
        backgroundColor: color || 'transparent',
      }}
    />
  ));
};

export const EnhancedFlashList = forwardRef<EnhancedFlashListRef, EnhancedFlashListProps<any>>(
  function EnhancedFlashList(
    {
      data,
      renderItem,
      keyExtractor,

      // Enhanced features
      showSeparator = false,
      separatorHeight = 8,
      separatorColor,

      // Loading states
      loading = false,
      refreshing = false,
      onRefresh,

      // Empty states
      emptyComponent: EmptyComponent,
      loadingComponent: LoadingComponent,
      errorComponent: ErrorComponent,
      error,
      onRetry,

      // Performance
      estimatedItemSize = 80,
      overrideItemLayout,

      // Styling
      containerStyle,
      contentContainerStyle,

      // Pass through props
      ...flashListProps
    },
    ref
  ) {
    const { isDarkColorScheme } = useColorScheme();
    const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

    // Internal ref to FlashList
    const flashListRef = React.useRef<FlashList<any>>(null);

    // Expose imperative methods
    useImperativeHandle(
      ref,
      () => ({
        scrollToTop: () => {
          // Use InteractionManager for smooth scrolling
          InteractionManager.runAfterInteractions(() => {
            flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
          });
        },
        scrollToIndex: (index: number, animated = true) => {
          InteractionManager.runAfterInteractions(() => {
            flashListRef.current?.scrollToIndex({ index, animated });
          });
        },
        recordInteraction: () => {
          flashListRef.current?.recordInteraction();
        },
      }),
      []
    );

    // Optimized key extractor with fallback
    const optimizedKeyExtractor = useCallback(
      (item: any, index: number): string => {
        if (keyExtractor) {
          return keyExtractor(item, index);
        }
        return item._id || item.id || `item-${index}`;
      },
      [keyExtractor]
    );

    // Memoized separator component
    const SeparatorComponent = useMemo(() => {
      if (!showSeparator) return undefined;
      return createSeparatorComponent(separatorHeight, separatorColor);
    }, [showSeparator, separatorHeight, separatorColor]);

    // Memoized empty component
    const ListEmptyComponent = useMemo(() => {
      if (loading && LoadingComponent) {
        return <LoadingComponent />;
      }

      if (error && ErrorComponent && onRetry) {
        return <ErrorComponent error={error} onRetry={onRetry} />;
      }

      if (EmptyComponent) {
        return <EmptyComponent />;
      }

      return null;
    }, [loading, error, LoadingComponent, ErrorComponent, EmptyComponent, onRetry]);

    // Optimized render item with error boundary
    const safeRenderItem = useCallback<ListRenderItem<any>>(
      info => {
        try {
          return renderItem(info);
        } catch (error) {
          console.error('FlashList render item error:', error);
          return <View style={{ height: estimatedItemSize }} />;
        }
      },
      [renderItem, estimatedItemSize]
    );

    // Refresh control configuration
    const refreshControl = useMemo(() => {
      if (!onRefresh) return undefined;

      return (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
          // Performance optimization
          progressViewOffset={0}
        />
      );
    }, [onRefresh, refreshing, colors]);

    // Enhanced performance configurations
    const performanceProps = useMemo(
      () => ({
        // Core performance settings
        estimatedItemSize,
        overrideItemLayout,

        // Optimized render settings
        removeClippedSubviews: true,
        maxToRenderPerBatch: 8, // Reduced for better performance
        windowSize: 8, // Reduced window size
        initialNumToRender: 8, // Reduced initial render
        updateCellsBatchingPeriod: 16, // Optimized for 60fps

        // Memory optimizations
        disableAutoLayout: estimatedItemSize > 0,

        // Scroll optimizations
        keyboardShouldPersistTaps: 'handled' as const,
        keyboardDismissMode: 'on-drag' as const,

        // Performance flags
        legacyImplementation: false,
        maintainVisibleContentPosition: undefined, // Let FlashList handle this
      }),
      [estimatedItemSize, overrideItemLayout]
    );

    return (
      <View style={[{ flex: 1 }, containerStyle]}>
        <FlashList
          ref={flashListRef}
          data={data}
          renderItem={safeRenderItem}
          keyExtractor={optimizedKeyExtractor}
          // Enhanced features
          ItemSeparatorComponent={SeparatorComponent}
          ListEmptyComponent={ListEmptyComponent}
          refreshControl={refreshControl}
          // Performance optimizations
          {...performanceProps}
          // Styling
          contentContainerStyle={{
            paddingVertical: 8,
            ...contentContainerStyle,
          }}
          // Accessibility
          accessible={true}
          accessibilityRole='list'
          // Pass through all other props
          {...flashListProps}
        />
      </View>
    );
  }
);

// Export with display name for debugging
EnhancedFlashList.displayName = 'EnhancedFlashList';
