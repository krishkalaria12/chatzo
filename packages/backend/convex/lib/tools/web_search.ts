import { tool } from 'ai';
import { z } from 'zod';
import type { ToolAdapter } from '../toolkit';
import { SearchProvider } from './adapters/search_provider';

// NOTE: This version assumes you are using your own API key, not BYOK/user-provided keys.
export const WebSearchAdapter: ToolAdapter = async params => {
  if (!params.enabledTools.includes('web_search')) return {};

  // You should define your own API key and provider here.
  // For example, you might load from environment variables or config.
  const searchProviderId = 'serper';

  return {
    web_search: tool({
      description:
        'Search the web for information. Optionally scrape content from results for detailed information.',
      parameters: z.object({
        query: z.string().describe('The search query'),
        scrapeContent: z
          .boolean()
          .describe('Whether to scrape and include content from search results'),
      }),
      execute: async ({ query, scrapeContent }) => {
        // You can set a default for scrapeContent here if desired
        const shouldScrapeContent = scrapeContent ?? false;
        try {
          const searchProvider = new SearchProvider({
            provider: searchProviderId,
          });

          console.log(`Searching for ${query} with provider ${searchProviderId}...`);

          const results = await searchProvider.search(query, {
            limit: 5,
            scrapeContent: shouldScrapeContent,
            formats: shouldScrapeContent ? ['markdown', 'links'] : [],
          });

          return {
            success: true,
            query,
            results: results.map(result => ({
              title: result.title,
              url: result.url,
              description: result.description,
              ...(result.content && { content: result.content }),
              ...(result.markdown && { markdown: result.markdown }),
            })),
            count: results.length,
          };
        } catch (error) {
          console.error('Web search error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            query,
            results: [],
          };
        }
      },
    }),
  };
};
