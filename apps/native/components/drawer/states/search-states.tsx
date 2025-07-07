import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { SkeletonThreadItem } from '@/components/ui/skeleton';

interface SearchLoadingProps {
  query: string;
}

interface SearchEmptyProps {
  query: string;
  onClear?: () => void;
}

interface SearchErrorProps {
  query: string;
  error: string;
  onRetry: () => void;
  onClear?: () => void;
}

/**
 * Loading state while search is in progress
 */
export const SearchLoading: React.FC<SearchLoadingProps> = ({ query }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View className='flex-1 px-4 py-6'>
      {/* Search query indicator */}
      <View className='mb-6'>
        <Text
          className='text-sm font-medium font-lora text-center'
          style={{ color: colors.textSecondary }}
        >
          Searching for "{query}"...
        </Text>
      </View>

      {/* Skeleton loaders */}
      <View className='space-y-2'>
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonThreadItem key={index} />
        ))}
      </View>
    </View>
  );
};

/**
 * Empty state when no search results are found
 */
export const SearchEmpty: React.FC<SearchEmptyProps> = ({ query, onClear }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View className='flex-1 justify-center items-center px-6 py-12'>
      {/* Empty search icon */}
      <View
        className='w-16 h-16 rounded-full items-center justify-center mb-4'
        style={{ backgroundColor: colors.surface }}
      >
        <Ionicons name='search' size={32} color={colors.textSecondary} />
      </View>

      {/* Empty state text */}
      <Text
        className='text-lg font-semibold text-center mb-2 font-lora'
        style={{ color: colors.text }}
      >
        No conversations found
      </Text>

      <Text
        className='text-sm text-center leading-5 mb-6 font-lora'
        style={{ color: colors.textSecondary }}
      >
        We couldn't find any conversations matching{'\n'}"
        <Text className='font-medium'>{query}</Text>"
      </Text>

      {/* Suggestions */}
      <View className='mb-6'>
        <Text
          className='text-xs text-center mb-3 font-lora'
          style={{ color: colors.textSecondary }}
        >
          Try searching for:
        </Text>
        <View className='space-y-2'>
          <Text className='text-xs text-center font-lora' style={{ color: colors.textSecondary }}>
            • Keywords from your conversations
          </Text>
          <Text className='text-xs text-center font-lora' style={{ color: colors.textSecondary }}>
            • Topics you've discussed
          </Text>
          <Text className='text-xs text-center font-lora' style={{ color: colors.textSecondary }}>
            • Shorter search terms
          </Text>
        </View>
      </View>

      {/* Clear search button */}
      {onClear && (
        <TouchableOpacity
          onPress={onClear}
          className='px-6 py-3 rounded-xl border'
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
          activeOpacity={0.7}
        >
          <View className='flex-row items-center'>
            <Ionicons name='close' size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text className='font-medium font-lora' style={{ color: colors.primary }}>
              Clear Search
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Error state when search fails
 */
export const SearchError: React.FC<SearchErrorProps> = ({ query, error, onRetry, onClear }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View className='flex-1 justify-center items-center px-6 py-12'>
      {/* Error icon */}
      <View
        className='w-16 h-16 rounded-full items-center justify-center mb-4'
        style={{ backgroundColor: colors.surface }}
      >
        <Ionicons name='alert-circle-outline' size={32} color={CHATZO_COLORS.error} />
      </View>

      {/* Error text */}
      <Text
        className='text-lg font-semibold text-center mb-2 font-lora'
        style={{ color: colors.text }}
      >
        Search failed
      </Text>

      <Text
        className='text-sm text-center leading-5 mb-2 font-lora'
        style={{ color: colors.textSecondary }}
      >
        Could not search for "{query}"
      </Text>

      <Text
        className='text-xs text-center leading-4 mb-6 font-lora'
        style={{ color: colors.textSecondary }}
      >
        {error}
      </Text>

      {/* Action buttons */}
      <View className='flex-row space-x-3'>
        {/* Retry button */}
        <TouchableOpacity
          onPress={onRetry}
          className='flex-1 px-6 py-3 rounded-xl'
          style={{
            backgroundColor: colors.primary,
          }}
          activeOpacity={0.7}
        >
          <View className='flex-row items-center justify-center'>
            <Ionicons
              name='refresh'
              size={18}
              color={colors.background}
              style={{ marginRight: 8 }}
            />
            <Text className='font-medium font-lora' style={{ color: colors.background }}>
              Try Again
            </Text>
          </View>
        </TouchableOpacity>

        {/* Clear search button */}
        {onClear && (
          <TouchableOpacity
            onPress={onClear}
            className='flex-1 px-6 py-3 rounded-xl border'
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
            activeOpacity={0.7}
          >
            <View className='flex-row items-center justify-center'>
              <Ionicons name='close' size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text className='font-medium font-lora' style={{ color: colors.primary }}>
                Clear
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Search results count indicator
 */
export const SearchResultsCount: React.FC<{ count: number; query: string }> = ({
  count,
  query,
}) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  return (
    <View className='px-4 py-2 border-b' style={{ borderColor: colors.border }}>
      <Text className='text-sm font-medium font-lora' style={{ color: colors.textSecondary }}>
        {count} {count === 1 ? 'conversation' : 'conversations'} found for "{query}"
      </Text>
    </View>
  );
};
