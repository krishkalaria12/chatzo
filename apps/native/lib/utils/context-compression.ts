import { Message } from '@/lib/api/chat-api';

interface CompressionOptions {
  maxTokens?: number;
  maxMessages?: number;
  preserveSystemMessage?: boolean;
  preserveRecentMessages?: number;
}

/**
 * Estimate token count (rough approximation: ~4 characters per token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Compress conversation context to fit within token limits
 */
export function compressConversationContext(
  messages: Message[],
  options: CompressionOptions = {}
): Message[] {
  const {
    maxTokens = 4000,
    maxMessages = 20,
    preserveSystemMessage = true,
    preserveRecentMessages = 5,
  } = options;

  if (messages.length <= maxMessages) {
    return messages;
  }

  let compressed: Message[] = [];
  let totalTokens = 0;

  // Always preserve system message if it exists
  const systemMessage = messages.find(m => m.role === 'system');
  if (systemMessage && preserveSystemMessage) {
    compressed.push(systemMessage);
    totalTokens += estimateTokens(systemMessage.content);
  }

  // Get non-system messages
  const conversationMessages = messages.filter(m => m.role !== 'system');

  // Always preserve the most recent messages
  const recentMessages = conversationMessages.slice(-preserveRecentMessages);
  const recentTokens = recentMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

  // If recent messages already exceed token limit, return just the most recent ones
  if (totalTokens + recentTokens > maxTokens) {
    return [
      ...(systemMessage && preserveSystemMessage ? [systemMessage] : []),
      ...recentMessages.slice(-Math.floor(preserveRecentMessages / 2)),
    ];
  }

  // Add recent messages
  compressed.push(...recentMessages);
  totalTokens += recentTokens;

  // Work backwards through older messages, adding them if they fit
  const olderMessages = conversationMessages.slice(0, -preserveRecentMessages);
  for (let i = olderMessages.length - 1; i >= 0; i--) {
    const message = olderMessages[i];
    const messageTokens = estimateTokens(message.content);

    if (totalTokens + messageTokens <= maxTokens && compressed.length < maxMessages) {
      compressed.splice(-preserveRecentMessages, 0, message);
      totalTokens += messageTokens;
    } else {
      break;
    }
  }

  // Sort by creation time to maintain conversation order
  const systemMsg = compressed.filter(m => m.role === 'system');
  const otherMsgs = compressed
    .filter(m => m.role !== 'system')
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  return [...systemMsg, ...otherMsgs];
}

/**
 * Create a conversation summary for very long threads
 */
export function createConversationSummary(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === 'user').length;
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;

  const topics = extractTopics(messages);
  const topicsText = topics.length > 0 ? ` Topics discussed: ${topics.join(', ')}.` : '';

  return `[This conversation has ${userMessages} user messages and ${assistantMessages} assistant responses.${topicsText} The following are the most recent messages:]`;
}

/**
 * Extract potential topics from conversation (simple keyword extraction)
 */
function extractTopics(messages: Message[]): string[] {
  const text = messages
    .map(m => m.content)
    .join(' ')
    .toLowerCase();

  const keywords = [
    'code',
    'programming',
    'development',
    'bug',
    'error',
    'function',
    'design',
    'ui',
    'ux',
    'frontend',
    'backend',
    'database',
    'api',
    'server',
    'client',
    'web',
    'mobile',
    'app',
    'react',
    'javascript',
    'typescript',
    'python',
    'java',
    'help',
    'question',
    'problem',
    'solution',
    'advice',
  ];

  const foundTopics = keywords.filter(
    keyword => text.includes(keyword) && text.split(keyword).length > 2
  );

  return foundTopics.slice(0, 3); // Limit to 3 topics
}

/**
 * Intelligent message compression that preserves important context
 */
export function intelligentContextCompression(
  messages: Message[],
  maxTokens: number = 4000
): Message[] {
  if (messages.length <= 10) {
    return messages;
  }

  const compressed = compressConversationContext(messages, {
    maxTokens: maxTokens * 0.8, // Leave room for summary
    maxMessages: 15,
    preserveRecentMessages: 6,
  });

  // If we removed many messages, add a summary
  if (messages.length - compressed.length > 5) {
    const summary = createConversationSummary(messages);
    const summaryMessage: Message = {
      id: 'context_summary',
      role: 'system',
      content: summary,
      createdAt: messages[0]?.createdAt || Date.now(),
    };

    return [summaryMessage, ...compressed.filter(m => m.role !== 'system')];
  }

  return compressed;
}
