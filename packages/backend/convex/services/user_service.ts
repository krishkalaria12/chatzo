import { ConvexError } from 'convex/values';
import { getUserIdFromClerkId } from './middleware';

/**
 * Helper function to get user by clerkId - now using middleware
 */
export const getUserByClerkId = async (ctx: any, clerkId: string) => {
  const userId = await getUserIdFromClerkId(ctx, clerkId);
  if (!userId) {
    throw new ConvexError('User not found');
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError('User not found');
  }

  return user;
};
