// Cloudinary configuration and upload utility
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_DELIVERY_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadOptions {
  upload_preset: string;
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: string;
  public_id?: string;
  tags?: string[];
}

export interface CloudinaryPDFUploadOptions {
  upload_preset: string;
  folder?: string;
  public_id?: string;
  tags?: string[];
}

export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
}

// Helper function to get MIME type from file extension
function getMimeTypeFromUri(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();

  // Only include formats supported by Expo Image
  // Reference: https://docs.expo.dev/versions/latest/sdk/image/
  const supportedMimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    apng: 'image/apng',
    webp: 'image/webp',
    avif: 'image/avif',
    heic: 'image/heic',
    heif: 'image/heif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
  };

  return supportedMimeTypes[extension || ''] || 'image/jpeg'; // Default to JPEG if unknown
}

// Helper function to generate unique filename
function generateUniqueFilename(originalUri: string): string {
  const extension = originalUri.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `upload_${timestamp}_${randomString}.${extension}`;
}

// Helper function to validate if image format is supported by Expo Image
export function isImageFormatSupported(uri: string): boolean {
  const extension = uri.split('.').pop()?.toLowerCase();
  const supportedExtensions = [
    'jpg',
    'jpeg',
    'png',
    'apng',
    'webp',
    'avif',
    'heic',
    'heif',
    'svg',
    'ico',
  ];
  return supportedExtensions.includes(extension || '');
}

// Get supported image file extensions for ImagePicker
export function getSupportedImageExtensions(): string[] {
  return ['jpg', 'jpeg', 'png', 'apng', 'webp', 'avif', 'heic', 'heif', 'svg', 'ico'];
}

// Helper function to validate if file is a PDF
export function isPDFFile(uri: string): boolean {
  const extension = uri.split('.').pop()?.toLowerCase();
  return extension === 'pdf';
}

// Helper function to get PDF MIME type
function getPDFMimeType(): string {
  return 'application/pdf';
}

// Helper function to generate unique PDF filename
function generateUniquePDFFilename(originalName?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const name = originalName?.replace(/\.[^/.]+$/, '') || 'document';
  return `${name}_${timestamp}_${randomString}.pdf`;
}

export async function uploadToCloudinary(
  fileUri: string,
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResponse> {
  try {
    const formData = new FormData();

    // Detect MIME type and generate unique filename
    const mimeType = getMimeTypeFromUri(fileUri);
    const fileName = generateUniqueFilename(fileUri);

    // Add the file
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as any);

    // Add upload options
    formData.append('upload_preset', options.upload_preset);

    if (options.folder) {
      formData.append('folder', options.folder);
    }

    if (options.resource_type) {
      formData.append('resource_type', options.resource_type);
    }

    if (options.transformation) {
      formData.append('transformation', options.transformation);
    }

    if (options.public_id) {
      formData.append('public_id', options.public_id);
    }

    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// Cloudinary delete options
export interface CloudinaryDeleteOptions {
  resource_type?: 'image' | 'video' | 'raw';
  type?: 'upload' | 'private' | 'authenticated';
  invalidate?: boolean;
}

// Cloudinary delete response
export interface CloudinaryDeleteResponse {
  result: 'ok' | 'not found';
  public_id?: string;
}

// Delete function (requires API key and secret - should be done server-side in production)
export async function deleteFromCloudinary(
  publicId: string,
  options: CloudinaryDeleteOptions = {}
): Promise<CloudinaryDeleteResponse> {
  const CLOUDINARY_DELETE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`;

  try {
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '');

    if (options.resource_type) {
      formData.append('resource_type', options.resource_type);
    }

    if (options.type) {
      formData.append('type', options.type);
    }

    if (options.invalidate) {
      formData.append('invalidate', 'true');
    }

    // Generate timestamp
    const timestamp = Math.round(Date.now() / 1000);
    formData.append('timestamp', timestamp.toString());

    // Note: In production, signature should be generated server-side
    // This is a simplified version - you should implement proper authentication
    const response = await fetch(CLOUDINARY_DELETE_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Delete failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

// Generate optimized image URL with transformations
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    gravity?: 'auto' | 'center' | 'face' | 'faces';
  } = {}
): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
  } = options;

  let transformations: string[] = [];

  if (width || height) {
    let sizeTransform = `c_${crop}`;
    if (width) sizeTransform += `,w_${width}`;
    if (height) sizeTransform += `,h_${height}`;
    if (gravity !== 'auto') sizeTransform += `,g_${gravity}`;
    transformations.push(sizeTransform);
  }

  if (quality !== 'auto') {
    transformations.push(`q_${quality}`);
  } else {
    transformations.push('q_auto');
  }

  if (format !== 'auto') {
    transformations.push(`f_${format}`);
  } else {
    transformations.push('f_auto');
  }

  const transformString = transformations.join(',');
  return `${CLOUDINARY_DELIVERY_URL}/${transformString}/${publicId}`;
}

// Upload PDF to Cloudinary
export async function uploadPDFToCloudinary(
  fileUri: string,
  fileName: string,
  options: CloudinaryPDFUploadOptions
): Promise<CloudinaryUploadResponse> {
  try {
    // Validate PDF file
    if (!isPDFFile(fileUri)) {
      throw new Error('File is not a valid PDF');
    }

    const formData = new FormData();

    // Generate unique filename
    const uniqueFileName = generateUniquePDFFilename(fileName);

    // Add the PDF file
    formData.append('file', {
      uri: fileUri,
      type: getPDFMimeType(),
      name: uniqueFileName,
    } as any);

    // Add upload options
    formData.append('upload_preset', options.upload_preset);
    formData.append('resource_type', 'raw'); // PDFs are uploaded as raw files

    if (options.folder) {
      formData.append('folder', options.folder);
    }

    if (options.public_id) {
      formData.append('public_id', options.public_id);
    }

    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || `PDF upload failed with status ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary PDF upload error:', error);
    throw error;
  }
}

// Get PDF document URL (for viewing/downloading)
export function getPDFDocumentUrl(publicId: string): string {
  return `${CLOUDINARY_DELIVERY_URL}/fl_attachment/${publicId}`;
}

// Upload buffer to Cloudinary (for server-side use)
export async function uploadBufferToCloudinary(
  buffer: Uint8Array,
  options: CloudinaryUploadOptions & { mimeType: string }
): Promise<CloudinaryUploadResponse> {
  try {
    if (!options.upload_preset) {
      throw new Error('Cloudinary upload preset is required.');
    }

    const formData = new FormData();

    // Use a unique filename, Cloudinary will use public_id if provided
    const uniqueFileName = options.public_id || generateUniqueFilename('upload.png');

    formData.append('file', new Blob([buffer], { type: options.mimeType }), uniqueFileName);

    // Add upload options
    formData.append('upload_preset', options.upload_preset);

    if (options.folder) {
      formData.append('folder', options.folder);
    }
    if (options.public_id) {
      formData.append('public_id', options.public_id);
    }
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }
    // resource_type will be 'image' by default which is what we want.

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudinary buffer upload error:', error);
    throw error;
  }
}
