import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/use-color-scheme';
import { cn } from '@/lib/utils';
import { isPDFFile } from '@/utils/cloudinary';
import { PDFAttachment } from '@/lib/types/attachments';
import { PDFPickerItem } from './pdf-picker-item';

interface PDFPickerComponentProps {
  onPDFSelected: (pdf: PDFAttachment) => void;
  uploadPreset: string;
  disabled?: boolean;
  showPicker: boolean;
  onClose: () => void;
}

export const PDFPickerComponent: React.FC<PDFPickerComponentProps> = ({
  onPDFSelected,
  uploadPreset,
  disabled = false,
  showPicker,
  onClose,
}) => {
  const [isPickingDocument, setIsPickingDocument] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<PDFAttachment | null>(null);
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
    warning: isDarkColorScheme ? '#f59e0b' : '#d97706',
  };

  // Generate unique ID for PDF
  const generatePDFId = (): string => {
    return `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  };

  // Process selected PDF document
  const processSelectedPDF = (
    result: DocumentPicker.DocumentPickerResult
  ): PDFAttachment | null => {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];

    // Validate PDF file
    if (!isPDFFile(asset.name) || asset.mimeType !== 'application/pdf') {
      Alert.alert(
        'Invalid File Type',
        'Please select a PDF file. Only PDF documents are supported for document chat.',
        [{ text: 'OK' }]
      );
      return null;
    }

    // Create PDF attachment
    const pdfAttachment: PDFAttachment = {
      id: generatePDFId(),
      type: 'pdf',
      name: asset.name,
      uri: asset.uri,
      size: asset.size || undefined,
      mimeType: 'application/pdf',
      title: asset.name.replace(/\.[^/.]+$/, ''), // Remove .pdf extension
      isUploading: false,
      uploadProgress: 0,
    };

    return pdfAttachment;
  };

  // Pick PDF document
  const pickPDFDocument = async () => {
    if (isPickingDocument || disabled) return;

    try {
      setIsPickingDocument(true);
      onClose(); // Close picker modal

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      const pdfAttachment = processSelectedPDF(result);
      if (pdfAttachment) {
        setSelectedPDF(pdfAttachment);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('PDF picker error:', error);
      Alert.alert('Document Picker Error', 'Failed to pick PDF document. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsPickingDocument(false);
    }
  };

  // Handle final PDF selection
  const handleConfirmSelection = () => {
    if (selectedPDF) {
      onPDFSelected(selectedPDF);
      setSelectedPDF(null);
      setShowPreview(false);
    }
  };

  // Handle PDF removal from preview
  const handleRemovePDF = () => {
    setSelectedPDF(null);
    setShowPreview(false);
  };

  // Preview Modal
  if (showPreview && selectedPDF) {
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
                Selected PDF Document
              </Text>
            </View>

            {/* PDF Preview */}
            <View style={{ flex: 1 }}>
              <PDFPickerItem
                pdf={selectedPDF}
                onRemove={handleRemovePDF}
                showSize={true}
                showTitle={true}
              />
            </View>

            {/* Info Message */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                backgroundColor: colors.cardBackground,
                borderRadius: 8,
                marginTop: 16,
                borderLeftWidth: 4,
                borderLeftColor: colors.warning,
              }}
            >
              <MaterialIcons
                name='info'
                size={20}
                color={colors.warning}
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 14, color: colors.text, flex: 1 }}>
                Only vision-capable AI models can analyze PDF documents. Make sure to select a
                compatible model.
              </Text>
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
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>Use PDF Document</Text>
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
              Add PDF Document
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Select a PDF document to analyze
            </Text>
          </View>

          {/* Document Picker Option */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              backgroundColor: colors.cardBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: isPickingDocument ? 0.6 : 1,
            }}
            onPress={pickPDFDocument}
            disabled={isPickingDocument}
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
              {isPickingDocument ? (
                <ActivityIndicator size='small' color='#ffffff' />
              ) : (
                <MaterialIcons name='picture-as-pdf' size={20} color='#ffffff' />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
                Select PDF Document
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Choose a PDF file from your device
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info Note */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              backgroundColor: colors.cardBackground,
              borderRadius: 8,
              marginTop: 16,
              borderLeftWidth: 4,
              borderLeftColor: colors.warning,
            }}
          >
            <MaterialIcons
              name='info'
              size={16}
              color={colors.warning}
              style={{ marginRight: 8 }}
            />
            <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>
              Only one PDF can be selected at a time. PDF analysis requires a vision-capable model.
            </Text>
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
