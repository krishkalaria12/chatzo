import { httpAction } from '../../_generated/server';
import { api } from '../../_generated/api';
import {
  getUserIdFromClerkId,
  parseRequestBody,
  createErrorResponse,
} from '../../services/middleware';
import { getToolkit, type AbilityId } from '../../lib/toolkit';

/**
 * POST /api/chat/completions
 * AI chat completion endpoint with streaming, tool calling, and parallel title generation
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
      enabledTools = [], // New parameter for enabled tools
      maxSteps = 5, // Allow multi-step tool calling
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
            if (part.type === 'file' && part.mimeType === 'application/pdf') {
              const fileUrl = String(part.url);

              // Handle HTTPS URLs (Cloudinary, etc.)
              if (fileUrl.startsWith('https://')) {
                return {
                  type: 'file' as const,
                  data: new URL(fileUrl),
                  mimeType: 'application/pdf',
                };
              }

              // Reject local file URIs
              if (fileUrl.startsWith('file://') || fileUrl.startsWith('content://')) {
                return {
                  type: 'text' as const,
                  text: '[PDF was not uploaded to cloud storage and cannot be processed]',
                };
              }

              // Reject other unsupported formats
              return {
                type: 'text' as const,
                text: '[Unsupported PDF format - only HTTPS URLs are supported]',
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
      const newThread = await ctx.runMutation(api.services.thread_service.createOrGetThread, {
        clerkId,
        title: 'New Chat',
      });
      currentThreadId = newThread.id;
      isNewThread = true;
    }

    // Use AI SDK directly for proper streaming
    const { streamText } = await import('ai');
    const { createAIModel, getModelConfig } = await import('../../config/models');
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

    // Get tools if enabled
    const tools = enabledTools.length > 0 ? await getToolkit(ctx, enabledTools as AbilityId[]) : {};

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
      // Convert messages to Convex-compatible format for title generation
      const titleMessages = aiMessages.map((msg: any) => {
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
                if (part.type === 'file' && part.data) {
                  // Convert URL object back to string for Convex compatibility
                  return {
                    type: 'file' as const,
                    data: part.data.toString(),
                    mimeType: part.mimeType,
                  };
                }
                return part;
              })
            : msg.content,
        };
      });

      if (titleMessages.length > 0) {
        // Fire and forget - runs in parallel with streaming
        // Title generation uses multimodal support with gemini-2.0-flash
        ctx
          .runAction(api.services.thread_service.generateThreadTitle, {
            messages: titleMessages,
          })
          .then((titleResult: any) =>
            ctx.runMutation(api.services.thread_service.updateThreadTitle, {
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
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      toolChoice: enabledTools.length > 0 ? 'auto' : undefined,
      maxSteps: maxSteps,
      temperature: temperature,
      maxTokens: max_tokens,
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
                    // Normalize file part to match schema (url property)
                    if (part.type === 'file' && part.data && !part.url) {
                      return { ...part, url: part.data.toString() };
                    }
                    return part;
                  });
                }

                promises.push(
                  ctx.runMutation(api.services.message_service.saveMessage, {
                    threadId: currentThreadId,
                    role: 'user',
                    content: contentToSave,
                    metadata: {
                      toolsEnabled: enabledTools.length > 0 ? enabledTools : undefined,
                    },
                  })
                );
              }
            }

            // Save assistant message with tool call information
            const toolCalls =
              completion.toolCalls && Array.isArray(completion.toolCalls)
                ? completion.toolCalls.map(call => {
                    // Find the corresponding tool result if it exists
                    const toolResult = (completion as any).toolResults?.find(
                      (r: any) => r.toolCallId === call.toolCallId
                    );

                    return {
                      toolCallId: call.toolCallId,
                      toolName: call.toolName,
                      args: call.args,
                      result: toolResult?.result,
                    };
                  })
                : undefined;

            promises.push(
              ctx.runMutation(api.services.message_service.saveMessage, {
                threadId: currentThreadId,
                role: 'assistant',
                content: completion.text,
                metadata: {
                  modelId: model,
                  modelName: completion.response.modelId,
                  promptTokens: completion.usage.promptTokens,
                  completionTokens: completion.usage.completionTokens,
                  duration,
                  toolsEnabled: enabledTools.length > 0 ? enabledTools : undefined,
                  toolCalls,
                },
              })
            );

            // Update thread activity
            promises.push(
              ctx.runMutation(api.services.thread_service.updateThreadActivity, {
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

        console.error('Chat completion error:', error);

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
        'X-Tools-Enabled': enabledTools.join(','),
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
