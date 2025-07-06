import { ChatError } from '../../lib/errors';
import { createDataStream } from 'ai';
import type { Infer } from 'convex/values';
import { internal } from '../../_generated/api';
import type { Id } from '../../_generated/dataModel';
import { httpAction } from '../../_generated/server';
import { getClerkIdFromHeaders } from '../../lib/identity';
import type { Thread } from '../../schemas/thread';
import { RESPONSE_OPTS } from '../shared';

export const chatGET = httpAction(async (ctx, req: Request) => {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get('chatId');
  if (!threadId) return new ChatError('bad_request:api').toResponse();

  // Get clerkId from headers
  const clerkId = getClerkIdFromHeaders(req.headers);
  if (!clerkId) return new ChatError('unauthorized:chat').toResponse();

  // Look up user via internal query
  const user = await ctx.runQuery(internal.lib.identity.internalGetUserByClerkId, {
    clerkId,
  });
  if (!user) return new ChatError('unauthorized:chat').toResponse();

  let chat: Infer<typeof Thread> | null;

  try {
    chat = await ctx.runQuery(internal.threads.getThreadById, {
      threadId: threadId as Id<'threads'>,
    });
  } catch {
    return new ChatError('not_found:chat').toResponse();
  }

  if (!chat) return new ChatError('not_found:chat').toResponse();
  if (chat.authorId !== user._id) return new ChatError('forbidden:chat').toResponse();

  const messages = await ctx.runQuery(internal.messages.getMessagesByThreadId, {
    threadId: threadId as Id<'threads'>,
  });

  const mostRecentMessage = messages[messages.length - 1];
  if (!mostRecentMessage) {
    const emptyDataStream = createDataStream({
      execute: () => {},
    });
    return new Response(emptyDataStream.pipeThrough(new TextEncoderStream()), RESPONSE_OPTS);
  }

  if (mostRecentMessage.role !== 'assistant') {
    const emptyDataStream = createDataStream({
      execute: () => {},
    });
    return new Response(emptyDataStream.pipeThrough(new TextEncoderStream()), RESPONSE_OPTS);
  }

  const restoredStream = createDataStream({
    execute: buffer => {
      buffer.writeData({
        type: 'append-message',
        message: JSON.stringify(mostRecentMessage),
      });
    },
  });

  return new Response(restoredStream.pipeThrough(new TextEncoderStream()), RESPONSE_OPTS);
});
