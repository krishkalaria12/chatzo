// Attachment types for chat interface

export interface BaseAttachment {
  id: string;
  name: string;
  size?: number;
  uri: string;
  cloudinaryPublicId?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

export interface ImageAttachment extends BaseAttachment {
  type: 'image';
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface PDFAttachment extends BaseAttachment {
  type: 'pdf';
  mimeType: 'application/pdf';
  pageCount?: number;
  title?: string;
}

export type Attachment = ImageAttachment | PDFAttachment;

// Utility type guards
export function isImageAttachment(attachment: Attachment): attachment is ImageAttachment {
  return attachment.type === 'image';
}

export function isPDFAttachment(attachment: Attachment): attachment is PDFAttachment {
  return attachment.type === 'pdf';
}

// Validation helpers
export function validateImageAttachment(attachment: Partial<ImageAttachment>): boolean {
  return !!(attachment.uri && attachment.name && attachment.type === 'image');
}

export function validatePDFAttachment(attachment: Partial<PDFAttachment>): boolean {
  return !!(
    attachment.uri &&
    attachment.name &&
    attachment.type === 'pdf' &&
    attachment.mimeType === 'application/pdf'
  );
}

// Content type helpers for AI SDK
export type AttachmentContentType = 'mixed' | 'image' | 'pdf' | 'text';

export function getAttachmentContentType(attachments: Attachment[]): AttachmentContentType {
  if (attachments.length === 0) return 'text';

  const hasImages = attachments.some(isImageAttachment);
  const hasPDFs = attachments.some(isPDFAttachment);

  if (hasImages && hasPDFs) return 'mixed';
  if (hasImages) return 'image';
  if (hasPDFs) return 'pdf';

  return 'text';
}

// Upload status helpers
export function isAttachmentUploading(attachment: Attachment): boolean {
  return attachment.isUploading || false;
}

export function hasAttachmentError(attachment: Attachment): boolean {
  return !!attachment.error;
}

export function getAttachmentProgress(attachment: Attachment): number {
  return attachment.uploadProgress || 0;
}
