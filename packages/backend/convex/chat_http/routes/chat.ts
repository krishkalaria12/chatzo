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
    const aiMessages = messages.map((msg: any) => {
      let content = msg.content;

      // Handle array content (multimodal)
      if (Array.isArray(content)) {
        return {
          role: msg.role,
          content: content.map((part: any) => {
            if (part.type === 'text') {
              return { type: 'text' as const, text: String(part.text) };
            }
            if (part.type === 'image') {
              const imageUrl = String(part.url);

              // Handle HTTPS URLs (Cloudinary, etc.)
              if (imageUrl.startsWith('https://')) {
                return { type: 'image' as const, image: imageUrl };
              }

              // Handle base64 data URLs (backup method)
              if (imageUrl.startsWith('data:image/')) {
                return { type: 'image' as const, image: imageUrl };
              }

              // Reject local file URIs
              if (imageUrl.startsWith('file://') || imageUrl.startsWith('content://')) {
                return {
                  type: 'text' as const,
                  text: '[Image was not uploaded to cloud storage and cannot be processed]',
                };
              }

              // Reject other unsupported formats
              return {
                type: 'text' as const,
                text: '[Unsupported image format - only HTTPS URLs or base64 are supported]',
              };
            }
            return { type: 'text' as const, text: String(part) };
          }),
        };
      }

      // Handle simple string content
      return {
        role: msg.role,
        content: String(content),
      };
    });

    let currentThreadId = thread_id;
    let isNewThread = false;

    // Create thread if none provided
    if (!currentThreadId) {
      const newThread = await ctx.runMutation(api.services.chat_service.createOrGetThread, {
        clerkId,
        title: 'New Chat',
      });
      currentThreadId = newThread.id;
      isNewThread = true;
    }

    // Use AI SDK directly for proper streaming
    const { streamText } = await import('ai');
    const { createAIModel, getModelConfig } = await import('../../providers/model_factory');
    const { getSystemPrompt } = await import('../../config/prompts');

    // Get model configuration for backward compatibility
    const modelConfig = getModelConfig(model);
    if (!modelConfig) {
      return createErrorResponse(`Unknown model: ${model}`, 400);
    }

    // Create AI model instance using the factory
    let aiModel;
    try {
      aiModel = createAIModel(model);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : `Failed to create model: ${model}`,
        400
      );
    }

    // Use intelligent context compression for existing threads
    let contextMessages = aiMessages;
    let contextCompressed = false;

    if (currentThreadId && !isNewThread) {
      try {
        // Use the intelligent compression function from chat_service
        const compressedMessages = await ctx.runAction(
          api.services.chat_service.compressConversationContext,
          {
            threadId: currentThreadId,
            newMessages: aiMessages,
            maxTokens: max_tokens || 4000,
          }
        );

        contextMessages = compressedMessages;
        contextCompressed = compressedMessages.length < aiMessages.length + 5; // Rough estimation
      } catch (error) {
        console.warn('Failed to compress context, using original messages:', error);
        // Fallback to original messages if compression fails
      }
    }

    // Start title generation in parallel for new threads (don't await)
    if (isNewThread && messages.length >= 1 && generate_title) {
      // Pass the full message objects (including images) to title generation
      const titleMessages = aiMessages;

      if (titleMessages.length > 0) {
        // Fire and forget - runs in parallel with streaming
        // Title generation uses multimodal support with gemini-2.0-flash
        ctx
          .runAction(api.services.chat_service.generateThreadTitle, {
            messages: titleMessages,
          })
          .then((titleResult: any) =>
            ctx.runMutation(api.services.chat_service.updateThreadTitle, {
              threadId: currentThreadId,
              title: titleResult.title,
            })
          )
          .catch((error: any) => {
            console.error('Title generation failed:', error);
          });
      }
    }

    const startTime = Date.now();

    // Generate system prompt using the model configuration
    const systemPrompt = getSystemPrompt(modelConfig);

    const result = await streamText({
      model: aiModel,
      system: systemPrompt,
      messages: contextMessages,
      temperature: temperature ?? modelConfig.temperature,
      maxTokens: max_tokens ?? modelConfig.maxTokens,
      onFinish: async completion => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Save messages in background
        if (currentThreadId) {
          try {
            const promises = [];

            // Save user message - MULTIMODAL
            if (messages.length > 0) {
              const userMessage = messages[messages.length - 1];
              if (userMessage) {
                let contentToSave = userMessage.content;

                // Handle case where content is an array of parts
                if (Array.isArray(contentToSave)) {
                  contentToSave = contentToSave.map(part => {
                    // Normalize image part to match schema (url property)
                    if (part.type === 'image' && part.image && !part.url) {
                      return { ...part, url: part.image };
                    }
                    return part;
                  });
                }

                promises.push(
                  ctx.runMutation(api.services.chat_service.saveMessage, {
                    threadId: currentThreadId,
                    role: 'user',
                    content: contentToSave,
                    metadata: {},
                  })
                );
              }
            }

            // Save assistant message
            promises.push(
              ctx.runMutation(api.services.chat_service.saveMessage, {
                threadId: currentThreadId,
                role: 'assistant',
                content: completion.text,
                metadata: {
                  modelId: model,
                  modelName: completion.response.modelId,
                  promptTokens: completion.usage.promptTokens,
                  completionTokens: completion.usage.completionTokens,
                  duration,
                },
              })
            );

            // Update thread activity
            promises.push(
              ctx.runMutation(api.services.chat_service.updateThreadActivity, {
                threadId: currentThreadId,
              })
            );

            // Track usage event for analytics
            promises.push(
              ctx.runMutation(api.services.chat_service.trackUsage, {
                userId: userId,
                threadId: currentThreadId,
                modelId: model,
                modelName: completion.response.modelId || model,
                promptTokens: completion.usage.promptTokens || 0,
                completionTokens: completion.usage.completionTokens || 0,
                totalTokens: completion.usage.totalTokens || 0,
                duration,
                status: 'success',
              })
            );

            await Promise.all(promises);
          } catch (dbError) {
            console.error('Database save error:', dbError);
          }
        }
      },
      onError: async error => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Track failed usage event
        if (currentThreadId) {
          try {
            await ctx.runMutation(api.services.chat_service.trackUsage, {
              userId: userId,
              threadId: currentThreadId,
              modelId: model,
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
              duration,
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
          } catch (dbError) {
            console.error('Failed to track error usage:', dbError);
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
        'X-Context-Compressed': contextCompressed.toString(),
        'X-Context-Message-Count': contextMessages.length.toString(),
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
 * Generate AI-powered conversation titles with multimodal support (uses gemini-2.0-flash)
 */
export const generateTitle = httpAction(async (ctx, request) => {
  try {
    const body = await parseRequestBody(request);
    const { clerkId, messages, thread_id } = body;

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

    // Pass full message objects (including images) to title generation
    const titleMessages = messages.slice(0, 3); // First 3 messages for context

    if (titleMessages.length === 0) {
      return createErrorResponse('No valid message content found', 400);
    }

    // Title generation uses multimodal support with gemini-2.0-flash
    const result = await ctx.runAction(api.services.chat_service.generateThreadTitle, {
      messages: titleMessages,
    });

    // Update thread title if thread_id provided
    if (thread_id) {
      await ctx.runMutation(api.services.chat_service.updateThreadTitle, {
        threadId: thread_id,
        title: result.title,
      });
    }

    return createSuccessResponse({
      title: result.title,
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
    const { clerkId, title = 'New Chat', description } = body;

    // Get internal userId from clerkId
    if (!clerkId) {
      return createErrorResponse('clerkId is required', 400);
    }

    const thread = await ctx.runMutation(api.services.chat_service.createOrGetThread, {
      clerkId,
      title: title.trim(),
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
      clerkId,
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
      clerkId,
      limit,
      offset,
    });

    return createSuccessResponse({
      messages: messages.map((msg: any) => ({
        id: msg._id,
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

/**
 * DELETE /api/chat/threads/:threadId
 * Delete a specific conversation thread and all its messages
 * Note: Usage data is preserved for analytics
 */
export const deleteThread = httpAction(async (ctx, request) => {
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

    const result = await ctx.runMutation(api.services.chat_service.deleteThread, {
      threadId: threadId as any,
      clerkId,
    });

    return createSuccessResponse({
      message: 'Thread deleted successfully',
      deletedThreadId: result.deletedThreadId,
      deletedMessagesCount: result.deletedMessagesCount,
    });
  } catch (error) {
    console.error('Delete thread error:', error);

    if (error instanceof ConvexError && error.message.includes('access denied')) {
      return createErrorResponse('Thread not found or access denied', 404);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete thread',
      500
    );
  }
});
