import { BaseAIProvider, AIModelConfig } from './base';
import { GoogleAIProvider } from './google';
import { MistralAIProvider } from './mistral';

/**
 * Enhanced model interface that includes provider information
 */
export interface EnhancedModelConfig extends AIModelConfig {
  key: string;
  provider: string;
  providerDisplayName: string;
  providerIcon: string;
  providerColor: string;
}

/**
 * Provider registry that manages all AI providers
 */
export class ProviderRegistry {
  private providers: Map<string, BaseAIProvider> = new Map();
  private modelToProviderMap: Map<string, string> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize all available providers
   * Add new providers here when expanding the system
   */
  private initializeProviders() {
    // Register Google AI Provider
    const googleProvider = new GoogleAIProvider();
    this.registerProvider(googleProvider);

    // Register Mistral AI Provider
    const mistralProvider = new MistralAIProvider();
    this.registerProvider(mistralProvider);

    // TODO: Add new providers here
    // const openaiProvider = new OpenAIProvider();
    // this.registerProvider(openaiProvider);
    //
    // const anthropicProvider = new AnthropicProvider();
    // this.registerProvider(anthropicProvider);
  }

  /**
   * Register a new provider
   */
  private registerProvider(provider: BaseAIProvider) {
    const providerName = provider.config.name;
    this.providers.set(providerName, provider);

    // Build model to provider mapping
    Object.keys(provider.config.models).forEach(modelKey => {
      this.modelToProviderMap.set(modelKey, providerName);
    });
  }

  /**
   * Get a provider by name
   */
  getProvider(providerName: string): BaseAIProvider | null {
    return this.providers.get(providerName) || null;
  }

  /**
   * Get provider for a specific model
   */
  getProviderForModel(modelKey: string): BaseAIProvider | null {
    const providerName = this.modelToProviderMap.get(modelKey);
    return providerName ? this.getProvider(providerName) : null;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): BaseAIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all available models across all providers
   */
  getAllModels(): EnhancedModelConfig[] {
    const allModels: EnhancedModelConfig[] = [];

    for (const provider of this.providers.values()) {
      const providerInfo = provider.getProviderInfo();
      const models = provider.getModels();

      Object.entries(models).forEach(([key, model]) => {
        allModels.push({
          key,
          provider: providerInfo.name,
          providerDisplayName: providerInfo.displayName,
          providerIcon: providerInfo.icon,
          providerColor: providerInfo.color,
          ...model,
        });
      });
    }

    return allModels;
  }

  /**
   * Get a specific model configuration
   */
  getModelConfig(modelKey: string): EnhancedModelConfig | null {
    const provider = this.getProviderForModel(modelKey);
    if (!provider) return null;

    const model = provider.getModelConfig(modelKey);
    if (!model) return null;

    const providerInfo = provider.getProviderInfo();

    return {
      key: modelKey,
      provider: providerInfo.name,
      providerDisplayName: providerInfo.displayName,
      providerIcon: providerInfo.icon,
      providerColor: providerInfo.color,
      ...model,
    };
  }

  /**
   * Get model instance for inference
   */
  getModelInstance(modelKey: string, options?: any) {
    const provider = this.getProviderForModel(modelKey);
    if (!provider) {
      throw new Error(`No provider found for model: ${modelKey}`);
    }

    return provider.getModel(modelKey, options);
  }

  /**
   * Check if a model is supported
   */
  isModelSupported(modelKey: string): boolean {
    return this.modelToProviderMap.has(modelKey);
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(providerName: string): EnhancedModelConfig[] {
    const provider = this.getProvider(providerName);
    if (!provider) return [];

    const providerInfo = provider.getProviderInfo();
    const models = provider.getModels();

    return Object.entries(models).map(([key, model]) => ({
      key,
      provider: providerInfo.name,
      providerDisplayName: providerInfo.displayName,
      providerIcon: providerInfo.icon,
      providerColor: providerInfo.color,
      ...model,
    }));
  }
}

// Create singleton instance
export const providerRegistry = new ProviderRegistry();
