/**
 * Authentication middleware - validates user authentication
 */
export const requireAuth = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized');
  }
  return identity;
};

/**
 * Error response helper
 */
export const createErrorResponse = (message: string, status: number = 500) => {
  return new Response(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

/**
 * Success response helper
 */
export const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
