import React, { useState, useRef } from 'react';
import { View, TextInput, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { ModelPicker } from './model-picker';

interface AutoResizingInputProps {
  onSend?: (text: string) => void;
  placeholder?: string;
  selectedModel?: string;
  onModelChange?: (modelKey: string) => void;
}

export const AutoResizingInput: React.FC<AutoResizingInputProps> = ({
  onSend,
  placeholder = 'Type your message...',
  selectedModel = 'gemini-2.5-flash',
  onModelChange,
}) => {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const inputRef = useRef<TextInput>(null);
  const { isDarkColorScheme } = useColorScheme();

  // Theme colors
  const colors = {
    container: isDarkColorScheme ? '#27272a' : '#f4f4f5',
    border: isDarkColorScheme ? '#3f3f46' : '#e4e4e7',
    text: isDarkColorScheme ? '#fafafa' : '#09090b',
    placeholder: isDarkColorScheme ? '#9ca3af' : '#71717a',
    icon: isDarkColorScheme ? '#9ca3af' : '#71717a',
    sendButton: {
      active: isDarkColorScheme ? '#ffffff' : '#09090b',
      inactive: isDarkColorScheme ? '#3f3f46' : '#d4d4d8',
    },
    sendText: {
      active: isDarkColorScheme ? '#000000' : '#ffffff',
      inactive: isDarkColorScheme ? '#9ca3af' : '#71717a',
    },
  };

  // Animation for send button press
  const animationProgress = useSharedValue(0);

  const handleSend = () => {
    if (text.trim()) {
      onSend?.(text.trim());
      setText('');
      setInputHeight(40);

      // Quick animation
      animationProgress.value = withSpring(1, { damping: 15 });
      setTimeout(() => {
        animationProgress.value = withSpring(0, { damping: 15 });
      }, 100);
    }
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
  };

  // Handle content size change for better height calculation
  const handleContentSizeChange = (event: any) => {
    const { height } = event.nativeEvent.contentSize;
    // Set minimum height and ensure proper sizing
    const minHeight = 40;
    const maxHeight = 120;
    const newHeight = Math.max(minHeight, Math.min(height + 10, maxHeight));
    setInputHeight(newHeight);
  };

  // Handle key press for web (Enter to send)
  const handleKeyPress = (e: any) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle input container press to focus input (especially for web)
  const handleInputContainerPress = () => {
    inputRef.current?.focus();
  };

  // Container height = input height + padding for icons/buttons + model picker
  const containerHeight = inputHeight + 90; // Reduced height for native picker

  // Simple animated styles - only animate scale, not height to avoid conflict with KeyboardAvoidingView
  const animatedContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(animationProgress.value, [0, 1], [1, 0.95]);
    return {
      transform: [{ scale }],
    };
  });

  return (
    <View className='px-4 pb-6 pt-1'>
      <Animated.View
        style={[
          animatedContainerStyle,
          {
            height: containerHeight,
            backgroundColor: colors.container,
            borderColor: colors.border,
          },
        ]}
        className='overflow-hidden rounded-2xl border'
      >
        {/* Model Selector */}
        <View className='px-4 py-2 border-b' style={{ borderColor: colors.border }}>
          <View className='flex-row items-center justify-between'>
            <Text className='text-xs font-medium' style={{ color: colors.icon }}>
              Model
            </Text>
            <View className='flex-1 ml-3'>
              <ModelPicker
                selectedModel={selectedModel}
                onModelChange={onModelChange || (() => {})}
              />
            </View>
          </View>
        </View>

        {/* Input area */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleInputContainerPress}
          className='flex-1 px-6 py-3'
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleTextChange}
            onContentSizeChange={handleContentSizeChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical='top'
            style={{
              fontSize: 16,
              lineHeight: 22,
              height: inputHeight,
              color: colors.text,
              paddingTop: 0,
              paddingBottom: 0,
              ...(Platform.OS === 'android' && {
                textAlignVertical: 'top',
              }),
              // Remove focus outline/border
              ...(Platform.OS === 'web' && {
                outline: 'none',
                border: 'none',
                resize: 'none',
              }),
            }}
          />
        </TouchableOpacity>

        {/* Bottom section */}
        <View className='flex-row items-center justify-between px-4 py-2'>
          {/* Icons */}
          <View className='flex-row items-center'>
            <TouchableOpacity className='p-1'>
              <MaterialIcons name='attach-file' size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Send button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            className='rounded-full px-4 py-2'
            style={{
              backgroundColor: text.trim() ? colors.sendButton.active : colors.sendButton.inactive,
              opacity: !text.trim() ? 0.5 : 1,
            }}
          >
            <Text
              className='font-medium'
              style={{
                color: text.trim() ? colors.sendText.active : colors.sendText.inactive,
              }}
            >
              Send
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};
