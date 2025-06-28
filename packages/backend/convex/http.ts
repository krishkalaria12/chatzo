import { httpRouter } from 'convex/server';
import { chat, chatOptions, getModels } from './ai';
import { testEndpoint, testGoogleAI } from './test';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

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

// Handle POST requests to /api/chat
http.route({
  path: '/api/chat',
  method: 'POST',
  handler: chat,
});

// Handle OPTIONS requests to /api/chat for CORS
http.route({
  path: '/api/chat',
  method: 'OPTIONS',
  handler: chatOptions,
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

export default http;
