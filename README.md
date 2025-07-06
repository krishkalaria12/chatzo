# Chatzo

A modern, multimodal AI chat application built with React Native, Expo, and
Convex, featuring AI tool calling capabilities including web search.

## Features

- 🤖 Multiple AI Models (Google Gemini, OpenAI, Anthropic, etc.)
- 🖼️ Multimodal Support (Text, Images, PDFs)
- 🔄 Real-time Streaming
- 🔍 **AI Tool Calling with Web Search**
- 📱 Cross-platform (iOS, Android, Web)
- 🎨 Beautiful, responsive UI
- 🌙 Dark/Light Theme Support
- 📂 Thread Management
- 📊 Usage Analytics

## Tool Calling Features

### Web Search Tool

The AI can now search the web for current information and real-time data:

- **Intelligent Search**: AI decides when to use web search based on your query
- **Content Scraping**: Option to include detailed content from search results
- **Beautiful UI**: Rich display of search results with clickable links
- **Error Handling**: Graceful fallbacks when search fails
- **Toggle Control**: Easy on/off switch in the input area

### Supported Use Cases

- Current events and breaking news
- Real-time data (weather, stocks, etc.)
- Recent developments in any field
- Fact-checking and verification
- Research assistance

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- Expo CLI
- iOS Simulator or Android emulator (for mobile testing)

### Environment Variables

#### Required for Basic Functionality

```bash
# Convex
CONVEX_DEPLOYMENT=your-convex-deployment
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret

# AI Models (at least one required)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

#### Required for Web Search Tool

Choose **one** of the following search providers:

```bash
# Option 1: Serper (Recommended - easier to set up)
SERPER_API_KEY=your-serper-api-key

# Option 2: Firecrawl (More advanced scraping)
FIRECRAWL_API_KEY=your-firecrawl-api-key
```

### Getting API Keys

#### Serper API (Recommended)

1. Visit [serper.dev](https://serper.dev)
2. Sign up for a free account
3. Get 2,500 free searches per month
4. Copy your API key to `SERPER_API_KEY`

#### Firecrawl API (Alternative)

1. Visit [firecrawl.dev](https://firecrawl.dev)
2. Sign up for an account
3. Get your API key from the dashboard
4. Copy your API key to `FIRECRAWL_API_KEY`

### Installation

1. Clone and install dependencies:

```bash
git clone <repository-url>
cd chatzo
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Deploy Convex backend:

```bash
cd packages/backend
npx convex deploy
```

4. Start the development server:

```bash
# For mobile development
cd apps/native
pnpm dev

# For web development
cd apps/web
pnpm dev
```

## Using Tool Calling

### Enabling Web Search

1. Open a chat conversation
2. Look for the search icon (🔍) in the input area
3. Tap the icon to toggle web search on/off
4. When enabled, you'll see a "Web" indicator

### Example Queries

With web search enabled, try asking:

- "What's the latest news about AI?"
- "Current weather in Tokyo"
- "Tesla stock price today"
- "Recent developments in quantum computing"
- "Breaking news in technology"

### How It Works

1. **User Input**: You type a message with web search enabled
2. **AI Decision**: The AI determines if web search is needed
3. **Tool Execution**: If needed, AI searches the web automatically
4. **Results Display**: Search results appear in a beautiful card format
5. **AI Response**: AI provides an answer based on the search results

### UI States

The tool calling UI shows different states:

- **🕒 Preparing search...**: AI is preparing the search query
- **🕒 Searching the web...**: Search is in progress
- **✅ Search completed**: Search finished successfully
- **❌ Search failed**: Error occurred (with retry options)

## Architecture

### Backend Tool Integration

```typescript
// Tool is automatically registered in toolkit.ts
export const TOOL_ADAPTERS = [WebSearchAdapter];
export const ABILITIES = ['web_search'] as const;
```

### Frontend Tool Control

```typescript
// Web search toggle in AutoResizingInput
const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

// Enabled tools passed to API
const enabledTools = isWebSearchEnabled ? ['web_search'] : [];
```

### Message Schema

Tool invocations are stored as content parts:

```typescript
{
  type: "tool-invocation",
  toolInvocation: {
    state: "call" | "result" | "partial-call",
    args?: any,
    result?: any,
    toolCallId: string,
    toolName: string,
    step?: number
  }
}
```

## Troubleshooting

### Web Search Not Working

1. **Check API Keys**: Ensure `SERPER_API_KEY` or `FIRECRAWL_API_KEY` is set
2. **Verify Environment**: API keys must be accessible in Convex environment
3. **Check Usage Limits**: Verify you haven't exceeded API quotas
4. **Network Issues**: Ensure your deployment can make external HTTP requests

### Tool Calling Errors

- **"Tool not found"**: Check that `web_search` is in `ABILITIES` array
- **"Invalid arguments"**: AI sent malformed search parameters
- **"Execution failed"**: Network or API error occurred

### Common Issues

1. **Tool not appearing**: Verify web search toggle is enabled
2. **No search results**: Try rephrasing your query
3. **Slow responses**: Large content scraping takes time
4. **Rate limits**: Wait and try again if you hit API limits

### Error Recovery

The app includes automatic error recovery:

- **Retry mechanism**: Failed searches can be retried
- **Graceful degradation**: AI continues without tools if search fails
- **User feedback**: Clear error messages with suggested actions

## Development

### Adding New Tools

1. Create tool adapter in `packages/backend/convex/lib/tools/`
2. Add to `TOOL_ADAPTERS` in `toolkit.ts`
3. Add to `ABILITIES` type
4. Create UI components for tool results
5. Update message renderer for new tool types

### Testing Tool Calling

1. Enable web search in chat interface
2. Ask a question requiring current information
3. Verify tool invocation UI appears
4. Check search results display correctly
5. Confirm AI incorporates results in response

## Contributing

Please ensure any new tools include:

- Proper error handling
- Beautiful UI components
- Type safety
- Comprehensive tests
- Documentation updates

## License

This project is licensed under the MIT License.
