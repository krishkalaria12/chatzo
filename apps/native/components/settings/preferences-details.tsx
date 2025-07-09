import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { AppContainer } from '@/components/app-container';
import { SettingsHeader } from './extras/settings-header';
import { cn } from '@/lib/utils';

interface PreferenceItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'select' | 'action';
  value?: boolean | string;
  options?: { label: string; value: string }[];
  onPress?: () => void;
  onChange?: (value: boolean | string) => void;
}

export default function PreferencesDetails() {
  const router = useRouter();
  const { isDarkColorScheme, toggleColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const [preferences, setPreferences] = useState({
    notifications: true,
    analytics: true,
    darkMode: isDarkColorScheme,
    autoSave: true,
    voiceInput: false,
    language: 'en',
    fontSize: 'medium',
  });

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));

    if (key === 'darkMode') {
      toggleColorScheme();
    }
  };

  const preferencesSections = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'darkMode',
          title: 'Dark Mode',
          description: 'Use dark theme throughout the app',
          type: 'toggle',
          value: preferences.darkMode,
          onChange: (value: boolean) => handlePreferenceChange('darkMode', value),
        },
        {
          id: 'fontSize',
          title: 'Font Size',
          description: 'Adjust text size for better readability',
          type: 'select',
          value: preferences.fontSize,
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
          onChange: (value: string) => handlePreferenceChange('fontSize', value),
        },
      ],
    },
    {
      title: 'Chat Settings',
      items: [
        {
          id: 'autoSave',
          title: 'Auto-save Conversations',
          description: 'Automatically save your chat history',
          type: 'toggle',
          value: preferences.autoSave,
          onChange: (value: boolean) => handlePreferenceChange('autoSave', value),
        },
        {
          id: 'voiceInput',
          title: 'Voice Input',
          description: 'Enable voice-to-text input',
          type: 'toggle',
          value: preferences.voiceInput,
          onChange: (value: boolean) => handlePreferenceChange('voiceInput', value),
        },
        {
          id: 'language',
          title: 'Language',
          description: 'Choose your preferred language',
          type: 'select',
          value: preferences.language,
          options: [
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
            { label: 'German', value: 'de' },
          ],
          onChange: (value: string) => handlePreferenceChange('language', value),
        },
      ],
    },
    {
      title: 'Privacy & Data',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          description: 'Receive notifications about updates',
          type: 'toggle',
          value: preferences.notifications,
          onChange: (value: boolean) => handlePreferenceChange('notifications', value),
        },
        {
          id: 'analytics',
          title: 'Usage Analytics',
          description: 'Help improve the app by sharing usage data',
          type: 'toggle',
          value: preferences.analytics,
          onChange: (value: boolean) => handlePreferenceChange('analytics', value),
        },
        {
          id: 'clearData',
          title: 'Clear All Data',
          description: 'Remove all conversations and settings',
          type: 'action',
          onPress: () => {
            Alert.alert(
              'Clear All Data',
              'This will permanently delete all your conversations and reset all settings. This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear Data', style: 'destructive' },
              ]
            );
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'feedback',
          title: 'Send Feedback',
          description: 'Help us improve Chatzo',
          type: 'action',
          onPress: () => Alert.alert('Feedback', 'Feedback feature coming soon!'),
        },
        {
          id: 'help',
          title: 'Help & Support',
          description: 'Get help and view documentation',
          type: 'action',
          onPress: () => Alert.alert('Help', 'Help center coming soon!'),
        },
        {
          id: 'about',
          title: 'About Chatzo',
          description: 'Version info and credits',
          type: 'action',
          onPress: () => Alert.alert('About', 'Chatzo v1.0.0\nBuilt with ❤️'),
        },
      ],
    },
  ];

  const renderPreferenceItem = (item: PreferenceItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <View
            key={item.id}
            className='flex-row items-center justify-between p-4 rounded-xl mb-3'
            style={{ backgroundColor: colors.background }}
          >
            <View className='flex-1'>
              <Text className='text-base font-medium mb-1' style={{ color: colors.text }}>
                {item.title}
              </Text>
              <Text className='text-sm' style={{ color: colors.textSecondary }}>
                {item.description}
              </Text>
            </View>
            <Switch
              value={item.value as boolean}
              onValueChange={item.onChange as (value: boolean) => void}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        );

      case 'select':
        return (
          <View
            key={item.id}
            className='p-4 rounded-xl mb-3'
            style={{ backgroundColor: colors.background }}
          >
            <View className='mb-3'>
              <Text className='text-base font-medium mb-1' style={{ color: colors.text }}>
                {item.title}
              </Text>
              <Text className='text-sm' style={{ color: colors.textSecondary }}>
                {item.description}
              </Text>
            </View>
            <View className='flex-row flex-wrap gap-2'>
              {item.options?.map(option => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => item.onChange?.(option.value)}
                  className='px-3 py-2 rounded-full'
                  style={{
                    backgroundColor: item.value === option.value ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    className='text-sm font-medium'
                    style={{
                      color: item.value === option.value ? colors.background : colors.text,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'action':
        return (
          <TouchableOpacity
            key={item.id}
            onPress={item.onPress}
            className='flex-row items-center justify-between p-4 rounded-xl mb-3'
            style={{ backgroundColor: colors.background }}
          >
            <View className='flex-1'>
              <Text className='text-base font-medium mb-1' style={{ color: colors.text }}>
                {item.title}
              </Text>
              <Text className='text-sm' style={{ color: colors.textSecondary }}>
                {item.description}
              </Text>
            </View>
            <Text className='text-lg' style={{ color: colors.textSecondary }}>
              →
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <AppContainer className='flex-1' style={{ backgroundColor: colors.background }}>
      <SettingsHeader onSignOut={() => {}} showBackButton={true} />

      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* Page Header */}
        <View className='mb-8'>
          <Text className='text-2xl font-bold font-lora mb-2' style={{ color: colors.text }}>
            Preferences
          </Text>
          <Text className='text-base' style={{ color: colors.textSecondary }}>
            Customize your Chatzo experience
          </Text>
        </View>

        {/* Preferences Sections */}
        {preferencesSections.map((section, sectionIndex) => (
          <View key={section.title} className='mb-8'>
            <Text className='text-lg font-semibold font-lora mb-4' style={{ color: colors.text }}>
              {section.title}
            </Text>

            <View
              className='p-2 rounded-2xl'
              style={{
                backgroundColor: colors.surface,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {section.items.map(item => renderPreferenceItem(item as PreferenceItem))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View className='mt-8 p-6 rounded-2xl' style={{ backgroundColor: colors.surface }}>
          <Text className='text-center text-sm font-medium mb-2' style={{ color: colors.text }}>
            Need help with settings?
          </Text>
          <Text className='text-center text-xs' style={{ color: colors.textSecondary }}>
            Contact support or check our help documentation
          </Text>
        </View>
      </ScrollView>
    </AppContainer>
  );
}
