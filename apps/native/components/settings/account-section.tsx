import React from 'react';
import { View, Text, Image } from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface AccountSectionProps {
  user: any; // Clerk user object
}

export const AccountSection: React.FC<AccountSectionProps> = ({ user }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  if (!user) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View className='space-y-3'>
      <Text className='text-lg font-semibold font-lora' style={{ color: colors.text }}>
        Account Information
      </Text>

      <View className='p-4 rounded-xl' style={{ backgroundColor: colors.surface }}>
        {/* User Profile */}
        <View className='flex-row items-center space-x-3 mb-4'>
          {user.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              className='w-16 h-16 rounded-full'
              style={{ backgroundColor: colors.border }}
            />
          ) : (
            <View
              className='w-16 h-16 rounded-full items-center justify-center'
              style={{ backgroundColor: colors.primary }}
            >
              <Text className='text-2xl font-bold' style={{ color: colors.background }}>
                {user.fullName?.charAt(0)?.toUpperCase() ||
                  user.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ||
                  '?'}
              </Text>
            </View>
          )}

          <View className='flex-1'>
            <Text className='text-lg font-semibold font-lora' style={{ color: colors.text }}>
              {user.fullName || 'Anonymous User'}
            </Text>
            <Text className='text-sm' style={{ color: colors.textSecondary }}>
              {user.emailAddresses?.[0]?.emailAddress || 'No email'}
            </Text>
          </View>
        </View>

        {/* Account Details */}
        <View className='space-y-3'>
          <View className='flex-row justify-between items-center'>
            <Text className='text-sm font-medium' style={{ color: colors.textSecondary }}>
              Account ID
            </Text>
            <Text className='text-sm font-mono' style={{ color: colors.text }}>
              {user.id.slice(-8)}
            </Text>
          </View>

          <View className='flex-row justify-between items-center'>
            <Text className='text-sm font-medium' style={{ color: colors.textSecondary }}>
              Member Since
            </Text>
            <Text className='text-sm' style={{ color: colors.text }}>
              {formatDate(user.createdAt)}
            </Text>
          </View>

          <View className='flex-row justify-between items-center'>
            <Text className='text-sm font-medium' style={{ color: colors.textSecondary }}>
              Last Updated
            </Text>
            <Text className='text-sm' style={{ color: colors.text }}>
              {formatDate(user.updatedAt)}
            </Text>
          </View>

          {user.emailAddresses?.[0]?.verification?.status && (
            <View className='flex-row justify-between items-center'>
              <Text className='text-sm font-medium' style={{ color: colors.textSecondary }}>
                Email Status
              </Text>
              <View className='flex-row items-center space-x-2'>
                <View
                  className={cn(
                    'w-2 h-2 rounded-full',
                    user.emailAddresses[0].verification.status === 'verified'
                      ? 'bg-green-500'
                      : 'bg-yellow-500'
                  )}
                />
                <Text className='text-sm capitalize' style={{ color: colors.text }}>
                  {user.emailAddresses[0].verification.status}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
