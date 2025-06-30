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
import { useColorScheme } from '@/lib/use-color-scheme';
import { chatAPI, Thread } from '@/lib/api/chat-api';
import { generateConvexApiUrl } from '@/lib/convex-utils';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { useThreadVersion } from '@/store/thread-version-store';

export default function ChatPage() {
  const { user } = useUser();
  const navigation = useNavigation();
  const { isDarkColorScheme } = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const { bump } = useThreadVersion();

  const [thread, setThread] = useState<Thread | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { messages, append, setMessages, isLoading } = useChat({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: generateConvexApiUrl('/api/chat/completions'),
    body: {
      clerkId: user?.id,
      model: selectedModel,
      thread_id: thread?._id,
      generate_title: true,
    },
    initialMessages: [],
    onFinish: () => setTimeout(() => bump(), 1000),
  });

  const threadsDrawerRef = useRef<ThreadsDrawerRef>(null);

  // Load thread + history on mount
  useEffect(() => {
    const load = async () => {
      if (!id || !user?.id) return;
      setIsLoadingHistory(true);
      try {
        const { threads } = await chatAPI.getThreads(user.id, 30, 0, false);
        const found = threads.find((t: Thread) => t._id === id);
        if (found) {
          setThread(found);
          setSelectedModel(found.settings?.modelId || selectedModel);
          const history = await chatAPI.getThreadMessages(user.id, found._id!);
          setMessages(
            history.messages.map(m => ({
              id: m._id || m.id || `msg-${Date.now()}`,
              role: m.role,
              content: m.content,
            }))
          );
        }
      } catch (e) {
        console.warn('Failed loading thread', e);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    load();
  }, [id, user?.id]);

  // auto scroll
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !user?.id) return;
    const needThread = !thread;
    await append({ role: 'user', content: text });
    if (needThread) {
      setTimeout(async () => {
        const { threads } = await chatAPI.getThreads(user.id, 1, 0, false);
        if (threads[0]) {
          setThread(threads[0]);
          bump();
        }
      }, 1200);
    }
  };

  return (
    <AppContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#e5e7eb' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                    style={{ padding: 8, marginRight: 12 }}
                  >
                    <MaterialIcons
                      name='menu'
                      size={20}
                      color={isDarkColorScheme ? '#f9fafb' : '#111827'}
                    />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {thread?.title || 'Chat'}
                  </Text>
                </View>
                <ThemeToggle />
              </View>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1, paddingHorizontal: 16 }}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'flex-end',
                paddingVertical: 16,
              }}
              showsVerticalScrollIndicator={false}
            >
              {isLoadingHistory && <ActivityIndicator style={{ marginBottom: 8 }} />}
              {messages.map(m => (
                <View
                  key={m.id}
                  style={{
                    marginBottom: 12,
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View
                    style={{
                      maxWidth: '85%',
                      padding: 10,
                      borderRadius: 16,
                      backgroundColor:
                        m.role === 'user' ? '#3b82f6' : isDarkColorScheme ? '#374151' : '#f3f4f6',
                    }}
                  >
                    <Text
                      style={{
                        color:
                          m.role === 'user' ? '#fff' : isDarkColorScheme ? '#f3f4f6' : '#111827',
                      }}
                    >
                      {m.content}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input */}
            <View style={{ paddingBottom: Platform.OS === 'ios' ? 10 : 20 }}>
              <AutoResizingInput
                onSend={handleSend}
                placeholder='Type your message...'
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <ThreadsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onThreadSelect={async t => {
          setIsDrawerOpen(false);
          setThread(t);
          await handleSend('');
        }}
        currentThreadId={thread?._id}
        onNewThread={() => {
          setThread(null);
          setMessages([]);
        }}
        ref={threadsDrawerRef}
      />
    </AppContainer>
  );
}
