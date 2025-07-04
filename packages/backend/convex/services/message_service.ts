import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { MessageContent } from '../schemas/message';
import { getUserByClerkId } from './user_service';
import { ConvexError } from 'convex/values';

/**
 * Get messages for a thread (internal use - no auth check)
 */
export const getThreadMessagesInternal = query({
  args: {
    threadId: v.id('threads'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { threadId, limit = 100 } = args;

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_thread_created', (q: any) => q.eq('threadId', threadId))
      .order('asc')
      .filter((q: any) => q.neq(q.field('isDeleted'), true))
      .paginate({ numItems: limit, cursor: null })
      .then((result: any) => result.page);

    return messages;
  },
});

/**
 * Get messages for a thread
 */
export const getThreadMessages = query({
  args: {
    threadId: v.id('threads'),
    clerkId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { threadId, clerkId, limit = 50, offset = 0 } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    // Verify user has access to this thread
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError('Thread not found or access denied');
    }

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_thread_created', (q: any) => q.eq('threadId', threadId))
      .order('asc')
      .filter((q: any) => q.neq(q.field('isDeleted'), true))
      .paginate({ numItems: limit, cursor: null })
      .then((result: any) => result.page.slice(offset, offset + limit));

    return messages;
  },
});

/**
 * Save a message to the database
 */
export const saveMessage = mutation({
  args: {
    threadId: v.id('threads'),
    role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
    content: MessageContent,
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert('messages', {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { messageId };
  },
});
