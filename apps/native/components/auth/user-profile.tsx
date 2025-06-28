import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

export function UserProfile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            clearAuth();
            router.replace('/');
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View className='items-center p-4'>
        <Text className='text-muted-foreground'>No user data available</Text>
      </View>
    );
  }

  return (
    <View className='items-center p-6 bg-card rounded-xl border border-border'>
      {/* Profile Image */}
      <View className='mb-4'>
        {user.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            className='w-20 h-20 rounded-full'
            style={{ width: 80, height: 80, borderRadius: 40 }}
          />
        ) : (
          <View className='w-20 h-20 rounded-full bg-primary items-center justify-center'>
            <Text className='text-2xl font-bold text-primary-foreground'>
              {user.fullName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0) || 'U'}
            </Text>
          </View>
        )}
      </View>

      {/* User Info */}
      <View className='items-center mb-6'>
        <Text className='text-xl font-semibold text-foreground mb-1'>
          {user.fullName || 'Welcome!'}
        </Text>
        <Text className='text-muted-foreground'>{user.emailAddresses[0]?.emailAddress}</Text>
      </View>

      {/* User Stats */}
      <View className='flex-row space-x-6 mb-6'>
        <View className='items-center'>
          <Text className='text-lg font-bold text-foreground'>
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
          <Text className='text-xs text-muted-foreground'>Joined</Text>
        </View>
        <View className='items-center'>
          <Text className='text-lg font-bold text-foreground'>
            {user.emailAddresses?.length || 0}
          </Text>
          <Text className='text-xs text-muted-foreground'>Email(s)</Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <Button title='Sign Out' onPress={handleSignOut} variant='outline' size='lg' fullWidth />
    </View>
  );
}
