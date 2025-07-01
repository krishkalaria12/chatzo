import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useChat } from '@ai-sdk/react';
import { fetch as expoFetch } from 'expo/fetch';
import { AppContainer } from '@/components/app-container';
import { AutoResizingInput } from '@/components/ui/auto-resizing-input';
import { SuggestedPrompts } from '@/components/ui/suggested-prompts';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MessageList } from '@/components/messages';
import { useColorScheme } from '@/lib/use-color-scheme';
import { chatAPI, Thread } from '@/lib/api/chat-api';
import { generateConvexApiUrl } from '@/lib/convex-utils';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useThreadVersion } from '@/store/thread-version-store';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { user } = useUser();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const newChat = (params as Record<string, string>).newChat;
  const threadParam = (params as Record<string, string>).id as string | undefined;
  const scrollViewRef = useRef<ScrollView>(null);
  const { isDarkColorScheme } = useColorScheme();
  const { bump } = useThreadVersion();

  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const lastHandledRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (newChat && newChat !== lastHandledRef.current) {
      handleNewThread();
      lastHandledRef.current = newChat;
    }
  }, [newChat]);

  // Use AI SDK's useChat hook with proper configuration
  const { messages, isLoading, error, append, setMessages } = useChat({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: generateConvexApiUrl('/api/chat/completions'),
    body: {
      clerkId: user?.id,
      model: selectedModel,
      thread_id: currentThread?._id,
      generate_title: true,
    },
    onError: error => {
      console.error('Chat error:', error);
      Alert.alert('Chat Error', error.message || 'Unknown error occurred');
    },
    onFinish: () => {
      setTimeout(() => {
        refreshCurrentThread();
      }, 1500);
    },
    initialMessages: [],
  });

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

  // Sync user on component mount
  useEffect(() => {
    if (user?.id) {
      syncUserWithConvex();
    }
  }, [user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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

  // Custom input handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user?.id) return;

    // If there's no current thread, we'll let the backend create one automatically.
    // After the first response arrives, we will fetch the latest thread list and set it.

    const shouldFetchThreadAfter = !currentThread;

    // Send message via AI SDK
    await append({
      role: 'user',
      content: text,
    });

    // If we didn't have a thread yet, fetch the most recent thread so the UI updates.
    if (shouldFetchThreadAfter && user?.id) {
      try {
        // Give the backend a moment to create & update the thread
        setTimeout(async () => {
          const { threads } = await chatAPI.getThreads(user.id, 1, 0, false);
          if (threads && threads.length > 0) {
            setCurrentThread(threads[0]);
            bump();
          }
        }, 1500);
      } catch (err) {
        console.warn('Failed to fetch latest thread:', err);
      }
    }
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
    <AppContainer
      enableScrollBar={true}
      scrollBar={{
        color: isDarkColorScheme ? '#f97316' : '#ea580c',
        showRail: true,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={cn('flex-1')}
        enabled={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className={cn('flex-1')}>
            {/* Fixed Header */}
            <View className={cn('py-4 px-4 border-b border-border bg-background z-[1000]')}>
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

            {/* Messages Area */}
            <View className={cn('flex-1 bg-background')}>
              {/* Show Suggested Prompts when no messages */}
              {messages.length === 0 && !isLoadingMessages && !isLoading && (
                <SuggestedPrompts onPromptSelect={handleSendMessage} isVisible={true} />
              )}

              {/* Enhanced Message List */}
              {(messages.length > 0 || isLoadingMessages || isLoading) && (
                <MessageList
                  ref={scrollViewRef}
                  messages={messages}
                  isLoading={isLoading}
                  isLoadingMessages={isLoadingMessages}
                />
              )}
            </View>

            {/* Fixed Input at Bottom */}
            <View
              className={cn('bg-background border-t border-border z-[1000]')}
              style={{
                paddingBottom: Platform.OS === 'ios' ? 10 : 20,
              }}
            >
              <AutoResizingInput
                onSend={handleSendMessage}
                placeholder='Type your message...'
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}
