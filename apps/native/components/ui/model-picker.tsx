import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useColorScheme } from '@/lib/use-color-scheme';
import { useModelsStore, DisplayModel } from '@/store/models-store';

interface ModelPickerProps {
  selectedModel: string;
  onModelChange: (modelKey: string) => void;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({ selectedModel, onModelChange }) => {
  const { isDarkColorScheme } = useColorScheme();
  const { models, isLoading, error, fetchModels } = useModelsStore();

  // Theme colors
  const colors = {
    background: isDarkColorScheme ? '#18181b' : '#f8fafc',
    text: isDarkColorScheme ? '#fafafa' : '#0f172a',
    border: isDarkColorScheme ? '#3f3f46' : '#e4e4e7',
  };

  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  if (isLoading) {
    return (
      <View className='flex-1 justify-center'>
        <Text style={{ color: colors.text, fontSize: 12, textAlign: 'center' }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className='flex-1 justify-center'>
        <Text style={{ color: colors.text, fontSize: 12, textAlign: 'center' }}>
          Error loading models
        </Text>
      </View>
    );
  }

  return (
    <View className='flex-1'>
      <Picker
        selectedValue={selectedModel}
        onValueChange={itemValue => {
          if (itemValue) {
            onModelChange(itemValue);
          }
        }}
        style={{
          color: colors.text,
          backgroundColor: colors.background,
          height: 35,
        }}
        dropdownIconColor={colors.text}
        mode='dropdown'
      >
        {models.map(model => (
          <Picker.Item
            key={model.key}
            label={`${model.providerDisplayName}: ${model.name}`}
            value={model.key}
            style={{
              fontSize: 14,
              color: colors.text,
            }}
          />
        ))}
      </Picker>
    </View>
  );
};
