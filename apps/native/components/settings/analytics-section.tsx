import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/skeleton';

interface AnalyticsSectionProps {
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
  loading: boolean;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ usage, models, loading }) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getModelColor = (index: number) => {
    const colors = [
      CHATZO_COLORS.accent.blue,
      CHATZO_COLORS.accent.yellow,
      CHATZO_COLORS.accent.orange,
      CHATZO_COLORS.accent.purple,
    ];
    return colors[index % colors.length];
  };

  return (
    <View className='space-y-4'>
      <Text className='text-lg font-semibold font-lora' style={{ color: colors.text }}>
        Analytics
      </Text>

      {/* Usage Statistics */}
      <View className='p-4 rounded-xl' style={{ backgroundColor: colors.surface }}>
        <Text className='text-base font-medium mb-3 font-lora' style={{ color: colors.text }}>
          Usage Statistics
        </Text>

        {loading ? (
          <View className='space-y-3'>
            <View className='flex-row justify-between'>
              <Skeleton width={80} height={14} className='rounded-md' />
              <Skeleton width={60} height={24} className='rounded-md' />
            </View>
            <Skeleton width='100%' height={80} className='rounded-md' />
          </View>
        ) : usage ? (
          <View className='space-y-4'>
            {/* Key Metrics */}
            <View className='flex-row justify-between'>
              <View className='flex-1 items-center'>
                <Text className='text-2xl font-bold font-lora' style={{ color: colors.primary }}>
                  {formatNumber(usage.totalRequests)}
                </Text>
                <Text className='text-xs text-center' style={{ color: colors.textSecondary }}>
                  Total Requests
                </Text>
              </View>

              <View className='flex-1 items-center'>
                <Text className='text-2xl font-bold font-lora' style={{ color: colors.primary }}>
                  {formatNumber(usage.totalTokens)}
                </Text>
                <Text className='text-xs text-center' style={{ color: colors.textSecondary }}>
                  Total Tokens
                </Text>
              </View>
            </View>

            {/* Additional Stats */}
            <View className='space-y-2'>
              <View className='flex-row justify-between'>
                <Text className='text-sm' style={{ color: colors.textSecondary }}>
                  Daily Average
                </Text>
                <Text className='text-sm font-medium' style={{ color: colors.text }}>
                  {usage.averageRequestsPerDay.toFixed(1)} requests/day
                </Text>
              </View>

              <View className='flex-row justify-between'>
                <Text className='text-sm' style={{ color: colors.textSecondary }}>
                  Avg Tokens/Request
                </Text>
                <Text className='text-sm font-medium' style={{ color: colors.text }}>
                  {usage.averageTokensPerRequest} tokens
                </Text>
              </View>

              <View className='flex-row justify-between'>
                <Text className='text-sm' style={{ color: colors.textSecondary }}>
                  Period
                </Text>
                <Text className='text-sm font-medium' style={{ color: colors.text }}>
                  {usage.period}
                </Text>
              </View>
            </View>

            {/* Simple Usage Chart */}
            <View className='mt-4'>
              <Text className='text-sm mb-2' style={{ color: colors.textSecondary }}>
                Recent Activity
              </Text>
              <View className='flex-row items-end space-x-1' style={{ height: 60 }}>
                {usage.dailyUsage.slice(-14).map((day, index) => {
                  const maxRequests = Math.max(...usage.dailyUsage.map(d => d.requests));
                  const height = maxRequests > 0 ? (day.requests / maxRequests) * 50 : 2;

                  return (
                    <View
                      key={day.date}
                      className='flex-1 rounded-t-sm'
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
        ) : (
          <Text className='text-center py-4' style={{ color: colors.textSecondary }}>
            No usage data available
          </Text>
        )}
      </View>

      {/* Model Usage */}
      <View className='p-4 rounded-xl' style={{ backgroundColor: colors.surface }}>
        <Text className='text-base font-medium mb-3 font-lora' style={{ color: colors.text }}>
          Model Usage
        </Text>

        {loading ? (
          <View className='space-y-3'>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} className='flex-row items-center justify-between py-2'>
                <View className='flex-1 space-y-1'>
                  <Skeleton width='70%' height={16} className='rounded-md' />
                  <Skeleton width='50%' height={12} className='rounded-md' />
                </View>
                <Skeleton width={40} height={16} className='rounded-md' />
              </View>
            ))}
          </View>
        ) : models.length > 0 ? (
          <View className='space-y-3'>
            {models.map((model, index) => (
              <View key={model.modelId} className='space-y-2'>
                <View className='flex-row items-center justify-between'>
                  <View className='flex-1'>
                    <Text className='text-sm font-medium' style={{ color: colors.text }}>
                      {model.modelName}
                    </Text>
                    <Text className='text-xs' style={{ color: colors.textSecondary }}>
                      {model.requests} requests • {formatNumber(model.totalTokens)} tokens
                    </Text>
                  </View>
                  <Text className='text-sm font-bold' style={{ color: getModelColor(index) }}>
                    {model.requestsPercentage}%
                  </Text>
                </View>

                {/* Usage Bar */}
                <View className='h-2 rounded-full' style={{ backgroundColor: colors.border }}>
                  <View
                    className='h-2 rounded-full'
                    style={{
                      width: `${model.requestsPercentage}%`,
                      backgroundColor: getModelColor(index),
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className='text-center py-4' style={{ color: colors.textSecondary }}>
            No model usage data available
          </Text>
        )}
      </View>
    </View>
  );
};
