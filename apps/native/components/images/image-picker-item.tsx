import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image, useImage } from 'expo-image';
import { useColorScheme } from '@/lib/use-color-scheme';

export interface SelectedImage {
  uri: string;
  type: string;
  name: string;
  size?: number;
  width?: number;
  height?: number;
}

export interface ImagePickerItemProps {
  image: SelectedImage;
  onRemove: () => void;
  showDimensions?: boolean;
  showFileSize?: boolean;
  thumbnailSize?: number;
}

/**
 * Enhanced Image Preview Item Component using expo-image v2
 * Benefits: Better performance, automatic caching, metadata extraction, and memory management
 * Used in image picker preview lists and other image selection interfaces
 */
export const ImagePickerItem: React.FC<ImagePickerItemProps> = ({
  image,
  onRemove,
  showDimensions = true,
  showFileSize = true,
  thumbnailSize = 60,
}) => {
  const [imageError, setImageError] = useState(false);
  const { isDarkColorScheme } = useColorScheme();

  // Colors for preview
  const colors = {
    background: isDarkColorScheme ? '#18181b' : '#ffffff',
    border: isDarkColorScheme ? '#3f3f46' : '#e4e4e7',
    text: isDarkColorScheme ? '#fafafa' : '#0f172a',
    textSecondary: isDarkColorScheme ? '#a1a1aa' : '#64748b',
    danger: isDarkColorScheme ? '#ef4444' : '#dc2626',
  };

  // Use expo-image v2 useImage hook for better performance and automatic caching
  const imageData = useImage(image.uri, {
    maxWidth: thumbnailSize + 20, // Slightly larger for better quality
    onError: (error, retry) => {
      console.error('Image preview loading failed:', error);
      setImageError(true);
    },
  });

  // Utility function to format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 8,
      }}
    >
      {/* Image Thumbnail */}
      <View
        style={{
          width: thumbnailSize,
          height: thumbnailSize,
          borderRadius: 8,
          backgroundColor: colors.border,
          marginRight: 12,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {!imageError && imageData ? (
          <Image
            source={imageData}
            style={{
              width: '100%',
              height: '100%',
            }}
            contentFit='cover'
            transition={200}
          />
        ) : !imageError ? (
          // Loading state
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.background,
            }}
          >
            <ActivityIndicator size='small' color={colors.textSecondary} />
          </View>
        ) : (
          // Error state
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.border,
            }}
          >
            <MaterialIcons name='image' size={24} color={colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Image Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {image.name}
        </Text>

        {/* File Size */}
        {showFileSize && image.size && (
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            {formatFileSize(image.size)}
          </Text>
        )}

        {/* Image Dimensions */}
        {showDimensions && image.width && image.height && (
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 1,
            }}
          >
            {image.width} × {image.height}
          </Text>
        )}
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        onPress={onRemove}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.danger,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 8,
        }}
        activeOpacity={0.7}
      >
        <MaterialIcons name='close' size={18} color='#ffffff' />
      </TouchableOpacity>
    </View>
  );
};
