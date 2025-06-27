import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Enhanced model interface for frontend display
 */
export interface DisplayModel {
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

/**
 * Provider display configuration
 */
export interface ProviderDisplayConfig {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Theme colors interface
 */
export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  success: string;
  warning: string;
  experimental: string;
}

/**
 * Model display utility functions
 */
export class ModelDisplayUtils {
  /**
   * Get provider color from theme
   */
  static getProviderColor(provider: string, colors: ThemeColors): string {
    switch (provider) {
      case 'google':
        return colors.accent;
      case 'mistral':
        return colors.experimental;
      default:
        return colors.textMuted;
    }
  }

  /**
   * Get provider icon
   */
  static getProviderIcon(provider: string): string {
    switch (provider) {
      case 'google':
        return 'auto-awesome';
      case 'mistral':
        return 'psychology';
      case 'openai':
        return 'smart-toy';
      case 'anthropic':
        return 'psychology-alt';
      default:
        return 'smart-toy';
    }
  }

  /**
   * Get provider display name
   */
  static getProviderDisplayName(provider: string): string {
    switch (provider) {
      case 'google':
        return 'Google AI';
      case 'mistral':
        return 'Mistral AI';
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic';
      default:
        return provider;
    }
  }

  /**
   * Format context window for display
   */
  static formatContextWindow(contextWindow: number): string {
    if (contextWindow >= 1000000) {
      return `${(contextWindow / 1000000).toFixed(1)}M context`;
    } else if (contextWindow >= 1000) {
      return `${(contextWindow / 1000).toFixed(0)}K context`;
    } else {
      return `${contextWindow} context`;
    }
  }

  /**
   * Group models by provider
   */
  static groupModelsByProvider(models: DisplayModel[]): Record<string, DisplayModel[]> {
    return models.reduce(
      (acc, model) => {
        if (!acc[model.provider]) {
          acc[model.provider] = [];
        }
        acc[model.provider].push(model);
        return acc;
      },
      {} as Record<string, DisplayModel[]>
    );
  }

  /**
   * Sort models by provider priority and name
   */
  static sortModels(models: DisplayModel[]): DisplayModel[] {
    const providerPriority = ['google', 'mistral', 'openai', 'anthropic'];

    return models.sort((a, b) => {
      // First sort by provider priority
      const aProviderIndex = providerPriority.indexOf(a.provider);
      const bProviderIndex = providerPriority.indexOf(b.provider);

      if (aProviderIndex !== bProviderIndex) {
        return (
          (aProviderIndex === -1 ? 999 : aProviderIndex) -
          (bProviderIndex === -1 ? 999 : bProviderIndex)
        );
      }

      // Then sort by model name
      return a.name.localeCompare(b.name);
    });
  }
}

/**
 * Model capability badge component
 */
interface CapabilityBadgeProps {
  type: 'vision' | 'tools' | 'context';
  value?: string;
  colors: ThemeColors;
}

export const CapabilityBadge: React.FC<CapabilityBadgeProps> = ({ type, value, colors }) => {
  const getCapabilityConfig = () => {
    switch (type) {
      case 'vision':
        return {
          icon: 'visibility',
          text: 'Vision',
          color: colors.success,
        };
      case 'tools':
        return {
          icon: 'build',
          text: 'Tools',
          color: colors.accent,
        };
      case 'context':
        return {
          icon: 'memory',
          text: value || 'Context',
          color: colors.textMuted,
        };
      default:
        return {
          icon: 'help',
          text: 'Unknown',
          color: colors.textMuted,
        };
    }
  };

  const config = getCapabilityConfig();

  return (
    <View className='flex-row items-center mr-3 mb-1'>
      <MaterialIcons name={config.icon as any} size={12} color={config.color} />
      <Text className='text-xs ml-1' style={{ color: config.color }}>
        {config.text}
      </Text>
    </View>
  );
};

/**
 * Provider badge component
 */
interface ProviderBadgeProps {
  provider: string;
  colors: ThemeColors;
}

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({ provider, colors }) => {
  const providerColor = ModelDisplayUtils.getProviderColor(provider, colors);
  const providerIcon = ModelDisplayUtils.getProviderIcon(provider);
  const providerDisplayName = ModelDisplayUtils.getProviderDisplayName(provider);

  return (
    <View className='flex-row items-center'>
      <MaterialIcons name={providerIcon as any} size={16} color={providerColor} />
      <View
        className='px-2 py-1 rounded-full ml-2'
        style={{ backgroundColor: providerColor + '20' }}
      >
        <Text className='text-xs font-medium' style={{ color: providerColor }}>
          {providerDisplayName}
        </Text>
      </View>
    </View>
  );
};

/**
 * Model info component for displaying model details
 */
interface ModelInfoProps {
  model: DisplayModel;
  colors: ThemeColors;
  isSelected?: boolean;
}

export const ModelInfo: React.FC<ModelInfoProps> = ({ model, colors, isSelected = false }) => {
  return (
    <View className='flex-1'>
      <View className='flex-row items-center justify-between mb-1'>
        <Text className='font-semibold text-base' style={{ color: colors.text }}>
          {model.name}
        </Text>
        <ProviderBadge provider={model.provider} colors={colors} />
      </View>

      <Text className='text-sm leading-5 mb-2' style={{ color: colors.textMuted }}>
        {model.description}
      </Text>

      {/* Capabilities */}
      <View className='flex-row flex-wrap'>
        {model.supportsVision && <CapabilityBadge type='vision' colors={colors} />}
        {model.supportsTools && <CapabilityBadge type='tools' colors={colors} />}
        <CapabilityBadge
          type='context'
          value={ModelDisplayUtils.formatContextWindow(model.contextWindow)}
          colors={colors}
        />
      </View>
    </View>
  );
};
