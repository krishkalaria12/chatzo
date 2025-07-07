import { httpRouter } from 'convex/server';
import { getModels } from './ai';
import { testEndpoint, testGoogleAI } from './test';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import { completions } from './chat_http/routes/chat';
import {
  createThread,
  deleteThread,
  generateTitle,
  getThreads,
  updateThread,
  searchThreads,
} from './chat_http/routes/threads';
import {
  getMessages,
  updateMessage,
  deleteMessage,
  deleteMessagesFromIndex,
} from './chat_http/routes/messages';
import { getUserUsage, getModelUsage } from './api/routes/analytics';

const http = httpRouter();

// Test endpoint for debugging
http.route({
  path: '/test',
  method: 'GET',
  handler: testEndpoint,
});

// Test Google AI configuration
http.route({
  path: '/test-ai',
  method: 'GET',
  handler: testGoogleAI,
});

// Get available models
http.route({
  path: '/api/models',
  method: 'GET',
  handler: getModels,
});

// Sync user data from Clerk
http.route({
  path: '/api/user/sync',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { clerkId, email, name, imageUrl } = body;

      if (!clerkId || !email) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: clerkId and email' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Call the getOrCreateUser mutation
      const userId = await ctx.runMutation(api.auth.getOrCreateUser, {
        clerkId,
        email,
        name,
        imageUrl,
      });

      return new Response(JSON.stringify({ success: true, userId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('User sync error:', error);
      return new Response(JSON.stringify({ error: 'Failed to sync user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }),
});

// Analytics endpoints
http.route({
  path: '/api/analytics/usage',
  method: 'GET',
  handler: getUserUsage,
});

http.route({
  path: '/api/analytics/models',
  method: 'GET',
  handler: getModelUsage,
});

// Chat API endpoints
http.route({
  path: '/api/chat/completions',
  method: 'POST',
  handler: completions,
});

http.route({
  path: '/api/chat/generate-title',
  method: 'POST',
  handler: generateTitle,
});

http.route({
  path: '/api/chat/threads',
  method: 'POST',
  handler: createThread,
});

http.route({
  path: '/api/chat/threads',
  method: 'GET',
  handler: getThreads,
});

http.route({
  path: '/api/chat/threads/search',
  method: 'GET',
  handler: searchThreads,
});

// Handle thread messages: /api/chat/threads/<threadId>/messages
http.route({
  pathPrefix: '/api/chat/threads/',
  method: 'GET',
  handler: getMessages,
});

// Handle thread updates: /api/chat/threads/<threadId>
http.route({
  pathPrefix: '/api/chat/threads/',
  method: 'PUT',
  handler: updateThread,
});

// Handle thread deletion: /api/chat/threads/<threadId>
http.route({
  pathPrefix: '/api/chat/threads/',
  method: 'DELETE',
  handler: deleteThread,
});

// Handle bulk message deletion: /api/chat/bulk-delete-messages/<threadId>/from/<index>
http.route({
  pathPrefix: '/api/chat/bulk-delete-messages/',
  method: 'DELETE',
  handler: deleteMessagesFromIndex,
});

// Handle message updates: /api/chat/messages/<messageId>
http.route({
  pathPrefix: '/api/chat/messages/',
  method: 'PUT',
  handler: updateMessage,
});

// Handle message deletion: /api/chat/messages/<messageId>
http.route({
  pathPrefix: '/api/chat/messages/',
  method: 'DELETE',
  handler: deleteMessage,
});

export default http;
