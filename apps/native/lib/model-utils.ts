import { generateConvexApiUrl } from '@/lib/convex-utils';

export interface DisplayModel {
  key: string;
  id: string;
  name: string;
  provider: string;
  abilities: string[];
  contextWindow?: number;
  supportsVision: boolean;
  supportsTools: boolean;
}

// Cache for models to avoid repeated API calls
let modelsCache: DisplayModel[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all available models
 */
export async function fetchModels(): Promise<DisplayModel[]> {
  // Return cached models if still valid
  if (modelsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return modelsCache;
  }

  try {
    const response = await fetch(generateConvexApiUrl('/api/models'));
    const data = await response.json();

    if (response.ok) {
      const processed = (
        data.models as {
          id: string;
          name: string;
          provider: string;
          abilities: string[];
          contextWindow?: number;
        }[]
      ).map(m => {
        const abilities = m.abilities || [];
        return {
          key: m.id,
          id: m.id,
          name: m.name,
          provider: m.provider,
          abilities,
          contextWindow: m.contextWindow,
          supportsVision: abilities.includes('vision'),
          supportsTools: abilities.includes('function_calling'),
        } as DisplayModel;
      });

      const sortedModels = processed.sort((a: DisplayModel, b: DisplayModel) => {
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider);
        }
        return a.name.localeCompare(b.name);
      });

      modelsCache = sortedModels;
      cacheTimestamp = Date.now();

      return sortedModels;
    } else {
      throw new Error(data.error || 'Failed to fetch models');
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

/**
 * Get model by key
 */
export async function getModelByKey(modelKey: string): Promise<DisplayModel | null> {
  try {
    const models = await fetchModels();
    return models.find(model => model.key === modelKey) || null;
  } catch (error) {
    console.error('Error getting model by key:', error);
    return null;
  }
}

/**
 * Check if a model supports vision
 */
export async function doesModelSupportVision(modelKey: string): Promise<boolean> {
  try {
    const model = await getModelByKey(modelKey);
    return model?.supportsVision || false;
  } catch (error) {
    console.error('Error checking vision support:', error);
    return false;
  }
}

/**
 * Check if a model supports tools
 */
export async function doesModelSupportTools(modelKey: string): Promise<boolean> {
  try {
    const model = await getModelByKey(modelKey);
    return model?.supportsTools || false;
  } catch (error) {
    console.error('Error checking tools support:', error);
    return false;
  }
}

/**
 * Get models that support vision
 */
export async function getVisionSupportedModels(): Promise<DisplayModel[]> {
  try {
    const models = await fetchModels();
    return models.filter(model => model.supportsVision);
  } catch (error) {
    console.error('Error getting vision supported models:', error);
    return [];
  }
}

/**
 * Get models that support tools
 */
export async function getToolsSupportedModels(): Promise<DisplayModel[]> {
  try {
    const models = await fetchModels();
    return models.filter(model => model.supportsTools);
  } catch (error) {
    console.error('Error getting tools supported models:', error);
    return [];
  }
}

/**
 * Validate if model can handle images
 */
export function validateModelForImages(
  model: DisplayModel | null,
  hasImages: boolean
): {
  canProceed: boolean;
  warning?: string;
  suggestion?: string;
} {
  if (!hasImages) {
    return { canProceed: true };
  }

  if (!model) {
    return {
      canProceed: false,
      warning: 'Model not found',
      suggestion: 'Please select a valid model',
    };
  }

  if (!model.supportsVision) {
    return {
      canProceed: false,
      warning: `${model.name} doesn't support images`,
      suggestion: 'Switch to a vision-capable model like GPT-4V or Gemini Pro Vision',
    };
  }

  return { canProceed: true };
}

/**
 * Validate if model can handle PDFs
 */
export function validateModelForPDFs(
  model: DisplayModel | null,
  hasPDFs: boolean
): {
  canProceed: boolean;
  warning?: string;
  suggestion?: string;
} {
  if (!hasPDFs) {
    return { canProceed: true };
  }

  if (!model) {
    return {
      canProceed: false,
      warning: 'Model not found',
      suggestion: 'Please select a valid model',
    };
  }

  if (!model.supportsVision) {
    return {
      canProceed: false,
      warning: `${model.name} doesn't support PDF documents`,
      suggestion: 'Switch to a vision-capable model like GPT-4V or Gemini Pro Vision',
    };
  }

  return { canProceed: true };
}

/**
 * Validate if model can handle mixed attachments (images + PDFs)
 */
export function validateModelForAttachments(
  model: DisplayModel | null,
  hasImages: boolean,
  hasPDFs: boolean
): {
  canProceed: boolean;
  warning?: string;
  suggestion?: string;
} {
  if (!hasImages && !hasPDFs) {
    return { canProceed: true };
  }

  if (!model) {
    return {
      canProceed: false,
      warning: 'Model not found',
      suggestion: 'Please select a valid model',
    };
  }

  if (!model.supportsVision) {
    const attachmentTypes = [];
    if (hasImages) attachmentTypes.push('images');
    if (hasPDFs) attachmentTypes.push('PDF documents');

    return {
      canProceed: false,
      warning: `${model.name} doesn't support ${attachmentTypes.join(' or ')}`,
      suggestion: 'Switch to a vision-capable model like GPT-4V or Gemini Pro Vision',
    };
  }

  return { canProceed: true };
}

/**
 * Get recommended model for images
 */
export async function getRecommendedModelForImages(): Promise<DisplayModel | null> {
  try {
    const visionModels = await getVisionSupportedModels();

    // Priority order for vision models
    const priorityModels = [
      'gpt-4o',
      'gpt-4-vision-preview',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'claude-3.5-sonnet',
    ];

    for (const priority of priorityModels) {
      const model = visionModels.find(m => m.key.includes(priority) || m.id.includes(priority));
      if (model) {
        return model;
      }
    }

    // Fallback to first available vision model
    return visionModels[0] || null;
  } catch (error) {
    console.error('Error getting recommended model for images:', error);
    return null;
  }
}

/**
 * Clear models cache
 */
export function clearModelsCache(): void {
  modelsCache = null;
  cacheTimestamp = 0;
}
