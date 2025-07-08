import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { AppContainer } from '@/components/app-container';
import { Button } from '@/components/ui/button';
import { chatAPI } from '@/lib/api/chat-api';

// Import extras components
import { SettingsHeader } from './extras/settings-header';
import { AccountSection } from './account-section';
import { AnalyticsSection } from './analytics-section';
import { SettingsLoading } from './extras/settings-loading';
import { SettingsError } from './extras/settings-error';

interface AnalyticsData {
  usage: {
    totalRequests: number;
    totalTokens: number;
    period: string;
    dailyUsage: Array<{ date: string; requests: number; tokens: number }>;
    averageRequestsPerDay: number;
    averageTokensPerRequest: number;
  } | null;
  models: Array<{
    modelId: string;
    modelName: string;
    requests: number;
    totalTokens: number;
    requestsPercentage: number;
    averageTokensPerRequest: number;
  }>;
}

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  // State management
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    usage: null,
    models: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const [usageData, modelsData] = await Promise.all([
          chatAPI.getUserUsage(user.id, 30),
          chatAPI.getModelUsage(user.id, 30),
        ]);

        setAnalyticsData({
          usage: usageData,
          models: modelsData,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  // Load data on mount
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchAnalytics(false);
  }, [fetchAnalytics]);

  // Handle sign out
  const handleSignOut = useCallback(() => {
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
  }, [signOut, router]);

  // Render loading state
  if (loading && !refreshing) {
    return (
      <AppContainer className='flex-1' style={{ backgroundColor: colors.background }}>
        <SettingsLoading />
      </AppContainer>
    );
  }

  // Render error state
  if (error && !refreshing) {
    return (
      <AppContainer className='flex-1' style={{ backgroundColor: colors.background }}>
        <SettingsError error={error} onRetry={handleRetry} />
      </AppContainer>
    );
  }

  return (
    <AppContainer className='flex-1' style={{ backgroundColor: colors.background }}>
      <SettingsHeader onSignOut={handleSignOut} />

      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View className='p-6 space-y-6'>
          {/* Account Information Section */}
          <AccountSection user={user} />

          {/* Analytics Section */}
          <AnalyticsSection
            usage={analyticsData.usage}
            models={analyticsData.models}
            loading={refreshing}
          />

          {/* Sign Out Button */}
          <View className='pt-6'>
            <Button
              variant='outline'
              onPress={handleSignOut}
              className='w-full'
              style={{ borderColor: colors.border }}
              title='Sign Out'
            >
              <Text style={{ color: colors.text }}>Sign Out</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </AppContainer>
  );
}
