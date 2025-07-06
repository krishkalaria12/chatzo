import { httpRouter } from 'convex/server';
import { corsRouter } from 'convex-helpers/server/cors';
import { chatGET } from './chat_http/routes/get_chat';
import { chatPOST } from './chat_http/routes/post_chat';

const http = httpRouter();
const cors = corsRouter(http, {
  allowedOrigins: ['*'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-clerk-id'],
  allowCredentials: true,
});

cors.route({
  path: '/chat',
  method: 'POST',
  handler: chatPOST,
});

cors.route({
  path: '/chat',
  method: 'GET',
  handler: chatGET,
});

export default http;
