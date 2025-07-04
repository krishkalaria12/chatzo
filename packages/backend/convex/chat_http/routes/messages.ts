import { httpAction } from '../../_generated/server';
import { api } from '../../_generated/api';
import {
  getUserIdFromClerkId,
  createErrorResponse,
  createSuccessResponse,
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
