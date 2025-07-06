import { internalQuery } from '../_generated/server';
import { v } from 'convex/values';

// Accept any context that provides `db` and `auth` so we can reuse this helper
type MinimalCtx = { db: any; auth: any };

/**
 * Gets the clerk ID from the request headers.
 * @param headers The request headers
 * @returns The clerk ID or null if not found
 */
export function getClerkIdFromHeaders(headers: Headers): string | null {
  const clerkId = headers.get('x-clerk-id');
  return clerkId;
}

/**
 * Describes a successfully authenticated user.
 */
export type AuthenticatedUser = {
  id: string; // The Convex `users` table _id
  clerkId: string;
  name: string | null;
  email: string;
};

/**
 * Describes an authentication error.
 */
export type AuthenticationError = {
  error: 'Unauthenticated' | 'UserNotFound';
  message: string;
};

/**
 * Fetches the Convex user identity from the Clerk token provided in the
 * authentication header.
 *
 * @param ctx The query context.
 * @returns The authenticated user, or an error if they could not be found.
 */
export async function getUserIdentity(
  ctx: MinimalCtx
): Promise<AuthenticatedUser | AuthenticationError> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return {
      error: 'Unauthenticated',
      message: 'User must be logged in to perform this action.',
    };
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject))
    .unique();

  if (!user) {
    return {
      error: 'UserNotFound',
      message: `User with Clerk ID ${identity.subject} could not be found in the database.`,
    };
  }

  return {
    id: user._id,
    clerkId: user.clerkId,
    name: user.name ?? '',
    email: user.email,
  };
}

export const internalGetUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async ({ db }, { clerkId }) => {
    return await db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', clerkId))
      .unique();
  },
});
