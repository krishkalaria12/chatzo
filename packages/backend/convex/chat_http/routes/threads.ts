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
    const result = await ctx.runAction(api.services.thread_service.generateThreadTitle, {
      messages: titleMessages,
    });

    // Update thread title if thread_id provided
    if (thread_id) {
      await ctx.runMutation(api.services.thread_service.updateThreadTitle, {
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
    const { clerkId, title = 'New Chat' } = body;

    // Get internal userId from clerkId
    if (!clerkId) {
      return createErrorResponse('clerkId is required', 400);
    }

    const thread = await ctx.runMutation(api.services.thread_service.createOrGetThread, {
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

    const threads = await ctx.runQuery(api.services.thread_service.getUserThreads, {
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

    const result = await ctx.runMutation(api.services.thread_service.deleteThread, {
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

/**
 * PUT /api/chat/threads/:threadId
 * Update a specific conversation thread (currently supports title updates)
 */
export const updateThread = httpAction(async (ctx, request) => {
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

    const body = await parseRequestBody(request);
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return createErrorResponse('Title is required and must be a string', 400);
    }

    const result = await ctx.runMutation(api.services.thread_service.updateThreadTitleWithAuth, {
      threadId: threadId as any,
      title,
      clerkId,
    });

    return createSuccessResponse({
      message: 'Thread updated successfully',
      threadId: result.threadId,
      title: result.title,
    });
  } catch (error) {
    console.error('Update thread error:', error);

    if (error instanceof ConvexError && error.message.includes('access denied')) {
      return createErrorResponse('Thread not found or access denied', 404);
    }

    if (
      error instanceof ConvexError &&
      (error.message.includes('empty') || error.message.includes('exceed'))
    ) {
      return createErrorResponse(error.message, 400);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update thread',
      500
    );
  }
});
