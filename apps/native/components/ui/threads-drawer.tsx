import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { useAuthStore } from '@/store/auth-store';
import { generateConvexApiUrl } from '@/lib/convex-utils';
import { Thread } from '@/lib/api/chat-api';

interface ThreadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onThreadSelect: (thread: Thread) => void;
  currentThreadId?: string;
  onNewThread: () => void;
}

interface ThreadsDrawerRef {
  refreshThreads: () => void;
}

export const ThreadsDrawer = forwardRef<ThreadsDrawerRef, ThreadsDrawerProps>(
  ({ isOpen, onClose, onThreadSelect, currentThreadId, onNewThread }, ref) => {
    const { isDarkColorScheme } = useColorScheme();
    const { user } = useAuthStore();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const colors = {
      background: isDarkColorScheme ? '#1f2937' : '#ffffff',
      surface: isDarkColorScheme ? '#374151' : '#f3f4f6',
      border: isDarkColorScheme ? '#4b5563' : '#e5e7eb',
      text: isDarkColorScheme ? '#f9fafb' : '#111827',
      textMuted: isDarkColorScheme ? '#9ca3af' : '#6b7280',
      primary: isDarkColorScheme ? '#3b82f6' : '#2563eb',
      overlay: 'rgba(0, 0, 0, 0.5)',
    };

    // Load threads function
    const loadThreads = async () => {
      if (!user?.clerkId) return;

      setLoading(true);
      setError(null);

      try {
        const url = generateConvexApiUrl(`/api/chat/threads?clerkId=${user.clerkId}&limit=30`);
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
          setThreads(data.threads || []);
          console.log('Threads loaded:', data.threads?.length || 0);
        } else {
          setError(data.error?.message || 'Failed to load threads');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load threads');
      } finally {
        setLoading(false);
      }
    };

    // Expose refresh function via ref
    useImperativeHandle(ref, () => ({
      refreshThreads: loadThreads,
    }));

    useEffect(() => {
      if (isOpen) {
        loadThreads();
      }
    }, [isOpen, user?.clerkId]);

    // Format date
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffHours < 1) {
        return 'Just now';
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
      } else if (diffDays < 7) {
        return `${Math.floor(diffDays)}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    };

    if (!isOpen) return null;

    return (
      <View className='absolute inset-0 z-50'>
        {/* Overlay */}
        <TouchableOpacity
          className='absolute inset-0'
          style={{ backgroundColor: colors.overlay }}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Drawer */}
        <View
          className='absolute left-0 top-0 bottom-0 w-80'
          style={{ backgroundColor: colors.background }}
        >
          {/* Header */}
          <View
            className='flex-row items-center justify-between p-4 border-b'
            style={{ borderColor: colors.border }}
          >
            <View className='flex-row items-center'>
              <Text className='text-lg font-semibold' style={{ color: colors.text }}>
                Chat History
              </Text>
              {/* Refresh button */}
              <TouchableOpacity onPress={loadThreads} className='ml-2 p-1' disabled={loading}>
                <MaterialIcons
                  name='refresh'
                  size={20}
                  color={loading ? colors.textMuted : colors.primary}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={onClose} className='p-1'>
              <MaterialIcons name='close' size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* New Chat Button */}
          <View className='p-4 border-b' style={{ borderColor: colors.border }}>
            <TouchableOpacity
              onPress={() => {
                onNewThread();
                onClose();
              }}
              className='flex-row items-center justify-center p-3 rounded-lg'
              style={{ backgroundColor: colors.primary }}
            >
              <MaterialIcons name='add' size={20} color='white' />
              <Text className='text-white font-medium ml-2'>New Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Threads List */}
          <ScrollView className='flex-1 p-4'>
            {loading ? (
              <View className='flex-1 justify-center items-center py-8'>
                <ActivityIndicator size='large' color={colors.primary} />
                <Text className='text-sm mt-2' style={{ color: colors.textMuted }}>
                  Loading threads...
                </Text>
              </View>
            ) : error ? (
              <View className='flex-1 justify-center items-center py-8'>
                <MaterialIcons name='error-outline' size={32} color={colors.textMuted} />
                <Text className='text-sm mt-2 text-center' style={{ color: colors.textMuted }}>
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={loadThreads}
                  className='mt-4 px-4 py-2 rounded-lg'
                  style={{ backgroundColor: colors.surface }}
                >
                  <Text className='text-sm font-medium' style={{ color: colors.text }}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : threads.length === 0 ? (
              <View className='flex-1 justify-center items-center py-8'>
                <MaterialIcons name='chat-bubble-outline' size={32} color={colors.textMuted} />
                <Text className='text-sm mt-2 text-center' style={{ color: colors.textMuted }}>
                  No chat history yet.{'\n'}Start a new conversation!
                </Text>
              </View>
            ) : (
              threads.map(thread => (
                <TouchableOpacity
                  key={thread.id}
                  onPress={() => {
                    onThreadSelect(thread);
                    onClose();
                  }}
                  className={`p-3 rounded-lg mb-2 ${
                    currentThreadId === thread.id ? 'border-2' : 'border'
                  }`}
                  style={{
                    backgroundColor: currentThreadId === thread.id ? colors.surface : 'transparent',
                    borderColor: currentThreadId === thread.id ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    className='font-medium text-sm'
                    style={{ color: colors.text }}
                    numberOfLines={2}
                  >
                    {thread.title}
                  </Text>
                  <View className='flex-row justify-between items-center mt-2'>
                    <Text className='text-xs' style={{ color: colors.textMuted }}>
                      {thread.messageCount} messages
                    </Text>
                    <Text className='text-xs' style={{ color: colors.textMuted }}>
                      {formatDate(thread.updatedAt)}
                    </Text>
                  </View>
                  {thread.settings?.modelId && (
                    <Text className='text-xs mt-1' style={{ color: colors.textMuted }}>
                      {thread.settings.modelId}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    );
  }
);

ThreadsDrawer.displayName = 'ThreadsDrawer';

// Export type for ref
export type { ThreadsDrawerRef };

// Export refresh hook for external use
export const useThreadsDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<ThreadsDrawerRef>(null);

  return {
    isOpen,
    openDrawer: () => setIsOpen(true),
    closeDrawer: () => setIsOpen(false),
    refreshThreads: () => drawerRef.current?.refreshThreads(),
    drawerRef,
  };
};
