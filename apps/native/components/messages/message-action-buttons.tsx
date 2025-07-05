import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, Pressable } from 'react-native';
import { Copy, RotateCcw, Edit3, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from '@/lib/use-color-scheme';
import { cn } from '@/lib/utils';
import { ModelPicker } from '@/components/ui/model-picker';

interface MessageActionButtonsProps {
  messageId: string;
  role: 'user' | 'assistant' | 'system';
  content: string | any;
  isVisible?: boolean;
  onCopy?: () => void;
  onRetry?: (messageId: string, selectedModel?: string) => void;
  onEdit?: (messageId: string) => void;
  onCancel?: () => void;
}

export const MessageActionButtons: React.FC<MessageActionButtonsProps> = ({
  messageId,
  role,
  content,
  isVisible = true,
  onCopy,
  onRetry,
  onEdit,
  onCancel,
}) => {
  const { isDarkColorScheme } = useColorScheme();
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');

  const colors = {
    button: isDarkColorScheme ? '#374151' : '#f1f5f9',
    buttonHover: isDarkColorScheme ? '#4b5563' : '#e2e8f0',
    text: isDarkColorScheme ? '#d1d5db' : '#475569',
    textHover: isDarkColorScheme ? '#f9fafb' : '#334155',
    border: isDarkColorScheme ? '#4b5563' : '#e2e8f0',
    background: isDarkColorScheme ? '#1f2937' : '#ffffff',
  };

  // Extract text content from message for copying
  const getTextContent = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' ');
    }

    if (content && typeof content === 'object' && content.type === 'text') {
      return content.text;
    }

    return 'Unable to copy content';
  };

  const handleCopy = async () => {
    try {
      const textContent = getTextContent(content);
      await Clipboard.setStringAsync(textContent);

      // Show success feedback
      Alert.alert('Copied!', 'Message copied to clipboard', [{ text: 'OK', style: 'default' }]);

      onCopy?.();
    } catch (error) {
      console.error('Copy failed:', error);
      Alert.alert('Copy Failed', 'Unable to copy message to clipboard');
    }
  };

  const handleRetryClick = () => {
    if (role === 'user') {
      // For user messages, show model picker
      setShowModelPicker(true);
    } else {
      // For assistant messages, retry with same model
      onRetry?.(messageId);
    }
  };

  const handleModelConfirm = () => {
    setShowModelPicker(false);
    onRetry?.(messageId, selectedModel);
  };

  const handleEdit = () => {
    if (role === 'user') {
      onEdit?.(messageId);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <View
        className={cn(
          'flex-row items-center gap-1 mt-2 px-1 py-1 rounded-lg',
          'bg-background/50 backdrop-blur-sm'
        )}
        style={{
          backgroundColor: colors.background + '80',
          borderColor: colors.border,
          borderWidth: 1,
        }}
      >
        {/* Copy Button */}
        <TouchableOpacity
          onPress={handleCopy}
          className={cn(
            'flex-row items-center gap-1 px-2 py-1.5 rounded-md',
            'active:scale-95 transition-transform'
          )}
          style={{ backgroundColor: colors.button }}
          activeOpacity={0.7}
        >
          <Copy size={14} color={colors.text} />
          <Text className='text-xs font-medium' style={{ color: colors.text }}>
            Copy
          </Text>
        </TouchableOpacity>

        {/* Retry Button */}
        <TouchableOpacity
          onPress={handleRetryClick}
          className={cn(
            'flex-row items-center gap-1 px-2 py-1.5 rounded-md',
            'active:scale-95 transition-transform'
          )}
          style={{ backgroundColor: colors.button }}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color={colors.text} />
          <Text className='text-xs font-medium' style={{ color: colors.text }}>
            Retry
          </Text>
        </TouchableOpacity>

        {/* Edit Button - Only for user messages */}
        {role === 'user' && (
          <TouchableOpacity
            onPress={handleEdit}
            className={cn(
              'flex-row items-center gap-1 px-2 py-1.5 rounded-md',
              'active:scale-95 transition-transform'
            )}
            style={{ backgroundColor: colors.button }}
            activeOpacity={0.7}
          >
            <Edit3 size={14} color={colors.text} />
            <Text className='text-xs font-medium' style={{ color: colors.text }}>
              Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Model Picker Modal */}
      {showModelPicker && (
        <View className='absolute inset-0 bg-black/50 flex items-center justify-center z-50'>
          <View
            className='bg-background rounded-xl p-4 mx-4 shadow-2xl'
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 1,
              minWidth: 300,
            }}
          >
            <View className='flex-row items-center justify-between mb-4'>
              <Text className='text-lg font-semibold' style={{ color: colors.text }}>
                Choose Model for Retry
              </Text>
              <TouchableOpacity
                onPress={() => setShowModelPicker(false)}
                className='p-1 rounded-full'
                style={{ backgroundColor: colors.button }}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View className='mb-4'>
              <ModelPicker selectedModel={selectedModel} onModelChange={setSelectedModel} />
            </View>

            <View className='flex-row gap-2'>
              <TouchableOpacity
                onPress={() => setShowModelPicker(false)}
                className='flex-1 py-2 px-4 rounded-lg'
                style={{ backgroundColor: colors.button }}
              >
                <Text className='text-center font-medium' style={{ color: colors.text }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleModelConfirm}
                className='flex-1 py-2 px-4 rounded-lg'
                style={{ backgroundColor: isDarkColorScheme ? '#3b82f6' : '#2563eb' }}
              >
                <Text className='text-center font-medium text-white'>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
};
