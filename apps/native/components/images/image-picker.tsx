import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { Image, useImage } from 'expo-image';
import { useColorScheme } from '@/lib/use-color-scheme';
import { cn } from '@/lib/utils';
import { isImageFormatSupported } from '@/utils/cloudinary';
import { ImagePickerItem, type SelectedImage } from './image-picker-item';

interface ImagePickerComponentProps {
  onImagesSelected: (images: SelectedImage[]) => void;
  maxImages?: number;
  uploadPreset: string;
  disabled?: boolean;
  showPicker: boolean;
  onClose: () => void;
}

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  onImagesSelected,
  maxImages = 5,
  uploadPreset,
  disabled = false,
  showPicker,
  onClose,
}) => {
  const [isPickingImages, setIsPickingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { isDarkColorScheme } = useColorScheme();

  // Theme colors
  const colors = {
    background: isDarkColorScheme ? '#18181b' : '#ffffff',
    overlay: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    cardBackground: isDarkColorScheme ? '#27272a' : '#f8fafc',
    border: isDarkColorScheme ? '#3f3f46' : '#e4e4e7',
    text: isDarkColorScheme ? '#fafafa' : '#0f172a',
    textSecondary: isDarkColorScheme ? '#a1a1aa' : '#64748b',
    primary: isDarkColorScheme ? '#3b82f6' : '#2563eb',
    danger: isDarkColorScheme ? '#ef4444' : '#dc2626',
    success: isDarkColorScheme ? '#10b981' : '#059669',
  };

  // Request camera permissions with better UX
  const requestCameraPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true; // Web handles permissions automatically
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

  // Request media library permissions with better UX
  const requestMediaLibraryPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true; // Web handles permissions automatically
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

  // Enhanced image processing with better validation
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

  // Take photo with camera
  const takePhoto = async () => {
    if (isPickingImages || disabled) return;

    try {
      setIsPickingImages(true);
      onClose(); // Close picker modal

      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
        aspect: undefined,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processedImages = processSelectedImages(result.assets);
        if (processedImages.length > 0) {
          setSelectedImages(processedImages);
          setShowPreview(true);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsPickingImages(false);
    }
  };

  // Pick images from gallery with enhanced handling
  const pickFromGallery = async () => {
    if (isPickingImages || disabled) return;

    try {
      setIsPickingImages(true);
      onClose(); // Close picker modal

      const hasPermission = await requestMediaLibraryPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: maxImages > 1,
        quality: 0.8,
        allowsEditing: false,
        aspect: undefined,
        exif: false,
        base64: false,
        selectionLimit: maxImages,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const processedImages = processSelectedImages(result.assets);
        if (processedImages.length > 0) {
          setSelectedImages(processedImages);
          setShowPreview(true);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Gallery Error', 'Failed to pick images. Please try again.');
    } finally {
      setIsPickingImages(false);
    }
  };

  // Handle final image selection
  const handleConfirmSelection = () => {
    onImagesSelected(selectedImages);
    setSelectedImages([]);
    setShowPreview(false);
  };

  // Handle image removal from preview
  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);

    if (newImages.length === 0) {
      setShowPreview(false);
    }
  };

  // Preview Modal
  if (showPreview) {
    return (
      <Modal
        visible={true}
        transparent
        animationType='slide'
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.background,
              marginTop: 100,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={{ marginRight: 16 }}>
                <MaterialIcons name='arrow-back' size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, flex: 1 }}>
                Selected Images ({selectedImages.length})
              </Text>
            </View>

            {/* Image List */}
            <View style={{ flex: 1 }}>
              {selectedImages.map((image, index) => (
                <ImagePickerItem
                  key={index}
                  image={image}
                  onRemove={() => handleRemoveImage(index)}
                />
              ))}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 16,
                  backgroundColor: colors.cardBackground,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginRight: 8,
                }}
                onPress={() => setShowPreview(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  padding: 16,
                  backgroundColor: colors.success,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginLeft: 8,
                }}
                onPress={handleConfirmSelection}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                  Use {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Main Picker Modal
  return (
    <Modal visible={showPicker} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 320,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={e => e.stopPropagation()}
        >
          {/* Header */}
          <View className={cn('mb-6')}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: colors.text,
                textAlign: 'center',
              }}
            >
              Add Images
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              {maxImages > 1 ? `Select up to ${maxImages} images` : 'Select an image'}
            </Text>
          </View>

          {/* Options */}
          <View className={cn('space-y-3')}>
            {/* Camera Option */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: colors.cardBackground,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: isPickingImages ? 0.6 : 1,
              }}
              onPress={takePhoto}
              disabled={isPickingImages}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                {isPickingImages ? (
                  <ActivityIndicator size='small' color='#ffffff' />
                ) : (
                  <MaterialIcons name='camera-alt' size={20} color='#ffffff' />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
                  Take Photo
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Use your camera to take a new photo
                </Text>
              </View>
            </TouchableOpacity>

            {/* Gallery Option */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: colors.cardBackground,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: isPickingImages ? 0.6 : 1,
              }}
              onPress={pickFromGallery}
              disabled={isPickingImages}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                {isPickingImages ? (
                  <ActivityIndicator size='small' color='#ffffff' />
                ) : (
                  <MaterialIcons name='photo-library' size={20} color='#ffffff' />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
                  Photo Library
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {maxImages > 1
                    ? 'Select multiple images from your gallery'
                    : 'Choose from your gallery'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={{
              marginTop: 20,
              padding: 12,
              alignItems: 'center',
            }}
            onPress={onClose}
          >
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
