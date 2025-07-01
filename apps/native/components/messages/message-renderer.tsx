import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { MarkdownContent } from './markdown-content';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

interface MessageRendererProps {
  message: Message;
}

export const MessageRenderer: React.FC<MessageRendererProps> = memo(({ message }) => {
  const { isDarkColorScheme } = useColorScheme();
  const theme = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // User message styling - with background, right aligned
  if (isUser) {
    return (
      <View className={cn('mb-4 px-4')}>
        <View className={cn('items-end')}>
          <View
            className={cn('px-4 py-3 rounded-2xl rounded-br-md max-w-[85%]')}
            style={{
              backgroundColor: theme.primary,
              shadowColor: isDarkColorScheme ? '#000' : theme.primary,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDarkColorScheme ? 0.2 : 0.15,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              className={cn('font-nunito')}
              style={{
                color: isDarkColorScheme
                  ? CHATZO_COLORS.dark.background
                  : CHATZO_COLORS.light.background,
                fontSize: 15,
                lineHeight: 21,
                fontWeight: '500',
              }}
            >
              {message.content}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Assistant message styling - no background, full width
  if (isAssistant) {
    return (
      <View className={cn('mb-4 px-4')}>
        <View className={cn('w-full')}>
          <MarkdownContent content={message.content} />
        </View>
      </View>
    );
  }

  // System message (fallback)
  return (
    <View className={cn('mb-3 items-center px-4')}>
      <View
        className={cn('px-3 py-2 rounded-lg')}
        style={{
          backgroundColor: theme.textSecondary + '20',
        }}
      >
        <Text
          className={cn('text-xs text-center font-nunito')}
          style={{
            color: theme.textSecondary,
          }}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
});

MessageRenderer.displayName = 'MessageRenderer';
