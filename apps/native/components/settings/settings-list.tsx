import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { AppContainer } from '@/components/app-container';
import { SettingsHeader } from './extras/settings-header';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

export default function SettingsList() {
  const router = useRouter();
  const { user } = useUser();
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const settingsItems: SettingItem[] = [
    {
      id: 'account',
      title: 'Account Information',
      description: 'Manage your profile and account details',
      icon: '👤',
      route: '/(settings)/account',
      color: CHATZO_COLORS.accent.blue,
    },
    {
      id: 'analytics',
      title: 'Analytics & Usage',
      description: 'View your usage statistics and analytics',
      icon: '📊',
      route: '/(settings)/analytics',
      color: CHATZO_COLORS.accent.yellow,
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your app experience',
      icon: '⚙️',
      route: '/(settings)/preferences',
      color: CHATZO_COLORS.accent.purple,
    },
  ];

  const handleSettingPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <AppContainer className='flex-1' style={{ backgroundColor: colors.background }}>
      <SettingsHeader onSignOut={() => {}} showBackButton={true} />

      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* User Welcome */}
        <View className='mb-8'>
          <Text className='text-2xl font-bold font-lora mb-2' style={{ color: colors.text }}>
            Settings
          </Text>
          <Text className='text-base' style={{ color: colors.textSecondary }}>
            Welcome back, {user?.fullName || 'User'}! Customize your experience.
          </Text>
        </View>

        {/* Settings Grid */}
        <View className='space-y-4'>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleSettingPress(item.route)}
              activeOpacity={0.7}
              className='overflow-hidden rounded-2xl'
              style={{
                backgroundColor: colors.surface,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View className='p-6'>
                <View className='flex-row items-center mb-4'>
                  <View
                    className='w-12 h-12 rounded-2xl items-center justify-center mr-4'
                    style={{ backgroundColor: item.color }}
                  >
                    <Text className='text-2xl'>{item.icon}</Text>
                  </View>

                  <View className='flex-1'>
                    <Text
                      className='text-lg font-semibold font-lora mb-1'
                      style={{ color: colors.text }}
                    >
                      {item.title}
                    </Text>
                    <Text className='text-sm leading-5' style={{ color: colors.textSecondary }}>
                      {item.description}
                    </Text>
                  </View>

                  <View
                    className='w-8 h-8 rounded-full items-center justify-center'
                    style={{ backgroundColor: colors.border }}
                  >
                    <Text className='text-sm font-medium' style={{ color: colors.text }}>
                      →
                    </Text>
                  </View>
                </View>

                {/* Subtle gradient line */}
                <View
                  className='h-1 rounded-full'
                  style={{ backgroundColor: item.color, opacity: 0.3 }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View className='mt-12 p-6 rounded-2xl' style={{ backgroundColor: colors.surface }}>
          <Text className='text-center text-sm font-medium mb-2' style={{ color: colors.text }}>
            Chatzo AI Assistant
          </Text>
          <Text className='text-center text-xs' style={{ color: colors.textSecondary }}>
            Version 1.0.0 • Made with ❤️
          </Text>
        </View>
      </ScrollView>
    </AppContainer>
  );
}
