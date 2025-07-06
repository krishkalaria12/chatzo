import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { LanguageModel } from 'ai';

export type ModelAbility = 'vision' | 'function_calling' | 'pdf' | 'reasoning' | 'effort_control';

export const CoreProviders = ['google', 'mistral'] as const;
export type CoreProvider = (typeof CoreProviders)[number];
export type ModelDefinitionProviders = CoreProvider;

export type SharedModel<Abilities extends ModelAbility[] = ModelAbility[]> = {
  id: string;
  name: string;
  provider: CoreProvider;
  abilities: Abilities;
  mode?: 'text' | 'image';
};

export const MODELS_SHARED: SharedModel[] = [
  // Google Models
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    abilities: ['reasoning', 'vision', 'function_calling', 'pdf', 'effort_control'],
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    abilities: ['vision', 'function_calling', 'reasoning', 'pdf', 'effort_control'],
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    abilities: ['vision', 'function_calling', 'pdf'],
  },
  // Mistral Models
  {
    id: 'pixtral-large',
    name: 'Pixtral Large',
    provider: 'mistral',
    abilities: ['vision', 'function_calling', 'reasoning'],
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    abilities: ['function_calling', 'reasoning'],
  },
  {
    id: 'mistral-small',
    name: 'Mistral Small',
    provider: 'mistral',
    abilities: ['function_calling'],
  },
  {
    id: 'mistral-8b',
    name: 'Mistral 8B',
    provider: 'mistral',
    abilities: ['function_calling'],
  },
] as const;

export const getModelById = (modelId: string) =>
  MODELS_SHARED.find(model => model.id === modelId) || null;

/**
 * Lightweight factory that returns a LanguageModel instance for a given model key.
 */
export const createAIModel = (modelKey: string, options?: any): LanguageModel => {
  const modelConfig = getModelById(modelKey);
  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  switch (modelConfig.provider) {
    case 'google':
      return google(modelConfig.id, options);
    case 'mistral':
      return mistral(modelConfig.id, options);
    default: {
      // Exhaustive check for TypeScript completeness
      throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }
  }
};

// Backwards-compatibility alias
export const getModelConfig = getModelById;

export const getAllModels = () => {
  return MODELS_SHARED;
};

export const getModelsByProvider = (provider: CoreProvider) => {
  return MODELS_SHARED.filter(model => model.provider === provider);
};

export const DEFAULT_MODEL = 'gemini-2.5-flash';
