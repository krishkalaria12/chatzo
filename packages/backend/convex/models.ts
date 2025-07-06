import { httpAction } from './_generated/server';
import { getAllModels, DEFAULT_MODEL } from './config/models';

// Get available models using provider registry
export const getModels = httpAction(async (ctx, request) => {
  try {
    const models = getAllModels();
    const defaultModel = DEFAULT_MODEL;

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
