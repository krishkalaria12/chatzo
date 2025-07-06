import { ChatError } from './lib/errors';
import {
  type FieldPaths,
  type FilterBuilder,
  type GenericTableInfo,
  paginationOptsValidator,
} from 'convex/server';
import { type Infer, v } from 'convex/values';
import { nanoid } from 'nanoid';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { getUserIdentity } from './lib/identity';
import type { Thread } from './schemas/thread';
import { HTTPAIMessage, type Message } from './schemas/message';

export const getThreadById = internalQuery({
  args: { threadId: v.id('threads') },
  handler: async ({ db }, { threadId }) => {
    const thread = await db.get(threadId);
    if (!thread) return null;
    return thread;
  },
});

export const createThreadOrInsertMessages = internalMutation({
  args: {
    threadId: v.optional(v.string()),
    authorId: v.string(),
    userMessage: v.optional(HTTPAIMessage),
    proposedNewAssistantId: v.string(),
    targetFromMessageId: v.optional(v.string()),
    targetMode: v.optional(v.union(v.literal('normal'), v.literal('edit'), v.literal('retry'))),
    folderId: v.optional(v.id('projects')),
  },
  handler: async (
    ctx,
    {
      threadId,
      authorId,
      userMessage,
      proposedNewAssistantId,
      targetFromMessageId,
      targetMode,
      folderId,
    }
  ) => {
    if (!userMessage) return new ChatError('bad_request:chat');

    if (!threadId) {
      const userMessageId_new = userMessage.messageId || nanoid();
      const newUserMessage_new = {
        messageId: userMessageId_new,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
        parts: userMessage.parts,
        role: userMessage.role,
      };
      const newAssistantMessage_new = {
        messageId: proposedNewAssistantId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
        parts: [],
        role: 'assistant' as const,
      };

      const newId = await ctx.db.insert('threads', {
        authorId,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        projectId: folderId, // Set the project ID if creating from a folder
      });
      // const doc = await ctx.db.get(newId);
      // await aggregrateThreadsByFolder.insert(ctx, doc!);

      // Thread count will be automatically updated by aggregate triggers

      await ctx.db.insert('messages', {
        threadId: newId,
        ...newUserMessage_new,
      });
      const assistantMessageConvexId = await ctx.db.insert('messages', {
        threadId: newId,
        ...newAssistantMessage_new,
      });

      return {
        threadId: newId,
        userMessageId: userMessageId_new,
        assistantMessageId: proposedNewAssistantId,
        assistantMessageConvexId,
      };
    }

    // new thread flow
    const thread = await ctx.db.get(threadId as Id<'threads'>);
    if (!thread) {
      console.error('[cvx][createThreadOrInsertMessages] Thread not found', threadId);
      return undefined;
    }

    // Handle edit mode - delete messages after the edited message
    let originalAssistantMessageId = proposedNewAssistantId;
    if (targetFromMessageId) {
      const allMessages = await ctx.db
        .query('messages')
        .withIndex('byThreadId', q => q.eq('threadId', threadId as Id<'threads'>))
        .order('asc')
        .collect();

      // Find the index of the message we're editing from
      const targetMessageIndex = allMessages.findIndex(
        msg => msg.messageId === targetFromMessageId
      );

      if (targetMessageIndex !== -1) {
        // Get the original assistant message ID before deleting (to reuse it)
        const messagesAfterTarget = allMessages.slice(targetMessageIndex + 1);
        const originalAssistantMessage = messagesAfterTarget.find(msg => msg.role === 'assistant');
        if (originalAssistantMessage) {
          originalAssistantMessageId = originalAssistantMessage.messageId;
        }

        // Delete all messages after the edited message
        for (const msg of messagesAfterTarget) {
          await ctx.db.delete(msg._id);
        }

        if (targetMode === 'edit') {
          // Update the edited message with new content
          const editMessage = allMessages[targetMessageIndex];
          if (editMessage) {
            await ctx.db.patch(editMessage._id, {
              parts: userMessage.parts,
              updatedAt: Date.now(),
            });
          }
        }
      }

      const newAssistantMessage_edit_or_retry = {
        messageId: originalAssistantMessageId, // Reuse the original assistant message ID
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
        parts: [],
        role: 'assistant' as const,
      };

      const assistantMessageConvexId = await ctx.db.insert('messages', {
        threadId: threadId as Id<'threads'>,
        ...newAssistantMessage_edit_or_retry,
      });

      return {
        threadId: threadId as Id<'threads'>,
        userMessageId: targetFromMessageId,
        assistantMessageId: originalAssistantMessageId, // Return the reused ID
        assistantMessageConvexId,
      };
    }

    const userMessageId_existing = userMessage.messageId || nanoid();
    const newUserMessage_existing = {
      messageId: userMessageId_existing,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {},
      parts: userMessage.parts,
      role: userMessage.role,
    };
    const newAssistantMessage_existing = {
      messageId: proposedNewAssistantId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {},
      parts: [],
      role: 'assistant' as const,
    };

    await ctx.db.insert('messages', {
      threadId: threadId as Id<'threads'>,
      ...newUserMessage_existing,
    });
    const assistantMessageConvexId = await ctx.db.insert('messages', {
      threadId: threadId as Id<'threads'>,
      ...newAssistantMessage_existing,
    });

    return {
      threadId: threadId as Id<'threads'>,
      userMessageId: userMessageId_existing,
      assistantMessageId: proposedNewAssistantId,
      assistantMessageConvexId,
    };
  },
});

// New query to fetch all messages for a thread (public)
export const getThreadMessages = internalQuery({
  args: { threadId: v.id('threads') },
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query('messages')
      .withIndex('byThreadId', q => q.eq('threadId', threadId))
      .collect();
  },
});

// Paginated search query for command palette and search
export const searchUserThreads = query({
  args: {
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async ({ db, auth }, { query, paginationOpts }) => {
    const user = await getUserIdentity({ db, auth });

    if ('error' in user) {
      return {
        page: [],
        isDone: true,
        continueCursor: '',
      };
    }

    if (!query.trim()) {
      // If no search query, return recent threads with pagination
      return await db
        .query('threads')
        .withIndex('byAuthor', q => q.eq('authorId', user.id))
        .order('desc')
        .paginate(paginationOpts);
    }

    // Use search index for text search
    return await db
      .query('threads')
      .withSearchIndex('search_title', q => q.search('title', query.trim()).eq('authorId', user.id))
      .paginate(paginationOpts);
  },
});

const isEmpty = <A extends GenericTableInfo, B extends FieldPaths<A>>(
  q: FilterBuilder<A>,
  field: B
) =>
  q.or(
    q.eq(q.field(field), undefined),
    q.eq(q.field(field), null)
    // etc
  );

export const getUserThreadsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    includeInFolder: v.optional(v.boolean()),
  },
  handler: async ({ db, auth }, { paginationOpts, includeInFolder }) => {
    const user = await getUserIdentity({ db, auth });

    if ('error' in user) {
      // Return empty pagination result instead of error object
      return {
        page: [],
        isDone: true,
        continueCursor: '',
      };
    }

    // For the first page, include pinned threads at the top
    const isFirstPage = !paginationOpts.cursor;

    if (isFirstPage) {
      const pinnedQuery = db
        .query('threads')
        .withIndex('byAuthor', q => q.eq('authorId', user.id))
        .filter(q => q.eq(q.field('pinned'), true))
        .order('desc');

      const regularQuery = db
        .query('threads')
        .withIndex('byAuthor', q => q.eq('authorId', user.id))
        .filter(q => q.neq(q.field('pinned'), true))
        .order('desc');

      const [pinnedThreads, regularThreadsResult] = await Promise.all([
        !includeInFolder
          ? pinnedQuery.filter(q => isEmpty(q, 'projectId')).collect()
          : pinnedQuery.collect(),
        !includeInFolder
          ? regularQuery.filter(q => isEmpty(q, 'projectId')).paginate(paginationOpts)
          : regularQuery.paginate(paginationOpts),
      ]);

      const combinedPage = [...pinnedThreads, ...regularThreadsResult.page];
      const maxItems = paginationOpts.numItems;

      if (combinedPage.length > maxItems) {
        return {
          page: combinedPage.slice(0, maxItems),
          isDone: false,
          continueCursor: regularThreadsResult.continueCursor,
        };
      }

      return {
        page: combinedPage,
        isDone: regularThreadsResult.isDone,
        continueCursor: regularThreadsResult.continueCursor,
      };
    }

    const baseQuery = db
      .query('threads')
      .withIndex('byAuthor', q => q.eq('authorId', user.id))
      .filter(q => q.neq(q.field('pinned'), true));

    if (!includeInFolder) {
      return await baseQuery
        .filter(q => isEmpty(q, 'projectId'))
        .order('desc')
        .paginate(paginationOpts);
    }
    return await baseQuery.order('desc').paginate(paginationOpts);
  },
});

// Public version of getThreadById
export const getThread = query({
  args: { threadId: v.id('threads') },
  handler: async ({ db, auth }, { threadId }) => {
    const user = await getUserIdentity({ db, auth });

    if ('error' in user) return null;

    const thread = await db.get(threadId);
    if (!thread || thread.authorId !== user.id) return null;

    return thread;
  },
});

export const updateThreadStreamingState = internalMutation({
  args: {
    threadId: v.id('threads'),
    isLive: v.boolean(),
    streamStartedAt: v.optional(v.number()),
    currentStreamId: v.optional(v.string()),
  },
  handler: async ({ db }, { threadId, isLive, streamStartedAt, currentStreamId }) => {
    const thread = await db.get(threadId);
    if (!thread) {
      console.error('[cvx][updateThreadStreamingState] Thread not found', threadId);
      return;
    }

    await db.patch(threadId, {
      isLive,
      streamStartedAt: isLive ? streamStartedAt : undefined,
      currentStreamId: isLive ? currentStreamId : undefined,
      updatedAt: Date.now(),
    });
  },
});

export const updateThreadName = internalMutation({
  args: {
    threadId: v.id('threads'),
    name: v.string(),
  },
  handler: async ({ db }, { threadId, name }) => {
    await db.patch(threadId, {
      title: name,
    });
  },
});

// Internal mutations for shared thread operations
export const createSharedThread = internalMutation({
  args: {
    originalThreadId: v.id('threads'),
    authorId: v.string(),
    title: v.string(),
    messages: v.array(v.any()),
    includeAttachments: v.boolean(),
  },
  handler: async ({ db }, { originalThreadId, authorId, title, messages, includeAttachments }) => {
    const sharedThreadId = await db.insert('sharedThreads', {
      originalThreadId,
      authorId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages,
      includeAttachments,
    });
    return { sharedThreadId };
  },
});

export const getSharedThread = query({
  args: { sharedThreadId: v.id('sharedThreads') },
  handler: async ({ db }, { sharedThreadId }) => {
    const sharedThread = await db.get(sharedThreadId);
    if (!sharedThread) return null;
    return sharedThread;
  },
});

// Shared Thread Functions
export const shareThread = action({
  args: {
    clerkId: v.string(),
    threadId: v.id('threads'),
    includeAttachments: v.optional(v.boolean()),
  },
  handler: async (ctx, { clerkId, threadId, includeAttachments = false }) => {
    // Actions can't access db, so we need to run a query to get the user.
    // We will assume that an internal query to get user by clerk ID exists.
    const user = await ctx.runQuery(internal.lib.identity.internalGetUserByClerkId, {
      clerkId,
    });

    if (!user) return { error: 'Unauthorized' };

    // Get the original thread
    const thread: Infer<typeof Thread> | null = await ctx.runQuery(internal.threads.getThreadById, {
      threadId,
    });
    if (!thread || thread.authorId !== user._id) {
      return { error: 'Unauthorized' };
    }

    // Get all messages for the thread
    const messages: Infer<typeof Message>[] = await ctx.runQuery(
      internal.threads.getThreadMessages,
      { threadId }
    );

    // Convert messages to AIMessage format for shared thread
    const aiMessages = messages.map(msg => ({
      messageId: msg.messageId,
      role: msg.role,
      parts: msg.parts,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      metadata: msg.metadata,
    }));

    aiMessages.reverse();

    // Create shared thread
    const result: {
      sharedThreadId: Id<'sharedThreads'>;
    } = await ctx.runMutation(internal.threads.createSharedThread, {
      originalThreadId: threadId,
      authorId: user._id,
      title: thread.title,
      messages: aiMessages,
      includeAttachments,
    });

    return result;
  },
});

export const togglePinThread = mutation({
  args: { threadId: v.id('threads') },
  handler: async (ctx, { threadId }) => {
    const user = await getUserIdentity(ctx);

    if ('error' in user) return { error: user.error };

    const thread = await ctx.db.get(threadId);
    if (!thread || thread.authorId !== user.id) return { error: 'Unauthorized' };

    await ctx.db.patch(threadId, {
      pinned: !thread.pinned,
    });

    return { pinned: !thread.pinned };
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id('threads') },
  handler: async (ctx, { threadId }) => {
    const user = await getUserIdentity(ctx);

    if ('error' in user) return { error: user.error };

    const thread = await ctx.db.get(threadId);
    if (!thread || thread.authorId !== user.id) return { error: 'Unauthorized' };

    // Thread count will be automatically updated by aggregate triggers

    await ctx.db.delete(threadId);
    // await aggregrateThreadsByFolder.delete(ctx, thread);
  },
});

export const renameThread = mutation({
  args: {
    threadId: v.id('threads'),
    title: v.string(),
  },
  handler: async (ctx, { threadId, title }) => {
    const user = await getUserIdentity(ctx);

    if ('error' in user) return { error: user.error };

    const thread = await ctx.db.get(threadId);
    if (!thread || thread.authorId !== user.id) return { error: 'Unauthorized' };

    // Validate title is not empty and reasonable length
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return { error: 'Title cannot be empty' };
    if (trimmedTitle.length > 100) return { error: 'Title too long' };

    await ctx.db.patch(threadId, {
      title: trimmedTitle,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
