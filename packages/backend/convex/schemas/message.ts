import { v } from 'convex/values';

// Base message content types
export const MessageContent = v.union(
  v.string(),
  v.object({
    type: v.literal('text'),
    text: v.string(),
  }),
  v.object({
    type: v.literal('image'),
    url: v.string(),
    alt: v.optional(v.string()),
  }),
  v.object({
    type: v.literal('file'),
    url: v.string(),
    fileName: v.string(),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
  })
);

// Message metadata for AI-related information
export const MessageMetadata = v.object({
  modelId: v.optional(v.string()),
  modelName: v.optional(v.string()),
  promptTokens: v.optional(v.number()),
  completionTokens: v.optional(v.number()),
  serverDurationMs: v.optional(v.number()),
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
