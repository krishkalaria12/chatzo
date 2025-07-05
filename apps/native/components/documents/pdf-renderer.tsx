import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';

export interface PDFRendererProps {
  fileName: string;
  fileSize?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * PDF Renderer Component
 * Displays PDF documents in messages with preview and download capabilities
 */
export const PDFRenderer: React.FC<PDFRendererProps> = ({
  fileName,
  fileSize,
  maxWidth = 280,
  maxHeight = 180,
}) => {
  const { isDarkColorScheme } = useColorScheme();

  // Theme colors
  const colors = {
    background: isDarkColorScheme ? '#27272a' : '#f8fafc',
    border: isDarkColorScheme ? '#3f3f46' : '#e4e4e7',
    text: isDarkColorScheme ? '#fafafa' : '#0f172a',
    textSecondary: isDarkColorScheme ? '#a1a1aa' : '#64748b',
    primary: isDarkColorScheme ? '#3b82f6' : '#2563eb',
    success: isDarkColorScheme ? '#10b981' : '#059669',
    warning: isDarkColorScheme ? '#f59e0b' : '#d97706',
    danger: isDarkColorScheme ? '#ef4444' : '#dc2626',
    pdfIcon: isDarkColorScheme ? '#ef4444' : '#dc2626',
  };

  // Utility function to format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Extract filename without extension for display
  const getDisplayName = (filename: string): string => {
    return filename.replace(/\.[^/.]+$/, '');
  };

  return (
    <View
      style={{
        maxWidth,
        width: maxWidth,
        backgroundColor: colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginVertical: 4,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <MaterialIcons name='picture-as-pdf' size={24} color={colors.pdfIcon} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text,
            }}
            numberOfLines={2}
          >
            {getDisplayName(fileName)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            PDF Document{fileSize ? ` • ${formatFileSize(fileSize)}` : ''}
          </Text>
        </View>
      </View>

      {/* Document preview placeholder */}
      <View
        style={{
          height: Math.min(maxHeight, 120),
          backgroundColor: colors.border,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <MaterialIcons name='description' size={32} color={colors.textSecondary} />
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 6,
          }}
        >
          PDF Document
        </Text>
      </View>
    </View>
  );
};
