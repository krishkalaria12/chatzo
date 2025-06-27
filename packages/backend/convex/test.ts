import { httpAction } from './_generated/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Simple test endpoint to verify HTTP actions are working
export const testEndpoint = httpAction(async (ctx, request) => {
  try {
    return new Response(
      JSON.stringify({
        message: 'Convex HTTP action is working!',
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Test endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: 'Test endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

// Test Google AI configuration
export const testGoogleAI = httpAction(async (ctx, request) => {
  try {
    // Check if API key exists (don't log the actual key for security)
    const hasApiKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!hasApiKey) {
      return new Response(
        JSON.stringify({
          error: 'Google AI API key not found',
          message: 'Please set GOOGLE_GENERATIVE_AI_API_KEY in your Convex environment',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Test a simple AI call
    const result = await generateText({
      model: google('gemini-2.5-flash-preview-04-17'),
      prompt: "Say 'Hello from Google AI!' in one sentence.",
      maxTokens: 50,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Google AI is working!',
        model: 'gemini-2.5-flash-preview-04-17',
        response: result.text,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Google AI test error:', error);
    return new Response(
      JSON.stringify({
        error: 'Google AI test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
