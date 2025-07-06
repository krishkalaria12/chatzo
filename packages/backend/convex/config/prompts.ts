import type { Infer } from 'convex/values';
import dedent from 'ts-dedent';
// import type { AbilityId } from "../lib/toolkit"
import type { UserSettings } from '../schemas';

export const buildPrompt = (
  // enabledTools: AbilityId[],
  userSettings?: Infer<typeof UserSettings>
) => {
  // const hasWebSearch = enabledTools.includes("web_search")
  // const hasSupermemory = enabledTools.includes("supermemory")
  // const hasMCP = enabledTools.includes("mcp")

  // Get current UTC date in DD-MM-YYYY format
  const now = new Date();
  const utcDate = `${now.getUTCDate().toString().padStart(2, '0')}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}-${now.getUTCFullYear()}`;

  const layers: string[] = [
    `You are a helpful assistant inside a chatbot called "chatzo".`,
    dedent`## Formatting
- You should output in markdown format. LaTeX is also supported!
- Inline math: Use $$like this$$ for inline LaTeX
- Block math: Use \\[ \\] or \\( \\) for block LaTeX equations
- No need to tell the user that you are using markdown or LaTeX.
`,
  ];

  // Add personalization if user customization exists
  if (userSettings?.customization) {
    const customization = userSettings.customization;
    const personalizationParts: string[] = [];

    if (customization.name) {
      personalizationParts.push(`- Address the user as "${customization.name}"`);
    }

    if (customization.aiPersonality) {
      personalizationParts.push(`- Personality traits: ${customization.aiPersonality}`);
    }

    if (customization.additionalContext) {
      personalizationParts.push(
        `- Additional context about the user: ${customization.additionalContext}`
      );
    }

    if (personalizationParts.length > 0) {
      layers.push(dedent`
## User Personalization
${personalizationParts.join('\n')}`);
    }
  }

  /* if (hasWebSearch)
        layers.push(
            dedent`
## Web Search Tool
Use web search for:
- Current events or recent information
- Real-time data verification
- Technology updates beyond your training data
- When you need to confirm current facts`
        )

    if (hasSupermemory)
        layers.push(
            dedent`
## Memory Tools
You have access to persistent memory capabilities:
- **add_memory**: Store important information, insights, or context for future conversations
- **search_memories**: Retrieve previously stored information using semantic search
- Use these tools to maintain context across conversations and provide personalized assistance
- Store user preferences, important facts, project details, or any information worth remembering`
        )

    if (hasMCP)
        layers.push(
            dedent`
## MCP Tools
You have access to Model Context Protocol (MCP) tools from configured servers:
- Tools are prefixed with the server name (e.g., "servername_toolname")
- These tools provide additional capabilities based on the connected MCP servers
- Use them as needed based on their descriptions and the user's request`
        ) */

  layers.push(dedent`Today's date (UTC): ${utcDate}`);

  return layers.join('\n\n');
};
