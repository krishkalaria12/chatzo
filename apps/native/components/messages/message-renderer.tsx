import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { MarkdownContent } from './markdown-content';
import { EnhancedImage } from '@/components/images';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { MessageContent, ContentPart, ImageContentPart, TextContentPart } from '@/lib/api/chat-api';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  createdAt?: Date;
}

interface MessageRendererProps {
  message: Message;
}

const { width: screenWidth } = Dimensions.get('window');

export const MessageRenderer: React.FC<MessageRendererProps> = memo(({ message }) => {
  const { isDarkColorScheme } = useColorScheme();
  const theme = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Enhanced image content renderer using the EnhancedImage component
  const renderImageContent = (content: { type: 'image'; url: string; alt?: string }) => {
    const maxWidth = screenWidth * (isUser ? 0.6 : 0.7); // Smaller for user messages
    const maxHeight = 300;

    return (
      <View style={{ marginTop: 8, marginBottom: 4 }}>
        <EnhancedImage
          uri={content.url}
          alt={content.alt}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          borderRadius={isUser ? 12 : 8}
          showShadow={true}
          transition={200}
          onPress={() => {
            // Future: Add full-screen image preview
            Alert.alert('Image Preview', 'Full image preview coming soon!');
          }}
        />
      </View>
    );
  };

  // File content renderer (for future file support)
  const renderFileContent = (content: {
    type: 'file';
    url: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
  }) => {
    const formatFileSize = (bytes?: number): string => {
      if (!bytes) return '';
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: isDarkColorScheme ? '#27272a' : '#f8fafc',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.border,
          marginTop: 4,
        }}
        activeOpacity={0.7}
        onPress={() => {
          Alert.alert('File Preview', 'File preview coming soon!');
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: theme.text,
            }}
            numberOfLines={1}
          >
            {content.fileName}
          </Text>
          {content.fileSize && (
            <Text
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                marginTop: 2,
              }}
            >
              {formatFileSize(content.fileSize)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Helper to render individual content parts
  const renderContentPart = (part: ContentPart) => {
    switch (part.type) {
      case 'text':
        // User text is plain, assistant text can be markdown
        if (isUser) {
          return (
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
              {part.text}
            </Text>
          );
        }
        return <MarkdownContent content={part.text} />;
      case 'image':
        return renderImageContent(part);
      case 'file':
        return renderFileContent(part);
      default:
        return <Text style={{ color: theme.text }}>Unsupported content type</Text>;
    }
  };

  // Enhanced content renderer with proper type handling
  const renderContent = (content: MessageContent) => {
    // For simple string content
    if (typeof content === 'string') {
      if (isUser) {
        return (
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
            {content}
          </Text>
        );
      }
      return <MarkdownContent content={content} />;
    }

    // For array content (multiple parts)
    if (Array.isArray(content)) {
      return (
        <View>
          {content.map((part, index) => {
            // Add margin between parts for better spacing
            const partStyle = index > 0 ? { marginTop: 8 } : {};
            return (
              <View key={index} style={partStyle}>
                {renderContentPart(part)}
              </View>
            );
          })}
        </View>
      );
    }

    // For single content part object
    return renderContentPart(content);
  };

  // User message styling - with background, right aligned
  if (isUser) {
    const content = message.content;
    const imageParts = (
      Array.isArray(content) ? content.filter(part => part.type === 'image') : []
    ) as ImageContentPart[];
    const textParts = (
      typeof content === 'string'
        ? [{ type: 'text' as const, text: content }]
        : Array.isArray(content)
          ? content.filter(part => part.type === 'text')
          : content.type === 'text'
            ? [content]
            : []
    ) as TextContentPart[];

    return (
      <View className='mb-4 px-4 items-end'>
        {/* Render images above the text bubble */}
        {imageParts.length > 0 && (
          <View className='flex-row flex-wrap justify-end gap-2 mb-2'>
            {imageParts.map((part, index) => (
              <View key={`img-${index}`}>{renderImageContent(part)}</View>
            ))}
          </View>
        )}

        {/* Render text bubble if there is text */}
        {textParts.length > 0 && (
          <View
            className='px-4 py-3 rounded-2xl rounded-br-md max-w-[85%]'
            style={{
              backgroundColor: theme.primary,
              shadowColor: isDarkColorScheme ? '#000' : theme.primary,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDarkColorScheme ? 0.2 : 0.15,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            {textParts.map((part, index) => (
              <Text
                key={`txt-${index}`}
                className='font-nunito'
                style={{
                  color: isDarkColorScheme
                    ? CHATZO_COLORS.dark.background
                    : CHATZO_COLORS.light.background,
                  fontSize: 15,
                  lineHeight: 21,
                  fontWeight: '500',
                }}
              >
                {part.text}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  // Assistant message styling - no background, full width
  if (isAssistant) {
    return (
      <View className={cn('mb-4 px-4')}>
        <View className={cn('w-full')}>{renderContent(message.content)}</View>
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
          {/* System messages are assumed to be simple text for now */}
          {typeof message.content === 'string' ? message.content : 'System message'}
        </Text>
      </View>
    </View>
  );
});

MessageRenderer.displayName = 'MessageRenderer';
