import React, { memo, forwardRef } from 'react';
import { ScrollView, View, ActivityIndicator, Text } from 'react-native';
import { MessageRenderer } from './message-renderer';
import { AssistantMessageSkeleton } from './extra';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

// AI SDK Message interface compatibility
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  createdAt?: Date;
}

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
  isLoadingMessages?: boolean;
  className?: string;
}

export const MessageList = memo(
  forwardRef<ScrollView, MessageListProps>(
    ({ messages, isLoading = false, isLoadingMessages = false, className }, ref) => {
      const { isDarkColorScheme } = useColorScheme();
      const theme = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

      // Filter out unsupported message types (like 'data' role)
      const supportedMessages = messages.filter(
        message =>
          message.role === 'user' || message.role === 'assistant' || message.role === 'system'
      );

      // Loading indicator for initial message loading
      if (isLoadingMessages) {
        return (
          <View className={cn('flex-1 justify-center items-center', className)}>
            <ActivityIndicator size='large' color={theme.primary} className={cn('mb-3')} />
            <Text
              className={cn('text-base font-nunito')}
              style={{
                color: theme.textSecondary,
              }}
            >
              Loading conversation...
            </Text>
          </View>
        );
      }

      return (
        <ScrollView
          ref={ref}
          className={cn('flex-1', className)}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 12,
            flexGrow: 1,
            justifyContent: supportedMessages.length === 0 ? 'center' : 'flex-end',
          }}
          keyboardShouldPersistTaps='handled'
        >
          {/* Empty state */}
          {supportedMessages.length === 0 && !isLoading && (
            <View className={cn('flex-1 justify-center items-center py-12')}>
              <Text
                className={cn('text-lg font-medium text-center mb-2 font-nunito')}
                style={{
                  color: theme.textSecondary,
                }}
              >
                Start a conversation
              </Text>
              <Text
                className={cn('text-base text-center font-nunito')}
                style={{
                  color: theme.textSecondary,
                }}
              >
                Type a message below to begin
              </Text>
            </View>
          )}

          {/* Messages */}
          {supportedMessages.map((message, index) => (
            <MessageRenderer
              key={`${message.id}-${index}`}
              message={{
                id: message.id,
                role: message.role as 'user' | 'assistant' | 'system',
                content: message.content,
                createdAt: message.createdAt,
              }}
            />
          ))}

          {/* Assistant typing indicator */}
          {isLoading && <AssistantMessageSkeleton />}
        </ScrollView>
      );
    }
  )
);

MessageList.displayName = 'MessageList';
