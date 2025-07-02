import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Image, useImage } from 'expo-image';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';

export interface EnhancedImageProps {
  uri: string;
  alt?: string;
  maxWidth: number;
  maxHeight: number;
  borderRadius?: number;
  onPress?: () => void;
  showShadow?: boolean;
  transition?: number;
}

/**
 * Enhanced Image Component using expo-image v2
 * Benefits: Better performance, automatic caching, preloading, and intelligent memory management
 */
export const EnhancedImage: React.FC<EnhancedImageProps> = memo(
  ({
    uri,
    alt,
    maxWidth,
    maxHeight,
    borderRadius = 12,
    onPress,
    showShadow = true,
    transition = 200,
  }) => {
    const [error, setError] = useState(false);
    const { isDarkColorScheme } = useColorScheme();
    const theme = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

    // Use expo-image v2 useImage hook for better performance, preloading and metadata extraction
    const image = useImage(uri, {
      maxWidth: maxWidth,
      onError: (error, retry) => {
        console.error('Image loading failed:', error);
        setError(true);
      },
    });

    // Calculate responsive dimensions using image metadata
    const getImageSize = () => {
      if (!image || !image.width || !image.height) {
        return { width: maxWidth, height: maxHeight };
      }

      const { width, height } = image;
      const aspectRatio = width / height;

      if (width > maxWidth) {
        return {
          width: maxWidth,
          height: maxWidth / aspectRatio,
        };
      }

      if (height > maxHeight) {
        return {
          width: maxHeight * aspectRatio,
          height: maxHeight,
        };
      }

      return { width, height };
    };

    const imageSize = getImageSize();

    // Handle default press action
    const handlePress = () => {
      if (onPress) {
        onPress();
      } else {
        // Default action: show image preview alert
        Alert.alert('Image Preview', 'Full image preview coming soon!');
      }
    };

    // Error state
    if (error) {
      return (
        <View
          style={{
            width: maxWidth,
            height: 120,
            backgroundColor: theme.background,
            borderRadius,
            borderWidth: 1,
            borderColor: theme.border,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Failed to load image</Text>
          <TouchableOpacity
            onPress={() => {
              setError(false);
              // Note: expo-image handles retry internally, but we reset our error state
            }}
            style={{ marginTop: 8 }}
          >
            <Text style={{ color: theme.primary, fontSize: 12 }}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Loading state
    if (!image) {
      return (
        <View
          style={{
            width: maxWidth,
            height: 200,
            backgroundColor: theme.background,
            borderRadius,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <ActivityIndicator size='small' color={theme.primary} />
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 8 }}>
            Loading image...
          </Text>
        </View>
      );
    }

    // Successful image render
    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePress}
          style={{
            borderRadius,
            overflow: 'hidden',
            backgroundColor: theme.background,
            ...(showShadow && {
              shadowColor: isDarkColorScheme ? '#000' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDarkColorScheme ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 3,
            }),
          }}
        >
          <Image
            source={image}
            style={{
              width: imageSize.width,
              height: imageSize.height,
              backgroundColor: theme.background,
            }}
            contentFit='cover'
            transition={transition}
          />
        </TouchableOpacity>
        {alt && (
          <Text
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              marginTop: 6,
              fontStyle: 'italic',
              paddingHorizontal: 4,
            }}
          >
            {alt}
          </Text>
        )}
      </View>
    );
  }
);

EnhancedImage.displayName = 'EnhancedImage';
