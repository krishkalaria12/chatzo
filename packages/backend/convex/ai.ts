import { httpAction } from './_generated/server';
import { streamText } from 'ai';
import { providerRegistry } from './providers/registry';
import { getSystemPrompt } from './config/prompts';

// HTTP action for streaming AI chat
export const chat = httpAction(async (ctx, request) => {
  try {
    const { messages, model: selectedModel } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get model configuration using provider registry
    const modelKey = selectedModel || 'gemini-2.5-flash'; // Default model
    const modelConfig = providerRegistry.getModelConfig(modelKey);

    if (!modelConfig) {
      return new Response(JSON.stringify({ error: `Invalid model: ${modelKey}` }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Clean up message format - remove any extra properties that might cause issues
    const cleanMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system prompt as the first message if not already present
    const systemPrompt = getSystemPrompt({
      name: modelConfig.name,
      id: modelConfig.id,
      description: modelConfig.description,
      provider: modelConfig.provider,
    });
    const messagesWithSystem =
      cleanMessages[0]?.role === 'system'
        ? cleanMessages
        : [{ role: 'system', content: systemPrompt }, ...cleanMessages];

    // Get model instance from provider registry
    const modelInstance = providerRegistry.getModelInstance(modelKey);

    const result = await streamText({
      model: modelInstance,
      messages: messagesWithSystem,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
    });

    // Return the streaming response with exact headers from official guide
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'none',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate AI response',
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

// Get available models using provider registry
export const getModels = httpAction(async (ctx, request) => {
  try {
    const models = providerRegistry.getAllModels();
    const defaultModel = 'gemini-2.5-flash';

    return new Response(JSON.stringify({ models, defaultModel }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Get models error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch models' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

// OPTIONS handler for CORS preflight
export const chatOptions = httpAction(async (ctx, request) => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
});
