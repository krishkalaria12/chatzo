import { LanguageModel } from 'ai';

export interface AIModelConfig {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  temperature: number;
  supportsVision: boolean;
  supportsTools: boolean;
  contextWindow: number;
  outputTokens: number;
}

export interface ProviderConfig {
  name: string;
  displayName: string;
  icon: string;
  color: string;
  description: string;
  website?: string;
  models: Record<string, AIModelConfig>;
}

export abstract class BaseAIProvider {
  abstract readonly config: ProviderConfig;

  /**
   * Get a model instance by ID
   */
  abstract getModel(modelId: string, options?: any): LanguageModel;

  /**
   * Get all available models for this provider
   */
  getModels(): Record<string, AIModelConfig> {
    return this.config.models;
  }

  /**
   * Get a specific model config by ID
   */
  getModelConfig(modelId: string): AIModelConfig | null {
    return this.config.models[modelId] || null;
  }

  /**
   * Check if provider supports a specific model
   */
  supportsModel(modelId: string): boolean {
    return modelId in this.config.models;
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: this.config.name,
      displayName: this.config.displayName,
      icon: this.config.icon,
      color: this.config.color,
      description: this.config.description,
      website: this.config.website,
    };
  }
}
