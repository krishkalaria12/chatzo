import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { chatAPI } from '@/lib/api/chat-api';
import { useColorScheme } from '@/lib/use-color-scheme';

interface TestButtonProps {
  onSuccess?: () => void;
}

export const TestButton: React.FC<TestButtonProps> = ({ onSuccess }) => {
  const { user } = useUser();
  const { isDarkColorScheme } = useColorScheme();

  const runFullTest = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    try {
      // Test 1: Connection
      const connectionTest = await chatAPI.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.message}`);
      }

      // Test 2: AI Models
      const aiTest = await chatAPI.testAI();
      if (!aiTest.success) {
        throw new Error(`AI test failed: ${aiTest.message}`);
      }

      // Test 3: Create Thread
      const thread = await chatAPI.createThread(user.id, 'Test Thread');

      // Test 4: Get Threads
      const threadsResult = await chatAPI.getThreads(user.id, 5);

      // Test 5: Send a test message
      const testMessages = [
        {
          id: 'test1',
          role: 'user' as const,
          content: 'Hello, this is a test message',
          metadata: {},
        },
      ];

      const chatResponse = await chatAPI.sendChatCompletion({
        clerkId: user.id,
        messages: testMessages,
        model: 'gemini-2.5-flash',
        thread_id: thread.id,
        generate_title: true,
      });

      // If we got here, all tests passed
      Alert.alert(
        'All Tests Passed! ✅',
        `✓ Connection: OK\n✓ AI Models: OK\n✓ Thread Creation: OK\n✓ Threads List: ${threadsResult.threads.length} found\n✓ Chat Completion: OK\n\nYour chat system is working perfectly!`
      );

      onSuccess?.();
    } catch (error) {
      Alert.alert(
        'Test Failed ❌',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your backend configuration.`
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={runFullTest}
      className='px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900 border border-purple-300 dark:border-purple-700'
    >
      <Text className='text-xs font-medium text-purple-700 dark:text-purple-300'>
        🧪 Run Full Test
      </Text>
    </TouchableOpacity>
  );
};
