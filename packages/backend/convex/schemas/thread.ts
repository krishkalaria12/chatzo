import { v } from 'convex/values';

// Thread schema for organizing conversations
export const Thread = v.object({
  userId: v.id('users'), // Reference to users table instead of Clerk ID string
  title: v.string(),
  description: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastMessageAt: v.optional(v.number()),
  messageCount: v.number(),
  isArchived: v.optional(v.boolean()),
  isPinned: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
});
