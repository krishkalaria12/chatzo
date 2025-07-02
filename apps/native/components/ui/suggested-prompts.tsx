import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { cn } from '@/lib/utils';
import { MaterialIcons } from '@expo/vector-icons';

interface SuggestedPromptsProps {
  onPromptSelect: (prompt: string) => void;
  isVisible?: boolean;
}

const SUGGESTED_PROMPTS = [
  {
    id: 1,
    text: 'Upload an image and ask me about it',
    icon: 'image' as keyof typeof MaterialIcons.glyphMap,
    category: 'Vision',
  },
  {
    id: 2,
    text: 'Are black holes real?',
    icon: 'explore' as keyof typeof MaterialIcons.glyphMap,
    category: 'Science',
  },
  {
    id: 3,
    text: 'How many Rs are in the word "strawberry"?',
    icon: 'quiz' as keyof typeof MaterialIcons.glyphMap,
    category: 'Language',
  },
  {
    id: 4,
    text: 'Write a short story about a robot',
    icon: 'create' as keyof typeof MaterialIcons.glyphMap,
    category: 'Creative',
  },
];

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  onPromptSelect,
  isVisible = true,
}) => {
  const { isDarkColorScheme } = useColorScheme();

  if (!isVisible) return null;

  const colors = {
    icon: isDarkColorScheme ? '#a1a1aa' : '#64748b',
    accent: isDarkColorScheme ? '#3b82f6' : '#2563eb',
  };

  return (
    <View className={cn('flex-1 justify-center px-6 py-8')}>
      {/* Welcome Message */}
      <View className={cn('mb-8 items-center')}>
        <View className={cn('mb-4 p-4 rounded-full', 'bg-gray-100 dark:bg-gray-800')}>
          <MaterialIcons name='chat' size={32} color={colors.accent} />
        </View>
        <Text
          className={cn('text-2xl font-bold text-center mb-2', 'text-gray-900 dark:text-white')}
        >
          How can I help you today?
        </Text>
        <Text
          className={cn(
            'text-base text-center leading-relaxed',
            'text-gray-600 dark:text-gray-400'
          )}
        >
          Choose a prompt below or type your own message
        </Text>
      </View>

      {/* Suggested Prompts Grid */}
      <View className={cn('flex-1')}>
        <View className={cn('flex-row flex-wrap justify-between')}>
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={prompt.id}
              onPress={() => onPromptSelect(prompt.text)}
              className={cn(
                'w-[48%] mb-3 rounded-2xl p-4 border',
                'bg-gray-50 dark:bg-gray-800',
                'border-gray-200 dark:border-gray-700',
                'active:bg-gray-100 dark:active:bg-gray-700'
              )}
              activeOpacity={0.7}
            >
              <View className={cn('flex-row items-start')}>
                <View className={cn('mr-3 mt-1')}>
                  <MaterialIcons name={prompt.icon} size={20} color={colors.icon} />
                </View>
                <View className={cn('flex-1')}>
                  <Text
                    className={cn(
                      'text-sm font-medium leading-5 mb-1',
                      'text-gray-900 dark:text-white'
                    )}
                    numberOfLines={3}
                  >
                    {prompt.text}
                  </Text>
                  <Text className={cn('text-xs', 'text-gray-500 dark:text-gray-400')}>
                    {prompt.category}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};
