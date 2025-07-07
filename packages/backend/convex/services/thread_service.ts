import { action, mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { getUserByClerkId } from './user_service';
import { ConvexError } from 'convex/values';
import { api } from '../_generated/api';

/**
 * Generate title for a chat thread - with multimodal support (Cloudinary URLs only)
 */
export const generateThreadTitle = action({
  args: {
    messages: v.array(v.any()), // Accept full message objects (can include images and PDFs)
  },
  handler: async (ctx, args) => {
    const { messages } = args;

    try {
      const { generateText } = await import('ai');
      const { google } = await import('@ai-sdk/google');
      const { TITLE_GENERATION_SYSTEM_PROMPT, FALLBACK_TITLE } = await import(
        '../config/title_prompts'
      );

      // Always use gemini-2.0-flash for title generation
      const model = google('gemini-2.0-flash');

      // Convert messages to AI SDK format for title generation
      const titleMessages = messages.map((msg: any) => {
        return {
          role: msg.role,
          content: Array.isArray(msg.content)
            ? msg.content.map((part: any) => {
                if (part.type === 'text') {
                  return { type: 'text' as const, text: part.text };
                }
                if (part.type === 'image') {
                  return { type: 'image' as const, image: part.image };
                }
                if (part.type === 'file' && part.mimeType === 'application/pdf') {
                  // Convert PDF file to AI SDK format
                  return {
                    type: 'file' as const,
                    data: new URL(part.data),
                    mimeType: 'application/pdf' as const,
                  };
                }
                return part;
              })
            : msg.content,
        };
      });

      // Use generateText with multimodal support
      const { text } = await generateText({
        model,
        system: TITLE_GENERATION_SYSTEM_PROMPT,
        messages: titleMessages,
        temperature: 0.3,
        maxTokens: 20, // Very short for title generation
      });

      // Clean and validate the generated title
      const cleanTitle = text.trim().replace(/['"]/g, '');
      const wordCount = cleanTitle.split(' ').length;

      // Ensure title is within 2-6 words
      if (wordCount >= 2 && wordCount <= 6) {
        return { title: cleanTitle };
      }

      // Fallback: always use 'New Chat'
      return { title: FALLBACK_TITLE };
    } catch (error) {
      console.error('Title generation error:', error);
      // Fallback: always use 'New Chat'
      return {
        title: 'New Chat',
      };
    }
  },
});

/**
 * Create a new thread
 */
export const createOrGetThread = mutation({
  args: {
    clerkId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkId, title = 'New Chat' } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    const now = Date.now();
    const threadId = await ctx.db.insert('threads', {
      userId: user._id, // Use convex user ID instead of clerkId
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    });

    return {
      id: threadId,
      userId: user._id,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };
  },
});

/**
 * Update thread with generated title
 */
export const updateThreadTitle = mutation({
  args: {
    threadId: v.id('threads'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { threadId, title } = args;

    await ctx.db.patch(threadId, {
      title,
      updatedAt: Date.now(),
    });

    return { threadId, title };
  },
});

/**
 * Update thread title with user authorization
 */
export const updateThreadTitleWithAuth = mutation({
  args: {
    threadId: v.id('threads'),
    title: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const { threadId, title, clerkId } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    // Verify user has access to this thread
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError('Thread not found or access denied');
    }

    // Validate title length and content
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      throw new ConvexError('Title cannot be empty');
    }
    if (trimmedTitle.length > 100) {
      throw new ConvexError('Title cannot exceed 100 characters');
    }

    await ctx.db.patch(threadId, {
      title: trimmedTitle,
      updatedAt: Date.now(),
    });

    return { threadId, title: trimmedTitle };
  },
});

/**
 * Get threads for a user
 */
export const getUserThreads = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { clerkId, limit = 20, offset = 0, archived = false } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    let query = ctx.db
      .query('threads')
      .withIndex('by_user_updated', (q: any) => q.eq('userId', user._id))
      .order('desc');

    if (archived === true) {
      // Only show archived threads explicitly
      query = query.filter((q: any) => q.eq(q.field('isArchived'), true));
    } else if (archived === false) {
      // Exclude threads marked archived=true, include undefined / false
      query = query.filter((q: any) => q.neq(q.field('isArchived'), true));
    }

    const threads = await query
      .paginate({ numItems: limit, cursor: null })
      .then((result: any) => result.page.slice(offset, offset + limit));

    return threads;
  },
});

/**
 * Update thread activity
 */
export const updateThreadActivity = mutation({
  args: {
    threadId: v.id('threads'),
  },
  handler: async (ctx, args) => {
    const messageCount = await ctx.db
      .query('messages')
      .withIndex('by_thread_id', (q: any) => q.eq('threadId', args.threadId))
      .collect()
      .then((messages: any) => messages.length);

    await ctx.db.patch(args.threadId, {
      lastMessageAt: Date.now(),
      updatedAt: Date.now(),
      messageCount,
    });
  },
});

/**
 * Delete a thread and all its associated messages
 * Note: Usage data is preserved for analytics
 */
export const deleteThread = mutation({
  args: {
    threadId: v.id('threads'),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const { threadId, clerkId } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    // Verify user has access to this thread
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== user._id) {
      throw new ConvexError('Thread not found or access denied');
    }

    // Delete all messages associated with this thread
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_thread_id', (q: any) => q.eq('threadId', threadId))
      .collect();

    // Delete messages in batches for better performance
    const deletePromises = messages.map(message => ctx.db.delete(message._id));
    await Promise.all(deletePromises);

    // Delete the thread itself
    await ctx.db.delete(threadId);

    // Note: We do NOT delete usage events as they should be preserved for analytics
    // Usage events remain in the database for historical tracking

    return {
      success: true,
      deletedThreadId: threadId,
      deletedMessagesCount: messages.length,
    };
  },
});

/**
 * Search threads for a user
 */
export const searchUserThreads = query({
  args: {
    clerkId: v.string(),
    searchQuery: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    archived: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    threads: any[];
    total: number;
    hasMore: boolean;
  }> => {
    const { clerkId, searchQuery, limit = 20, offset = 0, archived = false } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    // If search query is empty, return empty results (not regular threads)
    if (!searchQuery.trim()) {
      return {
        threads: [],
        total: 0,
        hasMore: false,
      };
    }

    // Normalize search query for better matching
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const searchTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);

    // Get all threads for the user first
    let baseQuery = ctx.db
      .query('threads')
      .withIndex('by_user_updated', (q: any) => q.eq('userId', user._id))
      .order('desc');

    // Apply archived filter
    if (archived === true) {
      baseQuery = baseQuery.filter((q: any) => q.eq(q.field('isArchived'), true));
    } else if (archived === false) {
      baseQuery = baseQuery.filter((q: any) => q.neq(q.field('isArchived'), true));
    }

    // Get all threads (we'll filter in memory for complex search)
    const allThreads = await baseQuery.collect();

    // Filter threads based on search criteria
    const filteredThreads = allThreads.filter((thread: any) => {
      const title = thread.title?.toLowerCase() || '';
      const description = thread.description?.toLowerCase() || '';

      const titleMatch = title.includes(normalizedQuery);
      const descriptionMatch = description.includes(normalizedQuery);

      // Tag matching
      const tagMatch =
        thread.tags?.some((tag: string) => tag.toLowerCase().includes(normalizedQuery)) || false;

      // Multi-term search (all terms must match at least one field)
      const multiTermMatch =
        searchTerms.length > 1
          ? searchTerms.every(term => {
              return (
                title.includes(term) ||
                description.includes(term) ||
                (thread.tags?.map((tag: string) => tag.toLowerCase()).join(' ') || '').includes(
                  term
                )
              );
            })
          : false;

      const isMatch = titleMatch || descriptionMatch || tagMatch || multiTermMatch;

      return isMatch;
    });

    // Apply pagination
    const startIndex = offset;
    const endIndex = offset + limit;
    const paginatedThreads = filteredThreads.slice(startIndex, endIndex);

    return {
      threads: paginatedThreads,
      total: filteredThreads.length,
      hasMore: endIndex < filteredThreads.length,
    };
  },
});
