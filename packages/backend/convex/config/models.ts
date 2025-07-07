import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { groq } from '@ai-sdk/groq';
import { LanguageModel } from 'ai';

export type ModelAbility = 'vision' | 'function_calling' | 'pdf' | 'reasoning' | 'effort_control';

export const CoreProviders = ['google', 'mistral', 'groq'] as const;
export type CoreProvider = (typeof CoreProviders)[number];
export type ModelDefinitionProviders = CoreProvider;

export type SharedModel<Abilities extends ModelAbility[] = ModelAbility[]> = {
  id: string;
  name: string;
  provider: ModelDefinitionProviders;
  abilities: Abilities;
  contextWindow?: number;
};

export const getModelById = (id: string) => MODELS_SHARED.find(m => m.id === id);

export const getAllModels = () => MODELS_SHARED;

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
  // Groq Models
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1',
    provider: 'groq',
    abilities: ['reasoning', 'function_calling'],
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    provider: 'groq',
    abilities: ['vision', 'reasoning', 'function_calling'],
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70b',
    provider: 'groq',
    abilities: ['reasoning', 'function_calling'],
  },
  {
    id: 'qwen-2.5-32b',
    name: 'Qwen 2.5 32b',
    provider: 'groq',
    abilities: ['reasoning', 'function_calling'],
  },
  {
    id: 'qwen-qwq-32b',
    name: 'Qwen QWQ 32b',
    provider: 'groq',
    abilities: ['reasoning', 'function_calling'],
  },
] as const;

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
    case 'groq':
      return groq(modelConfig.id, options);
    default: {
      // Exhaustive check for TypeScript completeness
      throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }
  }
};

export const DEFAULT_MODEL = 'gemini-2.5-flash';
