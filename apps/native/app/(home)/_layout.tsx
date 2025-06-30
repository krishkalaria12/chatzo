import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { chatAPI, Thread } from '@/lib/api/chat-api';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThreadVersion } from '@/store/thread-version-store';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadThreads = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { threads } = await chatAPI.getThreads(user.id, 30, 0, false);
      setThreads(threads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const version = useThreadVersion(state => state.version);

  // initial + whenever a new thread is created (version bumped)
  React.useEffect(() => {
    loadThreads();
  }, [version]);

  // Create new chat & navigate
  const handleNewChat = () => {
    // Set a unique param to trigger new chat reset in HomePage
    router.setParams({ newChat: Date.now().toString() });
    props.navigation.closeDrawer();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left']}>
      <DrawerContentScrollView {...props}>
        {/* Default (static) route(s) */}
        <DrawerItemList {...props} />

        {/* New Chat button */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <TouchableOpacity
            onPress={handleNewChat}
            style={{
              backgroundColor: '#2563eb',
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>+ New Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Threads heading */}
        <Text
          key='threads-heading'
          style={{ marginTop: 24, marginLeft: 16, fontWeight: 'bold', color: '#6b7280' }}
        >
          Threads
        </Text>

        {/* Loading / error / list */}
        {loading ? (
          <View style={{ padding: 20 }}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <DrawerItem label={`Error: ${error}`} onPress={loadThreads} />
        ) : (
          threads.map((thread, idx) => {
            const threadId = thread._id ?? `temp-${idx}`;
            const isActive = pathname === `/${thread._id}`;
            return (
              <DrawerItem
                key={`thread-${threadId}`}
                label={thread.title || 'Untitled'}
                focused={isActive}
                activeTintColor='#f97316'
                onPress={() => {
                  if (thread._id) {
                    props.navigation.navigate('[id]', { id: thread._id });
                    props.navigation.closeDrawer();
                  }
                }}
              />
            );
          })
        )}
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

export default function HomeLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={CustomDrawerContent}
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: '#f97316',
          drawerHideStatusBarOnOpen: false,
          drawerStatusBarAnimation: 'fade',
          drawerStyle: {
            width: '80%',
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
          },
        }}
      >
        {/* Main chat screen */}
        <Drawer.Screen
          name='index'
          options={{
            drawerLabel: 'Chat',
            title: 'Chat',
            drawerIcon: ({ color, size }) => (
              <MaterialIcons name='chat' size={size} color={color} />
            ),
          }}
        />

        {/* Hidden dynamic route */}
        <Drawer.Screen
          name='[id]'
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
