import { v } from 'convex/values';

// Individual content part types (compatible with AI SDK format)
export const TextContentPart = v.object({
  type: v.literal('text'),
  text: v.string(),
});

export const ImageContentPart = v.object({
  type: v.literal('image'),
  url: v.string(),
  alt: v.optional(v.string()),
});

export const FileContentPart = v.object({
  type: v.literal('file'),
  url: v.string(),
  fileName: v.string(),
  fileSize: v.optional(v.number()),
  mimeType: v.optional(v.string()),
});

// Content part union
export const ContentPart = v.union(TextContentPart, ImageContentPart, FileContentPart);

// Message content can be:
// 1. Simple string (legacy support)
// 2. Single content part object
// 3. Array of content parts (AI SDK compatible for mixed content)
export const MessageContent = v.union(v.string(), ContentPart, v.array(ContentPart));

// Message metadata for AI-related information
export const MessageMetadata = v.object({
  modelId: v.optional(v.string()),
  modelName: v.optional(v.string()),
  promptTokens: v.optional(v.number()),
  completionTokens: v.optional(v.number()),
  serverDurationMs: v.optional(v.number()),
  duration: v.optional(v.number()), // Duration in milliseconds (alternative to serverDurationMs)
  temperature: v.optional(v.number()),
  maxTokens: v.optional(v.number()),
});

// HTTP AI Message (for API requests/responses)
export const HTTPAIMessage = v.object({
  role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
  content: MessageContent,
  metadata: v.optional(MessageMetadata),
});

// AI Message (internal processing)
export const AIMessage = v.object({
  role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
  content: MessageContent,
  createdAt: v.number(),
  updatedAt: v.number(),
  metadata: MessageMetadata,
});

// Database Message (stored in Convex)
export const Message = v.object({
  threadId: v.id('threads'),
  role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
  content: MessageContent,
  createdAt: v.number(),
  updatedAt: v.number(),
  metadata: MessageMetadata,
  isDeleted: v.optional(v.boolean()),
  editedAt: v.optional(v.number()),
});
