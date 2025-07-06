import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Message, SharedThread, Thread, UsageEvent, UserSettings } from './schemas';

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

  threads: defineTable(Thread)
    .index('byAuthor', ['authorId'])
    .index('byProject', ['projectId'])
    .index('byAuthorAndProject', ['authorId', 'projectId'])
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['authorId'],
    }),

  sharedThreads: defineTable(SharedThread).index('byAuthorId', ['authorId']),

  messages: defineTable(Message)
    .index('byThreadId', ['threadId'])
    .index('byMessageId', ['messageId']),

  settings: defineTable(UserSettings).index('byUser', ['userId']),

  usageEvents: defineTable(UsageEvent).index('byUserDay', ['userId', 'daysSinceEpoch']),
});
