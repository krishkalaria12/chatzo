import { mistral } from '@ai-sdk/mistral';
import { LanguageModel } from 'ai';
import { BaseAIProvider, ProviderConfig } from './base';

export class MistralAIProvider extends BaseAIProvider {
  readonly config: ProviderConfig = {
    name: 'mistral',
    displayName: 'Mistral AI',
    icon: 'psychology',
    color: '#8b5cf6',
    description: 'Powerful open-source AI models with excellent performance',
    website: 'https://mistral.ai/',
    models: {
      'pixtral-large': {
        id: 'pixtral-large-latest',
        name: 'Pixtral Large',
        description: 'Advanced multimodal model with excellent vision and reasoning capabilities',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: true,
        supportsTools: true,
        contextWindow: 128000,
        outputTokens: 8192,
      },
      'mistral-large': {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        description: 'Most capable Mistral model for complex reasoning and analysis tasks',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: false,
        supportsTools: true,
        contextWindow: 128000,
        outputTokens: 8192,
      },
      'mistral-small': {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        description: 'Fast and efficient model optimized for everyday tasks',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: false,
        supportsTools: true,
        contextWindow: 128000,
        outputTokens: 8192,
      },
      'ministral-8b': {
        id: 'ministral-8b-latest',
        name: 'Ministral 8B',
        description: 'Compact model with excellent performance-to-size ratio',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: false,
        supportsTools: true,
        contextWindow: 128000,
        outputTokens: 8192,
      },
      'ministral-3b': {
        id: 'ministral-3b-latest',
        name: 'Ministral 3B',
        description: 'Ultra-compact model for high-throughput applications',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: false,
        supportsTools: true,
        contextWindow: 128000,
        outputTokens: 8192,
      },
    },
  };

  getModel(modelId: string, options?: any): LanguageModel {
    const modelConfig = this.getModelConfig(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found in Mistral AI provider`);
    }

    return mistral(modelConfig.id, options);
  }
}
