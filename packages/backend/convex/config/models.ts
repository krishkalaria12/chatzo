export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  temperature: number;
  supportsVision: boolean;
  supportsTools: boolean;
  provider: 'google' | 'mistral';
  contextWindow: number;
  outputTokens: number;
}

export const ALL_MODELS: Record<string, AIModel> = {
  // Google Generative AI Models
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro-exp-03-25',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable model with advanced reasoning and multimodal capabilities',
    maxTokens: 8192,
    temperature: 0.7,
    supportsVision: true,
    supportsTools: true,
    provider: 'google',
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
    provider: 'google',
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
    provider: 'google',
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
    provider: 'google',
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
    provider: 'google',
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
    provider: 'google',
    contextWindow: 1000000,
    outputTokens: 8192,
  },

  // Mistral AI Models
  'pixtral-large': {
    id: 'pixtral-large-latest',
    name: 'Pixtral Large',
    description: 'Advanced multimodal model with excellent vision and reasoning capabilities',
    maxTokens: 8192,
    temperature: 0.7,
    supportsVision: true,
    supportsTools: true,
    provider: 'mistral',
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
    provider: 'mistral',
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
    provider: 'mistral',
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
    provider: 'mistral',
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
    provider: 'mistral',
    contextWindow: 128000,
    outputTokens: 8192,
  },
};

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export const getModelById = (modelKey: string): AIModel | null => {
  return ALL_MODELS[modelKey] || null;
};

export const getAllModels = (): AIModel[] => {
  return Object.values(ALL_MODELS);
};

export const getModelsByProvider = (provider: 'google' | 'mistral'): AIModel[] => {
  return Object.values(ALL_MODELS).filter(model => model.provider === provider);
};
