import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import {
  // Message schemas
  Message,
  // Thread schemas
  Thread,
  // Usage schemas
  UsageEvent,
  DailyUsageSummary,
} from './schemas';

export default defineSchema({
  // User table for Clerk authentication
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email']),

  // Thread table for organizing conversations
  threads: defineTable(Thread)
    .index('by_user_id', ['userId'])
    .index('by_user_created', ['userId', 'createdAt'])
    .index('by_user_updated', ['userId', 'updatedAt'])
    .index('by_user_last_message', ['userId', 'lastMessageAt'])
    .index('by_user_archived', ['userId', 'isArchived'])
    .index('by_user_pinned', ['userId', 'isPinned']),

  // Message table for storing conversation messages
  messages: defineTable(Message)
    .index('by_thread_id', ['threadId'])
    .index('by_thread_created', ['threadId', 'createdAt'])
    .index('by_thread_role', ['threadId', 'role']),

  // Usage events for tracking AI model usage
  usageEvents: defineTable(UsageEvent)
    .index('by_user_id', ['userId'])
    .index('by_user_timestamp', ['userId', 'timestamp'])
    .index('by_user_days_since_epoch', ['userId', 'daysSinceEpoch'])
    .index('by_model_id', ['modelId'])
    .index('by_thread_id', ['threadId'])
    .index('by_status', ['status']),

  // Daily usage summaries for analytics
  dailyUsageSummaries: defineTable(DailyUsageSummary)
    .index('by_user_id', ['userId'])
    .index('by_user_date', ['userId', 'date'])
    .index('by_user_days_since_epoch', ['userId', 'daysSinceEpoch'])
    .index('by_date', ['date']),
});
