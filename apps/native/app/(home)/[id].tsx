import React from 'react';
import { View, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function DynamicItemPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Set header title dynamically */}
      <Stack.Screen options={{ title: `Item ${id}` }} />
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Dynamic Page for Item {id}</Text>
    </View>
  );
}
