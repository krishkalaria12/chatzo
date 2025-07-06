import type {
  AssistantContent,
  CoreAssistantMessage,
  CoreToolMessage,
  CoreUserMessage,
  ToolCallPart,
  ToolContent,
  UserContent,
} from 'ai';
import type { Infer } from 'convex/values';
import type { Message } from '../schemas/message';
import type { ModelAbility } from '../schemas/settings';
import { getFileTypeInfo, isImageMimeType } from './file_constants';

export type CoreMessage = (CoreAssistantMessage | CoreToolMessage | CoreUserMessage) & {
  messageId: string;
};

export const dbMessagesToCore = async (
  messages: Infer<typeof Message>[],
  modelAbilities: ModelAbility[]
): Promise<CoreMessage[]> => {
  const mapped_messages: CoreMessage[] = [];
  for await (const message of messages) {
    const to_commit_messages: ((CoreAssistantMessage | CoreToolMessage | CoreUserMessage) & {
      messageId: string;
    })[] = [];
    if (message.role === 'user') {
      const mapped_content: UserContent = [];

      const failedFileFetch = (type: 'image' | 'text' | 'pdf', filename: string) => {
        mapped_content.push({
          type: 'text',
          text: `<internal-system-error>Failed to fetch ${type} file ${filename}. Maybe there was an issue or the file was deleted.</internal-system-error>`,
        });
      };

      for (const p of message.parts) {
        if (p.type === 'text') {
          mapped_content.push({ type: 'text', text: p.text });
        }
        if (p.type === 'file') {
          const _extract = p.data.startsWith('attachments/') ? (p.data.split('/').pop() ?? '') : '';
          const extractedFileName = _extract.length > 51 ? _extract.slice(51) : _extract;

          const filename = p.filename || extractedFileName;
          const fileTypeInfo = getFileTypeInfo(filename, p.mimeType);

          if (fileTypeInfo.isImage && isImageMimeType(p.mimeType || '')) {
            // Represent image as remote URL (AI SDK supports URL strings)
            const fileUrl = p.data;
            if (typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
              mapped_content.push({
                type: 'image',
                image: fileUrl,
              });
            } else {
              failedFileFetch('image', filename);
            }
          } else if (fileTypeInfo.isText && !fileTypeInfo.isImage) {
            try {
              const fileUrl = p.data;
              const data = await fetch(fileUrl);

              if (data.ok) {
                const text = await data.text();
                mapped_content.push({
                  type: 'text',
                  text: `<file name="${filename}">\n${text}\n</file>`,
                });
              } else {
                console.warn(
                  `[cvx][chat] Failed to fetch text file ${p.data}: ${data.status} ${data.statusText}`
                );
                failedFileFetch('text', filename);
              }
            } catch (error) {
              console.warn(`[cvx][chat] Error processing text file ${p.data}:`, error);
              failedFileFetch('text', filename);
            }
          } else if (fileTypeInfo.isPdf && modelAbilities.includes('pdf')) {
            const fileUrl = p.data;
            if (typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
              mapped_content.push({
                type: 'file',
                mimeType: 'application/pdf',
                filename: filename,
                data: new URL(fileUrl),
              });
            } else {
              failedFileFetch('pdf', filename);
            }
          } else {
            mapped_content.push({
              type: 'text',
              text: fileTypeInfo.isPdf
                ? '<internal-system-error>PDF files are not supported by this model. Please try again with a different model.</internal-system-error>'
                : `<internal-system-error>Unsupported file type: ${filename} (${p.mimeType})</internal-system-error>`,
            });
          }
        }
      }

      if (mapped_content.length === 0) {
        console.log(`[cvx][chat] Skipping message with no content: ${message.messageId}`);
        continue;
      }

      const lastMessage = mapped_messages[mapped_messages.length - 1];
      if (lastMessage && lastMessage.role === 'user' && typeof lastMessage.content === 'object') {
        lastMessage.content.push(...mapped_content);
      } else {
        to_commit_messages.unshift({
          role: 'user',
          messageId: message.messageId,
          content: mapped_content,
        });
      }
    } else if (message.role === 'assistant') {
      const mapped_content: AssistantContent = [];
      const tool_calls: ToolCallPart[] = [];
      const tool_results: ToolContent = [];

      // First pass: collect all content and tool results separately
      for (const p of message.parts) {
        if (p.type === 'text') {
          mapped_content.push({ type: 'text', text: p.text });
        } else if (p.type === 'file') {
          const fileUrl = p.data;
          mapped_content.push({
            type: 'file',
            mimeType: p.mimeType || 'application/octet-stream',
            filename: p.filename || '',
            data:
              typeof fileUrl === 'string' && fileUrl.startsWith('http')
                ? new URL(fileUrl)
                : fileUrl,
          });
        } else if (p.type === 'tool-invocation') {
          tool_calls.push({
            type: 'tool-call',
            toolCallId: p.toolInvocation.toolCallId,
            toolName: p.toolInvocation.toolName,
            args: p.toolInvocation.args,
          });
          // Collect tool results separately
          tool_results.push({
            type: 'tool-result',
            toolCallId: p.toolInvocation.toolCallId,
            toolName: p.toolInvocation.toolName,
            result: p.toolInvocation.result,
          });
        } else if (p.type === 'reasoning') {
          mapped_content.push({
            type: 'reasoning',
            text: p.reasoning,
          });
        }
      }

      if (mapped_content.length === 0) {
        continue;
      }

      // Check if we should merge with the last assistant message
      const lastMessage = mapped_messages[mapped_messages.length - 1];

      if (
        lastMessage &&
        lastMessage.role === 'assistant' &&
        tool_calls.length === 0 && // Don't merge if current message has tool results
        typeof lastMessage.content === 'object'
      ) {
        // Merge with previous assistant message
        lastMessage.content.push(...mapped_content);
      } else {
        if (tool_calls.length > 0) {
          to_commit_messages.unshift({
            role: 'assistant',
            messageId: `${message.messageId}-tool-call`,
            content: tool_calls,
          });
          to_commit_messages.unshift({
            role: 'tool',
            messageId: `${message.messageId}-tool-result`,
            content: tool_results,
          });
        }

        // Create new assistant message
        to_commit_messages.unshift({
          role: 'assistant',
          messageId: message.messageId,
          content: mapped_content,
        });
      }
    }

    mapped_messages.push(...to_commit_messages);
  }

  mapped_messages.reverse();

  // console.log("[cvx][chat] mapped_messages", mapped_messages.length)
  // for (let i = 0; i < mapped_messages.length; i++) {
  //     const m = mapped_messages[i]
  //     const roughContent =
  //         typeof m.content === "object"
  //             ? m.content
  //                   .map((c) => (c.type === "text" ? c.text.slice(0, 100) : `[${c.type}]`))
  //                   .join(",")
  //             : m.content
  //     console.log(` History[${i}](${m.role}) ${roughContent}`)
  // }
  return mapped_messages;
};
