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
    edited: v.optional(v.boolean()),
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

/**
 * Update an existing message
 */
export const updateMessage = mutation({
  args: {
    messageId: v.id('messages'),
    content: MessageContent,
    edited: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { messageId, content, edited = true } = args;

    await ctx.db.patch(messageId, {
      content,
      edited,
      editedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete messages from a specific index onwards (for retry operations)
 */
export const deleteMessagesFromIndex = mutation({
  args: {
    threadId: v.id('threads'),
    fromIndex: v.number(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const { threadId, fromIndex, clerkId } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    // Verify user has access to this thread
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError('Thread not found or access denied');
    }

    // Get all messages for the thread
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_thread_created', (q: any) => q.eq('threadId', threadId))
      .order('asc')
      .filter((q: any) => q.neq(q.field('isDeleted'), true))
      .collect();

    // Delete messages from the specified index onwards
    const messagesToDelete = messages.slice(fromIndex);
    const deletePromises = messagesToDelete.map(msg =>
      ctx.db.patch(msg._id, {
        isDeleted: true,
        updatedAt: Date.now(),
      })
    );

    await Promise.all(deletePromises);

    return { deletedCount: messagesToDelete.length };
  },
});

/**
 * Soft delete a message
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id('messages'),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const { messageId, clerkId } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    // Get the message and verify access
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new ConvexError('Message not found');
    }

    // Get the thread to verify user access
    const thread = await ctx.db.get(message.threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError('Access denied');
    }

    await ctx.db.patch(messageId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
