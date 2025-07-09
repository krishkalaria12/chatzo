import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { AppContainer } from '@/components/app-container';
import { SettingsHeader } from './extras/settings-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AccountDetails() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/');
          } catch (err) {
            console.error('Sign out error:', err);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <AppContainer className='flex-1' style={{ backgroundColor: colors.background }}>
        <SettingsHeader onSignOut={handleSignOut} showBackButton={true} />
        <View className='flex-1 justify-center items-center'>
          <Text style={{ color: colors.text }}>No user data available</Text>
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer className='flex-1' style={{ backgroundColor: colors.background }}>
      <SettingsHeader onSignOut={handleSignOut} showBackButton={true} />

      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* Page Header */}
        <View className='mb-8'>
          <Text className='text-2xl font-bold font-lora mb-2' style={{ color: colors.text }}>
            Account Information
          </Text>
          <Text className='text-base' style={{ color: colors.textSecondary }}>
            Manage your profile and account details
          </Text>
        </View>

        {/* Profile Card */}
        <View
          className='p-6 rounded-2xl mb-6'
          style={{
            backgroundColor: colors.surface,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className='flex-row items-center mb-6'>
            {user.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className='w-20 h-20 rounded-2xl mr-4'
                style={{ backgroundColor: colors.border }}
              />
            ) : (
              <View
                className='w-20 h-20 rounded-2xl items-center justify-center mr-4'
                style={{ backgroundColor: colors.primary }}
              >
                <Text className='text-3xl font-bold' style={{ color: colors.background }}>
                  {user.fullName?.charAt(0)?.toUpperCase() ||
                    user.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ||
                    '?'}
                </Text>
              </View>
            )}

            <View className='flex-1'>
              <Text className='text-xl font-bold font-lora mb-1' style={{ color: colors.text }}>
                {user.fullName || 'Anonymous User'}
              </Text>
              <Text className='text-sm mb-2' style={{ color: colors.textSecondary }}>
                {user.emailAddresses?.[0]?.emailAddress || 'No email'}
              </Text>

              {user.emailAddresses?.[0]?.verification?.status && (
                <View className='flex-row items-center'>
                  <View
                    className={cn(
                      'w-2 h-2 rounded-full mr-2',
                      user.emailAddresses[0].verification.status === 'verified'
                        ? 'bg-green-500'
                        : 'bg-yellow-500'
                    )}
                  />
                  <Text className='text-xs capitalize font-medium' style={{ color: colors.text }}>
                    {user.emailAddresses[0].verification.status} Account
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            className='p-4 rounded-xl border-2 border-dashed'
            style={{ borderColor: colors.border }}
          >
            <Text className='text-center font-medium' style={{ color: colors.textSecondary }}>
              Edit Profile Picture
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Details */}
        <View
          className='p-6 rounded-2xl mb-6'
          style={{
            backgroundColor: colors.surface,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className='text-lg font-semibold font-lora mb-4' style={{ color: colors.text }}>
            Account Details
          </Text>

          <View className='space-y-4'>
            <View
              className='flex-row justify-between items-center py-3 border-b'
              style={{ borderColor: colors.border }}
            >
              <Text className='text-sm font-medium' style={{ color: colors.textSecondary }}>
                Account ID
              </Text>
              <Text className='text-sm font-mono' style={{ color: colors.text }}>
                {user.id.slice(-8)}
              </Text>
            </View>

            <View
              className='flex-row justify-between items-center py-3 border-b'
              style={{ borderColor: colors.border }}
            >
              <Text className='text-sm font-medium' style={{ color: colors.textSecondary }}>
                Email Address
              </Text>
              <Text className='text-sm' style={{ color: colors.text }}>
                {user.emailAddresses?.[0]?.emailAddress || 'Not set'}
              </Text>
            </View>

            <View
              className='flex-row justify-between items-center py-3 border-b'
              style={{ borderColor: colors.border }}
            >
              <Text className='text-sm font-medium' style={{ color: colors.textSecondary }}>
                Full Name
              </Text>
              <Text className='text-sm' style={{ color: colors.text }}>
                {user.fullName || 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View
          className='p-6 rounded-2xl mb-6'
          style={{
            backgroundColor: colors.surface,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className='text-lg font-semibold font-lora mb-4' style={{ color: colors.text }}>
            Security
          </Text>

          <TouchableOpacity
            className='flex-row items-center justify-between p-4 rounded-xl mb-3'
            style={{ backgroundColor: colors.background }}
          >
            <View className='flex-row items-center'>
              <View
                className='w-10 h-10 rounded-full items-center justify-center mr-3'
                style={{ backgroundColor: colors.primary }}
              >
                <Text style={{ color: colors.background }}>🔒</Text>
              </View>
              <Text className='font-medium' style={{ color: colors.text }}>
                Change Password
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className='flex-row items-center justify-between p-4 rounded-xl'
            style={{ backgroundColor: colors.background }}
          >
            <View className='flex-row items-center'>
              <View
                className='w-10 h-10 rounded-full items-center justify-center mr-3'
                style={{ backgroundColor: colors.primary }}
              >
                <Text style={{ color: colors.background }}>🛡️</Text>
              </View>
              <Text className='font-medium' style={{ color: colors.text }}>
                Two-Factor Authentication
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary }}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View
          className='p-6 rounded-2xl mb-6'
          style={{
            backgroundColor: colors.surface,
            borderColor: CHATZO_COLORS.error,
            borderWidth: 1,
          }}
        >
          <Text
            className='text-lg font-semibold font-lora mb-4'
            style={{ color: CHATZO_COLORS.error }}
          >
            Danger Zone
          </Text>

          <Button
            variant='outline'
            onPress={handleSignOut}
            className='w-full mb-3'
            style={{ borderColor: CHATZO_COLORS.error }}
          >
            <Text style={{ color: CHATZO_COLORS.error }}>Sign Out</Text>
          </Button>

          <Button
            variant='outline'
            onPress={() => Alert.alert('Delete Account', 'This feature is not yet available.')}
            className='w-full'
            style={{ borderColor: CHATZO_COLORS.error }}
          >
            <Text style={{ color: CHATZO_COLORS.error }}>Delete Account</Text>
          </Button>
        </View>
      </ScrollView>
    </AppContainer>
  );
}
