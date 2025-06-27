import { google } from '@ai-sdk/google';
import { LanguageModel } from 'ai';
import { BaseAIProvider, ProviderConfig } from './base';

export class GoogleAIProvider extends BaseAIProvider {
  readonly config: ProviderConfig = {
    name: 'google',
    displayName: 'Google AI',
    icon: 'auto-awesome',
    color: '#4285f4',
    description: 'Advanced AI models from Google with multimodal capabilities',
    website: 'https://ai.google.dev/',
    models: {
      'gemini-2.5-pro': {
        id: 'gemini-2.5-pro-exp-03-25',
        name: 'Gemini 2.5 Pro',
        description: 'Most capable model with advanced reasoning and multimodal capabilities',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: true,
        supportsTools: true,
        contextWindow: 2000000,
        outputTokens: 8192,
      },
      'gemini-2.5-flash': {
        id: 'gemini-2.5-flash-preview-04-17',
        name: 'Gemini 2.5 Flash',
        description: 'Fast, efficient model with reasoning capabilities and large context',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: true,
        supportsTools: true,
        contextWindow: 1000000,
        outputTokens: 8192,
      },
      'gemini-2.0-flash': {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash',
        description: 'Latest multimodal model with image generation and grounding',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: true,
        supportsTools: true,
        contextWindow: 1000000,
        outputTokens: 8192,
      },
      'gemini-1.5-pro': {
        id: 'gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro',
        description: 'Stable production model with excellent performance across tasks',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: true,
        supportsTools: true,
        contextWindow: 2000000,
        outputTokens: 8192,
      },
      'gemini-1.5-flash': {
        id: 'gemini-1.5-flash-latest',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient model optimized for speed and cost',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: true,
        supportsTools: true,
        contextWindow: 1000000,
        outputTokens: 8192,
      },
      'gemini-1.5-flash-8b': {
        id: 'gemini-1.5-flash-8b-latest',
        name: 'Gemini 1.5 Flash 8B',
        description: 'Compact, ultra-fast model for simple tasks and high throughput',
        maxTokens: 8192,
        temperature: 0.7,
        supportsVision: false,
        supportsTools: true,
        contextWindow: 1000000,
        outputTokens: 8192,
      },
    },
  };

  getModel(modelId: string, options?: any): LanguageModel {
    const modelConfig = this.getModelConfig(modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found in Google AI provider`);
    }

    return google(modelConfig.id, options);
  }
}
