import { httpAction } from './_generated/server';
import { providerRegistry } from './providers/registry';

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
