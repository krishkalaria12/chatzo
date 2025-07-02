import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/cloudinary';

interface ImageData {
  id: string;
  uri: string;
  cloudinaryPublicId?: string;
  name: string;
  size?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

interface ImagePreviewProps {
  images: ImageData[];
  onDeleteImage: (imageId: string) => void;
  maxWidth?: number;
  showProgress?: boolean;
  editable?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  onDeleteImage,
  maxWidth = screenWidth - 32,
  showProgress = true,
  editable = true,
}) => {
  const { isDarkColorScheme } = useColorScheme();

  const colors = {
    background: isDarkColorScheme ? '#27272a' : '#f8fafc',
    border: isDarkColorScheme ? '#3f3f46' : '#e4e4e7',
    text: isDarkColorScheme ? '#fafafa' : '#0f172a',
    textSecondary: isDarkColorScheme ? '#a1a1aa' : '#64748b',
    error: isDarkColorScheme ? '#ef4444' : '#dc2626',
    success: isDarkColorScheme ? '#22c55e' : '#16a34a',
    overlay: isDarkColorScheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
  };

  const handleDeletePress = (imageId: string, imageName: string) => {
    Alert.alert('Delete Image', `Are you sure you want to remove "${imageName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDeleteImage(imageId),
      },
    ]);
  };

  const getImageUrl = (image: ImageData): string => {
    if (image.cloudinaryPublicId) {
      return getOptimizedImageUrl(image.cloudinaryPublicId, {
        width: 200,
        height: 200,
        quality: 'auto',
        format: 'auto',
        crop: 'fill',
      });
    }
    return image.uri;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (images.length === 0) {
    return null;
  }

  const imageSize = Math.min((maxWidth - 16) / 3, 120);

  return (
    <View className={cn('mb-4')}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          maxWidth,
        }}
      >
        {images.map(image => (
          <View
            key={image.id}
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: 12,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Image
              source={{ uri: getImageUrl(image) }}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.background,
              }}
              resizeMode='cover'
            />

            {image.isUploading && showProgress && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: colors.overlay,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size='small' color='#ffffff' />
                {image.uploadProgress !== undefined && (
                  <Text
                    style={{
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: '500',
                      marginTop: 4,
                    }}
                  >
                    {Math.round(image.uploadProgress)}%
                  </Text>
                )}
              </View>
            )}

            {image.error && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 8,
                }}
              >
                <MaterialIcons name='error' size={24} color='#ffffff' />
                <Text
                  style={{
                    color: '#ffffff',
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                  numberOfLines={2}
                >
                  Upload failed
                </Text>
              </View>
            )}

            {editable && !image.isUploading && (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.error,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1,
                  elevation: 2,
                }}
                onPress={() => handleDeletePress(image.id, image.name)}
                activeOpacity={0.8}
              >
                <MaterialIcons name='close' size={14} color='#ffffff' />
              </TouchableOpacity>
            )}

            {!image.isUploading && !image.error && image.cloudinaryPublicId && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.success,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name='check' size={12} color='#ffffff' />
              </View>
            )}
          </View>
        ))}
      </View>

      <View className={cn('mt-2')}>
        {images.map(image => (
          <View key={`info-${image.id}`} className={cn('mb-1')}>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
              }}
              numberOfLines={1}
            >
              {image.name}
              {image.size && ` • ${formatFileSize(image.size)}`}
              {image.isUploading && ' • Uploading...'}
              {image.error && ' • Failed'}
              {!image.isUploading && !image.error && image.cloudinaryPublicId && ' • Uploaded'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
