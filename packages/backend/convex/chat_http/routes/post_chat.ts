import type {
  FileUIPart,
  ReasoningUIPart,
  TextUIPart,
  ToolInvocationUIPart,
} from '@ai-sdk/ui-utils';
import { formatDataStreamPart } from 'ai';
import { nanoid } from 'nanoid';

import { ChatError } from '../../lib/errors';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { createDataStream, smoothStream, streamText } from 'ai';
import type { Infer } from 'convex/values';
import { internal } from '../../_generated/api';
import type { Id } from '../../_generated/dataModel';
import { httpAction } from '../../_generated/server';
import { dbMessagesToCore } from '../../lib/db_to_core_messages';
import { getClerkIdFromHeaders } from '../../lib/identity';
import type { ImageSize } from '../../config/models';
import { getToolkit } from '../../lib/toolkit';
import type { HTTPAIMessage } from '../../schemas/message';
import type { ErrorUIPart } from '../../schemas/parts';
import { getModel } from '../get_model';
import { generateAndStoreImage } from '../image_generation';
import { manualStreamTransform } from '../manual_stream_transform';
import { buildPrompt } from '../../config/prompts';
import { RESPONSE_OPTS } from '../shared';
import type { AbilityId } from '../../lib/toolkit';

const buildGoogleProviderOptions = (modelId: string): GoogleGenerativeAIProviderOptions => {
  const options: GoogleGenerativeAIProviderOptions = {};

  if (modelId === 'gemini-2.0-flash-image-generation') {
    options.responseModalities = ['TEXT', 'IMAGE'];
  }

  if (['2.5-flash', '2.5-pro'].some(m => modelId.includes(m))) {
    options.thinkingConfig = {
      includeThoughts: true,
      thinkingBudget: 6000, // medium reasoning effort
    };
  }

  return options;
};

const buildOpenAIProviderOptions = (modelId: string): OpenAIResponsesProviderOptions => {
  const options: OpenAIResponsesProviderOptions = {};

  if (['o1', 'o3', 'o4'].some(m => modelId.includes(m))) {
    options.reasoningEffort = 'medium';
    options.reasoningSummary = 'detailed';
  }

  return options;
};

const buildAnthropicProviderOptions = (modelId: string): AnthropicProviderOptions => {
  const options: AnthropicProviderOptions = {};

  if (['sonnet-4', '4-sonnet', '4-opus', 'opus-4', '3.7'].some(m => modelId.includes(m))) {
    options.thinking = {
      type: 'enabled',
      budgetTokens: 6000, // medium reasoning effort
    };
  }

  return options;
};

export const chatPOST = httpAction(async (ctx, req) => {
  const body: {
    id?: string;
    message: Infer<typeof HTTPAIMessage>;
    model: string;
    proposedNewAssistantId: string;
    enabledTools: AbilityId[]; // use correct type
    targetFromMessageId?: string;
    targetMode?: 'normal' | 'edit' | 'retry';
    imageSize?: ImageSize;
  } = await req.json();

  if (body.targetFromMessageId && !body.id) {
    return new ChatError('bad_request:chat').toResponse();
  }

  // Get clerkId from headers
  const clerkId = getClerkIdFromHeaders(req.headers);
  if (!clerkId) {
    return new ChatError('unauthorized:chat').toResponse();
  }

  // Look up user via internal query
  const user = await ctx.runQuery(internal.lib.identity.internalGetUserByClerkId, {
    clerkId,
  });
  if (!user) return new ChatError('unauthorized:chat').toResponse();

  const mutationResult = await ctx.runMutation(internal.threads.createThreadOrInsertMessages, {
    threadId: body.id as Id<'threads'>,
    authorId: user._id, // use _id from user lookup
    userMessage: 'message' in body ? body.message : undefined,
    proposedNewAssistantId: body.proposedNewAssistantId,
    targetFromMessageId: body.targetFromMessageId,
    targetMode: body.targetMode,
  });

  if (mutationResult instanceof ChatError) return mutationResult.toResponse();
  if (!mutationResult) return new ChatError('bad_request:chat').toResponse();

  const dbMessages = await ctx.runQuery(internal.messages.getMessagesByThreadId, {
    threadId: mutationResult.threadId,
  });

  const modelData = await getModel(ctx, body.model, clerkId);
  if (modelData instanceof ChatError) return modelData.toResponse();
  const { model, modelName } = modelData;

  const mapped_messages = await dbMessagesToCore(dbMessages, modelData.abilities);

  const streamStartTime = Date.now();

  const remoteCancel = new AbortController();
  const parts: Array<
    | TextUIPart
    | (ReasoningUIPart & { duration?: number })
    | ToolInvocationUIPart
    | FileUIPart
    | Infer<typeof ErrorUIPart>
  > = [];

  const uploadPromises: Promise<void>[] = [];
  const settings = await ctx.runQuery(internal.settings.getUserSettingsInternal, {
    userId: user._id,
  });

  // Track token usage
  const totalTokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
  };

  const stream = createDataStream({
    execute: async dataStream => {
      await ctx.runMutation(internal.threads.updateThreadStreamingState, {
        threadId: mutationResult.threadId,
        isLive: true,
        streamStartedAt: streamStartTime,
      });

      dataStream.writeData({
        type: 'thread_id',
        content: mutationResult.threadId,
      });

      dataStream.writeMessageAnnotation({
        type: 'model_name',
        content: modelName,
      });

      if (model.modelType === 'image') {
        console.log('[cvx][chat][stream] Image generation mode detected');

        // Extract the prompt from the user message
        const userMessage = mapped_messages.find(m => m.role === 'user');

        const prompt =
          typeof userMessage?.content === 'string'
            ? userMessage.content
            : userMessage?.content
                .map(t => (t.type === 'text' ? t.text : undefined))
                .filter(t => t !== undefined)
                .join(' ');

        if (typeof prompt !== 'string' || !prompt.trim()) {
          console.error('[cvx][chat][stream] No valid prompt found for image generation');
          parts.push({
            type: 'error',
            error: {
              code: 'unknown',
              message:
                'No prompt provided for image generation. Please provide a description of the image you want to create.',
            },
          });
          dataStream.write(
            formatDataStreamPart(
              'error',
              'No prompt provided for image generation. Please provide a description of the image you want to create.'
            )
          );
        } else {
          // Use the provided imageSize or fall back to default
          const imageSize: ImageSize = (body.imageSize || '1:1') as ImageSize;

          // Create mock tool call for image generation
          const mockToolCall: ToolInvocationUIPart = {
            type: 'tool-invocation',
            toolInvocation: {
              state: 'call',
              args: {
                imageSize,
                prompt,
              },
              toolCallId: nanoid(),
              toolName: 'image_generation',
            },
          };

          parts.push(mockToolCall);
          dataStream.write(
            formatDataStreamPart('tool_call', {
              toolCallId: mockToolCall.toolInvocation.toolCallId,
              toolName: mockToolCall.toolInvocation.toolName,
              args: mockToolCall.toolInvocation.args,
            })
          );

          // Patch the message with the tool call first
          await ctx.runMutation(internal.messages.patchMessage, {
            threadId: mutationResult.threadId,
            messageId: mutationResult.assistantMessageId,
            parts: parts,
            metadata: {
              modelId: body.model,
              modelName,
              serverDurationMs: Date.now() - streamStartTime,
            },
          });

          try {
            // Generate the image
            const result = await generateAndStoreImage({
              prompt,
              imageSize,
              imageModel: model,
              modelId: body.model,
              userId: user._id,
              threadId: mutationResult.threadId,
              actionCtx: ctx,
            });

            // Send tool result
            dataStream.write(
              formatDataStreamPart('tool_result', {
                toolCallId: mockToolCall.toolInvocation.toolCallId,
                result: {
                  assets: result.assets,
                  prompt: result.prompt,
                  modelId: result.modelId,
                },
              })
            );

            // Update parts with successful result
            parts[0] = {
              type: 'tool-invocation',
              toolInvocation: {
                state: 'result',
                args: mockToolCall.toolInvocation.args,
                result: {
                  assets: result.assets,
                  prompt: result.prompt,
                  modelId: result.modelId,
                },
                toolCallId: mockToolCall.toolInvocation.toolCallId,
                toolName: 'image_generation',
              },
            } satisfies ToolInvocationUIPart;
          } catch (error) {
            console.error('[cvx][chat][stream] Image generation failed:', error);

            // Send error in tool result
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            dataStream.write(
              formatDataStreamPart('tool_result', {
                toolCallId: mockToolCall.toolInvocation.toolCallId,
                result: {
                  error: errorMessage,
                },
              })
            );

            // Update parts with error
            parts[0] = {
              type: 'tool-invocation',
              toolInvocation: {
                state: 'result',
                args: mockToolCall.toolInvocation.args,
                result: {
                  error: errorMessage,
                },
                toolCallId: mockToolCall.toolInvocation.toolCallId,
                toolName: 'image_generation',
              },
            } satisfies ToolInvocationUIPart;
          }
        }
      } else {
        const result = streamText({
          model: model,
          maxSteps: 100,
          abortSignal: remoteCancel.signal,
          experimental_transform: smoothStream(),
          toolCallStreaming: true,
          tools: modelData.abilities.includes('function_calling')
            ? await getToolkit(ctx, body.enabledTools, settings)
            : undefined,
          messages: [
            ...(modelData.modelId !== 'gemini-2.0-flash-image-generation'
              ? [
                  {
                    role: 'system',
                    content: buildPrompt(),
                  } as const,
                ]
              : []),
            ...mapped_messages,
          ],
          providerOptions: {
            google: buildGoogleProviderOptions(modelData.modelId),
            openai: buildOpenAIProviderOptions(modelData.modelId),
            anthropic: buildAnthropicProviderOptions(modelData.modelId),
          },
        });

        dataStream.merge(
          result.fullStream.pipeThrough(
            manualStreamTransform(
              parts,
              totalTokenUsage,
              mutationResult.assistantMessageId,
              uploadPromises,
              user._id
            )
          )
        );

        await result.consumeStream();
        await Promise.allSettled(uploadPromises);
      }
      remoteCancel.abort();

      await ctx.runMutation(internal.messages.patchMessage, {
        threadId: mutationResult.threadId,
        messageId: mutationResult.assistantMessageId,
        parts:
          parts.length > 0
            ? parts
            : [
                {
                  type: 'error',
                  error: {
                    code: 'no-response',
                    message: 'The model did not generate a response. Please try again.',
                  },
                },
              ],
        metadata: {
          modelId: body.model,
          modelName,
          promptTokens: totalTokenUsage.promptTokens,
          completionTokens: totalTokenUsage.completionTokens,
          reasoningTokens: totalTokenUsage.reasoningTokens,
          serverDurationMs: Date.now() - streamStartTime,
        },
      });

      await ctx
        .runMutation(internal.threads.updateThreadStreamingState, {
          threadId: mutationResult.threadId,
          isLive: false,
        })
        .catch(err => console.error('Failed to update thread state:', err));
    },
    onError: error => {
      console.error('[cvx][chat][stream] Fatal error:', error);
      // Mark thread as not live on error
      ctx
        .runMutation(internal.threads.updateThreadStreamingState, {
          threadId: mutationResult.threadId,
          isLive: false,
        })
        .catch(err => console.error('Failed to update thread state:', err));
      return 'Stream error occurred';
    },
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), RESPONSE_OPTS);
});
