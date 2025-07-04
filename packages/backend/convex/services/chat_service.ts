import { action, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';

// Define message type for better typing
interface ProcessedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Intelligent context compression for long conversations
 */
export const compressConversationContext = action({
  args: {
    threadId: v.id('threads'),
    newMessages: v.array(v.any()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ProcessedMessage[]> => {
    const { threadId, newMessages, maxTokens = 4000 } = args;

    try {
      // Get existing messages from database
      const existingMessages: any[] = await ctx.runQuery(
        api.services.message_service.getThreadMessagesInternal,
        {
          threadId,
          limit: 100, // Get more messages for compression
        }
      );

      // Helper function to extract text content from complex message content
      const extractTextContent = (content: any): string => {
        if (typeof content === 'string') {
          return content;
        }

        // Handle array of content parts (mixed text and images)
        if (Array.isArray(content)) {
          return content
            .map((part: any) => {
              if (typeof part === 'string') return part;
              if (part.type === 'text') return part.text;
              if (part.type === 'image') return `[Image: ${part.alt || part.url}]`;
              if (part.type === 'file') return `[File: ${part.fileName}]`;
              return String(part);
            })
            .filter(Boolean) // Remove empty strings
            .join(' ');
        }

        // Handle single content object
        if (typeof content === 'object' && content.type) {
          switch (content.type) {
            case 'text':
              return content.text;
            case 'image':
              return `[Image: ${content.alt || content.url}]`;
            case 'file':
              return `[File: ${content.fileName}]`;
            default:
              return String(content);
          }
        }

        return String(content);
      };

      // Combine existing + new messages
      const allMessages: ProcessedMessage[] = [
        ...existingMessages.map(
          (msg: any): ProcessedMessage => ({
            role: msg.role,
            content: extractTextContent(msg.content),
          })
        ),
        ...newMessages.map(
          (msg: any): ProcessedMessage => ({
            role: msg.role,
            content: extractTextContent(msg.content),
          })
        ),
      ];

      // If conversation is short, return as-is
      if (allMessages.length <= 10) {
        return allMessages;
      }

      // Estimate tokens (rough: 4 chars per token)
      const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

      // Always preserve system messages and recent messages
      const systemMessages = allMessages.filter((m: ProcessedMessage) => m.role === 'system');
      const conversationMessages = allMessages.filter((m: ProcessedMessage) => m.role !== 'system');
      const recentMessages = conversationMessages.slice(-6); // Last 6 messages

      let compressed: ProcessedMessage[] = [...systemMessages, ...recentMessages];
      let totalTokens = compressed.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

      // Add older messages if they fit
      const olderMessages = conversationMessages.slice(0, -6);
      for (let i = olderMessages.length - 1; i >= 0; i--) {
        const msg = olderMessages[i];
        const msgTokens = estimateTokens(msg.content);

        if (totalTokens + msgTokens <= maxTokens * 0.8) {
          // Leave 20% buffer
          compressed.splice(-6, 0, msg); // Insert before recent messages
          totalTokens += msgTokens;
        } else {
          break;
        }
      }

      // If we removed many messages, create a summary
      if (allMessages.length - compressed.length > 8) {
        try {
          const { generateText } = await import('ai');
          const { google } = await import('@ai-sdk/google');

          const summaryContent = olderMessages
            .slice(0, 10)
            .map((m: ProcessedMessage) => `${m.role}: ${m.content.slice(0, 100)}...`)
            .join('\n');

          const { text } = await generateText({
            model: google('gemini-2.0-flash-exp'),
            prompt: `Summarize this conversation context in 2-3 sentences to preserve important details:\n\n${summaryContent}`,
            maxTokens: 100,
            temperature: 0.3,
          });

          const summaryMessage: ProcessedMessage = {
            role: 'system',
            content: `[Previous conversation summary: ${text}]`,
          };

          return [
            summaryMessage,
            ...compressed.filter((m: ProcessedMessage) => m.role !== 'system'),
          ];
        } catch (error) {
          console.error('Summary generation failed:', error);
          // Fallback to simple summary
          const summaryMessage: ProcessedMessage = {
            role: 'system',
            content: `[Previous conversation with ${allMessages.length - compressed.length} earlier messages omitted for context length]`,
          };

          return [
            summaryMessage,
            ...compressed.filter((m: ProcessedMessage) => m.role !== 'system'),
          ];
        }
      }

      return compressed;
    } catch (error) {
      console.error('Context compression error:', error);
      // Fallback: return recent messages only
      return newMessages.slice(-5).map(
        (msg: any): ProcessedMessage => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : String(msg.content),
        })
      );
    }
  },
});

/**
 * Track usage event
 */
export const trackUsage = mutation({
  args: {
    userId: v.id('users'), // Now using convex user ID
    threadId: v.optional(v.id('threads')),
    messageId: v.optional(v.string()),
    modelId: v.string(),
    modelName: v.optional(v.string()),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    duration: v.optional(v.number()),
    status: v.union(
      v.literal('success'),
      v.literal('error'),
      v.literal('timeout'),
      v.literal('cancelled')
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('usageEvents', {
      ...args,
      timestamp: Date.now(),
      daysSinceEpoch: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
    });
  },
});
