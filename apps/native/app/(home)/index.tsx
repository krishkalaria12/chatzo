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
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useChat } from '@ai-sdk/react';
import { fetch as expoFetch } from 'expo/fetch';
import { AppContainer } from '@/components/app-container';
import { AutoResizingInput } from '@/components/ui/auto-resizing-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ThreadsDrawer, ThreadsDrawerRef } from '@/components/ui/threads-drawer';
import { TestButton } from '@/components/ui/test-button';
import { useColorScheme } from '@/lib/use-color-scheme';
import { chatAPI, Thread, Message } from '@/lib/api/chat-api';
import { generateConvexApiUrl } from '@/lib/convex-utils';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

export default function HomePage() {
  const { user } = useUser();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const { isDarkColorScheme } = useColorScheme();

  // State management
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'untested' | 'testing' | 'success' | 'failed'
  >('untested');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Use AI SDK's useChat hook with proper configuration
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    setMessages,
    reload,
  } = useChat({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: generateConvexApiUrl('/api/chat/completions'),
    body: {
      clerkId: user?.id,
      model: selectedModel,
      thread_id: currentThread?.id,
      generate_title: true,
    },
    onError: error => {
      console.error('Chat error:', error);
      Alert.alert('Chat Error', error.message || 'Unknown error occurred');
    },
    onFinish: (message, { usage, finishReason }) => {
      console.log('Message completed:', { message, usage, finishReason });

      // Refresh thread list to show updated titles
      // This will be triggered when the backend updates the title
      setTimeout(() => {
        refreshThreadsList();
        refreshCurrentThread();
      }, 1500); // Small delay to allow backend title generation to complete
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "# Hello! I'm Chatzo 🚀\n\nYour AI assistant powered by **Google Gemini** and **Mistral AI** models. You can select different models using the selector in the input area below.\n\nHow can I help you today?",
      },
    ],
  });

  // Ref to store the drawer refresh function
  const threadsDrawerRef = useRef<ThreadsDrawerRef>(null);

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

  // Test connection
  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const result = await chatAPI.testConnection();
      setConnectionStatus(result.success ? 'success' : 'failed');
      Alert.alert(result.success ? 'Success' : 'Failed', result.message);
    } catch (error) {
      setConnectionStatus('failed');
      Alert.alert('Error', error instanceof Error ? error.message : 'Connection test failed');
    }
  };

  // Test AI models
  const testAI = async () => {
    try {
      const result = await chatAPI.testAI();
      if (result.success) {
        Alert.alert('AI Test Success', `Model: ${result.model}\nResponse: ${result.response}`);
      } else {
        Alert.alert('AI Test Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'AI test failed');
    }
  };

  // Load thread messages and set them in useChat
  const loadThreadMessages = async (threadId: string) => {
    if (!user?.id) return;

    setIsLoadingMessages(true);
    try {
      const result = await chatAPI.getThreadMessages(user.id, threadId);

      // Convert API messages to useChat format
      const formattedMessages = result.messages.map((msg: any) => ({
        id: msg._id,
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
    if (!currentThread?.id || !user?.id) return;

    try {
      const threadsResponse = await fetch(
        generateConvexApiUrl(`/api/chat/threads?clerkId=${user.id}&limit=1`)
      );
      const threadsData = await threadsResponse.json();

      const updatedThread = threadsData.threads?.find((t: Thread) => t.id === currentThread.id);
      if (updatedThread && updatedThread.title !== currentThread.title) {
        setCurrentThread(updatedThread);
        console.log('Thread title updated:', updatedThread.title);
      }
    } catch (error) {
      console.warn('Failed to refresh current thread:', error);
    }
  };

  // Refresh threads list (for drawer)
  const refreshThreadsList = () => {
    threadsDrawerRef.current?.refreshThreads();
  };

  // Handle thread selection
  const handleThreadSelect = async (thread: Thread) => {
    setCurrentThread(thread);
    setSelectedModel(thread.settings?.modelId || 'gemini-2.5-flash');

    // Load messages for the selected thread
    await loadThreadMessages(thread.id);
  };

  // Handle new thread creation
  const handleNewThread = () => {
    setCurrentThread(null);

    // Reset to welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "# Hello! I'm Chatzo 🚀\n\nYour AI assistant powered by **Google Gemini** and **Mistral AI** models. You can select different models using the selector in the input area below.\n\nHow can I help you today?",
      },
    ]);
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
          }
        }, 1500);
      } catch (err) {
        console.warn('Failed to fetch latest thread:', err);
      }
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
    <AppContainer
      enableScrollBar={true}
      scrollBar={{
        color: isDarkColorScheme ? '#f97316' : '#ea580c',
        showRail: true,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
        enabled={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className='flex-1'>
            {/* Header */}
            <View className='py-4 px-4 border-b border-border bg-background'>
              <View className='flex-row items-center justify-between mb-2'>
                <View className='flex-row items-center flex-1'>
                  {/* Menu button to open navigation drawer */}
                  <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                    className='mr-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-800'
                  >
                    <MaterialIcons
                      name='menu'
                      size={20}
                      color={isDarkColorScheme ? '#f9fafb' : '#111827'}
                    />
                  </TouchableOpacity>

                  <View className='flex-1'>
                    <Text className='text-xl font-bold text-black dark:text-white'>
                      {currentThread?.title || 'New Chat'}
                    </Text>
                    {currentThread && (
                      <Text className='text-xs text-muted-foreground'>
                        {currentThread.messageCount} messages •{' '}
                        {currentThread.settings?.modelId || selectedModel}
                      </Text>
                    )}
                  </View>
                </View>
                <ThemeToggle />
              </View>

              <Text className='text-sm text-muted-foreground mb-2'>
                AI Assistant powered by Google Gemini & Mistral AI • Latest AI SDK • Streaming
                enabled
              </Text>

              {/* Connection Test Buttons */}
              <View className='flex-row space-x-2'>
                <TouchableOpacity
                  onPress={testConnection}
                  className='px-3 py-1 rounded-md bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700'
                >
                  <Text className='text-xs font-medium text-green-700 dark:text-green-300'>
                    Test Convex ({connectionStatus})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={testAI}
                  className='px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                >
                  <Text className='text-xs font-medium text-blue-700 dark:text-blue-300'>
                    Test AI Models
                  </Text>
                </TouchableOpacity>

                <TestButton onSuccess={() => console.log('All tests passed!')} />
              </View>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              className='flex-1 px-4 bg-background'
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 16 }}
            >
              {isLoadingMessages && (
                <View className='items-center mb-4'>
                  <ActivityIndicator
                    size='small'
                    color={isDarkColorScheme ? '#3b82f6' : '#2563eb'}
                  />
                  <Text className='text-xs text-muted-foreground mt-2'>
                    Loading conversation...
                  </Text>
                </View>
              )}

              {messages.map(message => (
                <View
                  key={message.id}
                  className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <View
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 rounded-bl-md'
                    }`}
                  >
                    <Text
                      className={`text-base leading-relaxed ${
                        message.role === 'user' ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {message.content}
                    </Text>
                  </View>
                  <Text
                    className={`text-xs text-muted-foreground mt-1 px-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </Text>
                </View>
              ))}

              {isLoading && (
                <View className='items-start mb-4'>
                  <View className='bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-bl-md'>
                    <View className='flex-row items-center'>
                      <Text className='text-gray-600 dark:text-gray-300 text-base mr-2'>
                        AI is thinking
                      </Text>
                      <View className='flex-row'>
                        <Text className='text-gray-400 animate-pulse'>●</Text>
                        <Text className='text-gray-400 animate-pulse ml-1'>●</Text>
                        <Text className='text-gray-400 animate-pulse ml-1'>●</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Auto Resizing Input */}
            <View style={{ paddingBottom: Platform.OS === 'ios' ? 10 : 20 }}>
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

      {/* Threads Drawer */}
      <ThreadsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onThreadSelect={handleThreadSelect}
        currentThreadId={currentThread?.id}
        onNewThread={handleNewThread}
        ref={threadsDrawerRef}
      />
    </AppContainer>
  );
}
