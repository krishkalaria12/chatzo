import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useColorScheme } from '@/lib/use-color-scheme';
import { generateConvexApiUrl } from '@/lib/convex-utils';

interface DisplayModel {
  key: string;
  id: string;
  name: string;
  description: string;
  provider: string;
  providerDisplayName: string;
  providerIcon: string;
  providerColor: string;
  supportsVision: boolean;
  supportsTools: boolean;
  contextWindow: number;
  maxTokens: number;
  temperature: number;
  outputTokens: number;
}

interface ModelPickerProps {
  selectedModel: string;
  onModelChange: (modelKey: string) => void;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({ selectedModel, onModelChange }) => {
  const [models, setModels] = useState<DisplayModel[]>([]);
  const [loading, setLoading] = useState(false);
  const { isDarkColorScheme } = useColorScheme();

  // Theme colors
  const colors = {
    background: isDarkColorScheme ? '#18181b' : '#f8fafc',
    text: isDarkColorScheme ? '#fafafa' : '#0f172a',
    border: isDarkColorScheme ? '#3f3f46' : '#e4e4e7',
  };

  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch(generateConvexApiUrl('/api/models'));
      const data = await response.json();

      if (response.ok) {
        // Sort models by provider, then by name
        const sortedModels = data.models.sort((a: DisplayModel, b: DisplayModel) => {
          if (a.provider !== b.provider) {
            return a.provider.localeCompare(b.provider);
          }
          return a.name.localeCompare(b.name);
        });
        setModels(sortedModels);
      } else {
        console.error('Failed to fetch models:', data.error);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className='flex-1 justify-center'>
        <Text style={{ color: colors.text, fontSize: 12, textAlign: 'center' }}>Loading...</Text>
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
