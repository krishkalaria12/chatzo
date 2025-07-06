import React, { useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useColorScheme } from '@/lib/use-color-scheme';
import { useModelsStore } from '@/store/models-store';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react-native';

interface ModelPickerProps {
  selectedModel: string;
  onModelChange: (modelKey: string) => void;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({ selectedModel, onModelChange }) => {
  const { isDarkColorScheme } = useColorScheme();
  const { models, isLoading, error, fetchModels } = useModelsStore();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const pickerContainerStyle = cn(
    'flex-row items-center p-1 rounded-lg',
    isDarkColorScheme ? 'bg-zinc-800' : 'bg-slate-100'
  );
  const pickerTextColor = isDarkColorScheme ? '#FFFFFF' : '#1e293b';

  if (isLoading) {
    return (
      <View className='flex-1 justify-center items-center h-10'>
        <Text className='text-slate-500 dark:text-slate-400 text-xs'>Loading models...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className='flex-1 justify-center items-center h-10'>
        <Text className='text-red-500 dark:text-red-400 text-xs'>Error</Text>
      </View>
    );
  }

  return (
    <View className={pickerContainerStyle}>
      <Picker
        selectedValue={selectedModel || 'gemini-2.5-flash'}
        onValueChange={itemValue => {
          if (itemValue) {
            onModelChange(itemValue);
          }
        }}
        style={{
          flex: 1,
          color: pickerTextColor,
          backgroundColor: 'transparent',
          borderWidth: 0,
          height: Platform.OS === 'android' ? 40 : undefined,
        }}
        itemStyle={{
          color: pickerTextColor,
          fontSize: 14,
        }}
        mode='dropdown'
        dropdownIconColor={pickerTextColor}
      >
        {models.map(model => (
          <Picker.Item
            key={model.key}
            label={`${model.provider.charAt(0).toUpperCase() + model.provider.slice(1)}: ${model.name}`}
            value={model.key}
            color={Platform.OS === 'ios' ? pickerTextColor : undefined}
          />
        ))}
      </Picker>
      {/* Custom dropdown icon for consistency on iOS */}
      {Platform.OS === 'ios' && (
        <View className='absolute right-2 top-0 bottom-0 justify-center pointer-events-none'>
          <ChevronDown size={16} color={pickerTextColor} />
        </View>
      )}
    </View>
  );
};
