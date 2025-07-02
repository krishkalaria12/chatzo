import { action, mutation, query } from '../_generated/server';
import { ConvexError, v } from 'convex/values';
import { getUserIdFromClerkId } from './middleware';
import { api } from '../_generated/api';

// Define message type for better typing
interface ProcessedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Helper function to get user by clerkId - now using middleware
 */
const getUserByClerkId = async (ctx: any, clerkId: string) => {
  const userId = await getUserIdFromClerkId(ctx, clerkId);
  if (!userId) {
    throw new ConvexError('User not found');
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError('User not found');
  }

  return user;
};

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
 * Intelligent context compression for long conversations
 */
export const compressConversationContext = action({
  args: {
    threadId: v.id('threads'),
    newMessages: v.array(v.any()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ProcessedMessage[]> => {
    const { threadId, newMessages, maxTokens = 4000 } = args;

    try {
      // Get existing messages from database
      const existingMessages: any[] = await ctx.runQuery(
        api.services.chat_service.getThreadMessagesInternal,
        {
          threadId,
          limit: 100, // Get more messages for compression
        }
      );

      // Helper function to extract text content from complex message content
      const extractTextContent = (content: any): string => {
        if (typeof content === 'string') {
          return content;
        }

        // Handle array of content parts (mixed text and images)
        if (Array.isArray(content)) {
          return content
            .map((part: any) => {
              if (typeof part === 'string') return part;
              if (part.type === 'text') return part.text;
              if (part.type === 'image') return `[Image: ${part.alt || part.url}]`;
              if (part.type === 'file') return `[File: ${part.fileName}]`;
              return String(part);
            })
            .filter(Boolean) // Remove empty strings
            .join(' ');
        }

        // Handle single content object
        if (typeof content === 'object' && content.type) {
          switch (content.type) {
            case 'text':
              return content.text;
            case 'image':
              return `[Image: ${content.alt || content.url}]`;
            case 'file':
              return `[File: ${content.fileName}]`;
            default:
              return String(content);
          }
        }

        return String(content);
      };

      // Combine existing + new messages
      const allMessages: ProcessedMessage[] = [
        ...existingMessages.map(
          (msg: any): ProcessedMessage => ({
            role: msg.role,
            content: extractTextContent(msg.content),
          })
        ),
        ...newMessages.map(
          (msg: any): ProcessedMessage => ({
            role: msg.role,
            content: extractTextContent(msg.content),
          })
        ),
      ];

      // If conversation is short, return as-is
      if (allMessages.length <= 10) {
        return allMessages;
      }

      // Estimate tokens (rough: 4 chars per token)
      const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

      // Always preserve system messages and recent messages
      const systemMessages = allMessages.filter((m: ProcessedMessage) => m.role === 'system');
      const conversationMessages = allMessages.filter((m: ProcessedMessage) => m.role !== 'system');
      const recentMessages = conversationMessages.slice(-6); // Last 6 messages

      let compressed: ProcessedMessage[] = [...systemMessages, ...recentMessages];
      let totalTokens = compressed.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

      // Add older messages if they fit
      const olderMessages = conversationMessages.slice(0, -6);
      for (let i = olderMessages.length - 1; i >= 0; i--) {
        const msg = olderMessages[i];
        const msgTokens = estimateTokens(msg.content);

        if (totalTokens + msgTokens <= maxTokens * 0.8) {
          // Leave 20% buffer
          compressed.splice(-6, 0, msg); // Insert before recent messages
          totalTokens += msgTokens;
        } else {
          break;
        }
      }

      // If we removed many messages, create a summary
      if (allMessages.length - compressed.length > 8) {
        try {
          const { generateText } = await import('ai');
          const { google } = await import('@ai-sdk/google');

          const summaryContent = olderMessages
            .slice(0, 10)
            .map((m: ProcessedMessage) => `${m.role}: ${m.content.slice(0, 100)}...`)
            .join('\n');

          const { text } = await generateText({
            model: google('gemini-2.0-flash-exp'),
            prompt: `Summarize this conversation context in 2-3 sentences to preserve important details:\n\n${summaryContent}`,
            maxTokens: 100,
            temperature: 0.3,
          });

          const summaryMessage: ProcessedMessage = {
            role: 'system',
            content: `[Previous conversation summary: ${text}]`,
          };

          return [
            summaryMessage,
            ...compressed.filter((m: ProcessedMessage) => m.role !== 'system'),
          ];
        } catch (error) {
          console.error('Summary generation failed:', error);
          // Fallback to simple summary
          const summaryMessage: ProcessedMessage = {
            role: 'system',
            content: `[Previous conversation with ${allMessages.length - compressed.length} earlier messages omitted for context length]`,
          };

          return [
            summaryMessage,
            ...compressed.filter((m: ProcessedMessage) => m.role !== 'system'),
          ];
        }
      }

      return compressed;
    } catch (error) {
      console.error('Context compression error:', error);
      // Fallback: return recent messages only
      return newMessages.slice(-5).map(
        (msg: any): ProcessedMessage => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : String(msg.content),
        })
      );
    }
  },
});

/**
 * Generate title for a chat thread - with multimodal support (Cloudinary URLs only)
 */
export const generateThreadTitle = action({
  args: {
    messages: v.array(v.any()), // Accept full message objects (can include images)
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

      // Use generateText with multimodal support
      const { text } = await generateText({
        model,
        system: TITLE_GENERATION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: messages,
          },
        ],
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
    content: v.any(),
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
 * Track usage event
 */
export const trackUsage = mutation({
  args: {
    userId: v.id('users'), // Now using convex user ID
    threadId: v.optional(v.id('threads')),
    messageId: v.optional(v.string()),
    modelId: v.string(),
    modelName: v.optional(v.string()),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    duration: v.optional(v.number()),
    status: v.union(
      v.literal('success'),
      v.literal('error'),
      v.literal('timeout'),
      v.literal('cancelled')
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('usageEvents', {
      ...args,
      timestamp: Date.now(),
      daysSinceEpoch: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
    });
  },
});
