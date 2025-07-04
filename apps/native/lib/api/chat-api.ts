import { generateConvexApiUrl } from '@/lib/convex-utils';

// Individual content part types (compatible with AI SDK format)
export type TextContentPart = {
  type: 'text';
  text: string;
};

export type ImageContentPart = {
  type: 'image';
  url: string;
  alt?: string;
};

export type FileContentPart = {
  type: 'file';
  url: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
};

export type ContentPart = TextContentPart | ImageContentPart | FileContentPart;

// Message content types matching backend schema and AI SDK format
export type MessageContent =
  | string // Simple text (legacy support)
  | ContentPart // Single content part
  | ContentPart[]; // Array of content parts (AI SDK compatible for mixed content)

export interface Message {
  _id?: string;
  id?: string; // fallback for compatibility
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  metadata?: {
    modelId?: string;
    modelName?: string;
    promptTokens?: number;
    completionTokens?: number;
    serverDurationMs?: number;
    duration?: number;
    temperature?: number;
    maxTokens?: number;
  };
  createdAt?: number;
  updatedAt?: number;
}

export interface Thread {
  _id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number;
  messageCount: number;
  isArchived?: boolean;
  isPinned?: boolean;
  tags?: string[];
  settings?: {
    modelId?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

export interface ChatCompletionRequest {
  clerkId: string;
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  thread_id?: string;
  generate_title?: boolean;
}

export interface ChatCompletionResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code?: string;
  };
}

class ChatAPI {
  private baseUrl = generateConvexApiUrl('');

  /**
   * Helper function to create AI SDK compatible message content
   * Combines text and images into proper content array format
   */
  createMessageContent(
    text?: string,
    images?: { uri: string; cloudinaryPublicId?: string; name: string }[]
  ): MessageContent {
    const parts: ContentPart[] = [];

    // Add text part if present
    if (text && text.trim()) {
      parts.push({
        type: 'text',
        text: text.trim(),
      });
    }

    // Add image parts if present - use Cloudinary URLs
    if (images && images.length > 0) {
      for (const image of images) {
        // The `uri` now holds the full Cloudinary URL after upload
        parts.push({
          type: 'image',
          url: image.uri,
          alt: image.name,
        });
      }
    }

    // Return appropriate format based on content
    if (parts.length === 0) {
      return ''; // Empty content
    } else if (parts.length === 1 && parts[0].type === 'text') {
      return parts[0].text; // Simple string for text-only
    } else {
      return parts; // Array format for mixed content or images
    }
  }

  /**
   * Send chat completion request with streaming
   */
  async sendChatCompletion(request: ChatCompletionRequest): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/api/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response;
  }

  /**
   * Create a new thread
   */
  async createThread(
    clerkId: string,
    title: string = 'New Chat',
    settings?: {
      modelId?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<Thread> {
    const response = await fetch(`${this.baseUrl}/api/chat/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId,
        title,
        settings,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create thread');
    }

    return data;
  }

  /**
   * Get user's threads
   */
  async getThreads(
    clerkId: string,
    limit: number = 30,
    offset: number = 0,
    archived: boolean = false
  ): Promise<{ threads: Thread[]; pagination: any }> {
    const params = new URLSearchParams({
      clerkId,
      limit: limit.toString(),
      offset: offset.toString(),
      archived: archived.toString(),
    });

    const response = await fetch(`${this.baseUrl}/api/chat/threads?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch threads');
    }

    return data;
  }

  /**
   * Get messages from a thread
   */
  async getThreadMessages(
    clerkId: string,
    threadId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: Message[]; pagination: any }> {
    const params = new URLSearchParams({
      clerkId,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${this.baseUrl}/api/chat/threads/${threadId}/messages?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch messages');
    }

    return data;
  }

  /**
   * Generate title for conversation
   */
  async generateTitle(
    clerkId: string,
    messages: string[],
    model: string = 'gemini-2.5-flash',
    threadId?: string
  ): Promise<{ title: string; category: string; confidence: number }> {
    const response = await fetch(`${this.baseUrl}/api/chat/generate-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId,
        messages,
        model,
        thread_id: threadId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate title');
    }

    return data;
  }

  /**
   * Test connection to backend
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/test`);
      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Connection test failed' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Test AI models
   */
  async testAI(): Promise<{
    success: boolean;
    message: string;
    model?: string;
    response?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/test-ai`);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message,
          model: data.model,
          response: data.response,
        };
      } else {
        return { success: false, message: data.details || data.error || 'AI test failed' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get analytics usage data
   */
  async getUserUsage(
    clerkId: string,
    days: number = 30
  ): Promise<{
    totalRequests: number;
    totalTokens: number;
    dailyUsage: Array<{ date: string; requests: number; tokens: number }>;
  }> {
    const params = new URLSearchParams({
      clerkId,
      days: days.toString(),
    });

    const response = await fetch(`${this.baseUrl}/api/analytics/usage?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch usage data');
    }

    return data;
  }

  /**
   * Get model usage breakdown
   */
  async getModelUsage(
    clerkId: string,
    days: number = 30
  ): Promise<
    Array<{
      modelId: string;
      modelName: string;
      requests: number;
      totalTokens: number;
      requestsPercentage: number;
    }>
  > {
    const params = new URLSearchParams({
      clerkId,
      days: days.toString(),
    });

    const response = await fetch(`${this.baseUrl}/api/analytics/models?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch model usage');
    }

    return data;
  }

  /**
   * Delete a thread and all its messages
   */
  async deleteThread(
    clerkId: string,
    threadId: string
  ): Promise<{
    message: string;
    deletedThreadId: string;
    deletedMessagesCount: number;
  }> {
    const params = new URLSearchParams({
      clerkId,
    });

    const response = await fetch(`${this.baseUrl}/api/chat/threads/${threadId}?${params}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to delete thread');
    }

    return data;
  }
}

// Export singleton instance
export const chatAPI = new ChatAPI();
