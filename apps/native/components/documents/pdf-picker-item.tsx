import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { PDFAttachment } from '@/lib/types/attachments';

export interface PDFPickerItemProps {
  pdf: PDFAttachment;
  onRemove: () => void;
  showSize?: boolean;
  showTitle?: boolean;
  thumbnailSize?: number;
}

/**
 * PDF Preview Item Component
 * Displays PDF information in picker preview lists
 */
export const PDFPickerItem: React.FC<PDFPickerItemProps> = ({
  pdf,
  onRemove,
  showSize = true,
  showTitle = true,
  thumbnailSize = 60,
}) => {
  const { isDarkColorScheme } = useColorScheme();

  // Colors for preview
  const colors = {
    background: isDarkColorScheme ? '#18181b' : '#ffffff',
    border: isDarkColorScheme ? '#3f3f46' : '#e4e4e7',
    text: isDarkColorScheme ? '#fafafa' : '#0f172a',
    textSecondary: isDarkColorScheme ? '#a1a1aa' : '#64748b',
    danger: isDarkColorScheme ? '#ef4444' : '#dc2626',
    primary: isDarkColorScheme ? '#3b82f6' : '#2563eb',
    pdfIcon: isDarkColorScheme ? '#ef4444' : '#dc2626',
  };

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
        padding: 16,
        backgroundColor: colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 8,
      }}
    >
      {/* PDF Icon */}
      <View
        style={{
          width: thumbnailSize,
          height: thumbnailSize,
          borderRadius: 8,
          backgroundColor: colors.border,
          marginRight: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialIcons name='picture-as-pdf' size={thumbnailSize / 2} color={colors.pdfIcon} />
      </View>

      {/* PDF Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {pdf.name}
        </Text>

        {/* Title */}
        {showTitle && pdf.title && pdf.title !== pdf.name && (
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {pdf.title}
          </Text>
        )}

        {/* File Size */}
        {showSize && pdf.size && (
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginBottom: 2,
            }}
          >
            {formatFileSize(pdf.size)}
          </Text>
        )}

        {/* Page Count */}
        {pdf.pageCount && (
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            {pdf.pageCount} page{pdf.pageCount !== 1 ? 's' : ''}
          </Text>
        )}

        {/* Type Badge */}
        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            alignSelf: 'flex-start',
            marginTop: 4,
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '500',
            }}
          >
            PDF DOCUMENT
          </Text>
        </View>
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        onPress={onRemove}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.danger,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 12,
        }}
        activeOpacity={0.7}
      >
        <MaterialIcons name='close' size={20} color='#ffffff' />
      </TouchableOpacity>
    </View>
  );
};
