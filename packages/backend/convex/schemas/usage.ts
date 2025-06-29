import { v } from 'convex/values';

// Usage event for tracking AI model usage
export const UsageEvent = v.object({
  userId: v.id('users'),
  threadId: v.optional(v.id('threads')),
  messageId: v.optional(v.string()),
  modelId: v.string(), // "openai:gpt-4o", "anthropic:claude-3.5-sonnet", etc.
  modelName: v.optional(v.string()),
  promptTokens: v.number(), // p -> promptTokens
  completionTokens: v.number(), // c -> completionTokens
  totalTokens: v.number(),
  cost: v.optional(v.number()), // Cost in USD
  duration: v.optional(v.number()), // Duration in milliseconds
  timestamp: v.number(),
  daysSinceEpoch: v.number(), // Math.floor(Date.now() / (24*60*60*1000))
  status: v.union(
    v.literal('success'),
    v.literal('error'),
    v.literal('timeout'),
    v.literal('cancelled')
  ),
  errorMessage: v.optional(v.string()),
});

// Daily usage summary for analytics
export const DailyUsageSummary = v.object({
  userId: v.id('users'),
  date: v.string(), // YYYY-MM-DD format
  daysSinceEpoch: v.number(),
  modelUsage: v.array(
    v.object({
      modelId: v.string(),
      requestCount: v.number(),
      totalPromptTokens: v.number(),
      totalCompletionTokens: v.number(),
      totalCost: v.number(),
      averageDuration: v.number(),
    })
  ),
  totalRequests: v.number(),
  totalTokens: v.number(),
  totalCost: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});
