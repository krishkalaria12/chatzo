import { v } from 'convex/values';

// Thread schema for organizing conversations
export const Thread = v.object({
  userId: v.string(), // Clerk user ID
  title: v.string(),
  description: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastMessageAt: v.optional(v.number()),
  messageCount: v.number(),
  isArchived: v.optional(v.boolean()),
  isPinned: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
  settings: v.optional(
    v.object({
      modelId: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      systemPrompt: v.optional(v.string()),
    })
  ),
});
