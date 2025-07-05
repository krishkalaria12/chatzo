import { httpAction } from '../../_generated/server';
import { api } from '../../_generated/api';
import {
  getUserIdFromClerkId,
  createErrorResponse,
  createSuccessResponse,
  parseRequestBody,
} from '../../services/middleware';
import { ConvexError } from 'convex/values';

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

    const messages = await ctx.runQuery(api.services.message_service.getThreadMessages, {
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
 * PUT /api/chat/messages/:messageId
 * Update/edit a message
 */
export const updateMessage = httpAction(async (ctx, request) => {
  try {
    const body = await parseRequestBody(request);
    const { clerkId, content } = body;

    const url = new URL(request.url);
    const messageId = url.pathname.split('/')[4];

    if (!clerkId) {
      return createErrorResponse('clerkId is required', 400);
    }

    if (!messageId) {
      return createErrorResponse('Message ID is required', 400);
    }

    if (!content) {
      return createErrorResponse('Content is required', 400);
    }

    // Get internal userId from clerkId
    const userId = await getUserIdFromClerkId(ctx, clerkId);
    if (!userId) {
      return createErrorResponse('Invalid clerkId or user not found', 401);
    }

    // Update the message
    await ctx.runMutation(api.services.message_service.updateMessage, {
      messageId: messageId as any,
      content,
      edited: true,
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Update message error:', error);

    if (error instanceof ConvexError && error.message.includes('access denied')) {
      return createErrorResponse('Message not found or access denied', 404);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update message',
      500
    );
  }
});

/**
 * DELETE /api/chat/threads/:threadId/messages/from/:index
 * Delete messages from a specific index onwards (for retry operations)
 */
export const deleteMessagesFromIndex = httpAction(async (ctx, request) => {
  try {
    const body = await parseRequestBody(request);
    const { clerkId } = body;

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const threadId = pathParts[4];
    const fromIndex = parseInt(pathParts[7]);

    if (!clerkId) {
      return createErrorResponse('clerkId is required', 400);
    }

    if (!threadId) {
      return createErrorResponse('Thread ID is required', 400);
    }

    if (isNaN(fromIndex)) {
      return createErrorResponse('Valid index is required', 400);
    }

    // Get internal userId from clerkId
    const userId = await getUserIdFromClerkId(ctx, clerkId);
    if (!userId) {
      return createErrorResponse('Invalid clerkId or user not found', 401);
    }

    // Delete messages from the specified index onwards
    const result = await ctx.runMutation(api.services.message_service.deleteMessagesFromIndex, {
      threadId: threadId as any,
      fromIndex,
      clerkId,
    });

    return createSuccessResponse({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Delete messages error:', error);

    if (error instanceof ConvexError && error.message.includes('access denied')) {
      return createErrorResponse('Thread not found or access denied', 404);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete messages',
      500
    );
  }
});

/**
 * DELETE /api/chat/messages/:messageId
 * Delete a single message
 */
export const deleteMessage = httpAction(async (ctx, request) => {
  try {
    const body = await parseRequestBody(request);
    const { clerkId } = body;

    const url = new URL(request.url);
    const messageId = url.pathname.split('/')[4];

    if (!clerkId) {
      return createErrorResponse('clerkId is required', 400);
    }

    if (!messageId) {
      return createErrorResponse('Message ID is required', 400);
    }

    // Get internal userId from clerkId
    const userId = await getUserIdFromClerkId(ctx, clerkId);
    if (!userId) {
      return createErrorResponse('Invalid clerkId or user not found', 401);
    }

    // Delete the message
    await ctx.runMutation(api.services.message_service.deleteMessage, {
      messageId: messageId as any,
      clerkId,
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);

    if (error instanceof ConvexError && error.message.includes('access denied')) {
      return createErrorResponse('Message not found or access denied', 404);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete message',
      500
    );
  }
});
