import { LanguageModel } from 'ai';
import { providerRegistry } from './registry';
import { getModelById } from '../config/models';

/**
 * Create an AI model instance for the given model key
 * @param modelKey - The model identifier (e.g., 'gemini-2.5-flash', 'mistral-large')
 * @param options - Optional configuration for the model
 * @returns LanguageModel instance ready for use with AI SDK
 */
export const createAIModel = (modelKey: string, options?: any): LanguageModel => {
  // Check if model is supported in our registry
  if (!isModelSupported(modelKey)) {
    throw new Error(
      `Unsupported model: ${modelKey}. Available models: ${getSupportedModels().join(', ')}`
    );
  }

  try {
    return providerRegistry.getModelInstance(modelKey, options);
  } catch (error) {
    throw new Error(
      `Failed to create model instance for ${modelKey}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get model configuration for the given model key
 * This uses the existing models.ts configuration for backward compatibility
 */
export const getModelConfig = (modelKey: string) => {
  return getModelById(modelKey);
};

/**
 * Get enhanced model configuration with provider info
 */
export const getEnhancedModelConfig = (modelKey: string) => {
  return providerRegistry.getModelConfig(modelKey);
};

/**
 * Get list of all supported model keys
 */
export const getSupportedModels = (): string[] => {
  return providerRegistry.getAllModels().map(model => model.key);
};

/**
 * Check if a model is supported
 */
export const isModelSupported = (modelKey: string): boolean => {
  return providerRegistry.isModelSupported(modelKey);
};

/**
 * Get all available models grouped by provider
 */
export const getAllModelsByProvider = () => {
  const models = providerRegistry.getAllModels();
  const grouped: Record<string, typeof models> = {};

  models.forEach(model => {
    if (!grouped[model.provider]) {
      grouped[model.provider] = [];
    }
    grouped[model.provider].push(model);
  });

  return grouped;
};
