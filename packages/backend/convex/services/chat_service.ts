import { action, mutation, query } from '../_generated/server';
import { ConvexError, v } from 'convex/values';
import { HTTPAIMessage } from '../schemas';
import { api } from '../_generated/api';

/**
 * Chat completion service - handles AI model interactions using Vercel AI SDK
 */
export const completeChatStream = action({
  args: {
    messages: v.array(HTTPAIMessage),
    modelId: v.string(),
    threadId: v.optional(v.id('threads')),
    userId: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { messages, modelId, threadId, userId, temperature, maxTokens } = args;

    try {
      // Dynamic import of AI SDK
      const { streamText } = await import('ai');
      const { getModelById } = await import('../config/models');

      // Get model configuration
      const modelConfig = getModelById(modelId);
      if (!modelConfig) {
        throw new ConvexError(`Unknown model: ${modelId}`);
      }

      // Import the appropriate provider
      let model;
      if (modelConfig.provider === 'google') {
        const { google } = await import('@ai-sdk/google');
        model = google(modelConfig.id);
      } else if (modelConfig.provider === 'mistral') {
        const { mistral } = await import('@ai-sdk/mistral');
        model = mistral(modelConfig.id);
      } else {
        throw new ConvexError(`Unsupported model provider: ${modelConfig.provider as string}`);
      }

      // Convert messages to AI SDK format
      const aiMessages = messages.map(msg => ({
        role: msg.role,
        content:
          typeof msg.content === 'string'
            ? msg.content
            : msg.content?.type === 'text'
              ? msg.content.text
              : String(msg.content),
      }));

      const startTime = Date.now();

      // Always use streaming
      const result = await streamText({
        model,
        messages: aiMessages,
        temperature: temperature ?? modelConfig.temperature,
        maxTokens: maxTokens ?? modelConfig.maxTokens,
        onFinish: async completion => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Save messages and track usage in background
          if (threadId) {
            try {
              await Promise.all([
                // Save user message
                ctx.runMutation(api.services.chat_service.saveMessage, {
                  threadId,
                  messageId:
                    messages.find(m => m.role === 'user')?.messageId || crypto.randomUUID(),
                  role: 'user',
                  content: messages.find(m => m.role === 'user')?.content || '',
                  metadata: {},
                }),
                // Save assistant message
                ctx.runMutation(api.services.chat_service.saveMessage, {
                  threadId,
                  messageId: completion.response.id || crypto.randomUUID(),
                  role: 'assistant',
                  content: completion.text,
                  metadata: {
                    modelId,
                    modelName: completion.response.modelId,
                    promptTokens: completion.usage.promptTokens,
                    completionTokens: completion.usage.completionTokens,
                    serverDurationMs: duration,
                    temperature: temperature ?? modelConfig.temperature,
                    maxTokens: maxTokens ?? modelConfig.maxTokens,
                  },
                }),
                // Update thread activity
                ctx.runMutation(api.services.chat_service.updateThreadActivity, {
                  threadId,
                }),
                // Track usage
                ctx.runMutation(api.services.chat_service.trackUsage, {
                  userId,
                  threadId,
                  messageId: completion.response.id || crypto.randomUUID(),
                  modelId,
                  modelName: completion.response.modelId,
                  promptTokens: completion.usage.promptTokens,
                  completionTokens: completion.usage.completionTokens,
                  totalTokens: completion.usage.totalTokens,
                  cost: 0, // Calculate based on model pricing
                  duration,
                  status: 'success',
                }),
              ]);
            } catch (dbError) {
              console.error('Database save error:', dbError);
              // Don't fail the completion if DB save fails
            }
          }
        },
        onError: async error => {
          // Track failed usage
          if (threadId) {
            try {
              await ctx.runMutation(api.services.chat_service.trackUsage, {
                userId,
                threadId,
                modelId,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                status: 'error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              });
            } catch (dbError) {
              console.error('Failed to track error usage:', dbError);
            }
          }
        },
      });

      return {
        stream: result.toTextStreamResponse(),
        messageId: crypto.randomUUID(),
      };
    } catch (error) {
      console.error('Chat completion error:', error);
      throw new ConvexError(
        `Chat completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

/**
 * Generate title for a chat thread using AI SDK structured data
 */
export const generateThreadTitle = action({
  args: {
    messages: v.array(v.string()),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { messages, modelId = 'gemini-2.5-flash' } = args;

    try {
      const { generateObject } = await import('ai');
      const { z } = await import('zod');
      const { getModelById } = await import('../config/models');

      const modelConfig = getModelById(modelId);
      if (!modelConfig) {
        throw new ConvexError(`Unknown model: ${modelId}`);
      }

      let model;
      if (modelConfig.provider === 'google') {
        const { google } = await import('@ai-sdk/google');
        model = google(modelConfig.id);
      } else if (modelConfig.provider === 'mistral') {
        const { mistral } = await import('@ai-sdk/mistral');
        model = mistral(modelConfig.id);
      } else {
        throw new ConvexError(`Unsupported model provider: ${modelConfig.provider as string}`);
      }

      // Simple fallback for title generation since title_prompts file was deleted
      const prompt = `Generate a concise, descriptive title (2-6 words) for this conversation:\n\n${messages
        .slice(0, 3)
        .map((msg, i) => `Message ${i + 1}: ${msg}`)
        .join('\n')}`;

      const result = await generateObject({
        model,
        schema: z.object({
          title: z
            .string()
            .describe('A concise, descriptive title for the conversation (2-6 words)'),
          category: z
            .enum([
              'technical-help',
              'code-review',
              'architecture',
              'debugging',
              'learning',
              'planning',
              'general',
              'brainstorming',
            ])
            .optional(),
          confidence: z.number().min(0).max(1).optional(),
        }),
        prompt,
        temperature: 0.3,
      });

      return {
        title: result.object.title,
        category: result.object.category || 'general',
        confidence: result.object.confidence || 0.8,
      };
    } catch (error) {
      console.error('Title generation error:', error);

      // Simple fallback title generation
      const topics = ['Chat', 'Discussion', 'Conversation', 'Question', 'Help'];
      return {
        title: topics[Math.floor(Math.random() * topics.length)],
        category: 'general' as const,
        confidence: 0.5,
      };
    }
  },
});

/**
 * Create a new thread or get existing one
 */
export const createOrGetThread = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
    settings: v.optional(
      v.object({
        modelId: v.optional(v.string()),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        systemPrompt: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId, title = 'New Chat', settings } = args;

    const now = Date.now();
    const threadId = await ctx.db.insert('threads', {
      userId,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      settings: {
        modelId: settings?.modelId || 'gemini-2.5-flash',
        temperature: settings?.temperature ?? 0.7,
        maxTokens: settings?.maxTokens ?? 1000,
        systemPrompt: settings?.systemPrompt,
      },
    });

    return {
      id: threadId,
      userId,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      settings,
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
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { threadId, title, category } = args;

    await ctx.db.patch(threadId, {
      title,
      updatedAt: Date.now(),
      ...(category && { tags: [category] }),
    });

    return { threadId, title, category };
  },
});

/**
 * Get threads for a user
 */
export const getUserThreads = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, limit = 20, offset = 0, archived = false } = args;

    let query = ctx.db
      .query('threads')
      .withIndex('by_user_updated', (q: any) => q.eq('userId', userId))
      .order('desc');

    if (archived !== undefined) {
      query = query.filter((q: any) => q.eq(q.field('isArchived'), archived));
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
    userId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { threadId, userId, limit = 50, offset = 0 } = args;

    // Verify user has access to this thread
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) {
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
    messageId: v.string(),
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
    userId: v.string(),
    threadId: v.optional(v.id('threads')),
    messageId: v.optional(v.string()),
    modelId: v.string(),
    modelName: v.optional(v.string()),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    cost: v.optional(v.number()),
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

/**
 * Intelligent context compression for long conversations
 */
const compressConversationContext = async (
  ctx: any,
  threadId: string,
  newMessages: any[],
  maxTokens: number = 4000
) => {
  try {
    // Get existing messages from database
    const existingMessages = await ctx.db
      .query('messages')
      .withIndex('by_thread_created', (q: any) => q.eq('threadId', threadId))
      .order('asc')
      .collect();

    // Combine existing + new messages
    const allMessages = [
      ...existingMessages.map((msg: any) => ({
        role: msg.role,
        content:
          typeof msg.content === 'string' ? msg.content : msg.content?.text || String(msg.content),
      })),
      ...newMessages.map((msg: any) => ({
        role: msg.role,
        content:
          typeof msg.content === 'string' ? msg.content : msg.content?.text || String(msg.content),
      })),
    ];

    // If conversation is short, return as-is
    if (allMessages.length <= 10) {
      return allMessages;
    }

    // Estimate tokens (rough: 4 chars per token)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    // Always preserve system messages and recent messages
    const systemMessages = allMessages.filter(m => m.role === 'system');
    const conversationMessages = allMessages.filter(m => m.role !== 'system');
    const recentMessages = conversationMessages.slice(-6); // Last 6 messages

    let compressed = [...systemMessages, ...recentMessages];
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
      const { generateText } = await import('ai');
      const { google } = await import('@ai-sdk/google');

      try {
        const summaryContent = olderMessages
          .slice(0, 10)
          .map(m => `${m.role}: ${m.content.slice(0, 100)}...`)
          .join('\n');

        const summary = await generateText({
          model: google('gemini-2.5-flash'),
          prompt: `Summarize this conversation context in 2-3 sentences to preserve important details:\n\n${summaryContent}`,
          maxTokens: 100,
          temperature: 0.3,
        });

        const summaryMessage = {
          role: 'system' as const,
          content: `[Previous conversation summary: ${summary.text}]`,
        };

        return [summaryMessage, ...compressed.filter(m => m.role !== 'system')];
      } catch (error) {
        console.error('Summary generation failed:', error);
        // Fallback to simple summary
        const summaryMessage = {
          role: 'system' as const,
          content: `[Previous conversation with ${allMessages.length - compressed.length} earlier messages omitted for context length]`,
        };

        return [summaryMessage, ...compressed.filter(m => m.role !== 'system')];
      }
    }

    return compressed;
  } catch (error) {
    console.error('Context compression error:', error);
    // Fallback: return recent messages only
    return newMessages.slice(-5);
  }
};

/**
 * Enhanced chat completion with automatic context management
 */
export const completeChatWithContext = action({
  args: {
    messages: v.array(HTTPAIMessage),
    modelId: v.string(),
    threadId: v.id('threads'),
    userId: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { messages, modelId, threadId, userId, temperature, maxTokens } = args;

    try {
      // Get compressed context including database history
      const compressedMessages = await compressConversationContext(
        ctx,
        threadId,
        messages,
        maxTokens || 4000
      );

      // Continue with existing chat completion logic using compressed messages
      const { streamText } = await import('ai');
      const { getModelById } = await import('../config/models');

      const modelConfig = getModelById(modelId);
      if (!modelConfig) {
        throw new ConvexError(`Unknown model: ${modelId}`);
      }

      let model;
      if (modelConfig.provider === 'google') {
        const { google } = await import('@ai-sdk/google');
        model = google(modelConfig.id);
      } else if (modelConfig.provider === 'mistral') {
        const { mistral } = await import('@ai-sdk/mistral');
        model = mistral(modelConfig.id);
      } else {
        throw new ConvexError(`Unsupported model provider: ${modelConfig.provider as string}`);
      }

      const startTime = Date.now();

      const result = await streamText({
        model,
        messages: compressedMessages,
        temperature: temperature ?? modelConfig.temperature,
        maxTokens: maxTokens ?? modelConfig.maxTokens,
        onFinish: async completion => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Save only the new user message and AI response
          try {
            await Promise.all([
              // Save new user message
              ctx.runMutation(api.services.chat_service.saveMessage, {
                threadId,
                messageId: messages.find(m => m.role === 'user')?.messageId || crypto.randomUUID(),
                role: 'user',
                content: messages.find(m => m.role === 'user')?.content || '',
                metadata: {},
              }),
              // Save assistant response
              ctx.runMutation(api.services.chat_service.saveMessage, {
                threadId,
                messageId: completion.response.id || crypto.randomUUID(),
                role: 'assistant',
                content: completion.text,
                metadata: {
                  modelId,
                  modelName: completion.response.modelId,
                  promptTokens: completion.usage.promptTokens,
                  completionTokens: completion.usage.completionTokens,
                  serverDurationMs: duration,
                  temperature: temperature ?? modelConfig.temperature,
                  maxTokens: maxTokens ?? modelConfig.maxTokens,
                  contextCompressed: compressedMessages.length < messages.length + 5, // Indicate if context was compressed
                },
              }),
              // Update thread activity
              ctx.runMutation(api.services.chat_service.updateThreadActivity, {
                threadId,
              }),
              // Track usage
              ctx.runMutation(api.services.chat_service.trackUsage, {
                userId,
                threadId,
                messageId: completion.response.id || crypto.randomUUID(),
                modelId,
                modelName: completion.response.modelId,
                promptTokens: completion.usage.promptTokens,
                completionTokens: completion.usage.completionTokens,
                totalTokens: completion.usage.totalTokens,
                cost: 0,
                duration,
                status: 'success',
              }),
            ]);
          } catch (dbError) {
            console.error('Database save error:', dbError);
          }
        },
      });

      return {
        stream: result.toTextStreamResponse(),
        messageId: crypto.randomUUID(),
        contextInfo: {
          totalMessages: compressedMessages.length,
          compressed: compressedMessages.length < messages.length + 5,
        },
      };
    } catch (error) {
      console.error('Chat completion with context error:', error);
      throw new ConvexError(
        `Chat completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
