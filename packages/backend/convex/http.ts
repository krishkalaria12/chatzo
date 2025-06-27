import { httpRouter } from 'convex/server';
import { chat, chatOptions, getModels } from './ai';
import { testEndpoint, testGoogleAI } from './test';

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

export default http;
