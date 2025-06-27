import { AppContainer } from '@/components/app-container';
import { AutoResizingInput } from '@/components/ui/auto-resizing-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { generateConvexApiUrl } from '@/lib/convex-utils';
import { useThemeColors } from '@/components/theme-colors';
import { useColorScheme } from '@/lib/use-color-scheme';
import { useChat } from '@ai-sdk/react';
import { fetch as expoFetch } from 'expo/fetch';
import { useEffect, useRef, useState } from 'react';
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

export default function HomePage() {
  const scrollViewRef = useRef<ScrollView>(null);
  const colors = useThemeColors();
  const { isDarkColorScheme } = useColorScheme();
  const [connectionStatus, setConnectionStatus] = useState<
    'untested' | 'testing' | 'success' | 'failed'
  >('untested');
  const [selectedModel, setSelectedModel] = useState<string>('mistral-large');

  const { messages, error, handleInputChange, input, handleSubmit, isLoading, append } = useChat({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: generateConvexApiUrl('/api/chat'),
    body: {
      model: selectedModel,
    },
    onError: error => {
      console.error('Chat error:', error);
      Alert.alert('Chat Error', error.message || 'Unknown error occurred');
    },
    onFinish: message => {
      // Message completed successfully
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "# Hello! I'm Chatzo 🚀\n\nYour AI assistant powered by **Google Gemini** and **Mistral AI** models. You can select different models using the selector in the input area below to match your specific needs.\n\nHow can I help you today?",
      },
    ],
  });

  // Test Convex connection
  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const testUrl = generateConvexApiUrl('/test');

      const response = await fetch(testUrl, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionStatus('success');
        Alert.alert('Success', 'Convex connection is working!');
      } else {
        setConnectionStatus('failed');
        Alert.alert('Test Failed', data.error || 'Connection test failed');
      }
    } catch (error) {
      setConnectionStatus('failed');
      Alert.alert(
        'Connection Error',
        error instanceof Error ? error.message : 'Failed to connect to Convex'
      );
    }
  };

  // Test Google AI specifically
  const testGoogleAI = async () => {
    try {
      const testUrl = generateConvexApiUrl('/test-ai');

      const response = await fetch(testUrl, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Google AI Success', `Model: ${data.model}\nResponse: ${data.response}`);
      } else {
        Alert.alert('Google AI Test Failed', data.details || data.error || 'AI test failed');
      }
    } catch (error) {
      Alert.alert(
        'Google AI Error',
        error instanceof Error ? error.message : 'Failed to test Google AI'
      );
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Handle message sending with AutoResizingInput
  const handleSendMessage = async (text: string) => {
    if (text.trim() && !isLoading) {
      try {
        await append({
          role: 'user',
          content: text.trim(),
        });
      } catch (error) {
        console.error('Send message error:', error);
        Alert.alert(
          'Submit Error',
          error instanceof Error ? error.message : 'Failed to send message'
        );
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
              if (typeof window !== 'undefined' && window.location?.reload) {
                window.location.reload();
              } else {
                console.log('Retry tapped - refresh not available in React Native');
              }
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
          <View className='flex-1 justify-between'>
            <View className='flex-1'>
              {/* Header */}
              <View className='py-4 px-4 border-b border-border bg-background'>
                <View className='flex-row items-center justify-between mb-2'>
                  <View className='flex-1'>
                    <Text className='text-2xl font-bold text-black dark:text-white'>Chatzo</Text>
                  </View>
                  <ThemeToggle />
                </View>

                <Text className='text-sm text-muted-foreground mb-2'>
                  AI Assistant powered by Google Gemini & Mistral AI • Streaming enabled
                </Text>

                {/* Connection Test Button */}
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
                    onPress={testGoogleAI}
                    className='px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                  >
                    <Text className='text-xs font-medium text-blue-700 dark:text-blue-300'>
                      Test AI Models
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Messages */}
              <ScrollView
                ref={scrollViewRef}
                className='flex-1 px-4 bg-background'
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 16 }}
              >
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
                          message.role === 'user'
                            ? 'text-white'
                            : 'text-gray-900 dark:text-gray-100'
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
            </View>

            {/* Auto Resizing Input */}
            <AutoResizingInput
              onSend={handleSendMessage}
              placeholder='Type your message...'
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}
