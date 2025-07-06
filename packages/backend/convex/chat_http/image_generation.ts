import type { ImageModelV1 } from '@ai-sdk/provider';
import { experimental_generateImage } from 'ai';
import type { GenericActionCtx } from 'convex/server';
import type { DataModel, Id } from '../_generated/dataModel';
import { type ImageSize, MODELS_SHARED } from '../config/models';
import { uploadBufferToCloudinary } from '../lib/cloudinary';

export interface ImageGenerationResult {
  assets: {
    imageUrl: string;
    imageSize: ImageSize;
    mimeType: string;
  }[];
  prompt: string;
  modelId: string;
}

export async function generateAndStoreImage({
  prompt,
  imageSize: requestedImageSize,
  imageModel,
  modelId,
  userId,
  threadId,
  actionCtx,
}: {
  prompt: string;
  imageSize: ImageSize;
  imageModel: ImageModelV1;
  modelId: string;
  userId: string;
  threadId: Id<'threads'>;
  actionCtx: GenericActionCtx<DataModel>;
}): Promise<ImageGenerationResult> {
  console.log('[cvx][image_generation] Starting image generation');

  const sharedModel = MODELS_SHARED.find(m => m.id === modelId);
  if (!sharedModel || sharedModel.mode !== 'image') {
    throw new Error(`Model ${modelId} is not an image generation model`);
  }

  // Validate that the requested image size is supported by the model
  if (!sharedModel.supportedImageSizes?.includes(requestedImageSize)) {
    console.warn('[cvx][image_generation] Unsupported image size, using default');
    // Fall back to first supported size
    const fallbackSize = sharedModel.supportedImageSizes?.[0];
    if (!fallbackSize) {
      throw new Error(`Model ${modelId} has no supported image sizes configured`);
    }
    requestedImageSize = fallbackSize;
  }

  const imageSize = requestedImageSize;

  // Determine if this model needs resolution format (like GPT Image 1)
  const needsResolution = imageSize.includes('x');

  // For models that need aspect ratios, convert resolution format to aspect ratio
  let aspectRatio: `${number}:${number}` | undefined;
  let size: `${number}x${number}` | undefined;

  if (needsResolution) {
    // Use the resolution directly
    size = imageSize as `${number}x${number}`;
  } else {
    // Convert to aspect ratio, handling HD variants
    const baseRatio = imageSize.replace('-hd', '');
    aspectRatio = baseRatio as `${number}:${number}`;
  }

  try {
    console.log(
      `[cvx][image_generation] Generating image with model ${imageModel.provider}/${imageModel.modelId}`,
      { imageSize, aspectRatio, size }
    );

    const { images } = await experimental_generateImage({
      model: imageModel,
      prompt,
      ...(size ? { size } : { aspectRatio }),
    });

    const assets: ImageGenerationResult['assets'] = [];

    for (const image of images) {
      const public_id = `generations/${userId}/${Date.now()}-${crypto.randomUUID()}-gen`;

      const result = await uploadBufferToCloudinary(image.uint8Array, {
        upload_preset: process.env.CLOUDINARY_GENERATIONS_PRESET!,
        mimeType: image.mimeType,
        public_id,
      });

      console.log('[cvx][image_generation] Image stored to Cloudinary:', result.public_id);

      assets.push({
        imageUrl: result.secure_url,
        imageSize: requestedImageSize,
        mimeType: image.mimeType,
      });
    }

    console.log('[cvx][image_generation] Image generation complete');

    return {
      assets,
      prompt,
      modelId,
    };
  } catch (error) {
    console.error('[cvx][image_generation] Error generating image:', error);
    throw new Error(
      `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
