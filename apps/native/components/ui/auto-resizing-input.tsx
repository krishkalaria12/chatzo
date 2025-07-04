import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/lib/use-color-scheme';
import { ModelPicker } from './model-picker';
import { SelectedImage, ImagePreview } from '../images';
import { cn } from '@/lib/utils';
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/cloudinary';
import { useModelsStore, validateModelForImages, DisplayModel } from '@/store/models-store';
import { isImageFormatSupported } from '@/utils/cloudinary';

interface ImageAttachment {
  id: string;
  uri: string;
  cloudinaryPublicId?: string;
  name: string;
  size?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

interface AutoResizingInputProps {
  onSend?: (text: string, images?: ImageAttachment[]) => void;
  placeholder?: string;
  selectedModel?: string;
  onModelChange?: (modelKey: string) => void;
  uploadPreset?: string;
  maxImages?: number;
  disabled?: boolean;
}

export const AutoResizingInput: React.FC<AutoResizingInputProps> = ({
  onSend,
  placeholder = 'Type your message...',
  selectedModel = 'gemini-2.5-flash',
  onModelChange,
  uploadPreset = 'chatzo',
  maxImages = 5,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isPickingImages, setIsPickingImages] = useState(false);
  const [modelWarning, setModelWarning] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { isDarkColorScheme } = useColorScheme();

  // Theme colors with better contrast
  const colors = {
    container: isDarkColorScheme ? '#1f2937' : '#f8fafc',
    border: isDarkColorScheme ? '#374151' : '#e2e8f0',
    text: isDarkColorScheme ? '#f9fafb' : '#1e293b',
    placeholder: isDarkColorScheme ? '#9ca3af' : '#64748b',
    icon: isDarkColorScheme ? '#9ca3af' : '#64748b',
    sendButton: {
      active: isDarkColorScheme ? '#3b82f6' : '#2563eb',
      inactive: isDarkColorScheme ? '#374151' : '#cbd5e1',
    },
    sendText: {
      active: '#ffffff',
      inactive: isDarkColorScheme ? '#6b7280' : '#64748b',
    },
    modelSection: isDarkColorScheme ? '#111827' : '#ffffff',
  };

  // Animation for send button press
  const animationProgress = useSharedValue(0);

  // Check model validation when images or model changes
  React.useEffect(() => {
    const validation = validateModelForImages(selectedModel, images.length > 0);
    setModelWarning(validation.canProceed ? null : validation.warning || null);
  }, [selectedModel, images.length]);

  // Request camera permissions
  const requestCameraPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  // Request media library permissions
  const requestMediaLibraryPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please enable photo library access in your device settings to select images.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  // Process selected images
  const processSelectedImages = (assets: any[]): SelectedImage[] => {
    const validImages: SelectedImage[] = [];
    const invalidImages: string[] = [];

    assets.forEach(asset => {
      if (isImageFormatSupported(asset.uri)) {
        validImages.push({
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName || `image_${Date.now()}_${validImages.length}.jpg`,
          size: asset.fileSize,
          width: asset.width,
          height: asset.height,
        });
      } else {
        invalidImages.push(asset.fileName || 'Unknown file');
      }
    });

    if (invalidImages.length > 0) {
      Alert.alert(
        'Some Files Skipped',
        `The following files were skipped due to unsupported format:\n${invalidImages.join(', ')}`
      );
    }

    return validImages;
  };

  const handleSend = () => {
    // Check if we can proceed with current model and images
    const validation = validateModelForImages(selectedModel, images.length > 0);

    if (!validation.canProceed) {
      Alert.alert(
        'Model Incompatible',
        validation.warning || 'Selected model cannot handle images',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (text.trim() || images.length > 0) {
      // Filter out images that are still uploading or have errors
      const validImages = images.filter(img => !img.isUploading && !img.error);

      onSend?.(text.trim(), validImages.length > 0 ? validImages : undefined);
      setText('');
      setImages([]);
      setInputHeight(40);
      setModelWarning(null);

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

  // Handle image selection
  const handleImagesSelected = async (selectedImages: SelectedImage[]) => {
    if (disabled) return;

    // Convert to ImageAttachment and start upload
    const newImages: ImageAttachment[] = selectedImages.map(img => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      uri: img.uri,
      name: img.name,
      size: img.size,
      isUploading: true,
      uploadProgress: 0,
    }));

    // Add to images state
    setImages(prevImages => {
      const totalImages = prevImages.length + newImages.length;
      if (totalImages > maxImages) {
        Alert.alert(
          'Too Many Images',
          `You can only attach up to ${maxImages} images. Some images will be skipped.`
        );
        return [...prevImages, ...newImages.slice(0, maxImages - prevImages.length)];
      }
      return [...prevImages, ...newImages];
    });

    // Upload each image
    for (const newImage of newImages) {
      try {
        // Update progress
        setImages(prevImages =>
          prevImages.map(img => (img.id === newImage.id ? { ...img, uploadProgress: 10 } : img))
        );

        const result = await uploadToCloudinary(newImage.uri, {
          upload_preset: uploadPreset,
          folder: 'chatzo_images',
          resource_type: 'image',
          tags: ['chat', 'user_upload'],
        });

        // Update with successful upload
        setImages(prevImages =>
          prevImages.map(img =>
            img.id === newImage.id
              ? {
                  ...img,
                  uri: result.secure_url, // Use the full Cloudinary URL from response
                  cloudinaryPublicId: result.public_id,
                  isUploading: false,
                  uploadProgress: 100,
                  error: undefined,
                }
              : img
          )
        );
      } catch (error) {
        console.error('Image upload failed:', error);

        // Update with error
        setImages(prevImages =>
          prevImages.map(img =>
            img.id === newImage.id
              ? {
                  ...img,
                  isUploading: false,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : img
          )
        );
      }
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId: string) => {
    const imageToDelete = images.find(img => img.id === imageId);

    // Remove from UI immediately
    setImages(prevImages => prevImages.filter(img => img.id !== imageId));

    // Delete from Cloudinary if it was uploaded
    if (imageToDelete?.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(imageToDelete.cloudinaryPublicId);
      } catch (error) {
        console.warn('Failed to delete image from Cloudinary:', error);
      }
    }
  };

  // Direct camera access
  const handleCameraPress = async () => {
    if (disabled || isPickingImages) return;

    if (images.length >= maxImages) {
      Alert.alert('Maximum Images Reached', `You can only attach up to ${maxImages} images.`);
      return;
    }

    try {
      setIsPickingImages(true);

      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
        aspect: undefined,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processedImages = processSelectedImages(result.assets);
        if (processedImages.length > 0) {
          await handleImagesSelected(processedImages);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsPickingImages(false);
    }
  };

  // Direct gallery access
  const handleGalleryPress = async () => {
    if (disabled || isPickingImages) return;

    if (images.length >= maxImages) {
      Alert.alert('Maximum Images Reached', `You can only attach up to ${maxImages} images.`);
      return;
    }

    try {
      setIsPickingImages(true);

      const hasPermission = await requestMediaLibraryPermissions();
      if (!hasPermission) return;

      const remainingSlots = maxImages - images.length;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: remainingSlots > 1,
        quality: 0.8,
        allowsEditing: false,
        aspect: undefined,
        exif: false,
        base64: false,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processedImages = processSelectedImages(result.assets);
        if (processedImages.length > 0) {
          await handleImagesSelected(processedImages);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Gallery Error', 'Failed to pick images. Please try again.');
    } finally {
      setIsPickingImages(false);
    }
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

  // Calculate container height with proper spacing
  const modelSectionHeight = 50; // Fixed height for model picker
  const imagePreviewHeight = images.length > 0 ? 140 : 0;
  const warningHeight = modelWarning ? 45 : 0;
  const inputSectionHeight = Math.max(inputHeight + 60, 100); // Ensure minimum height
  const totalHeight = modelSectionHeight + imagePreviewHeight + warningHeight + inputSectionHeight;

  // Simple animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(animationProgress.value, [0, 1], [1, 0.98]);
    return {
      transform: [{ scale }],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className='px-4 pb-6 pt-2'>
        <Animated.View
          style={[
            animatedContainerStyle,
            {
              height: totalHeight,
              backgroundColor: colors.container,
              borderColor: colors.border,
            },
          ]}
          className='overflow-hidden rounded-2xl border'
        >
          {/* Model Selector - Fixed height section */}
          <View
            style={{
              backgroundColor: colors.modelSection,
              borderBottomColor: colors.border,
              height: modelSectionHeight,
            }}
            className='border-b px-4 py-2 justify-center'
          >
            <View className='flex-row items-center'>
              <Text style={{ color: colors.icon }} className='text-xs font-medium w-12'>
                Model
              </Text>
              <View className='flex-1 ml-2'>
                <ModelPicker
                  selectedModel={selectedModel}
                  onModelChange={onModelChange || (() => {})}
                />
              </View>
            </View>
          </View>

          {/* Model Warning Section */}
          {modelWarning && (
            <View
              style={{
                borderBottomColor: colors.border,
                backgroundColor: isDarkColorScheme ? '#7f1d1d' : '#fef2f2',
                height: warningHeight,
              }}
              className='border-b px-4 py-2 justify-center'
            >
              <Text
                style={{
                  fontSize: 12,
                  color: isDarkColorScheme ? '#fca5a5' : '#dc2626',
                }}
                numberOfLines={2}
              >
                ⚠️ {modelWarning}
              </Text>
            </View>
          )}

          {/* Image Preview Section */}
          {images.length > 0 && (
            <View
              style={{
                borderBottomColor: colors.border,
                height: imagePreviewHeight,
              }}
              className='border-b px-4 py-2'
            >
              <ImagePreview
                images={images}
                onDeleteImage={handleDeleteImage}
                showProgress={true}
                editable={!disabled}
              />
            </View>
          )}

          {/* Input area */}
          <View className='flex-1 px-4 py-3'>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleInputContainerPress}
              className='flex-1'
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
                editable={!disabled}
                style={{
                  fontSize: 16,
                  lineHeight: 22,
                  minHeight: inputHeight,
                  color: colors.text,
                  paddingTop: 0,
                  paddingBottom: 0,
                  ...(Platform.OS === 'android' && {
                    textAlignVertical: 'top',
                  }),
                  ...(Platform.OS === 'web' && {
                    outline: 'none',
                    border: 'none',
                    resize: 'none',
                  }),
                }}
              />
            </TouchableOpacity>

            {/* Bottom section with icons and send button */}
            <View className='flex-row items-center justify-between mt-3'>
              {/* Left side icons */}
              <View className='flex-row items-center'>
                {/* Camera Button */}
                <TouchableOpacity
                  className='p-2 mr-2'
                  onPress={handleCameraPress}
                  disabled={disabled || isPickingImages}
                  style={{
                    opacity: disabled || isPickingImages ? 0.5 : 1,
                  }}
                >
                  <Camera
                    size={20}
                    color={disabled || isPickingImages ? colors.placeholder : colors.icon}
                  />
                </TouchableOpacity>

                {/* Gallery Button */}
                <TouchableOpacity
                  className='p-2 mr-2'
                  onPress={handleGalleryPress}
                  disabled={disabled || isPickingImages}
                  style={{
                    opacity: disabled || isPickingImages ? 0.5 : 1,
                  }}
                >
                  <ImageIcon
                    size={20}
                    color={disabled || isPickingImages ? colors.placeholder : colors.icon}
                  />
                </TouchableOpacity>

                {/* Image count indicator */}
                {images.length > 0 && (
                  <View
                    style={{
                      backgroundColor: colors.sendButton.active,
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      marginRight: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.sendText.active,
                        fontSize: 12,
                        fontWeight: '500',
                      }}
                    >
                      {images.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Send button */}
              <TouchableOpacity
                onPress={handleSend}
                disabled={disabled || (!text.trim() && images.length === 0)}
                className='rounded-full px-4 py-2'
                style={{
                  backgroundColor:
                    !disabled && (text.trim() || images.length > 0)
                      ? colors.sendButton.active
                      : colors.sendButton.inactive,
                  opacity: disabled || (!text.trim() && images.length === 0) ? 0.5 : 1,
                }}
              >
                <Text
                  className='font-medium'
                  style={{
                    color:
                      !disabled && (text.trim() || images.length > 0)
                        ? colors.sendText.active
                        : colors.sendText.inactive,
                  }}
                >
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};
