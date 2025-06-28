import { httpAction } from '../../_generated/server';
import { api } from '../../_generated/api';
import {
  getUserIdFromClerkId,
  createErrorResponse,
  createSuccessResponse,
} from '../../services/middleware';

/**
 * Get usage analytics for a user
 * GET /api/analytics/usage?clerkId=xxx&days=30
 */
export const getUserUsage = httpAction(async (ctx, request) => {
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

    const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 365);

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get usage statistics from service
    const usageStats = await ctx.runQuery(api.services.analytics_service.getUserUsageStats, {
      userId,
      startTimestamp: startDate.getTime(),
      endTimestamp: endDate.getTime(),
      days,
    });

    return createSuccessResponse(usageStats);
  } catch (error) {
    console.error('Get usage analytics error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      'analytics_error'
    );
  }
});

/**
 * Get model usage breakdown
 * GET /api/analytics/models?clerkId=xxx&days=30
 */
export const getModelUsage = httpAction(async (ctx, request) => {
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

    const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 365);

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get model usage statistics from service
    const modelUsage = await ctx.runQuery(api.services.analytics_service.getModelUsageStats, {
      userId,
      startTimestamp: startDate.getTime(),
      endTimestamp: endDate.getTime(),
    });

    return createSuccessResponse(modelUsage);
  } catch (error) {
    console.error('Get model usage error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      'analytics_error'
    );
  }
});
