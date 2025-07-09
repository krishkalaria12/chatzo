import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { AppContainer } from '@/components/app-container';
import { SettingsHeader } from './extras/settings-header';
import { chatAPI } from '@/lib/api/chat-api';
import Skeleton from '@/components/ui/skeleton';

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

export default function AnalyticsDetails() {
  const router = useRouter();
  const { user } = useUser();
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    usage: null,
    models: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(30);

  const fetchAnalytics = useCallback(
    async (isRefresh = false, days = selectedPeriod) => {
      if (!user?.id) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const [usageData, modelsData] = await Promise.all([
          chatAPI.getUserUsage(user.id, days),
          chatAPI.getModelUsage(user.id, days),
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
    [user?.id, selectedPeriod]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = useCallback(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  const handlePeriodChange = (period: 7 | 30 | 90) => {
    setSelectedPeriod(period);
    fetchAnalytics(false, period);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getModelColor = (index: number) => {
    const modelColors = [
      CHATZO_COLORS.accent.blue,
      CHATZO_COLORS.accent.yellow,
      CHATZO_COLORS.accent.orange,
      CHATZO_COLORS.accent.purple,
    ];
    return modelColors[index % modelColors.length];
  };

  const renderLoadingState = () => (
    <View className='space-y-6'>
      <View className='space-y-4'>
        <Skeleton width='40%' height={20} className='rounded-md' />
        <View className='flex-row space-x-4'>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} width={80} height={32} className='rounded-full' />
          ))}
        </View>
      </View>

      <View className='space-y-4'>
        <Skeleton width='60%' height={24} className='rounded-md' />
        <View className='grid grid-cols-2 gap-4'>
          {[1, 2, 3, 4].map(i => (
            <View key={i} className='p-4 rounded-xl' style={{ backgroundColor: colors.surface }}>
              <Skeleton width='100%' height={60} className='rounded-md' />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <AppContainer className='flex-1' style={{ backgroundColor: colors.background }}>
      <SettingsHeader onSignOut={() => {}} showBackButton={true} />

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
        contentContainerStyle={{ padding: 24 }}
      >
        {/* Page Header */}
        <View className='mb-8'>
          <Text className='text-2xl font-bold font-lora mb-2' style={{ color: colors.text }}>
            Analytics & Usage
          </Text>
          <Text className='text-base' style={{ color: colors.textSecondary }}>
            Track your AI usage and performance metrics
          </Text>
        </View>

        {loading ? (
          renderLoadingState()
        ) : error ? (
          <View className='flex-1 justify-center items-center p-6'>
            <Text className='text-lg font-bold mb-2' style={{ color: colors.text }}>
              Something went wrong
            </Text>
            <Text className='text-center mb-4' style={{ color: colors.textSecondary }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => fetchAnalytics()}
              className='px-6 py-3 rounded-xl'
              style={{ backgroundColor: colors.primary }}
            >
              <Text style={{ color: colors.background }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className='space-y-6'>
            {/* Period Selector */}
            <View>
              <Text className='text-lg font-semibold font-lora mb-3' style={{ color: colors.text }}>
                Time Period
              </Text>
              <View className='flex-row space-x-3'>
                {[
                  { value: 7, label: '7 Days' },
                  { value: 30, label: '30 Days' },
                  { value: 90, label: '90 Days' },
                ].map(period => (
                  <TouchableOpacity
                    key={period.value}
                    onPress={() => handlePeriodChange(period.value as 7 | 30 | 90)}
                    className='px-4 py-2 rounded-full'
                    style={{
                      backgroundColor:
                        selectedPeriod === period.value ? colors.primary : colors.surface,
                    }}
                  >
                    <Text
                      className='text-sm font-medium'
                      style={{
                        color: selectedPeriod === period.value ? colors.background : colors.text,
                      }}
                    >
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Usage Overview */}
            {analyticsData.usage && (
              <View
                className='p-6 rounded-2xl'
                style={{
                  backgroundColor: colors.surface,
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  className='text-lg font-semibold font-lora mb-4'
                  style={{ color: colors.text }}
                >
                  Usage Overview
                </Text>

                <View className='flex-row justify-between mb-6'>
                  <View className='flex-1 items-center'>
                    <Text
                      className='text-3xl font-bold font-lora'
                      style={{ color: colors.primary }}
                    >
                      {formatNumber(analyticsData.usage.totalRequests)}
                    </Text>
                    <Text className='text-sm text-center' style={{ color: colors.textSecondary }}>
                      Total Requests
                    </Text>
                  </View>

                  <View className='flex-1 items-center'>
                    <Text
                      className='text-3xl font-bold font-lora'
                      style={{ color: colors.primary }}
                    >
                      {formatNumber(analyticsData.usage.totalTokens)}
                    </Text>
                    <Text className='text-sm text-center' style={{ color: colors.textSecondary }}>
                      Total Tokens
                    </Text>
                  </View>
                </View>

                <View className='space-y-3'>
                  <View className='flex-row justify-between'>
                    <Text className='text-sm' style={{ color: colors.textSecondary }}>
                      Daily Average
                    </Text>
                    <Text className='text-sm font-medium' style={{ color: colors.text }}>
                      {analyticsData.usage.averageRequestsPerDay.toFixed(1)} requests/day
                    </Text>
                  </View>

                  <View className='flex-row justify-between'>
                    <Text className='text-sm' style={{ color: colors.textSecondary }}>
                      Avg Tokens/Request
                    </Text>
                    <Text className='text-sm font-medium' style={{ color: colors.text }}>
                      {analyticsData.usage.averageTokensPerRequest} tokens
                    </Text>
                  </View>
                </View>

                {/* Activity Chart */}
                <View className='mt-6'>
                  <Text className='text-sm mb-3' style={{ color: colors.textSecondary }}>
                    Daily Activity
                  </Text>
                  <View className='flex-row items-end space-x-1' style={{ height: 80 }}>
                    {analyticsData.usage.dailyUsage.slice(-14).map((day, index) => {
                      const maxRequests = Math.max(
                        ...analyticsData.usage!.dailyUsage.map(d => d.requests)
                      );
                      const height = maxRequests > 0 ? (day.requests / maxRequests) * 70 : 2;

                      return (
                        <View
                          key={day.date}
                          className='flex-1 rounded-t-md'
                          style={{
                            height: Math.max(height, 2),
                            backgroundColor: day.requests > 0 ? colors.primary : colors.border,
                            opacity: day.requests > 0 ? 1 : 0.3,
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Model Usage */}
            {analyticsData.models.length > 0 && (
              <View
                className='p-6 rounded-2xl'
                style={{
                  backgroundColor: colors.surface,
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  className='text-lg font-semibold font-lora mb-4'
                  style={{ color: colors.text }}
                >
                  Model Usage Breakdown
                </Text>

                <View className='space-y-4'>
                  {analyticsData.models.map((model, index) => (
                    <View key={model.modelId} className='space-y-3'>
                      <View className='flex-row items-center justify-between'>
                        <View className='flex-1'>
                          <Text className='text-base font-medium' style={{ color: colors.text }}>
                            {model.modelName}
                          </Text>
                          <Text className='text-sm' style={{ color: colors.textSecondary }}>
                            {model.requests} requests • {formatNumber(model.totalTokens)} tokens
                          </Text>
                        </View>
                        <View className='items-end'>
                          <Text
                            className='text-lg font-bold'
                            style={{ color: getModelColor(index) }}
                          >
                            {model.requestsPercentage}%
                          </Text>
                          <Text className='text-xs' style={{ color: colors.textSecondary }}>
                            {model.averageTokensPerRequest} avg tokens
                          </Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View className='h-3 rounded-full' style={{ backgroundColor: colors.border }}>
                        <View
                          className='h-3 rounded-full'
                          style={{
                            width: `${model.requestsPercentage}%`,
                            backgroundColor: getModelColor(index),
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* No Data State */}
            {!analyticsData.usage && !analyticsData.models.length && (
              <View className='flex-1 justify-center items-center p-12'>
                <Text className='text-6xl mb-4'>📊</Text>
                <Text className='text-xl font-bold mb-2 text-center' style={{ color: colors.text }}>
                  No Analytics Data
                </Text>
                <Text className='text-center' style={{ color: colors.textSecondary }}>
                  Start using the AI assistant to see your usage statistics here.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </AppContainer>
  );
}
