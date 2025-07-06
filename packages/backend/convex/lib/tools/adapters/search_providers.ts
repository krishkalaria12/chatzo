import { FirecrawlSearchAdapter, type FirecrawlSearchConfig } from './firecrawl_search_adapter';
import type { SearchAdapter, SearchOptions, SearchResult } from './search_adapter';
import { SerperSearchAdapter, type SerperSearchConfig } from './serper_search_adapter';

export type SearchProviderType = 'firecrawl' | 'serper';

export interface SearchProviderConfig {
  provider: SearchProviderType;
  apiKey?: string;
  config?: Partial<FirecrawlSearchConfig | SerperSearchConfig>;
}

export class SearchProvider {
  private adapter: SearchAdapter;

  constructor({ provider, apiKey, config = {} }: SearchProviderConfig) {
    switch (provider) {
      case 'firecrawl': {
        const firecrawlApiKey = apiKey || process.env.FIRECRAWL_API_KEY;
        if (!firecrawlApiKey) {
          throw new Error('Firecrawl API key is not set');
        }
        this.adapter = new FirecrawlSearchAdapter({
          apiKey: firecrawlApiKey,
          ...config,
        } as FirecrawlSearchConfig);
        break;
      }

      case 'serper': {
        const serperApiKey = apiKey || process.env.SERPER_API_KEY;
        if (!serperApiKey) {
          throw new Error('Serper API key is not set');
        }
        this.adapter = new SerperSearchAdapter({
          apiKey: serperApiKey,
          ...config,
        } as SerperSearchConfig);
        break;
      }
      default:
        throw new Error(`Unsupported search provider: ${provider}`);
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    return await this.adapter.search(query, options);
  }
}
