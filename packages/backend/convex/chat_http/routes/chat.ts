import { httpAction } from '../../_generated/server';
import { api } from '../../_generated/api';
import {
  getUserIdFromClerkId,
  parseRequestBody,
  createErrorResponse,
  createSuccessResponse,
} from '../../services/middleware';
import { ConvexError } from 'convex/values';

/**
 * POST /api/chat/completions
 * AI chat completion endpoint with streaming and parallel title generation
 */
export const completions = httpAction(async (ctx, request) => {
  try {
    const body = await parseRequestBody(request);
    const {
      clerkId,
      messages,
      model = 'gemini-2.5-flash',
      temperature = 0.7,
      max_tokens,
      thread_id,
      generate_title = true,
    } = body;

    // Get internal userId from clerkId
    if (!clerkId) {
      return createErrorResponse('clerkId is required', 400);
    }

    const userId = await getUserIdFromClerkId(ctx, clerkId);
    if (!userId) {
      return createErrorResponse('Invalid clerkId or user not found', 401);
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return createErrorResponse('Messages array is required and cannot be empty', 400);
    }

    // Convert to AI SDK format
    const aiMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    let currentThreadId = thread_id;
    let isNewThread = false;

    // Create thread if none provided
    if (!currentThreadId) {
      const newThread = await ctx.runMutation(api.services.chat_service.createOrGetThread, {
        userId,
        title: 'New Chat',
        settings: {
          modelId: model,
          temperature,
          maxTokens: max_tokens,
        },
      });
      currentThreadId = newThread.id;
      isNewThread = true;
    }

    // Use AI SDK directly for proper streaming
    const { streamText } = await import('ai');
    const { getModelById } = await import('../../config/models');

    const modelConfig = getModelById(model);
    if (!modelConfig) {
      return createErrorResponse(`Unknown model: ${model}`, 400);
    }

    let aiModel;
    if (modelConfig.provider === 'google') {
      const { google } = await import('@ai-sdk/google');
      aiModel = google(modelConfig.id);
    } else if (modelConfig.provider === 'mistral') {
      const { mistral } = await import('@ai-sdk/mistral');
      aiModel = mistral(modelConfig.id);
    } else {
      return createErrorResponse(`Unsupported model provider: ${modelConfig.provider}`, 400);
    }

    // Get existing messages from thread for context
    let contextMessages = aiMessages;
    if (currentThreadId && !isNewThread) {
      try {
        const existingMessages = await ctx.runQuery(api.services.chat_service.getThreadMessages, {
          threadId: currentThreadId,
          userId,
          limit: 20,
          offset: 0,
        });

        // Combine existing + new messages
        const allMessages = [
          ...existingMessages.map((msg: any) => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : String(msg.content),
          })),
          ...aiMessages,
        ];

        contextMessages = allMessages;
      } catch (error) {
        console.warn('Failed to get context messages:', error);
        // Continue with just the new messages
      }
    }

    const result = await streamText({
      model: aiModel,
      messages: contextMessages,
      temperature: temperature ?? modelConfig.temperature,
      maxTokens: max_tokens ?? modelConfig.maxTokens,
      onFinish: async completion => {
        // Save messages in background
        if (currentThreadId) {
          try {
            await Promise.all([
              // Save user message
              ctx.runMutation(api.services.chat_service.saveMessage, {
                threadId: currentThreadId,
                messageId: crypto.randomUUID(),
                role: 'user',
                content: messages[messages.length - 1]?.content || '',
                metadata: {},
              }),
              // Save assistant message
              ctx.runMutation(api.services.chat_service.saveMessage, {
                threadId: currentThreadId,
                messageId: completion.response.id || crypto.randomUUID(),
                role: 'assistant',
                content: completion.text,
                metadata: {
                  modelId: model,
                  modelName: completion.response.modelId,
                  promptTokens: completion.usage.promptTokens,
                  completionTokens: completion.usage.completionTokens,
                },
              }),
              // Update thread activity
              ctx.runMutation(api.services.chat_service.updateThreadActivity, {
                threadId: currentThreadId,
              }),
            ]);
          } catch (dbError) {
            console.error('Database save error:', dbError);
          }
        }

        // Generate title in background for new threads
        if (isNewThread && messages.length >= 1) {
          const messageTexts = messages
            .map((msg: any) =>
              typeof msg.content === 'string' ? msg.content : String(msg.content)
            )
            .filter(text => text.trim().length > 0);

          if (messageTexts.length > 0) {
            ctx
              .runAction(api.services.chat_service.generateThreadTitle, {
                messages: messageTexts,
                modelId: 'gemini-2.5-flash',
              })
              .then((titleResult: any) =>
                ctx.runMutation(api.services.chat_service.updateThreadTitle, {
                  threadId: currentThreadId,
                  title: titleResult.title,
                  category: titleResult.category,
                })
              )
              .catch((error: any) => {
                console.error('Title generation failed:', error);
              });
          }
        }
      },
    });

    // Return proper AI SDK streaming response
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'none',
        'X-Thread-ID': currentThreadId,
        'X-Is-New-Thread': isNewThread.toString(),
      },
    });
  } catch (error) {
    console.error('Chat completion error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});

/**
 * POST /api/chat/generate-title
 * Generate AI-powered conversation titles
 */
export const generateTitle = httpAction(async (ctx, request) => {
  try {
    const body = await parseRequestBody(request);
    const { clerkId, messages, model = 'gemini-2.5-flash', thread_id } = body;

    // Get internal userId from clerkId
    if (!clerkId) {
      return createErrorResponse('clerkId is required', 400);
    }

    const userId = await getUserIdFromClerkId(ctx, clerkId);
    if (!userId) {
      return createErrorResponse('Invalid clerkId or user not found', 401);
    }

    if (!messages || !Array.isArray(messages)) {
      return createErrorResponse('Messages array is required', 400);
    }

    // Extract text content from messages
    const messageTexts = messages
      .map((msg: any) =>
        typeof msg.content === 'string'
          ? msg.content
          : msg.content?.type === 'text'
            ? msg.content.text
            : String(msg.content || '')
      )
      .filter(text => text.trim().length > 0)
      .slice(0, 10);

    if (messageTexts.length === 0) {
      return createErrorResponse('No valid message content found', 400);
    }

    const result = await ctx.runAction(api.services.chat_service.generateThreadTitle, {
      messages: messageTexts,
      modelId: model,
    });

    // Update thread title if thread_id provided
    if (thread_id) {
      await ctx.runMutation(api.services.chat_service.updateThreadTitle, {
        threadId: thread_id,
        title: result.title,
        category: result.category,
      });
    }

    return createSuccessResponse({
      title: result.title,
      category: result.category,
      confidence: result.confidence,
      generatedAt: new Date().toISOString(),
      ...(thread_id && { threadId: thread_id }),
    });
  } catch (error) {
    console.error('Title generation error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to generate title',
      500
    );
  }
});

/**
 * POST /api/chat/threads
 * Create a new conversation thread
 */
export const createThread = httpAction(async (ctx, request) => {
  try {
    const body = await parseRequestBody(request);
    const { clerkId, title = 'New Chat', description, settings } = body;

    // Get internal userId from clerkId
    if (!clerkId) {
      return createErrorResponse('clerkId is required', 400);
    }

    const userId = await getUserIdFromClerkId(ctx, clerkId);
    if (!userId) {
      return createErrorResponse('Invalid clerkId or user not found', 401);
    }

    const thread = await ctx.runMutation(api.services.chat_service.createOrGetThread, {
      userId,
      title: title.trim(),
      settings: {
        modelId: settings?.modelId || 'gemini-2.5-flash',
        temperature: settings?.temperature ?? 0.7,
        maxTokens: settings?.maxTokens ?? 1000,
        systemPrompt: settings?.systemPrompt,
      },
    });

    return createSuccessResponse(thread);
  } catch (error) {
    console.error('Thread creation error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create thread',
      500
    );
  }
});

/**
 * GET /api/chat/threads
 * List conversation threads for the authenticated user
 */
export const getThreads = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const clerkId = url.searchParams.get('clerkId');

    // Get internal userId from clerkId
    if (!clerkId) {
      return createErrorResponse('clerkId parameter is required', 400);
    }

    const userId = await getUserIdFromClerkId(ctx, clerkId);
    if (!userId) {
      return createErrorResponse('Invalid clerkId or user not found', 401);
    }

    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const archived = url.searchParams.get('archived') === 'true';

    const threads = await ctx.runQuery(api.services.chat_service.getUserThreads, {
      userId,
      limit,
      offset,
      archived,
    });

    return createSuccessResponse({
      threads,
      pagination: {
        limit,
        offset,
        hasMore: threads.length === limit,
      },
    });
  } catch (error) {
    console.error('Get threads error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch threads',
      500
    );
  }
});

/**
 * GET /api/chat/threads/:threadId/messages
 * Get messages from a specific conversation thread
 */
export const getMessages = httpAction(async (ctx, request) => {
  try {
    const url = new URL(request.url);
    const clerkId = url.searchParams.get('clerkId');
    const threadId = url.pathname.split('/')[4];

    // Get internal userId from clerkId
    if (!clerkId) {
      return createErrorResponse('clerkId parameter is required', 400);
    }

    const userId = await getUserIdFromClerkId(ctx, clerkId);
    if (!userId) {
      return createErrorResponse('Invalid clerkId or user not found', 401);
    }

    if (!threadId) {
      return createErrorResponse('Thread ID is required', 400);
    }

    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    const messages = await ctx.runQuery(api.services.chat_service.getThreadMessages, {
      threadId: threadId as any,
      userId,
      limit,
      offset,
    });

    return createSuccessResponse({
      messages: messages.map((msg: any) => ({
        id: msg.messageId,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      })),
      pagination: {
        limit,
        offset,
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);

    if (error instanceof ConvexError && error.message.includes('access denied')) {
      return createErrorResponse('Thread not found or access denied', 404);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch messages',
      500
    );
  }
});
