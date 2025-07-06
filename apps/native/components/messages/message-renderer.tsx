import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert, TextInput } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { MarkdownContent } from './markdown-content';
import { ToolInvocation } from './tool-invocation';
import { EnhancedImage } from '@/components/images';
import { PDFRenderer } from '@/components/documents';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  MessageContent,
  ContentPart,
  ImageContentPart,
  TextContentPart,
  FileContentPart,
} from '@/lib/api/chat-api';
import { MessageActionButtons } from './message-action-buttons';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  createdAt?: Date;
}

interface MessageRendererProps {
  message: Message;
  onCopy?: (messageId: string) => void;
  onRetry?: (messageId: string, selectedModel?: string) => void;
  onEdit?: (messageId: string, editedText?: string) => void;
  isStreaming?: boolean;
  isLastMessage?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const MessageRenderer: React.FC<MessageRendererProps> = memo(
  ({ message, onCopy, onRetry, onEdit, isStreaming = false, isLastMessage = false }) => {
    const { isDarkColorScheme } = useColorScheme();
    const theme = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');

    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    // Extract text content from message for editing
    const getTextContent = (content: any): string => {
      if (typeof content === 'string') {
        return content;
      }

      if (Array.isArray(content)) {
        return content
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join(' ');
      }

      if (content && typeof content === 'object' && content.type === 'text') {
        return content.text;
      }

      return '';
    };

    // Handle edit start
    const handleEditStart = () => {
      const textContent = getTextContent(message.content);
      setEditText(textContent);
      setIsEditing(true);
    };

    // Handle edit save
    const handleEditSave = () => {
      if (editText.trim()) {
        onEdit?.(message.id, editText.trim());
        setIsEditing(false);
      }
    };

    // Handle edit cancel
    const handleEditCancel = () => {
      setIsEditing(false);
      setEditText('');
    };

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

    // File content renderer with PDF support
    const renderFileContent = (content: {
      type: 'file';
      url: string;
      fileName: string;
      fileSize?: number;
      mimeType?: string;
    }) => {
      // If it's a PDF, use the specialized PDF renderer
      if (content.mimeType === 'application/pdf') {
        return renderPDFContent(content);
      }

      // Generic file renderer for other file types
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

    // PDF content renderer using the specialized PDF renderer
    const renderPDFContent = (content: {
      type: 'file';
      url: string;
      fileName: string;
      fileSize?: number;
      mimeType?: string;
    }) => {
      const maxWidth = screenWidth * (isUser ? 0.7 : 0.8);
      const maxHeight = 200;

      return (
        <View style={{ marginTop: 8, marginBottom: 4 }}>
          <PDFRenderer
            fileName={content.fileName}
            fileSize={content.fileSize}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
          />
        </View>
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
        case 'tool-invocation':
          // Render tool invocation UI part
          return <ToolInvocation toolInvocation={part.toolInvocation} />;
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
      const pdfParts = (
        Array.isArray(content)
          ? content.filter(part => part.type === 'file' && part.mimeType === 'application/pdf')
          : []
      ) as FileContentPart[];
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

          {/* Render PDFs above the text bubble */}
          {pdfParts.length > 0 && (
            <View className='flex-row flex-wrap justify-end gap-2 mb-2'>
              {pdfParts.map((part, index) => (
                <View key={`pdf-${index}`}>{renderPDFContent(part)}</View>
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
              {isEditing ? (
                // Edit mode - TextInput
                <View>
                  <TextInput
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    autoFocus
                    style={{
                      color: isDarkColorScheme
                        ? CHATZO_COLORS.dark.background
                        : CHATZO_COLORS.light.background,
                      fontSize: 15,
                      lineHeight: 21,
                      fontWeight: '500',
                      padding: 0,
                      margin: 0,
                      minHeight: 20,
                    }}
                    placeholder='Edit your message...'
                    placeholderTextColor={isDarkColorScheme ? '#9ca3af' : '#64748b'}
                  />

                  {/* Edit buttons */}
                  <View className='flex-row items-center justify-end mt-2 gap-2'>
                    <TouchableOpacity
                      onPress={handleEditCancel}
                      className='p-1 rounded-full'
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                    >
                      <X
                        size={16}
                        color={
                          isDarkColorScheme
                            ? CHATZO_COLORS.dark.background
                            : CHATZO_COLORS.light.background
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleEditSave}
                      className='p-1 rounded-full'
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                    >
                      <Check
                        size={16}
                        color={
                          isDarkColorScheme
                            ? CHATZO_COLORS.dark.background
                            : CHATZO_COLORS.light.background
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // View mode - Normal text
                textParts.map((part, index) => (
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
                ))
              )}
            </View>
          )}

          {/* Action buttons for user messages */}
          {!isEditing && (
            <MessageActionButtons
              messageId={message.id}
              role={message.role}
              content={message.content}
              onCopy={() => onCopy?.(message.id)}
              onRetry={(messageId, selectedModel) => onRetry?.(messageId, selectedModel)}
              onEdit={handleEditStart}
            />
          )}
        </View>
      );
    }

    // Assistant message styling - no background, full width
    if (isAssistant) {
      // Show action buttons only when not streaming or not the last message
      const showActionButtons = !isStreaming || !isLastMessage;

      return (
        <View className={cn('mb-4 px-4')}>
          <View className={cn('w-full')}>{renderContent(message.content)}</View>

          {/* Action buttons for assistant messages - only show when response is complete */}
          {showActionButtons && (
            <MessageActionButtons
              messageId={message.id}
              role={message.role}
              content={message.content}
              onCopy={() => onCopy?.(message.id)}
              onRetry={(messageId, selectedModel) => onRetry?.(messageId, selectedModel)}
              onEdit={() => onEdit?.(message.id)}
            />
          )}
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
  }
);

MessageRenderer.displayName = 'MessageRenderer';
