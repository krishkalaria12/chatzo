import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Text, View, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { EnhancedFlashList } from '@/components/ui/enhanced-flash-list';
import type { EnhancedFlashListRef } from '@/components/ui/enhanced-flash-list';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useChat } from '@ai-sdk/react';
import { fetch as expoFetch } from 'expo/fetch';
import { AppContainer } from '@/components/app-container';
import { AutoResizingInput } from '@/components/ui/auto-resizing-input';
import { SuggestedPrompts } from '@/components/ui/suggested-prompts';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MessageRenderer } from '@/components/messages';
import { TypingShimmer } from '@/components/ui/shimmer-text';
import { useColorScheme } from '@/lib/use-color-scheme';
import { chatAPI, Thread } from '@/lib/api/chat-api';
import { generateConvexApiUrl } from '@/lib/convex-utils';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useThreadVersion } from '@/store/thread-version-store';
import { useModelsStore } from '@/store/models-store';
import { cn } from '@/lib/utils';
import { ImageAttachment, PDFAttachment } from '@/lib/types/attachments';

export default function HomePage() {
  const { user } = useUser();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const newChat = (params as Record<string, string>).newChat;
  const threadParam = (params as Record<string, string>).id as string | undefined;
  const listRef = useRef<EnhancedFlashListRef>(null);
  const { isDarkColorScheme } = useColorScheme();
  const { bump } = useThreadVersion();
  const { fetchModels } = useModelsStore();

  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Track whether we should auto-scroll to the bottom when new messages arrive.
  // The default behaviour is to auto-scroll, but if the user scrolls away from
  // the bottom we temporarily disable it until they return to the bottom.
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const lastHandledRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (newChat && newChat !== lastHandledRef.current) {
      handleNewThread();
      lastHandledRef.current = newChat;
    }
  }, [newChat]);

  // Use AI SDK's useChat hook with proper configuration
  // The latest AI SDK returns a `status` string instead of the previous
  // boolean `isLoading`. We still need a boolean throughout the component,
  // so we derive it from the status value for backwards-compatibility.
  const { messages, status, error, append, setMessages, stop } = useChat({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: generateConvexApiUrl('/api/chat/completions'),
    body: {
      clerkId: user?.id,
      model: selectedModel,
      thread_id: currentThread?._id,
      generate_title: true,
      enabledTools: webSearchEnabled ? ['web_search'] : [],
      maxSteps: 5,
      // Reduce UI updates while streaming so the JS thread stays responsive
      experimental_throttle: 80, // ms
    },
    onError: error => {
      console.error('Chat error:', error);

      // Don't show error for cancelled requests (when user clicks stop)
      if (
        error.message?.includes('Cancelled request') ||
        error.message?.includes('aborted') ||
        error.message?.includes('cancelled')
      ) {
        return; // Silently ignore cancelled requests
      }

      // Handle specific tool-related errors
      let errorMessage = error.message || 'Unknown error occurred';
      let errorTitle = 'Chat Error';

      if (error.message?.includes('tool')) {
        errorTitle = 'Tool Error';
        if (error.message?.includes('web_search')) {
          errorMessage = 'Web search failed. Please try again or disable web search.';
        } else if (error.message?.includes('NoSuchToolError')) {
          errorMessage = 'The requested tool is not available. Please try a different approach.';
        } else if (error.message?.includes('InvalidToolArgumentsError')) {
          errorMessage = 'Invalid tool parameters. Please rephrase your request.';
        } else if (error.message?.includes('ToolExecutionError')) {
          errorMessage = 'Tool execution failed. Please try again or disable tools.';
        }
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorTitle = 'Connection Error';
        errorMessage =
          'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorTitle = 'Timeout Error';
        errorMessage = 'Request timed out. Please try again with a shorter message.';
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: 'OK', style: 'default' },
        ...(webSearchEnabled && error.message?.includes('web_search')
          ? [
              {
                text: 'Disable Web Search',
                style: 'destructive' as const,
                onPress: () => setWebSearchEnabled(false),
              },
            ]
          : []),
        {
          text: 'Retry',
          style: 'default' as const,
          onPress: () => {
            // Retry the last message if there are messages
            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              if (lastMessage.role === 'user') {
                handleRetry(lastMessage.id, selectedModel);
              }
            }
          },
        },
      ]);
    },
    onFinish: () => {
      setTimeout(() => {
        refreshCurrentThread();
      }, 1500);
    },
    initialMessages: [],
  });

  // Derive isStreaming via useMemo
  const isLoading = useMemo(() => status === 'submitted' || status === 'streaming', [status]);

  // Sync user with Convex database
  const syncUserWithConvex = async () => {
    if (!user) return;

    try {
      const response = await fetch(generateConvexApiUrl('/api/user/sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.emailAddresses?.[0]?.emailAddress || '',
          name: user.fullName || '',
          imageUrl: user.imageUrl || '',
        }),
      });

      if (!response.ok) {
        console.warn('User sync failed:', response.status);
      }
    } catch (error) {
      console.warn('User sync error:', error);
    }
  };

  // Sync user and initialize models on component mount
  useEffect(() => {
    if (user?.id) {
      syncUserWithConvex();
    }
    // Initialize models store
    fetchModels();
  }, [user?.id, fetchModels]);

  // Auto-scroll to bottom when new messages arrive **only** if the user is
  // currently at (or near) the bottom.  This prevents forcing the user back
  // to the latest message when they intentionally scroll up to read earlier
  // messages while a response is still streaming.
  useEffect(() => {
    if (shouldAutoScroll && listRef.current && messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex(messages.length - 1);
      }, 50);
    }
  }, [messages.length, shouldAutoScroll]);

  // (scroll listener removed – FlashList handles it)

  // Load thread messages and set them in useChat
  const loadThreadMessages = async (threadId: string) => {
    if (!user?.id) return;

    setIsLoadingMessages(true);
    try {
      const result = await chatAPI.getThreadMessages(user.id, threadId);

      // Convert API messages to useChat format
      const formattedMessages = result.messages.map((msg: any) => ({
        id: msg._id || msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
      }));

      // Set messages in useChat hook
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('Error', 'Failed to load conversation history');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Refresh current thread data to get updated title
  const refreshCurrentThread = async () => {
    if (!currentThread?._id || !user?.id) return;

    try {
      const threadsResponse = await fetch(
        generateConvexApiUrl(`/api/chat/threads?clerkId=${user.id}&limit=1`)
      );
      const threadsData = await threadsResponse.json();

      const updatedThread = threadsData.threads?.find((t: Thread) => t._id === currentThread._id);
      if (updatedThread && updatedThread.title !== currentThread.title) {
        setCurrentThread(updatedThread);
        console.log('Thread title updated:', updatedThread.title);
      }
    } catch (error) {
      console.warn('Failed to refresh current thread:', error);
    }
  };

  // Handle thread selection
  const handleThreadSelect = async (thread: Thread) => {
    setCurrentThread(thread);
    setSelectedModel(thread.settings?.modelId || 'gemini-2.5-flash');

    // Load messages for the selected thread
    await loadThreadMessages(thread._id!);
  };

  // Handle new thread creation
  const handleNewThread = () => {
    setCurrentThread(null);

    // Clear messages for fresh chat
    setMessages([]);
  };

  // Custom input handler with image, PDF, and tool support
  const handleSendMessage = async (
    text: string,
    images?: ImageAttachment[],
    pdfs?: PDFAttachment[],
    enabledTools?: string[]
  ) => {
    if (
      (!text.trim() && (!images || images.length === 0) && (!pdfs || pdfs.length === 0)) ||
      isLoading ||
      !user?.id
    )
      return;

    const shouldFetchThreadAfter = !currentThread;

    // Use createMessageContent with Cloudinary URLs for both images and PDFs
    const messageContent = chatAPI.createMessageContent(text, images, pdfs);

    await append({
      role: 'user',
      content: messageContent as unknown as string,
    });

    if (shouldFetchThreadAfter && user?.id) {
      setTimeout(async () => {
        try {
          const { threads } = await chatAPI.getThreads(user.id, 1, 0, false);
          if (threads && threads.length > 0) {
            setCurrentThread(threads[0]);
            bump();
          }
        } catch (err) {
          console.warn('Failed to fetch latest thread:', err);
        }
      }, 1500);
    }
  };

  // Handle web search toggle
  const handleWebSearchToggle = (enabled: boolean) => {
    setWebSearchEnabled(enabled);
  };

  // Load thread when param provided from drawer
  useEffect(() => {
    if (!threadParam || currentThread?._id === threadParam) return;
    const fetchThread = async () => {
      if (!user?.id) return;
      try {
        const { threads } = await chatAPI.getThreads(user.id, 30, 0, false);
        const target = threads.find((t: Thread) => t._id === threadParam);
        if (target) {
          await handleThreadSelect(target);
        }
      } catch (e) {
        console.warn('Failed to load thread by param', e);
      }
    };
    fetchThread();
  }, [threadParam, user?.id]);

  // Message action handlers
  const handleCopy = async (messageId: string) => {
    console.log('Copy message:', messageId);
    // Copy functionality is handled in the MessageActionButtons component
  };

  const handleRetry = async (messageId: string, selectedModel?: string) => {
    if (!user?.id || !currentThread?._id) return;

    try {
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;

      const message = messages[messageIndex];

      // Delete messages from backend starting from this index
      await chatAPI.deleteMessagesFromIndex(user.id, currentThread._id, messageIndex);

      // Update local state
      const newMessages = messages.slice(0, messageIndex);
      setMessages(newMessages);

      // Update model if specified
      if (selectedModel) {
        setSelectedModel(selectedModel);
      }

      // Resend the message
      await append({
        role: 'user',
        content: message.content as unknown as string,
      });
    } catch (error) {
      console.error('Retry failed:', error);
      Alert.alert('Retry Failed', 'Unable to retry the message. Please try again.');
    }
  };

  const handleEdit = async (messageId: string, editedText?: string) => {
    if (!user?.id || !currentThread?._id) return;

    // If no edited text provided, this is just triggering edit mode (handled in component)
    if (!editedText) return;

    try {
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;

      const message = messages[messageIndex];

      // Only allow editing user messages
      if (message.role === 'user' && editedText.trim()) {
        try {
          // Delete messages from backend starting from this index
          await chatAPI.deleteMessagesFromIndex(user.id, currentThread._id, messageIndex);

          // Update local state
          const newMessages = messages.slice(0, messageIndex);
          setMessages(newMessages);

          // Resend with edited content
          await append({
            role: 'user',
            content: editedText.trim(),
          });
        } catch (error) {
          console.error('Edit failed:', error);
          Alert.alert('Edit Failed', 'Unable to edit the message. Please try again.');
        }
      }
    } catch (error) {
      console.error('Edit operation failed:', error);
      Alert.alert('Edit Failed', 'Unable to edit the message. Please try again.');
    }
  };

  if (error) {
    return (
      <AppContainer>
        <View className='flex-1 justify-center items-center p-6'>
          <Text className='text-red-500 text-center text-lg font-medium mb-4'>Chat Error</Text>
          <Text className='text-red-400 text-center text-sm mb-4'>
            {error.message || 'Unknown error occurred'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              // Reset chat state
              handleNewThread();
            }}
            className='mt-4 bg-blue-500 px-4 py-2 rounded-lg'
          >
            <Text className='text-white font-medium'>Retry</Text>
          </TouchableOpacity>
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      {/* Ensure the entire view shifts properly when keyboard is visible */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className={cn('flex-1')}>
          {/* Header (remains fixed at the top) */}
          <View className={cn('py-4 px-4 border-b border-border bg-background')}>
            <View className={cn('flex-row items-center justify-between')}>
              <View className={cn('flex-row items-center flex-1')}>
                {/* Menu button to open navigation drawer */}
                <TouchableOpacity
                  onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                  className={cn('mr-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-800')}
                >
                  <MaterialIcons
                    name='menu'
                    size={20}
                    color={isDarkColorScheme ? '#f9fafb' : '#111827'}
                  />
                </TouchableOpacity>

                <View className={cn('flex-1')}>
                  <Text className={cn('text-xl font-bold text-black dark:text-white')}>
                    {currentThread?.title || 'New Chat'}
                  </Text>
                </View>
              </View>
              <ThemeToggle />
            </View>
          </View>

          {/* Show Suggested Prompts when no messages */}
          {messages.length === 0 && !isLoadingMessages && !isLoading && (
            <View className={cn('flex-1')}>
              <SuggestedPrompts onPromptSelect={handleSendMessage} isVisible={true} />
            </View>
          )}

          {/* Messages */}
          {(messages.length > 0 || isLoadingMessages || isLoading) && (
            <View className={cn('flex-1')}>
              {/* Loading indicator for initial message loading */}
              {isLoadingMessages && (
                <EnhancedFlashList
                  data={Array.from({ length: 3 }).map((_, idx) => ({
                    id: `skeleton-${idx}`,
                    role: idx % 2 === 0 ? 'assistant' : 'user',
                    content: '',
                    createdAt: new Date(),
                  }))}
                  renderItem={({ item }) => (
                    <MessageRenderer
                      key={item.id}
                      message={{
                        id: item.id,
                        role: item.role as 'user' | 'assistant' | 'system',
                        content: item.content,
                        createdAt: item.createdAt,
                      }}
                      onCopy={handleCopy}
                      onRetry={handleRetry}
                      onEdit={handleEdit}
                      isStreaming={isLoading}
                      isLastMessage={false} // No last message for skeletons
                    />
                  )}
                  keyExtractor={item => item.id}
                  estimatedItemSize={120}
                  contentContainerStyle={{
                    paddingVertical: 12,
                    flexGrow: 1,
                    justifyContent: 'flex-start',
                  }}
                  showsVerticalScrollIndicator={false}
                />
              )}

              {/* Messages */}
              <EnhancedFlashList
                ref={listRef}
                data={messages}
                renderItem={({ item, index }) => (
                  <MessageRenderer
                    key={item.id}
                    message={{
                      id: item.id,
                      role: item.role as 'user' | 'assistant' | 'system',
                      content: item.content,
                      createdAt: item.createdAt,
                    }}
                    onCopy={handleCopy}
                    onRetry={handleRetry}
                    onEdit={handleEdit}
                    isStreaming={isLoading}
                    isLastMessage={index === messages.length - 1}
                  />
                )}
                keyExtractor={item => item.id}
                estimatedItemSize={120}
                contentContainerStyle={{
                  paddingVertical: 12,
                  flexGrow: messages.length === 0 ? 1 : undefined,
                }}
                // Allow tap outside to dismiss keyboard
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
              />

              {/* Typing indicator */}
              {isLoading && (
                <View className={cn('items-start mb-4 px-4')}>
                  <TypingShimmer visible={true} />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Input (remains fixed at the bottom) */}
        <View
          className={cn('bg-background border-t border-border')}
          style={{
            paddingTop: 8,
          }}
        >
          <AutoResizingInput
            onSend={handleSendMessage}
            placeholder='Type your message...'
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isStreaming={isLoading}
            onStop={stop}
            webSearchEnabled={webSearchEnabled}
            onWebSearchToggle={handleWebSearchToggle}
          />
        </View>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}
