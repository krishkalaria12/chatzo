import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface BackendModel {
  id: string;
  name: string;
  provider: string;
  abilities: string[];
  contextWindow?: number;
}

interface ModelsState {
  models: DisplayModel[];
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  fetchModels: () => Promise<void>;
  refreshModels: () => Promise<void>;
  getModelByKey: (key: string) => DisplayModel | null;
  getVisionModels: () => DisplayModel[];
  getToolsModels: () => DisplayModel[];
  doesModelSupportVision: (key: string) => boolean;
  doesModelSupportTools: (key: string) => boolean;
  clearError: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000;

export const useModelsStore = create<ModelsState>()(
  persist(
    (set, get) => ({
      models: [],
      isLoading: false,
      error: null,
      lastFetchTime: null,

      fetchModels: async () => {
        const state = get();

        if (
          state.models.length > 0 &&
          state.lastFetchTime &&
          Date.now() - state.lastFetchTime < CACHE_DURATION
        ) {
          return;
        }

        try {
          set({ isLoading: true, error: null });

          const response = await fetch(generateConvexApiUrl('/api/models'));
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch models');
          }

          const processed = (data.models as BackendModel[]).map(m => {
            const abilities: string[] = m.abilities || [];
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

          set({
            models: sortedModels,
            isLoading: false,
            error: null,
            lastFetchTime: Date.now(),
          });
        } catch (error) {
          console.error('Failed to fetch models:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch models',
          });
        }
      },

      refreshModels: async () => {
        set({ lastFetchTime: null });
        await get().fetchModels();
      },

      getModelByKey: (key: string) => {
        const { models } = get();
        return models.find(model => model.key === key) || null;
      },

      getVisionModels: () => {
        const { models } = get();
        return models.filter(model => model.supportsVision);
      },

      getToolsModels: () => {
        const { models } = get();
        return models.filter(model => model.supportsTools);
      },

      doesModelSupportVision: (key: string) => {
        const model = get().getModelByKey(key);
        return model?.supportsVision || false;
      },

      doesModelSupportTools: (key: string) => {
        const model = get().getModelByKey(key);
        return model?.supportsTools || false;
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'models-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        models: state.models,
        lastFetchTime: state.lastFetchTime,
      }),
      version: 1,
    }
  )
);

export const validateModelForImages = (
  modelKey: string | null,
  hasImages: boolean
): {
  canProceed: boolean;
  warning?: string;
  suggestion?: string;
} => {
  if (!hasImages) {
    return { canProceed: true };
  }

  if (!modelKey) {
    return {
      canProceed: false,
      warning: 'No model selected',
      suggestion: 'Please select a model',
    };
  }

  const model = useModelsStore.getState().getModelByKey(modelKey);

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
};

export const validateModelForPDFs = (
  modelKey: string | null,
  hasPDFs: boolean
): {
  canProceed: boolean;
  warning?: string;
  suggestion?: string;
} => {
  if (!hasPDFs) {
    return { canProceed: true };
  }

  if (!modelKey) {
    return {
      canProceed: false,
      warning: 'No model selected',
      suggestion: 'Please select a model',
    };
  }

  const model = useModelsStore.getState().getModelByKey(modelKey);

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
};

export const validateModelForAttachments = (
  modelKey: string | null,
  hasImages: boolean,
  hasPDFs: boolean
): {
  canProceed: boolean;
  warning?: string;
  suggestion?: string;
} => {
  if (!hasImages && !hasPDFs) {
    return { canProceed: true };
  }

  if (!modelKey) {
    return {
      canProceed: false,
      warning: 'No model selected',
      suggestion: 'Please select a model',
    };
  }

  const model = useModelsStore.getState().getModelByKey(modelKey);

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
};

// Hook for getting recommended model for images
export const useRecommendedImageModel = () => {
  const visionModels = useModelsStore(state => state.getVisionModels());

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
};
