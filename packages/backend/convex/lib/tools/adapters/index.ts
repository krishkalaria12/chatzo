// Search adapter interfaces and types
export type {
  SearchAdapter,
  SearchResult,
  SearchOptions,
  SearchAdapterConfig,
} from './search_adapter';

// Firecrawl adapter
export { FirecrawlSearchAdapter, type FirecrawlSearchConfig } from './firecrawl_search_adapter';

// Serper adapter
export { SerperSearchAdapter, type SerperSearchConfig } from './serper_search_adapter';

// Search provider manager
export {
  SearchProvider,
  type SearchProviderType,
  type SearchProviderConfig,
} from './search_provider';
