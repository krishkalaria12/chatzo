import { ActionCtx, QueryCtx, MutationCtx } from '../_generated/server';

/**
 * Get authenticated user ID by looking up clerkId in database
 * Frontend should send clerkId in request body or Authorization header
 */
export async function getAuthUserId(
  ctx: ActionCtx | QueryCtx | MutationCtx,
  request?: Request
): Promise<string | null> {
  try {
    let clerkId: string | null = null;

    // Try to get clerkId from Authorization header first
    if (request) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        clerkId = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    // If not in header, try to get from request body
    if (!clerkId && request) {
      try {
        const body = await request.json();
        clerkId = body.clerkId;

        // Reset the request body for later use
        // Note: We'll need to parse it again in the route handlers
      } catch (error) {
        // Request body might not be JSON or already consumed
      }
    }

    // Fallback to Clerk's built-in auth if no clerkId provided
    if (!clerkId) {
      const identity = await ctx.auth.getUserIdentity();
      clerkId = identity?.subject || null;
    }

    if (!clerkId) {
      return null;
    }

    // Look up internal userId using clerkId
    return await getUserIdFromClerkId(ctx, clerkId);
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Get userId directly from clerkId - works with all context types
 */
export async function getUserIdFromClerkId(
  ctx: ActionCtx | QueryCtx | MutationCtx,
  clerkId: string
): Promise<any | null> {
  try {
    // If we have direct database access (Query/Mutation), use it
    if ('db' in ctx) {
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', clerkId))
        .unique();

      return user?._id || null;
    }

    // If we're in an Action context, we need to call a query
    if ('runQuery' in ctx) {
      const { api } = await import('../_generated/api');
      const user = await ctx.runQuery(api.auth.getUserByClerkId, { clerkId });
      return user?._id || null;
    }

    return null;
  } catch (error) {
    console.error('Error looking up user by clerkId:', error);
    return null;
  }
}

/**
 * Ensure user is authenticated or throw error
 */
export async function requireAuth(
  ctx: ActionCtx | QueryCtx | MutationCtx,
  request?: Request
): Promise<string> {
  const userId = await getAuthUserId(ctx, request);
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T = any>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Create standard error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  type: string = 'api_error'
): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        type,
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create standard success response
 */
export function createSuccessResponse<T = any>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create streaming response
 */
export function createStreamResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
