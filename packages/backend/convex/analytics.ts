import { query } from './_generated/server';
import { v, ConvexError } from 'convex/values';

/**
 * Helper function to get user by clerkId
 */
const getUserByClerkId = async (ctx: any, clerkId: string) => {
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', clerkId))
    .unique();
  
  if (!user) {
    throw new ConvexError('User not found');
  }
  
  return user;
};

/**
 * Get user usage statistics for analytics
 */
export const getUserUsageStats = query({
  args: {
    clerkId: v.string(),
    startTimestamp: v.number(),
    endTimestamp: v.number(),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const { clerkId, startTimestamp, endTimestamp, days } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    // Get all usage events in the time range
    const usageEvents = await ctx.db
      .query('usageEvents')
      .withIndex('by_user_timestamp', (q: any) =>
        q.eq('userId', user._id).gte('timestamp', startTimestamp).lte('timestamp', endTimestamp)
      )
      .collect();

    // Calculate totals
    const totalRequests = usageEvents.length;
    const totalTokens = usageEvents.reduce((sum, event) => sum + (event.totalTokens || 0), 0);
    const totalCost = usageEvents.reduce((sum, event) => sum + (event.cost || 0), 0);

    // Group by date for daily usage
    const dailyUsageMap = new Map<string, { requests: number; tokens: number; cost: number }>();

    usageEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      const existing = dailyUsageMap.get(date) || { requests: 0, tokens: 0, cost: 0 };

      dailyUsageMap.set(date, {
        requests: existing.requests + 1,
        tokens: existing.tokens + (event.totalTokens || 0),
        cost: existing.cost + (event.cost || 0),
      });
    });

    // Create daily usage array
    const dailyUsage = [];
    const endDate = new Date(endTimestamp);

    for (let i = 0; i < days; i++) {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const usage = dailyUsageMap.get(date) || { requests: 0, tokens: 0, cost: 0 };
      dailyUsage.unshift({
        date,
        requests: usage.requests,
        tokens: usage.tokens,
        cost: Number(usage.cost.toFixed(4)),
      });
    }

    return {
      totalRequests,
      totalTokens,
      totalCost: Number(totalCost.toFixed(4)),
      period: `Last ${days} days`,
      dailyUsage,
      averageRequestsPerDay: Number((totalRequests / days).toFixed(2)),
      averageTokensPerRequest:
        totalRequests > 0 ? Number((totalTokens / totalRequests).toFixed(0)) : 0,
    };
  },
});

/**
 * Get model usage breakdown for analytics
 */
export const getModelUsageStats = query({
  args: {
    clerkId: v.string(),
    startTimestamp: v.number(),
    endTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const { clerkId, startTimestamp, endTimestamp } = args;

    // Get user by clerkId
    const user = await getUserByClerkId(ctx, clerkId);

    // Get usage events grouped by model
    const usageEvents = await ctx.db
      .query('usageEvents')
      .withIndex('by_user_timestamp', (q: any) =>
        q.eq('userId', user._id).gte('timestamp', startTimestamp).lte('timestamp', endTimestamp)
      )
      .collect();

    // Group by model
    const modelUsageMap = new Map<
      string,
      {
        modelId: string;
        modelName: string;
        requests: number;
        totalTokens: number;
        totalCost: number;
      }
    >();

    usageEvents.forEach(event => {
      const modelId = event.modelId;
      const modelName = event.modelName || modelId;
      const existing = modelUsageMap.get(modelId) || {
        modelId,
        modelName,
        requests: 0,
        totalTokens: 0,
        totalCost: 0,
      };

      modelUsageMap.set(modelId, {
        ...existing,
        requests: existing.requests + 1,
        totalTokens: existing.totalTokens + (event.totalTokens || 0),
        totalCost: existing.totalCost + (event.cost || 0),
      });
    });

    // Calculate totals for percentages
    const totalRequests = usageEvents.length;
    const totalCost = usageEvents.reduce((sum, event) => sum + (event.cost || 0), 0);

    // Convert to array and add percentages
    const modelUsage = Array.from(modelUsageMap.values())
      .map(model => ({
        ...model,
        averageTokensPerRequest:
          model.requests > 0 ? Math.round(model.totalTokens / model.requests) : 0,
        totalCost: Number(model.totalCost.toFixed(4)),
        requestsPercentage:
          totalRequests > 0 ? Number(((model.requests / totalRequests) * 100).toFixed(1)) : 0,
        costPercentage:
          totalCost > 0 ? Number(((model.totalCost / totalCost) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.requests - a.requests); // Sort by request count descending

    return modelUsage;
  },
});
